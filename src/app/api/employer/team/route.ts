import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employerUid = searchParams.get('employer_uid') || 'default_employer';

    const { data, error } = await supabaseAdmin
      .from('employer_team_members')
      .select('*')
      .eq('employer_uid', employerUid)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          team: [],
          error: 'Database table missing! Please run the team_schema.sql script in Supabase first.'
        });
      }
      throw error;
    }

    return NextResponse.json({ team: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, employer_uid } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('employer_team_members')
      .insert([
        {
          employer_uid: employer_uid || 'default_employer',
          name,
          email,
          role,
          status: 'Pending Invite'
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Database table missing! Please run the team_schema.sql script in Supabase first.' }, { status: 500 });
      }
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email has already been invited to your team.' }, { status: 400 });
      }
      throw error;
    }

    // Log the activity
    await supabaseAdmin.from('employer_activity_logs').insert([{
      employer_uid: employer_uid || 'default_employer',
      user_name: 'Admin / Current User', // In a real app with proper auth, grab this from session token
      action_type: 'Invited Member',
      target_details: `${name} (${role})`
    }]);

    return NextResponse.json({ member: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('employer_team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log the activity
    await supabaseAdmin.from('employer_activity_logs').insert([{
      employer_uid: 'default_employer', // In a real app, grab from session or pass it via request
      user_name: 'Admin / Current User',
      action_type: 'Removed Member',
      target_details: `Member ID: ${id}`
    }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
