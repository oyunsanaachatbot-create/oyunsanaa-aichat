const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const MAX_DIMENSIONS = [2560, 2048, 1600, 1280];
const JPEG_QUALITIES = [0.84, 0.74, 0.64, 0.54];
const JPG_EXTENSION_RE = /\.[^.]+$/;

function decodeImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" })
      .then((bitmap) => ({
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      }))
      .catch(() => {
        throw new Error("IMAGE_COMPRESSION_FAILED");
      });
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
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= MAX_UPLOAD_BYTES) {
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
        if (blob.size <= MAX_UPLOAD_BYTES) {
          return new File([blob], file.name.replace(JPG_EXTENSION_RE, ".jpg"), {
            type: "image/jpeg",
            lastModified: file.lastModified,
          });
        }
      }
    }

    throw new Error(
      smallestBlob && smallestBlob.size > MAX_UPLOAD_BYTES
        ? "IMAGE_TOO_LARGE_AFTER_COMPRESSION"
        : "IMAGE_COMPRESSION_FAILED"
    );
  } finally {
    decoded.close?.();
  }
}
