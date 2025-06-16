import { getServerSession } from "next-auth/next";
import { createMocks } from "node-mocks-http";

import { supabase } from "@/lib/db";
import * as etagUtils from "@/utils/etag";

import * as handler from "../../src/app/api/user-data/create-ride/route";

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

describe("GET /api/user-data/create-ride", () => {
  beforeEach(() => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(false);
  });

  it("should return 401 if not authenticated", async () => {
    const { req } = createMocks({
      method: "GET",
    });
    const response = await handler.GET(req);
    expect(response.status).toBe(401);
  });

  it("should return 200 with associated people if authenticated", async () => {
    const mockSession = { user: { id: "123" } };
    const mockAssociatedPeople = [{ id: 1, name: "John" }];
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockAssociatedPeople, error: null }),
    });
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const { req } = createMocks({
      method: "GET",
    });
    const response = await handler.GET(req);
    expect(response.status).toBe(200);
    const text = await response.text();
    const data = JSON.parse(text);
    expect(data.associatedPeople).toEqual(mockAssociatedPeople);
  });

  it("should return 304 if ETag matches", async () => {
    (etagUtils.isETagMatch as jest.Mock).mockReturnValue(true);
    const mockSession = { user: { id: "123" } };
    const mockAssociatedPeople = [{ id: 1, name: "John" }];
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockAssociatedPeople, error: null }),
    });
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const { req } = createMocks({
      method: "GET",
      headers: { "if-none-match": '"etag123"' },
    });
    const response = await handler.GET(req);
    expect(response.status).toBe(304);
  });

  it("should return 500 if Supabase throws an error", async () => {
    const mockSession = { user: { id: "123" } };
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockRejectedValue(new Error("DB error")),
    });
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);

    const { req } = createMocks({
      method: "GET",
    });
    const response = await handler.GET(req);
    expect(response.status).toBe(500);
  });
});
