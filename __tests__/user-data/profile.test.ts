import { getServerSession } from "next-auth/next";
import { createMocks } from "node-mocks-http";

import { getUserContacts } from "@/lib/contactService";
import { supabase } from "@/lib/db";
import * as etagUtils from "@/utils/etag";

import * as handler from "../../src/app/api/user-data/profile/route";

const mockedSupabase = supabase as any;

jest.mock("@/lib/db", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn().mockResolvedValue(null) }));
jest.mock("@/utils/etag", () => ({
  generateETag: jest.fn().mockReturnValue("etag123"),
  isETagMatch: jest.fn().mockReturnValue(false),
}));
jest.mock("@/lib/contactService", () => ({ getUserContacts: jest.fn() }));

describe("GET /api/user-data/profile", () => {
  beforeEach(() => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(false);
    mockedSupabase.from.mockReturnThis();
    mockedSupabase.select.mockReturnThis();
    mockedSupabase.eq.mockReturnThis();
    mockedSupabase.single.mockReset();
    (getUserContacts as jest.Mock).mockReset();
  });

  it("should return 401 if not authenticated", async () => {
    const { req } = createMocks({ method: "GET" });
    const response = await handler.GET(req);
    expect(response.status).toBe(401);
  });

  it("should return 200 if user found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (mockedSupabase.single as any)
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    (getUserContacts as jest.Mock).mockResolvedValue({ data: [], error: null });
    const { req } = createMocks({ method: "GET" });
    const response = await handler.GET(req);
    expect(response.status).toBe(200);
  });

  it("should return 304 if ETag matches", async () => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(true);
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (mockedSupabase.single as any)
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    (getUserContacts as jest.Mock).mockResolvedValue({ data: [], error: null });
    const { req } = createMocks({ method: "GET", headers: { "if-none-match": '"etag123"' } });
    const response = await handler.GET(req);
    expect(response.status).toBe(304);
  });

  it("should return 500 if DB error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (mockedSupabase.single as any).mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });
    (getUserContacts as jest.Mock).mockResolvedValue({ data: [], error: null });
    const { req } = createMocks({ method: "GET" });
    const response = await handler.GET(req);
    expect(response.status).toBe(500);
  });
});
