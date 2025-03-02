import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from "@aws-sdk/client-textract";

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
    const queryText = formData.get("query") as string | null; // Get the query from the form

    if (!file || !queryText) {
      return NextResponse.json(
        { error: "File and query are required" },
        { status: 400 }
      );
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

    // Extract text using Textract with custom query
    const textractResponse = await textract.send(
      new AnalyzeDocumentCommand({
        Document: {
          S3Object: { Bucket: process.env.AWS_S3_BUCKET_NAME!, Name: fileName },
        },
        FeatureTypes: ["QUERIES"], // Enable queries
        QueriesConfig: {
          Queries: [
            {
              Text: queryText, // The custom query from the form
              Alias: "custom_query",
              Pages: ["1"], // Specify which pages to analyze (optional)
            },
          ],
        },
      })
    );

    const extractedAnswer =
      textractResponse.Blocks?.filter((b) => b.BlockType === "QUERY_RESULT")
        .map((b) => b.Text)
        .join("\n") || "No relevant answer found.";

    return NextResponse.json({ answer: extractedAnswer });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}
