import { NextResponse } from "next/server";
import { publishToHashnode } from "@/lib/backlink-publishers/hashnode";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = (process.env.HASHNODE_API_KEY || "3589d29f-eea0-4975-a3b6-40aac62fe693").trim();

  // Test 1: Query Me
  let meRes: any = null;
  try {
    const r1 = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query Me { me { id username name publications(first: 5) { edges { node { id title url } } } } }`,
      }),
    });
    meRes = await r1.json();
  } catch (e: any) {
    meRes = { error: e.message };
  }

  // Test 2: Query Host
  let hostRes: any = null;
  try {
    const r2 = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query Pub { publication(host: "rojgarsuvidha.hashnode.dev") { id title domain { host } } }`,
      }),
    });
    hostRes = await r2.json();
  } catch (e: any) {
    hostRes = { error: e.message };
  }

  // Test 3: Full publishToHashnode
  const liveUrl = await publishToHashnode({
    jobId: "test-id",
    title: "CONCOR MT Recruitment 2026",
    slug: "77-posts-concor-mt-assistant-officer-recruitment-2026-online-form-eligibility",
  });

  return NextResponse.json({
    ok: !!liveUrl,
    liveUrl,
    meRes,
    hostRes,
  });
}
