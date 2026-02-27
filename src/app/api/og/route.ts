import { NextRequest } from "next/server";

function resolveUrl(href: string | undefined, base: string): string | undefined {
  if (!href?.trim()) return undefined;
  try {
    return new URL(href, base).href;
  } catch {
    return href.startsWith("http") ? href : undefined;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || !url.startsWith("http")) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const finalUrl = res.url || url;

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
    const rawImage = extract("image");
    const image = resolveUrl(rawImage, finalUrl);
    const rawFavicon =
      html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i)?.[1];
    const favicon = resolveUrl(rawFavicon, finalUrl);

    let domain: string | undefined;
    try {
      domain = new URL(finalUrl).hostname.replace(/^www\./, "");
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
    let domain: string | undefined;
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      domain = undefined;
    }
    return Response.json({
      title: undefined,
      description: undefined,
      image: undefined,
      favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : undefined,
      domain,
    });
  }
}
