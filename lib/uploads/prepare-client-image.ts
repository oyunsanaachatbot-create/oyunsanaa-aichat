const MAX_UPLOAD_BYTES = 900 * 1024;
export const EMERGENCY_UPLOAD_BYTES = 256 * 1024;
const MAX_DIMENSIONS = [2560, 2048, 1600, 1280, 1024, 768];
const JPEG_QUALITIES = [0.84, 0.74, 0.64, 0.54, 0.44, 0.34];
const JPG_EXTENSION_RE = /\.[^.]+$/;
const IMAGE_EXTENSION_RE =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i;
const HEIC_EXTENSION_RE = /\.(heic|heif)$/i;
const HEIC_MIME_RE = /^image\/(?:x-)?hei[cf](?:-sequence)?$/i;
const SERVER_SUPPORTED_TYPES = new Set([
  "image/avif",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

async function decodeImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Some mobile browsers expose createImageBitmap but cannot decode HEIC.
      // Fall back to the regular image decoder before reporting a failure.
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("IMAGE_COMPRESSION_FAILED"));
    };
    image.src = objectUrl;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("IMAGE_COMPRESSION_FAILED"));
      },
      "image/jpeg",
      quality
    );
  });
}

async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const { default: heic2any } = await import("heic2any");
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.86,
    });
    const jpegBlob = Array.isArray(result) ? result[0] : result;
    if (!jpegBlob) throw new Error("HEIC_CONVERSION_FAILED");

    return new File([jpegBlob], file.name.replace(JPG_EXTENSION_RE, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    throw new Error("HEIC_CONVERSION_FAILED");
  }
}

/**
 * Keep chat uploads below common reverse-proxy request limits. Large phone
 * images are resized and converted before the multipart request is created.
 */
export async function prepareImageForUpload(
  file: File,
  maxUploadBytes = MAX_UPLOAD_BYTES
): Promise<File> {
  const isImage =
    file.type.startsWith("image/") || IMAGE_EXTENSION_RE.test(file.name);
  const isHeic =
    HEIC_MIME_RE.test(file.type) || HEIC_EXTENSION_RE.test(file.name);
  const sourceFile = isHeic ? await convertHeicToJpeg(file) : file;
  const canSendDirectly =
    SERVER_SUPPORTED_TYPES.has(sourceFile.type.toLowerCase()) &&
    sourceFile.size <= maxUploadBytes;
  if (!isImage || canSendDirectly) {
    return sourceFile;
  }

  const decoded = await decodeImage(sourceFile);

  try {
    let smallestBlob: Blob | null = null;

    for (const maxDimension of MAX_DIMENSIONS) {
      const scale = Math.min(
        1,
        maxDimension / Math.max(decoded.width, decoded.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(decoded.width * scale));
      canvas.height = Math.max(1, Math.round(decoded.height * scale));

      const context = canvas.getContext("2d");
      if (!context) continue;
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

      for (const quality of JPEG_QUALITIES) {
        const blob = await canvasBlob(canvas, quality);
        if (!smallestBlob || blob.size < smallestBlob.size) {
          smallestBlob = blob;
        }
        if (blob.size <= maxUploadBytes) {
          return new File(
            [blob],
            sourceFile.name.replace(JPG_EXTENSION_RE, ".jpg"),
            {
              type: "image/jpeg",
              lastModified: file.lastModified,
            }
          );
        }
      }
    }

    if (!smallestBlob) throw new Error("IMAGE_COMPRESSION_FAILED");

    // Return the smallest available image instead of rejecting it. The caller
    // can retry once with an emergency size if the proxy still returns 413.
    return new File(
      [smallestBlob],
      sourceFile.name.replace(JPG_EXTENSION_RE, ".jpg"),
      {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }
    );
  } finally {
    decoded.close?.();
  }
}
