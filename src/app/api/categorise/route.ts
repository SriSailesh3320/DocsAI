import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import db from "@/lib/db";
import Document from "@/models/Document";
import User from "@/models/User";
import mongoose from "mongoose";


const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const textract = new TextractClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ProcessedFile {
  fileName: string;
  category: string;
  subCategory: string;
  summary: string;
  suggestedQueries: string[];
}

// Function to categorize document
// Function to remove duplicate words
function cleanResponse(response: string): string {
  return response
    .replace(/\b(\w+)\b\s+\1\b/gi, "$1") // Remove consecutive duplicate words
    .replace(/(\w+)\1/gi, "$1") // Remove merged duplicate words (e.g., "MedicalMedical")
    .trim();
}

// Function to categorize document
async function getCategory(text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "Others";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen-vl-plus:free",
        messages: [
          {
            role: "system",
            content:
              "Categorize the following document into one of these categories: Financial, Medical, Legal, Educational, or Others. Respond with only the category name.",
          },
          { role: "user", content: `Document text: ${text}` },
        ],
      }),
    });

    const data = await res.json();
    return cleanResponse(data.choices?.[0]?.message?.content || "Others");
  } catch (error) {
    console.error("Categorization API error:", error);
    return "Others";
  }
}


function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}
async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY; // Change to OpenAI key if needed
  if (!apiKey) {
    console.error("❌ OPENAI_API_KEY is missing!");
    return [];
  }

  try {
    console.log("🔍 Sending request to OpenAI API...");
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small", // Use OpenAI’s embedding model
        input: text,
      }),
    });

    console.log("📥 Response status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ API request failed: ${res.status} - ${errorText}`);
      return [];
    }

    const data = await res.json();
    console.log("✅ Received embedding:", data);

    return data.data?.[0]?.embedding || [];
  } catch (error) {
    console.error("❌ Embedding API error:", error);
    return [];
  }
}


// Function to extract text using Textract
async function extractTextFromS3(fileName: string): Promise<string> {
  const textractResponse = await textract.send(
    new AnalyzeDocumentCommand({
      Document: {
        S3Object: { Bucket: process.env.AWS_S3_BUCKET_NAME!, Name: fileName },
      },
      FeatureTypes: ["TABLES", "FORMS"],
    })
  );
  return (
    textractResponse.Blocks?.filter((b) => b.BlockType === "LINE")
      .map((b) => b.Text)
      .join("\n") || ""
  );
}

// Determine sub-category using OpenRouter API
async function getSubCategory(text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "Unknown";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen-vl-plus:free",
        messages: [
          {
            role: "system",
            content:
              "Determine the most relevant sub-category from the following list. Respond with only the sub-category name: invoice, tax, bank statement, salary, transaction, prescription, lab report, diagnosis, discharge, patient, contract, court, affidavit, patent, law, certificate, marksheet, research, academic, resume.",
          },
          { role: "user", content: `Document text: ${text}` },
        ],
      }),
    });

    const data = await res.json();
    return cleanResponse(data.choices?.[0]?.message?.content || "Unknown");
  } catch (error) {
    console.error("Sub-category API error:", error);
    return "Unknown";
  }
}

export async function POST(req: NextRequest) {
  try {
    // await connectToDatabase(); // Ensure MongoDB connection

    const formData = await req.formData();
    const files = formData.getAll("files") as Blob[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const processedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;

      // Upload file to S3 (temp location)
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Extract text and categorize
      const extractedText = await extractTextFromS3(fileName);
      const category = await getCategory(extractedText);
      const docSubCategory = await getSubCategory(extractedText);
      const categoryPath = `${category}/${fileName}`;

      // Move file to category folder in S3
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: categoryPath,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Save document details in MongoDB
      const newDocument = new Document({
        fileName,
        fileSize: file.size,
        fileType: file.type,
        category,
        subCategory: docSubCategory,
        extractedText,
        summary: "TBD",
        user: "675818e01617e2d952862228",
        suggestedQueries: [],
        uploadedAt: new Date(),
      });

      await newDocument.save();
      processedFiles.push(newDocument);
    }

    return NextResponse.json({
      message: "Files processed and stored successfully",
      files: processedFiles,
    });
  } catch (error) {
    console.error("Error processing files:", error);
    return NextResponse.json(
      { error: "Error processing files" },
      { status: 500 }
    );
  }
}
