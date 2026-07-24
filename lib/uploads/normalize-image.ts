import { Buffer } from "node:buffer";
import sharp from "sharp";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/**
 * Convert phone formats such as HEIC/HEIF to an OpenAI/storage-safe JPEG and
 * normalize large phone photos to the upload size limit.
 */
export async function normalizeUploadedImage(file: Blob): Promise<Blob> {
  const mime = file.type.toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(mime)) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is too large (max 15MB)");
  }

  const needsConversion =
    mime === "image/avif" ||
    mime === "image/heic" ||
    mime === "image/heif" ||
    file.size > MAX_OUTPUT_BYTES;

  if (!needsConversion) return file;

  const converted = await sharp(Buffer.from(await file.arrayBuffer()))
    .rotate()
    .resize({
      height: 4096,
      width: 4096,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  if (converted.byteLength > MAX_OUTPUT_BYTES) {
    throw new Error("Image is too large after compression");
  }

  const output = new ArrayBuffer(converted.byteLength);
  new Uint8Array(output).set(converted);
  return new Blob([output], { type: "image/jpeg" });
}
