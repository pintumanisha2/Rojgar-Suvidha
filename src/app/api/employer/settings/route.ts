import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employerId = searchParams.get('employer_id');

    if (!employerId) {
      return NextResponse.json({ error: 'employer_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('employer_profiles')
      .select('*')
      .eq('id', employerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ profile: null });
      }
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { employer_id, updates } = body;

    if (!employer_id || !updates) {
      return NextResponse.json({ error: 'employer_id and updates are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('employer_profiles')
      .update(updates)
      .eq('id', employer_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
