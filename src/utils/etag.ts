import { createHash } from "crypto";

/**
 * Generates an ETag hash from data
 *
 * @param data - The data to generate an ETag from
 * @returns A string ETag hash
 */
export function generateETag(data: unknown): string {
  // Stringify the data and create a hash
  const stringData = JSON.stringify(data);
  return createHash("md5").update(stringData).digest("hex");
}

/**
 * Checks if the provided ETag matches the If-None-Match header
 *
 * @param etag - The generated ETag for the current data
 * @param ifNoneMatch - The If-None-Match header value from the request
 * @returns Boolean indicating if the ETags match (content unchanged)
 */
export function isETagMatch(etag: string, ifNoneMatch?: string | null): boolean {
  if (!ifNoneMatch) return false;

  // Parse the If-None-Match header (may contain multiple ETags)
  const etags = ifNoneMatch.split(",").map((tag) => tag.trim().replace(/^["']|["']$/g, ""));

  // Check if our ETag is in the list
  return etags.includes(etag) || etags.includes("*");
}
