import type { ModulesConfig } from "./types";

export const modulesConfig: ModulesConfig = {
	modules: [
		"@nuxt/content",
		"@nuxt/image",
		"@nuxt/icon",
		"@nuxtjs/google-fonts",
		"@nuxt/scripts",
		"dayjs-nuxt",
	],
	googleFonts: {
		download: true,
		families: {
			"Short Stack": [400],
			Caveat: [400, 700],
			"Dancing Script": [400, 700],
			Inter: "100..900",
		},
		display: "swap",
		preconnect: true,
		preload: true,
		useStylesheet: true,
	},
	image: {
		provider: "none",
		quality: 70,
	},
	dayjs: {
		locales: ["en"],
		plugins: ["timezone", "utc"],
		defaultLocale: "en",
	},
	content: {
		build: {
			markdown: {
				highlight: {
					theme: "dracula-soft",
				},
				toc: {
					depth: 5,
					searchDepth: 5,
				},
				rehypePlugins: {
					"rehype-slug": {},
					"rehype-autolink-headings": {
						behavior: "wrap",
					},
				},
			},
		},
		renderer: {
			anchorLinks: true,
			alias: {
				a: "UtilLink",
				img: "UtilImg",
			},
		},
		experimental: {
			nativeSqlite: true,
		},
	},
};
