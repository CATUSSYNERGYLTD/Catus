import { randomUUID } from "node:crypto";

const bucketId = "catus-synergy-site-images";
export const maxImageUploadBytes = 15 * 1024 * 1024;

const imageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

function imageMatchesContentType(image: Buffer, contentType: string): boolean {
  switch (contentType) {
    case "image/jpeg":
      return image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    case "image/png":
      return image.length >= 8 && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    case "image/webp":
      return image.length >= 12 && image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP";
    case "image/gif":
      return image.length >= 6 && ["GIF87a", "GIF89a"].includes(image.toString("ascii", 0, 6));
    case "image/avif": {
      if (image.length < 16 || image.toString("ascii", 4, 8) !== "ftyp") return false;
      const compatibleBrands =
        image.toString("ascii", 16, Math.min(image.length, 64)).match(/.{4}/g) ?? [];
      const brands = [
        image.toString("ascii", 8, 12),
        ...compatibleBrands,
      ];
      return brands.some((brand) => brand === "avif" || brand === "avis");
    }
    default:
      return false;
  }
}

const bucketSettings = {
  public: true,
  file_size_limit: maxImageUploadBytes,
  allowed_mime_types: [...imageTypes.keys()],
};

export function normalizeImageContentType(value: string | null | undefined): string {
  return (value ?? "").split(";", 1)[0].trim().toLowerCase();
}

export function isSupportedImageContentType(value: string | null | undefined): boolean {
  return imageTypes.has(normalizeImageContentType(value));
}

export class SupabaseStorageError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "SupabaseStorageError";
  }
}

type StorageConfig = {
  url: string;
  adminKey: string;
};

function getStorageConfig(): StorageConfig {
  const url = (process.env.SUPABASE_PROJECT_URL || process.env.SUPABASE_URL)
    ?.trim()
    .replace(/\/+$/, "");
  const adminKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !adminKey) {
    throw new SupabaseStorageError("Supabase Storage is not configured.", 503);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseStorageError("SUPABASE_URL is not a valid URL.", 503);
  }
  const isLocalHttp =
    parsedUrl.protocol === "http:" &&
    (parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1");
  if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
    throw new SupabaseStorageError("SUPABASE_URL must use HTTPS.", 503);
  }

  return { url, adminKey };
}

function storageUrl(config: StorageConfig, path: string): string {
  return `${config.url}/storage/v1${path}`;
}

async function storageRequest(
  config: StorageConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  try {
    return await fetch(storageUrl(config, path), {
      ...init,
      headers: {
        apikey: config.adminKey,
        Authorization: `Bearer ${config.adminKey}`,
        ...init.headers,
      },
    });
  } catch {
    throw new SupabaseStorageError("Could not reach Supabase Storage.", 502);
  }
}

async function providerError(response: Response, action: string): Promise<SupabaseStorageError> {
  const detail = (await response.text()).slice(0, 400).replace(/\s+/g, " ").trim();
  return new SupabaseStorageError(
    `Supabase Storage ${action} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
    502,
  );
}

async function readBucket(config: StorageConfig): Promise<{ public?: boolean } | null> {
  const response = await storageRequest(config, `/bucket/${encodeURIComponent(bucketId)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw await providerError(response, "bucket lookup");
  return (await response.json()) as { public?: boolean };
}

async function ensurePublicBucket(config: StorageConfig): Promise<void> {
  let bucket = await readBucket(config);
  if (!bucket) {
    const response = await storageRequest(config, "/bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: bucketId,
        name: bucketId,
        ...bucketSettings,
      }),
    });
    if (!response.ok && response.status !== 409) {
      throw await providerError(response, "bucket creation");
    }
    bucket = await readBucket(config);
    if (!bucket) {
      throw new SupabaseStorageError("Supabase Storage bucket could not be created.", 502);
    }
  }

  if (!bucket.public) {
    throw new SupabaseStorageError(
      `The ${bucketId} bucket already exists but is private. Make it public in Supabase Storage or rename it before uploading.`,
      503,
    );
  }
}

function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadPublicSiteImage(
  image: Buffer,
  contentType: string,
): Promise<{ url: string; path: string }> {
  const normalizedType = normalizeImageContentType(contentType);
  const extension = imageTypes.get(normalizedType);
  if (!extension) {
    throw new SupabaseStorageError("Choose a JPEG, PNG, WebP, AVIF, or GIF image.", 415);
  }
  if (image.length === 0) {
    throw new SupabaseStorageError("The selected image is empty.", 400);
  }
  if (image.length > maxImageUploadBytes) {
    throw new SupabaseStorageError("Images must be 15 MB or smaller.", 413);
  }
  if (!imageMatchesContentType(image, normalizedType)) {
    throw new SupabaseStorageError("The image file content does not match its selected format.", 415);
  }

  const config = getStorageConfig();
  await ensurePublicBucket(config);

  const path = `site/${randomUUID()}.${extension}`;
  const response = await storageRequest(
    config,
    `/object/${encodeURIComponent(bucketId)}/${encodeObjectPath(path)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": normalizedType,
        "Cache-Control": "max-age=31536000",
        "x-upsert": "false",
      },
      body: image,
    },
  );
  if (!response.ok) throw await providerError(response, "image upload");

  return {
    url: `${config.url}/storage/v1/object/public/${encodeURIComponent(bucketId)}/${encodeObjectPath(path)}`,
    path,
  };
}