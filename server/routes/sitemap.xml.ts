export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl || "https://gokay.biz";

  // routes with their priorities and change frequencies
  const staticRoutes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/projects", priority: "0.8", changefreq: "monthly" },
    { path: "/photos", priority: "0.7", changefreq: "weekly" },
    { path: "/songs", priority: "0.7", changefreq: "daily" },
  ];

  try {
    // Fetch blog posts
    const posts = await queryCollection(event, "posts")
      .order("createdAt", "DESC")
      .all();

    // Fetch pages
    const pages = await queryCollection(event, "pages")
      .order("createdAt", "DESC")
      .all();

    const currentDate = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // Add static routes
    for (const route of staticRoutes) {
      xml += `
  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    }

    // Add blog posts
    for (const post of posts) {
      const lastmod = post.updatedAt
        ? new Date(post.updatedAt).toISOString().split("T")[0]
        : post.createdAt
          ? new Date(post.createdAt).toISOString().split("T")[0]
          : currentDate;

      xml += `
  <url>
    <loc>${siteUrl}${post.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }

    // Add pages
    for (const page of pages) {
      const lastmod = page.updatedAt
        ? new Date(page.updatedAt).toISOString().split("T")[0]
        : page.createdAt
          ? new Date(page.createdAt).toISOString().split("T")[0]
          : currentDate;

      xml += `
  <url>
    <loc>${siteUrl}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    setHeader(event, "Content-Type", "application/xml");
    setHeader(event, "Cache-Control", "max-age=3600"); // Cache for 1 hour

    return xml;
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Error generating sitemap",
    });
  }
});
