import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const docId = searchParams.get("docId");

  if (!docId) {
    return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
  }

  try {
    const gdocUrl = `https://docs.google.com/document/d/${docId}/export?format=html`;
    const response = await fetch(gdocUrl);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return NextResponse.json({ error: "Document is private or not found. Please ensure 'Anyone with the link' can view it." }, { status: 403 });
      }
      return NextResponse.json({ error: `Failed to fetch document: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();
    return NextResponse.json({ html });
  } catch (error: any) {
    console.error("GDoc Import Error:", error);
    return NextResponse.json({ error: "Server error while fetching document." }, { status: 500 });
  }
}
