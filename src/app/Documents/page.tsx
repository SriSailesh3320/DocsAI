"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch("/api/Document");
        if (!response.ok) throw new Error("Failed to fetch documents");
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 text-white">
      <Card className="bg-gray-900 shadow-lg">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-4 text-center text-white">
            Uploaded Documents
          </h2>
          {loading ? (
            <Skeleton className="h-40 w-full bg-gray-700" />
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full border border-gray-700">
                <TableHeader className="bg-gray-800">
                  <TableRow>
                    <TableHead className="text-gray-300">File Name</TableHead>
                    <TableHead className="text-gray-300">File Size</TableHead>
                    <TableHead className="text-gray-300">File Type</TableHead>
                    <TableHead className="text-gray-300">Category</TableHead>
                    <TableHead className="text-gray-300">
                      Sub-Category
                    </TableHead>
                    <TableHead className="text-gray-300">Uploaded By</TableHead>
                    <TableHead className="text-gray-300">Uploaded At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow
                      key={doc._id || index}
                      className="hover:bg-gray-800"
                    >
                      <TableCell className="text-gray-200">
                        {doc.fileName || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.fileSize
                          ? (doc.fileSize / 1024).toFixed(2) + " KB"
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.fileType || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.category || "Uncategorized"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.subCategory || "N/A"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.user?.username || "Unknown"}
                      </TableCell>
                      <TableCell className="text-gray-200">
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleString()
                          : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
