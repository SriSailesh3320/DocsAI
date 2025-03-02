import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  extractedText: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  summary: { type: String, required: true },
  suggestedQueries: { type: [String], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
