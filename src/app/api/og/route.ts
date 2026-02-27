import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArchiveBot/1.0; +https://archive.app)",
      },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();

    const extract = (name: string): string | undefined => {
      const patterns = [
        new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
      ];
      for (const re of patterns) {
        const m = html.match(re);
        if (m?.[1]) return m[1].trim();
      }
      return undefined;
    };

    const title = extract("title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    const description = extract("description");
    const image = extract("image");
    const favicon =
      html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)?.[1];

    let domain: string | undefined;
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = undefined;
    }

    return Response.json({
      title: title || undefined,
      description: description || undefined,
      image: image || undefined,
      favicon: favicon || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : undefined),
      domain: domain || undefined,
    });
  } catch (err) {
    console.error("OG fetch error:", err);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
