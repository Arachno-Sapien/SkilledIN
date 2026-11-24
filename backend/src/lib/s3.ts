import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

// Read on each call, not at import: local.ts loads .env after ESM imports have run.
const bucket = () => process.env.BUCKET_NAME;
let s3Client: S3Client | null = null;

function getS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
    });
  }
  return s3Client;
}

export async function createVideoUploadPolicy(challengeId: string) {
  const key = `videos/${challengeId}`;
  const bucketName = bucket();

  if (!bucketName) {
    // Dev mock upload endpoint. Same fields as a real policy (no Content-Type) so the client takes the same path.
    return {
      url: `/api/mock-upload`,
      fields: { key } as Record<string, string>,
      key,
    };
  }

  // No mock fallback once a bucket is configured: a fake policy "uploads" to nowhere and every submit then fails.
  const presigned = await createPresignedPost(getS3(), {
    Bucket: bucketName,
    Key: key,
    Conditions: [
      ["starts-with", "$Content-Type", "video/"],
      ["content-length-range", 0, 50 * 1024 * 1024], // up to 50MB
    ],
    Expires: 900, // 15 mins
  });

  return {
    url: presigned.url,
    fields: presigned.fields,
    key,
  };
}

/** false only when the object is really absent; other S3 errors throw so they are not reported as "upload again". */
export async function confirmVideoExists(key: string): Promise<boolean> {
  const bucketName = bucket();
  if (!bucketName) {
    return true; // dev mode
  }
  try {
    await getS3().send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (err) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e.name === "NotFound" || e.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}
