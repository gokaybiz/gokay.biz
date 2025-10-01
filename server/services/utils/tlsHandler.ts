// tlsHandler.ts
import { Agent, buildConnector, request, setGlobalDispatcher } from "undici";

const ciphers = [
	"TLS_AES_128_GCM_SHA256",
	"TLS_CHACHA20_POLY1305_SHA256",
	"TLS_AES_256_GCM_SHA384",
	"ECDHE-ECDSA-AES128-GCM-SHA256",
	"ECDHE-RSA-AES128-GCM-SHA256",
	"ECDHE-ECDSA-CHACHA20-POLY1305",
	"ECDHE-RSA-CHACHA20-POLY1305",
	"ECDHE-ECDSA-AES256-GCM-SHA384",
	"ECDHE-RSA-AES256-GCM-SHA384",
	"AES128-GCM-SHA256",
	"AES256-GCM-SHA384",
].join(":");

const ecdhCurve = "X25519:P-256:P-384:P-521";

const connector = buildConnector({ ciphers, ecdhCurve });
const agent = new Agent({ connect: connector });
setGlobalDispatcher(agent);

export async function tlsRequest(
	url: string,
	opts: Parameters<typeof request>[1] = {},
) {
	return request(url, { ...opts, dispatcher: agent });
}
