"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaFileUpload, FaSearch } from "react-icons/fa";

export default function CustomUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setLoading(true);
    setExtractedData(null); // Reset previous extraction results
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/integrated", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setExtractedData(data || {}); // Ensure it's always an object
    setLoading(false);
  };

  const askQuestion = async () => {
    if (!question) return;
    setQuestionLoading(true);
    setResponse(""); // Reset previous response

    const res = await fetch(
      `/api/integrated?question=${encodeURIComponent(question)}`
    );
    const data = await res.json();
    setResponse(data.response || "No response available.");
    setQuestionLoading(false);
  };

  return (
    <div>
      <br /><br />
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-2xl shadow-md space-y-6 ">
        {/* File Upload */}

        <video
          autoPlay
          loop
          muted
          className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
        >
          <source src="/back.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <label className="flex items-center justify-center cursor-pointer border-2 border-dashed border-gray-400 rounded-lg p-6 hover:border-blue-500">
          <FaFileUpload className="text-blue-500 text-3xl mr-2" />
          <input type="file" className="hidden" onChange={handleFileChange} />
          {file ? file.name : "Click to upload a file"}
        </label>

        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          onClick={uploadFile}
          disabled={loading}
        >
          {loading ? "Uploading..." : "Extract Text"}
        </button>

        {/* Extracted Data Display */}
        {extractedData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-100 p-4 rounded-lg space-y-2"
          >
            <p>
              <strong>Category:</strong> {extractedData?.category || "Unknown"}
            </p>
            <p>
              <strong>Sub-Category:</strong>{" "}
              {extractedData?.subCategory || "N/A"}
            </p>
            <p>
              <strong>Summary:</strong>{" "}
              {extractedData?.summary || "No summary available."}
            </p>

            {/* Suggested Queries */}
            <p>
              <strong>Suggested Queries:</strong>
            </p>
            <ul className="list-disc list-inside text-sm">
              {Array.isArray(extractedData?.suggestedQueries) &&
              extractedData.suggestedQueries.length > 0 ? (
                extractedData.suggestedQueries.map((q: string, i: number) => (
                  <li
                    key={i}
                    className="text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setQuestion(q)} // Autofill input on click
                  >
                    {q}
                  </li>
                ))
              ) : (
                <li className="text-gray-500">No queries available.</li>
              )}
            </ul>
          </motion.div>
        )}

        {/* Question Input and Ask Button */}
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 border p-2 rounded-lg"
          />
          <button
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
            onClick={askQuestion}
            disabled={questionLoading}
          >
            {questionLoading ? "Searching..." : <FaSearch />}
          </button>
        </div>

        {/* Query Response Display */}
        {response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-100 p-4 rounded-lg"
          >
            <p className="text-green-700">{response}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
