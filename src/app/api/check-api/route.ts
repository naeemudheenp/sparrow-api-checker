/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { url, token } = await req.json();
    console.log(url, "urls");

    if (!url) {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.get(url, { headers });
    return NextResponse.json({
      status: response.status,
      text: response.statusText,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: error.response?.status || "Error",
        text: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
