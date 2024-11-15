import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);
  const { currentPassword, newPassword } = await request.json();

  if (!userId || !currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = await getDb();

  try {
    // Fetch current user data
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

    if (!user) {
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
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}