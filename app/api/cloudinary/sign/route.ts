import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Mints a short-lived Cloudinary upload signature.
 *
 * The secret never reaches the browser, and only signed-in users get a
 * signature — otherwise the cloud account is an open file host. The folder is
 * chosen here rather than taken from the client so uploads cannot be scattered
 * across the account.
 */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "cloudinary_not_configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    contentType?: string;
    size?: number;
  };

  if (body.contentType && !ALLOWED_TYPES.includes(body.contentType)) {
    return NextResponse.json({ error: "wrong_type" }, { status: 415 });
  }
  if (typeof body.size === "number" && body.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const root = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ?? "permix";
  const kind = /^[a-z0-9_-]{1,32}$/.test(body.kind ?? "") ? body.kind : "misc";
  const folder = `${root}/${kind}`;
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signs the alphabetically sorted `key=value` pairs of every
  // parameter sent with the upload, except the file, api_key and the signature.
  const params: Record<string, string | number> = { folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  const signature = createHash("sha1")
    .update(`${toSign}${apiSecret}`)
    .digest("hex");

  return NextResponse.json(
    { cloudName, apiKey, timestamp, folder, signature },
    { headers: { "Cache-Control": "no-store" } },
  );
}
