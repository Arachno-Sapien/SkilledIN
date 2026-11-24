import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const BUCKET_NAME = process.env.BUCKET_NAME || "skilledin-videos";
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

  if (!process.env.BUCKET_NAME) {
    // Dev mock upload endpoint
    return {
      url: `/api/mock-upload`,
      fields: { key, "Content-Type": "video/webm" },
      key,
    };
  }

  try {
    const client = getS3();
    const presigned = await createPresignedPost(client, {
      Bucket: BUCKET_NAME,
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
  } catch (err) {
    console.warn("S3 presigned post error, using local fallback:", (err as Error).message);
    return {
      url: `/api/mock-upload`,
      fields: { key, "Content-Type": "video/webm" },
      key,
    };
  }
}

export async function confirmVideoExists(key: string): Promise<boolean> {
  if (!process.env.BUCKET_NAME) {
    return true; // dev mode
  }
  try {
    const client = getS3();
    await client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}
