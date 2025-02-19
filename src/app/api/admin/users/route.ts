import { type NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const USERS_PER_PAGE = 10;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";

  try {
    let query = supabase.from("users").select("id, name, email, phone", { count: "exact" });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: users, count, error } = await query.range((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE - 1).order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / USERS_PER_PAGE);

    return NextResponse.json({ users, totalPages });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
