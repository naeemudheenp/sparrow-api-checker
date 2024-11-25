/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { Github } from "lucide-react";
import autoTable from "jspdf-autotable";

interface ApiResponse {
  url: string;
  status?: number | string;
  text?: any;
  error?: string;
}

export default function Home() {
  const [fileData, setFileData] = useState<{ paths: string }[]>([]);
  const [domain, setDomain] = useState<string>("");
  const [bearerToken, setBearerToken] = useState<string>("");
  const [results, setResults] = useState<ApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData: { paths: string }[] = XLSX.utils.sheet_to_json(sheet);
      setFileData(parsedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const checkApis = async () => {
    setIsLoading(true);
    if (!fileData || !domain) {
      alert("Please upload an Excel file and enter a domain.");
      setIsLoading(false);
      return;
    }

    function isValidUrl(url: any) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        console.log(e);

        return false;
      }
    }

    if (!isValidUrl(`${domain}${fileData[0].paths}`)) {
      alert("Invalid url found.Execution terminated");
      setResults([]);
      return;
    } else {
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

      setIsLoading(false);
      console.log(responses, "responses");

      setResults(responses);
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("API Response Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Generated with Sparrow API Checker`, 14, 30);
    doc.text(`https://sparrow-api-checker.vercel.app/`, 14, 40);

    const headers = [["URL", "Status", "Response"]];
    const data = results.map((result) => [
      result.url,
      result.status || "Error",
      (result?.text?.message ? result?.text?.message : result?.text?.error) ||
        result?.text ||
        "",
    ]);

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 50,
    });

    doc.save("api-response-report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 !text-black yar">
      <div className="w-full max-w-6xl bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex gap-2  items-center">
          Sparrow API Response Checker
          <a
            href="https://github.com/naeemudheenp/sparrow-api-checker/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground  transition-colors"
            aria-label="View project on GitHub"
          >
            <Github className="h-6 w-6 hover:border-black hover:bg-white transition-all" />
          </a>
        </h1>
        <p>
          Excel should have only one sheet and URLs should come under the{" "}
          <strong>paths</strong> field.
        </p>
        <div className="space-y-4">
          <div className=" relative  flex-row flex justify-center items-center">
            <input
              type="text"
              placeholder="Enter domain (e.g., https://api.example.com)"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
            <p className=" absolute  right-3 text-green-500 top-2 bottom-0 h-full my-0">
              GET
            </p>
          </div>
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
                : "bg-gray-400 "
            }`}
          >
            {!isLoading ? (
              "Check APIs"
            ) : (
              <div className="flex justify-center items-center gap-3">
                Loading..
                <div className="animate-spin bg-gradient-to-r from-blue-800 to-blue-600 h-5 aspect-square rounded-full"></div>
              </div>
            )}
          </button>
        </div>
        {results.length > 0 && (
          <>
            <button
              onClick={downloadReport}
              className="mt-6 py-2 px-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700"
            >
              Download Report
            </button>
            <table className="mt-6 w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">URL</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                  <th className="border border-gray-300 px-4 py-2">Response</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => (
                  <tr key={result?.url}>
                    <td className="border border-gray-300 px-4 py-2">
                      {domain}
                      {result?.url}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {result?.status || "Error"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {(result?.text?.message
                        ? result?.text?.message
                        : result?.text?.error) ||
                        result?.text ||
                        ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
