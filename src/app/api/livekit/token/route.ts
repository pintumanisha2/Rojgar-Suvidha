/**
 * /api/livekit/token/route.ts
 * Generates a LiveKit JWT token for authenticated users to join
 * the Public Study Hall room.
 */
import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const apiKey    = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json(
        { error: "LiveKit not configured. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL to .env.local" },
        { status: 500 }
      );
    }

    // Verify user session via Authorization header (Supabase JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Get user's display name from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.full_name || "Student";
    const roomName = "public-study-hall"; // Single public hall room

    // Create LiveKit access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: "4h", // Token valid for 4 hours
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,        // Can publish camera/mic
      canSubscribe: true,      // Can receive others' streams
      canPublishData: true,    // Can send data messages
    });

    const jwt = await at.toJwt();

    return NextResponse.json({
      token: jwt,
      roomName,
      url: livekitUrl,
    });
  } catch (err: any) {
    console.error("[LiveKit Token] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
