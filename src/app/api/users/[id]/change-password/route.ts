// src/app/api/users/[id]/change-password/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);
  const { currentPassword, newPassword } = await request.json();

  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Fetch current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
