import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('associated_people')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ associatedPeople: data });
  } catch (error) {
    console.error('Fetch associated people error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, name, relationship } = await request.json();

  try {
    const { data, error } = await supabase
      .from('associated_people')
      .insert({ user_id: userId, name, relationship })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ associatedPerson: data });
  } catch (error) {
    console.error('Add associated person error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');

  if (!id || !userId) {
    return NextResponse.json({ error: 'Associated person ID and User ID are required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('associated_people')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete associated person error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}