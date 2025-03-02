import connectDB from "@/config/Database";
import Document from "@/models/Document";

// GET /api/documents
export const GET = async () => {
  try {
    await connectDB();

    const documents = await Document.find(
      {},
      "-suggestedQueries -summary"
    ).populate("user"); // Fetching all documents except suggestedQueries and summary
    return new Response(JSON.stringify(documents), { status: 200 });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return new Response("Failed to fetch documents", { status: 500 });
  }
};
