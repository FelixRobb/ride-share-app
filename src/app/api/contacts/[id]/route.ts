// app/api/contacts/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const contactId = url.pathname.split('/').at(-1);

  if (!contactId) {
    return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
