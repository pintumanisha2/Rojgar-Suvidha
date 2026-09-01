import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = "3589d29f-eea0-4975-a3b6-40aac62fe693";
  const host = "rojgarsuvidha.hashnode.dev";

  const headers = {
    "Authorization": apiKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  };

  let pubRes: any = null;
  let postRes: any = null;

  // Step 1: Query Host
  try {
    const r1 = await fetch("https://gql.hashnode.com", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `query Pub { publication(host: "${host}") { id title } }`,
      }),
    });
    pubRes = await r1.json();
  } catch (err: any) {
    pubRes = { error: err.message };
  }

  const pubId = pubRes?.data?.publication?.id;

  // Step 2: Try Publish Post
  if (pubId) {
    try {
      const r2 = await fetch("https://gql.hashnode.com", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `
            mutation PublishPost($input: PublishPostInput!) {
              publishPost(input: $input) {
                post {
                  url
                }
              }
            }
          `,
          variables: {
            input: {
              publicationId: pubId,
              title: "CONCOR MT & Assistant Officer Recruitment 2026",
              contentMarkdown: "# CONCOR MT Recruitment 2026\n\nApply online at [Rojgar Suvidha](https://www.rojgarsuvidha.com/job/77-posts-concor-mt-assistant-officer-recruitment-2026-online-form-eligibility).",
              originalArticleURL: "https://www.rojgarsuvidha.com/job/77-posts-concor-mt-assistant-officer-recruitment-2026-online-form-eligibility",
              tags: [{ name: "Jobs", slug: "jobs" }]
            }
          }
        }),
      });
      postRes = await r2.json();
    } catch (err: any) {
      postRes = { error: err.message };
    }
  }

  return NextResponse.json({
    pubId,
    pubRes,
    postRes,
    liveUrl: postRes?.data?.publishPost?.post?.url || null
  });
}
