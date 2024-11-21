"use client";

import { randomInt } from "crypto";
import { useState } from "react";
import * as XLSX from "xlsx";

interface ApiResponse {
  paths: string;
  status?: number | string;
  text?: string;
  error?: string;
}

export default function Home() {
  const [fileData, setFileData] = useState<{ URL: string }[]>([]);
  const [domain, setDomain] = useState<string>("");
  const [bearerToken, setBearerToken] = useState<string>("");
  const [results, setResults] = useState<ApiResponse[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData: { URL: string }[] = XLSX.utils.sheet_to_json(sheet);
      setFileData(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const checkApis = async () => {
    if (!fileData || !domain) {
      alert("Please upload an Excel file and enter a domain.");
      return;
    }

    const responses = await Promise.all(
      fileData.map(async (row) => {
        try {
          const response = await fetch("/api/check-api", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: `${domain}${row.paths}`,
              token: bearerToken,
            }),
          });
          const result = await response.json();
          return { url: row.paths, ...result };
        } catch (error) {
          return { url: row.paths, error: (error as Error).message };
        }
      })
    );

    console.log(responses, "responses");

    setResults(responses);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 !text-black yar">
      <div className="w-full max-w-3xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          API Response Checker
        </h1>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Enter domain (e.g., https://api.example.com)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="text"
            placeholder="Enter Bearer Token (optional)"
            value={bearerToken}
            onChange={(e) => setBearerToken(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={checkApis}
            disabled={!fileData.length || !domain}
            className={`w-full py-2 text-white font-bold rounded-md ${
              fileData.length && domain
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Check APIs
          </button>
        </div>
        {results.length > 0 && (
          <table className="mt-6 w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">URL</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
                <th className="border border-gray-300 px-4 py-2">Response</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={result.url}>
                  <td className="border border-gray-300 px-4 py-2">
                    {result.url}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {result.status || "Error"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {result?.text?.message || result?.text || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
