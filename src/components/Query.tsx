"use client";
import { useState } from "react";

export default function Query() {
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const uploadAndQueryText = async () => {
    if (!file || !query) {
      alert("Please select a file and enter a query.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query); // Send the query to the backend

    try {
      const response = await fetch("/api/upload-and-extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setAnswer(data.answer);
      } else {
        console.error("Error:", data.message);
      }
    } catch (error) {
      console.error("Request failed", error);
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="border p-2 m-2"
      />
      <input
        type="text"
        placeholder="Enter your query"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 m-2 w-full"
      />
      <button
        onClick={uploadAndQueryText}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Upload & Query
      </button>
      <pre className="mt-4 p-4 bg-gray-100">{answer}</pre>
    </div>
  );
}
