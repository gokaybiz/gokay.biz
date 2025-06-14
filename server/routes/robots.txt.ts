export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl || "https://gokay.biz";

  const robotsContent = `User-agent: *
Allow: /

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml

# Disallow nuxt internal paths
Disallow: /api/
Disallow: /_nuxt/
Disallow: /.nuxt/

# Allow search engine crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

User-agent: EcosiaBot
Allow: /

# Block AI crawlers - They won't respect anyway
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# Crawl delay for politeness
Crawl-delay: 1
`;

  setHeader(event, "Content-Type", "text/plain");
  setHeader(event, "Cache-Control", "max-age=86400"); // Cache for 24 hours

  return robotsContent;
});
