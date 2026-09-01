import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.HASHNODE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "HASHNODE_API_KEY is not set in Vercel process.env" });
  }

  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
        "User-Agent": "RojgarSuvidhaBot/1.0",
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              id
              username
              publications(first: 5) {
                edges {
                  node {
                    id
                    title
                  }
                }
              }
            }
          }
        `,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json();
    return NextResponse.json({ ok: res.ok, status: res.status, json });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
