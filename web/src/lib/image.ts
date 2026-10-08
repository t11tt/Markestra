const FILE_ID = /^f_[a-f0-9]{24}\.(?:png|jpe?g|webp|gif)$/;

export function isFileId(value: string) {
  return FILE_ID.test(value);
}

/** Database values stay as a file id or an emoji. Callers that render use this URL. */
export function displayImage(stored?: string | null): string | undefined {
  if (!stored) return undefined;
  if (isFileId(stored)) return `/api/files/${stored}`;
  return stored;
}

export function isPhotoSrc(image?: string) {
  if (!image) return false;
  return (
    image.startsWith("data:") ||
    image.startsWith("/api/files/") ||
    image.startsWith("blob:") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  );
}

export function shopPath(slug: string) {
  return `/shop?slug=${encodeURIComponent(slug)}`;
}
