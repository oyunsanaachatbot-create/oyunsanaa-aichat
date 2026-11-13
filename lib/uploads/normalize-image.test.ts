import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import {
  detectUploadedImageMime,
  normalizeUploadedImage,
} from "./normalize-image";

const IMAGE_ONLY_ERROR_RE = /Only image files/;

function namedBlob(parts: BlobPart[], type: string, name: string) {
  const blob = new Blob(parts, { type }) as Blob & { name: string };
  Object.defineProperty(blob, "name", { value: name });
  return blob;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const output = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(output).set(bytes);
  return output;
}

test("detects iPhone HEIC files when the browser MIME is generic", () => {
  const file = namedBlob([], "application/octet-stream", "IMG_1234.HEIC");
  assert.equal(detectUploadedImageMime(file), "image/heic");
});

test("accepts x-heif MIME variants", () => {
  const file = namedBlob([], "image/x-heif", "iphone-photo");
  assert.equal(detectUploadedImageMime(file), "image/x-heif");
});

test("forceJpeg returns an orientation-safe JPEG for vision requests", async () => {
  const png = await sharp({
    create: {
      width: 120,
      height: 80,
      channels: 3,
      background: "#4f46e5",
    },
  })
    .png()
    .toBuffer();
  const file = namedBlob([toArrayBuffer(png)], "image/png", "meal.png");

  const normalized = await normalizeUploadedImage(file, { forceJpeg: true });
  const metadata = await sharp(
    Buffer.from(await normalized.arrayBuffer())
  ).metadata();

  assert.equal(normalized.type, "image/jpeg");
  assert.equal(metadata.format, "jpeg");
  assert.equal(metadata.width, 120);
  assert.equal(metadata.height, 80);
});

test("rejects Live Photo video components instead of uploading them as images", async () => {
  const mov = namedBlob([], "video/quicktime", "IMG_1234.MOV");
  await assert.rejects(normalizeUploadedImage(mov), IMAGE_ONLY_ERROR_RE);
});
