import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.HASHNODE_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "HASHNODE_API_KEY is not set in Vercel" });
  }

  try {
    const res = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              id
              username
              name
              publications(first: 5) {
                edges {
                  node {
                    id
                    title
                    url
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
    return NextResponse.json({ ok: res.ok, json });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
