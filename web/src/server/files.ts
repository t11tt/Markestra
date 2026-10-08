import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { isFileId } from "@/lib/image";

const DIR = path.join(process.cwd(), "data", "files");
const MAX_BYTES = 6_000_000;

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export class ImageError extends Error {}

function extensionFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return null;
}

export async function saveImageBytes(bytes: Buffer, mime: string) {
  const ext = extensionFor(mime);
  if (!ext) throw new ImageError("只接受 PNG、JPEG、WebP 或 GIF");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new ImageError("图片大小不合适");
  const id = `f_${randomBytes(12).toString("hex")}.${ext}`;
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, id), bytes);
  return id;
}

export async function saveDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl);
  if (!match) throw new ImageError("图片格式不正确");
  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  return saveImageBytes(bytes, match[1]);
}

/** Turn an uploaded data URL or an existing file URL into the id stored in the database. */
export async function persistImage(value: string | null | undefined): Promise<string | null> {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return saveDataUrl(trimmed);
  const fromUrl = /^\/api\/files\/(f_[a-f0-9]{24}\.(?:png|jpe?g|webp|gif))$/.exec(trimmed);
  if (fromUrl) return fromUrl[1];
  if (isFileId(trimmed)) return trimmed;
  if (trimmed.length <= 8 && !trimmed.includes("/") && !trimmed.includes("\\")) return trimmed;
  throw new ImageError("图片格式不正确");
}

export async function readImageFile(id: string) {
  if (!isFileId(id)) return null;
  const file = path.join(DIR, id);
  try {
    const bytes = await fs.readFile(file);
    const ext = id.slice(id.lastIndexOf(".") + 1);
    return { bytes, mime: MIME[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}
