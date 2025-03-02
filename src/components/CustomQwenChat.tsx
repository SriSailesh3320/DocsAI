"use client";
import { useState } from "react";

const CustomQwenChat = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResponse = async () => {
    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("/api/qwen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate response");
      }

      setResponse(data.response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Qwen</h2>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt"
        className="w-full p-2 border rounded"
      />

      <button
        onClick={fetchResponse}
        className="w-full bg-yellow-500 text-white py-2 rounded disabled:opacity-50"
        disabled={loading || !prompt}
      >
        {loading ? "Generating..." : "Generate"}
      </button>

      {response && <p className="mt-4 p-2 bg-gray-100 rounded">{response}</p>}
      {error && (
        <p className="mt-4 p-2 bg-red-100 text-red-700 rounded">{error}</p>
      )}
    </div>
  );
};

export default CustomQwenChat;
