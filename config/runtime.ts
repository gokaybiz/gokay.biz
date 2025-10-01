import type { RuntimeConfigType } from "./types";

export const runtimeConfig: RuntimeConfigType = {
	runtimeConfig: {
		// Server-side only private config
		lastfmApiKey: "",
		googleSiteVerification: "",

		// Config that is also exposed to the client side
		public: {
			timezone: "",
			location: "",
			avatarUrl: "",
			lastfmUser: "",
			vscoUser: "",
			siteUrl: "",
			siteName: "Gökay Biz",
		},
	},
};
