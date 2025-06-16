import { getServerSession } from "next-auth/next";
import { createMocks } from "node-mocks-http";

import { supabase } from "@/lib/db";
import * as etagUtils from "@/utils/etag";

import * as handler from "../../src/app/api/user-data/edit-ride/route";

jest.mock("@/lib/db", () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));
jest.mock("next-auth/next", () => ({ getServerSession: jest.fn().mockResolvedValue(null) }));
jest.mock("@/utils/etag", () => ({
  generateETag: jest.fn().mockReturnValue("etag123"),
  isETagMatch: jest.fn().mockReturnValue(false),
}));

describe("GET /api/user-data/edit-ride", () => {
  beforeEach(() => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(false);
  });

  it("should return 401 if not authenticated", async () => {
    const { req } = createMocks({ method: "GET" });
    const response = await handler.GET(req);
    expect(response.status).toBe(401);
  });

  it("should return 400 if rideId is missing", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    const { req } = createMocks({ method: "GET" });
    req.nextUrl = { searchParams: new URLSearchParams() } as any;
    const response = await handler.GET(req);
    expect(response.status).toBe(400);
  });

  it("should return 404 if ride not found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    });
    const { req } = createMocks({ method: "GET" });
    req.nextUrl = { searchParams: new URLSearchParams([["rideId", "1"]]) } as any;
    const response = await handler.GET(req);
    expect(response.status).toBe(404);
  });

  it("should return 200 if ride found", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    });
    const { req } = createMocks({ method: "GET" });
    req.nextUrl = { searchParams: new URLSearchParams([["rideId", "1"]]) } as any;
    const response = await handler.GET(req);
    expect(response.status).toBe(200);
  });

  it("should return 304 if ETag matches", async () => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(true);
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
    });
    const { req } = createMocks({ method: "GET", headers: { "if-none-match": '"etag123"' } });
    req.nextUrl = { searchParams: new URLSearchParams([["rideId", "1"]]) } as any;
    const response = await handler.GET(req);
    expect(response.status).toBe(304);
  });

  it("should return 500 if DB error", async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { id: "123" } });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    const { req } = createMocks({ method: "GET" });
    req.nextUrl = { searchParams: new URLSearchParams([["rideId", "1"]]) } as any;
    const response = await handler.GET(req);
    expect(response.status).toBe(500);
  });
});
