import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookie = await cookies();
  cookie.delete("admin_jwt");
  return NextResponse.json({ success: true });
}
