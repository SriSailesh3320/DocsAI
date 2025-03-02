import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";
import fs from "fs/promises";

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    // Upload file to S3
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

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}
