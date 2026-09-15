export const CONTACT_AVATAR_BUCKET = "contact-avatars";
export const CONTACT_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const CONTACT_AVATAR_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function contactAvatarExtension(mime: string): string | null {
  return MIME_EXT[mime] ?? null;
}

/** Pull the storage object path out of a public URL for this bucket. */
export function contactAvatarPathFromUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const marker = `/object/public/${CONTACT_AVATAR_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const path = url.slice(idx + marker.length).split("?")[0];
  if (!path) return null;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function buildContactAvatarPath(
  accountId: string,
  contactId: string,
  ext: string,
  now: number = Date.now(),
): string {
  return `account-${accountId}/${contactId}/avatar-${now}.${ext}`;
}
