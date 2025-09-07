// Custom image loader for Next.js that uses Supabase Render endpoint for transformations.
// It accepts either:
// 1) bucket/path/to/file.ext
// 2) A full Supabase public object URL: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
// Non-Supabase URLs are returned as-is (no transformation).

type LoaderProps = { src: string; width: number; quality?: number };

function extractBucketPathFromPublicUrl(src: string): string | null {
  try {
    const url = new URL(src);
    const marker = "/storage/v1/object/public/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    // Return "<bucket>/<path>"
    return url.pathname.substring(idx + marker.length).replace(/^\/+/, "");
  } catch {
    return null;
  }
}

function toBucketPath(src: string): string {
  // If it's already a bucket/path
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    return src.replace(/^\/+/, "");
  }
  // If it's a Supabase public object URL
  const bp = extractBucketPathFromPublicUrl(src);
  if (bp) return bp;
  // Fallback: return original (non-supabase URL)
  return src;
}

export default function supabaseLoader({ src, width, quality }: LoaderProps): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const q = typeof quality === "number" ? quality : 75;

  // If base is missing or src is not a Supabase asset, return as-is
  const isSupabase = src.includes("/storage/v1/object/public/") || (!src.startsWith("http") && !src.startsWith("/"));
  if (!base || !isSupabase) {
    return src;
  }

  const bucketPath = toBucketPath(src);
  // Build Supabase Render URL
  const u = new URL(`${base}/storage/v1/render/image/public/${bucketPath}`);
  u.searchParams.set("width", String(width));
  u.searchParams.set("quality", String(q));
  u.searchParams.set("format", "webp");
  return u.toString();
}


