import { Duration, Effect, Option, Schedule } from "effect";
import type { Dispatcher } from "undici";
import type { VscoImage, VscoMediaItem, VscoMediaResponse } from "~/types/vsco";
import { tlsRequest } from "./tlsHandler";

type Response = Dispatcher.ResponseData<unknown>;

class FetchError {
	readonly _tag = "FetchError";
	constructor(
		readonly error: unknown,
		readonly url?: string,
	) {}
}

class ApiError {
	readonly _tag = "ApiError";
	constructor(
		readonly message: string,
		readonly status?: number,
	) {}
}

const BASE_URL = "https://vsco.co/api/";

const buildUrl = (
	version: string,
	path: string,
	params?: Record<string, string | number>,
) => {
	const url = new URL(`${BASE_URL}${version}/${path}`);
	if (params) {
		// Append each parameter to the URL
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.append(key, String(value));
		}
	}
	return url.toString();
};

const fetchJson = <T>(url: string): Effect.Effect<T, FetchError | ApiError> => {
	const fetchEffect = Effect.tryPromise({
		try: async () => {
			return await tlsRequest(url, {
				headers: {
					Authorization: "Bearer 7356455548d0a1d886db010883388d08be84d0c9",
				},
			});
		},
		catch: (e) => new FetchError(e, url),
	});

	const handleResponse = (
		response: Response,
	): Effect.Effect<T, FetchError | ApiError> => {
		return Effect.tryPromise({
			try: () => response.body.json() as Promise<T>,
			catch: (e) => new FetchError(e, url),
		});
	};

	return fetchEffect.pipe(
		Effect.flatMap(handleResponse),
		Effect.retry({
			times: 3,
			schedule: Duration.seconds(0.5).pipe(Schedule.exponential),
		}),
		Effect.catchAll((error) => Effect.fail(error)),
	);
};

interface VscoConfig {
	readonly username: string;
}

// Service factory for VSCO
export const createVscoService = ({ username }: VscoConfig) => {
	let cachedSiteId: Option.Option<number> = Option.none();

	const getSiteId = (): Effect.Effect<number, FetchError | ApiError> =>
		Option.match(cachedSiteId, {
			onNone: () =>
				fetchJson<{ sites: { id: number }[] }>(
					buildUrl("2.0", "sites", { subdomain: username }),
				).pipe(
					Effect.tap(() => console.log("Fetching site ID from API")),
					Effect.map((res) => {
						const id = res.sites[0]?.id;
						if (typeof id !== "number") throw new Error("No site id found");
						cachedSiteId = Option.some(id);
						return id;
					}),
				),
			onSome: (id) => Effect.succeed(id),
		});

	const getRedirectUrl = (url: string): Effect.Effect<string, FetchError> =>
		Effect.tryPromise({
			try: async () => {
				const res = await fetch(
					url.startsWith("http") ? url : `https://${url}`,
					{
						method: "HEAD",
						redirect: "follow",
					},
				);
				return res.url;
			},
			catch: (e) => {
				console.log(e);
				return new FetchError(e);
			},
		});

	const fetchAllMedia = (
		siteId: number,
		cursor?: string | null,
		acc: VscoMediaItem[] = [],
	): Effect.Effect<VscoMediaItem[], FetchError | ApiError> =>
		fetchJson<VscoMediaResponse>(
			buildUrl("3.0", "medias/profile", {
				site_id: siteId,
				...(cursor ? { cursor } : {}),
			}),
		).pipe(
			Effect.flatMap((res) =>
				res.previous_cursor
					? fetchAllMedia(siteId, res.previous_cursor, acc.concat(res.media))
					: Effect.succeed(acc.concat(res.media)),
			),
		);

	const getImages = (): Effect.Effect<VscoImage[], FetchError | ApiError> =>
		getSiteId().pipe(
			Effect.flatMap((siteId) =>
				fetchAllMedia(siteId).pipe(
					Effect.flatMap((media) =>
						Effect.all(
							media
								.filter(
									(item) =>
										item.type === "image" && item.image && !item.image.is_video,
								)
								.map((item) =>
									getRedirectUrl(item.image.responsive_url).pipe(
										Effect.map((url) => ({
											photo_url: url,
											date: item.image.capture_date ?? item.image.upload_date,
										})),
									),
								),
							{ concurrency: "unbounded" },
						).pipe(
							Effect.map((images) => images.sort((a, b) => b.date - a.date)),
						),
					),
				),
			),
		);

	return { getImages };
};
