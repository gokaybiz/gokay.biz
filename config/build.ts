import type { BuildConfig } from "./types";

export const buildConfig: BuildConfig = {
	css: ["~/assets/css/main.css"],
	nitro: {
		preset: "netlify",
		prerender: {
			routes: ["/sitemap.xml", "/robots.txt", "/blog/rss.xml"],
			autoSubfolderIndex: false,
		},
	},
};
