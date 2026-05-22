import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Basic list of abusive words (can be expanded)
const PROFANITY_LIST = [
  "bhenchod", "madarchod", "chutiya", "gandu", "fuck", "bitch", "asshole", "shit", "bastard", "loda", "bhosdike"
];

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, category, author_name, author_avatar } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    // ─────────────────────────────────────────────────────────────
    // 🛡️ STRICT CONTENT MODERATION (Phase 1 Rules)
    // ─────────────────────────────────────────────────────────────
    const text = content.toLowerCase();

    // 1. Block Phone Numbers (10+ digits, with or without +91)
    const phoneRegex = /(\+91|0)?\s?[6-9]\d{9}/;
    if (phoneRegex.test(content)) {
      return NextResponse.json({ error: "Phone numbers are not allowed in the community." }, { status: 400 });
    }

    // 2. Block Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    if (emailRegex.test(content)) {
      return NextResponse.json({ error: "Email addresses are not allowed." }, { status: 400 });
    }

    // 3. Block Links / URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/;
    if (urlRegex.test(content)) {
      return NextResponse.json({ error: "Links/URLs are strictly prohibited." }, { status: 400 });
    }

    // 4. Block Profanity (Gaali)
    for (const badWord of PROFANITY_LIST) {
      // Create a regex to match exact word boundary
      const badRegex = new RegExp(`\\b${badWord}\\b`, "i");
      if (badRegex.test(text)) {
        return NextResponse.json({ error: "Please use respectful language. Abusive words are not allowed." }, { status: 400 });
      }
    }

    // ─────────────────────────────────────────────────────────────
    // ✅ INSERT INTO DATABASE
    // ─────────────────────────────────────────────────────────────
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the user from the token to ensure user_id matches
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("private_community_posts")
      .insert({
        user_id: userData.user.id,
        content: content.trim(),
        category: category || "General",
        author_name: author_name,
        author_avatar: author_avatar,
        is_blocked: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Community Insert Error:", error);
      return NextResponse.json({ error: "Failed to post message." }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (err: any) {
    console.error("Community API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
