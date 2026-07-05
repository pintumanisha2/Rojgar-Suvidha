import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600; // Cache the PDF proxy response for 1 hour

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename || !filename.endsWith(".pdf")) {
      return new Response("Invalid file format. Only PDF files are served.", { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return new Response("Supabase configuration missing.", { status: 500 });
    }

    // Proxy target inside existing public 'blog_images' bucket under the 'pdfs' folder
    const targetUrl = `${supabaseUrl}/storage/v1/object/public/blog_images/pdfs/${filename}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      // Set cache headers to make sure it doesn't get re-fetched constantly
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`PDF upload proxy target not found: ${targetUrl}`);
      return new Response("Official Notification PDF not found on this server.", { status: 404 });
    }

    const fileBuffer = await response.arrayBuffer();

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("PDF upload proxy route error:", error.message);
    return new Response("Internal Server Error while loading PDF.", { status: 500 });
  }
}
