'use client'
import { useState } from "react";

export default function TextractUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const uploadAndExtractText = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("api/upload-and-extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setExtractedText(data.text);
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
      <button onClick={uploadAndExtractText} className="bg-blue-500 text-white p-2 rounded">
        Upload & Extract Text
      </button>
      <pre className="mt-4 p-4 bg-gray-100">{extractedText}</pre>
    </div>
  );
}
