import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import { env } from "./env";

const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export type UploadFolder =
  | "profiles"
  | "activities"
  | "groups"
  | "discussions";

export async function uploadToR2(
  file: Express.Multer.File,
  folder: UploadFolder,
): Promise<string> {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${env.STORAGE_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(env.STORAGE_PUBLIC_URL)) return;

  const key = publicUrl.replace(`${env.STORAGE_PUBLIC_URL}/`, "");

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: key,
    }),
  );
}
