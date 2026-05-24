import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to generate a fake Google Meet link for demo
const generateGoogleMeetLink = () => `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employerUid = searchParams.get('employer_uid') || 'default_employer';

    const { data, error } = await supabaseAdmin
      .from('employer_interviews')
      .select('*')
      .eq('employer_uid', employerUid)
      .order('scheduled_at', { ascending: true });

    if (error) {
      // If table doesn't exist yet, return mock data for frontend safety
      if (error.code === '42P01') {
        return NextResponse.json({
          interviews: [],
          error: 'Table not created yet. Please run the SQL script.'
        });
      }
      throw error;
    }

    return NextResponse.json({ interviews: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { candidate_name, candidate_email, job_role, scheduled_at, duration_minutes, meeting_type, employer_uid } = body;

    if (!candidate_name || !scheduled_at) {
      return NextResponse.json({ error: 'Candidate name and scheduled time are required' }, { status: 400 });
    }

    // Auto-generate Google Meet link if it's a Video Call or Google Meet
    const isVideo = meeting_type?.toLowerCase().includes('video') || meeting_type?.toLowerCase().includes('meet');
    const roomId = isVideo ? generateGoogleMeetLink() : null;

    const { data, error } = await supabaseAdmin
      .from('employer_interviews')
      .insert([
        {
          employer_uid: employer_uid || 'default_employer',
          candidate_name,
          candidate_email,
          job_role,
          scheduled_at,
          duration_minutes: duration_minutes || 45,
          meeting_type: meeting_type || 'Google Meet',
          room_id: roomId,
          status: 'scheduled'
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Database table missing! Please run the SQL script in Supabase first.' }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ interview: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
