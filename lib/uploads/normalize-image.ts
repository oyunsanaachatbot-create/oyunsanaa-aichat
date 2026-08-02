import { Buffer } from "node:buffer";
import sharp from "sharp";

const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/x-heic",
  "image/x-heif",
  "image/x-heic-sequence",
  "image/x-heif-sequence",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const HEIC_FILE_RE = /\.(?:heic|heif)$/i;
const HEIC_MIME_RE = /^image\/(?:x-)?hei[cf](?:-sequence)?$/i;

type FileLikeBlob = Blob & { name?: string };

export type NormalizeImageOptions = {
  /** Produce a consistent, orientation-correct JPEG for vision APIs. */
  forceJpeg?: boolean;
};

export function detectUploadedImageMime(file: FileLikeBlob): string {
  const declaredMime = file.type.toLowerCase().split(";")[0].trim();
  if (HEIC_FILE_RE.test(file.name ?? "")) {
    return file.name?.toLowerCase().endsWith(".heif")
      ? "image/heif"
      : "image/heic";
  }
  return declaredMime;
}

/**
 * Convert phone formats such as HEIC/HEIF to an OpenAI/storage-safe JPEG and
 * normalize large phone photos to the upload size limit.
 */
export async function normalizeUploadedImage(
  file: FileLikeBlob,
  options: NormalizeImageOptions = {}
): Promise<Blob> {
  const mime = detectUploadedImageMime(file);
  if (!SUPPORTED_IMAGE_TYPES.has(mime)) {
    throw new Error("Only image files are supported");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is too large (max 15MB)");
  }

  const needsConversion =
    mime === "image/avif" ||
    HEIC_MIME_RE.test(mime) ||
    file.size > MAX_OUTPUT_BYTES ||
    options.forceJpeg === true;

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
