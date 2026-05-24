import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employerUid = searchParams.get('employer_uid') || 'default_employer';

    const { data, error } = await supabaseAdmin
      .from('employer_activity_logs')
      .select('*')
      .eq('employer_uid', employerUid)
      .order('created_at', { ascending: false })
      .limit(50); // Get last 50 activities

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          logs: [],
          error: 'Database table missing! Please run the audit_logs_schema.sql script in Supabase first.'
        });
      }
      throw error;
    }

    return NextResponse.json({ logs: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employer_uid, user_name, action_type, target_details } = body;

    if (!user_name || !action_type || !target_details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('employer_activity_logs')
      .insert([
        {
          employer_uid: employer_uid || 'default_employer',
          user_name,
          action_type,
          target_details
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Database table missing!' }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json({ log: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
