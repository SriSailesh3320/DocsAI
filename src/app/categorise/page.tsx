"use client";
import { useState } from "react";

export default function FileUpload() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setError("Please select files to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/categorise", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setResults(data.files);
      } else {
        setError(data.error || "Failed to upload files.");
      }
    } catch (err) {
      setError("An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  // Function to filter files by category
  const getFilesByCategory = (category: string) => {
    return results.filter((file) => file.category === category);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 w-full h-full object-cover z-[-1]"
      >
        <source src="/backgroundvideo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Content */}
      <div className="relative z-10 max-w-2xl p-6 border rounded-lg shadow-lg bg-gray-900 bg-opacity-80 text-white">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">
          Upload Multiple Documents
        </h2>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="mb-4 border p-2 w-full bg-gray-800 text-white"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-green-600"
        >
          {uploading ? "Uploading..." : "Upload Files"}
        </button>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        {results.length > 0 && (
          <div className="mt-6 w-full">
            <h3 className="text-lg font-semibold text-gray-200">
              Processed Files:
            </h3>

            {["Financial", "Medical", "Legal", "Educational", "Others"].map(
              (category) => {
                const categoryFiles = getFilesByCategory(category);
                return categoryFiles.length > 0 ? (
                  <div key={category} className="mt-4">
                    <h4 className="text-lg font-semibold text-gray-300 underline">
                      {category}
                    </h4>
                    <ul className="mt-2 space-y-2">
                      {categoryFiles.map((file, index) => (
                        <li
                          key={index}
                          className="p-2 border rounded-lg bg-gray-800 text-white"
                        >
                          <p>
                            <strong>Name:</strong>{" "}
                            {file.fileName.includes("-")
                              ? file.fileName
                                  .split("-")
                                  .slice(1)
                                  .join("-")
                                  .trim()
                              : file.fileName}
                          </p>
                          {/* <p>
                            <strong>Category:</strong> {file.category}
                          </p> */}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
