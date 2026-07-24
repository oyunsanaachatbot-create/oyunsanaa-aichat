const MAX_UPLOAD_BYTES = 900 * 1024;
export const EMERGENCY_UPLOAD_BYTES = 256 * 1024;
const MAX_DIMENSIONS = [2560, 2048, 1600, 1280, 1024, 768];
const JPEG_QUALITIES = [0.84, 0.74, 0.64, 0.54, 0.44, 0.34];
const JPG_EXTENSION_RE = /\.[^.]+$/;
const IMAGE_EXTENSION_RE =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i;
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
  const canSendDirectly =
    SERVER_SUPPORTED_TYPES.has(file.type.toLowerCase()) &&
    file.size <= maxUploadBytes;
  if (!isImage || canSendDirectly) {
    return file;
  }

  const decoded = await decodeImage(file);

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
          return new File([blob], file.name.replace(JPG_EXTENSION_RE, ".jpg"), {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
        }
      }
    }

    if (!smallestBlob) throw new Error("IMAGE_COMPRESSION_FAILED");

    // Return the smallest available image instead of rejecting it. The caller
    // can retry once with an emergency size if the proxy still returns 413.
    return new File(
      [smallestBlob],
      file.name.replace(JPG_EXTENSION_RE, ".jpg"),
      {
        type: "image/jpeg",
        lastModified: file.lastModified,
      }
    );
  } finally {
    decoded.close?.();
  }
}
