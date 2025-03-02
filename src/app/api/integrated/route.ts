import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import connectDB from "@/config/Database";
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

interface Metadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  extractionTime: string;
}

let extractedText = "";
let metaData: Metadata | null = null;
let docCategory = "";
let docSubCategory = "";
let docSummary = "";
let suggestedQueries: string[] = [];

// Categorize document and determine sub-category using OpenRouter API

function cleanResponse(response: string): string {
  return response
    .replace(/\b(\w+)\b\s+\1\b/gi, "$1") // Remove duplicate consecutive words (with spaces)
    .replace(/(\w+)\1/gi, "$1") // Remove duplicate words that are merged (e.g., "MedicalMedical")
    .trim();
}



// Categorize document using OpenRouter API
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
              "Categorize the following document into one of these categories: Financial, Medical, Legal, Educational, or Others.",
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


// Generate document summary using OpenRouter API
async function generateSummary(text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "Summary unavailable due to missing API key.";

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
            content: "Summarize the following document in a few words.",
          },
          { role: "user", content: `Document text: ${text}` },
        ],
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Summary unavailable.";
  } catch (error) {
    console.error("Summary API error:", error);
    return "Summary unavailable.";
  }
}

// Generate suggested queries dynamically using OpenRouter API
async function generateSuggestedQueries(text: string): Promise<string[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return ["Query generation unavailable due to missing API key."];

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
              "Generate 6 relevant questions based on the document's content.",
          },
          { role: "user", content: `Document text: ${text}` },
        ],
      }),
    });

    const data = await res.json();
    return (
      data.choices?.[0]?.message?.content?.split("\n").slice(0, 10) || [
        "No queries generated.",
      ]
    );
  } catch (error) {
    console.error("Query Generation API error:", error);
    return ["Query generation failed."];
  }
}
// import { NextRequest, NextResponse } from "next/server";
console.log(extractedText) // Store extracted text from file processing

// 📌 Fetch AI answer for user questions
async function fetchAnswerFromAI(question: string, documentText: string): Promise<string> {
  return fetchAIResponse(
    "Answer the user's question based on the provided document text.",
    `Document: ${documentText}\nQuestion: ${question}`
  );
}

// 📌 Generalized AI response fetcher
async function fetchAIResponse(prompt: string, text: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "AI service unavailable.";

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
          { role: "system", content: prompt },
          { role: "user", content: `Document text: ${text}` },
        ],
      }),
    });

    const data = await res.json();
    return cleanResponse(data.choices?.[0]?.message?.content || "No relevant data found.");
  } catch (error) {
    console.error("AI API error:", error);
    return "Error processing request.";
  }
}

await mongoose.connect(process.env.MONGODB_URI!);

// 📌 POST Handler (Upload & Extract)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const userId = "675818e01617e2d952862228"; // Assuming frontend sends `userId`

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Upload file to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Extract text using Textract
    const textractResponse = await textract.send(
      new AnalyzeDocumentCommand({
        Document: {
          S3Object: { Bucket: process.env.AWS_S3_BUCKET_NAME!, Name: fileName },
        },
        FeatureTypes: ["TABLES", "FORMS"],
      })
    );

    const extractedText =
      textractResponse.Blocks?.filter((b) => b.BlockType === "LINE")
        .map((b) => b.Text)
        .join("\n") || "";

    const metaData = {
      fileName,
      fileSize: file.size,
      fileType: file.type,
      extractionTime: new Date().toISOString(),
    };

    // AI-powered processing
    const docCategory = await getCategory(extractedText);
    const docSubCategory = await getSubCategory(extractedText);
    const docSummary = await generateSummary(extractedText);
    const suggestedQueries = await generateSuggestedQueries(extractedText);

    // 📌 Save to MongoDB
    const newDocument = new Document({
      fileName,
      fileSize: file.size,
      fileType: file.type,
      extractedText,
      category: docCategory,
      subCategory: docSubCategory,
      summary: docSummary,
      suggestedQueries,
      user: userId,
      createdAt: new Date(),
    });

    await newDocument.save();

    return NextResponse.json({
      message: "Document processed and stored successfully",
      category: docCategory,
      subCategory: docSubCategory,
      summary: docSummary,
      suggestedQueries,
    });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}

// 📌 GET Handler (Answer User Questions)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const question = searchParams.get("question");

    if (!question) {
      return NextResponse.json(
        { error: "No question provided." },
        { status: 400 }
      );
    }

    // ✅ Retrieve the latest uploaded document from MongoDB
    const latestDocument = await Document.findOne().sort({ createdAt: -1 });

    if (!latestDocument || !latestDocument.extractedText) {
      return NextResponse.json(
        { error: "No document text available." },
        { status: 400 }
      );
    }

    const extractedText = latestDocument.extractedText; // ✅ Get the document text
    const answer = await fetchAnswerFromAI(question, extractedText);

    return NextResponse.json({ response: answer });
  } catch (error) {
    console.error("Error processing query:", error);
    return NextResponse.json(
      { error: "Error processing query" },
      { status: 500 }
    );
  }
}