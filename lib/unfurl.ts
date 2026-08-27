function meta(html: string, key: string) {
  const property = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
    "i",
  )
  const reversed = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
    "i",
  )
  return html.match(property)?.[1] || html.match(reversed)?.[1] || ""
}

function youtubeId(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1)
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v")
    }
  } catch {
    return null
  }
  return null
}

export async function unfurlUrl(raw: string) {
  const href = raw.trim()
  const parsed = new URL(href)
  const yt = youtubeId(href)
  if (yt) {
    return {
      href,
      title: "YouTube",
      description: parsed.hostname,
      image: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`,
      embed: `https://www.youtube.com/embed/${yt}`,
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 3000)
  try {
    const response = await fetch(href, {
      signal: controller.signal,
      headers: { "User-Agent": "publicpaste/1.0" },
      redirect: "follow",
    })
    const html = await response.text()
    return {
      href,
      title: meta(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1] || parsed.hostname,
      description: meta(html, "og:description") || parsed.hostname,
      image: meta(html, "og:image") || null,
      embed: null,
    }
  } catch {
    return {
      href,
      title: parsed.hostname,
      description: href,
      image: null,
      embed: null,
    }
  } finally {
    clearTimeout(timer)
  }
}
