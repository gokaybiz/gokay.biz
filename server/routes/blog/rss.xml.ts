import rss from "rss";

export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig();
	const siteUrl = config.public.siteUrl || "https://gokay.biz";
	const siteName = `${config.public.siteName}'s Blog` || "Gokay's Blog";

	try {
		const rssFeed = new rss({
			title: siteName,
			feed_url: `${siteUrl}/blog/rss.xml`,
			site_url: siteUrl,
		});

		// Fetch blog posts
		const posts = await queryCollection(event, "posts")
			.order("createdAt", "DESC")
			.all();

		const currentDate = new Date().toISOString().split("T")[0];

		// Iterate blog posts to RSS instance
		for (const post of posts) {
			const lastmod = post.updatedAt
				? new Date(post.updatedAt).toISOString().split("T")[0]
				: post.createdAt
					? new Date(post.createdAt).toISOString().split("T")[0]
					: currentDate;

			rssFeed.item({
				title: post.title,
				description: post.description,
				date: lastmod,
				url: `${siteUrl}${post.path}`,
			});
		}
		setHeader(event, "Content-Type", "application/rss+xml; charset=utf-8");
		setHeader(event, "Cache-Control", "max-age=3600"); // Cache for 1 hour

		return rssFeed.xml();
	} catch (error) {
		throw createError({
			statusCode: 500,
			statusMessage: "Error generating sitemap",
		});
	}
});
