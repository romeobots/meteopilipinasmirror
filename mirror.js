import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import https from "https";
import fetch from "node-fetch";

// Allow broken SSL (Node ONLY)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const agent = new https.Agent({ rejectUnauthorized: false });

const r2 = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY,
		secretAccessKey: process.env.R2_SECRET_KEY,
	},
});

const SOURCE_IMAGE = "http://src.meteopilipinas.gov.ph/repo/mtsat-colored/24hour/1-him-colored-fs8.png";

const BUCKET = "weather-images";
const KEY = "latest.png";

async function run() {
	console.log("Fetching image...");
	const res = await fetch(SOURCE_IMAGE, { agent });

	if (!res.ok) {
		throw new Error(`Fetch failed: ${res.status}`);
	}

	const buffer = Buffer.from(await res.arrayBuffer());

	console.log("Uploading to R2...");
	await r2.send(
		new PutObjectCommand({
			Bucket: BUCKET,
			Key: KEY,
			Body: buffer,
			ContentType: "image/png",
			CacheControl: "no-cache",
		})
	);

	console.log("Done ✅");
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
