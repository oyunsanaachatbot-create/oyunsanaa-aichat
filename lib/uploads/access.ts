const UNSAFE_SEGMENT = /[\\/\0]/;
/** Private buckets always use the uploader's user ID as the first segment. */
export function ownsPrivateUpload(
  bucket: string,
  path: string[],
  userId: string
) {
  return (
    ["chat-uploads", "ebook-images"].includes(bucket) &&
    !!userId &&
    path.length >= 2 &&
    path[0] === userId &&
    path.every(
      (part) =>
        !!part && part !== "." && part !== ".." && !UNSAFE_SEGMENT.test(part)
    )
  );
}

/** Old disk-backed uploads must not remain reachable through Next's static file server. */
export function isLegacyPrivateUploadPath(pathname: string) {
  try {
    return decodeURIComponent(pathname).toLowerCase().startsWith("/uploads/");
  } catch {
    return pathname.toLowerCase().startsWith("/uploads/");
  }
}
