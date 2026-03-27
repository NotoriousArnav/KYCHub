import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'kyc';

export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`Bucket ${BUCKET} already exists`);
  } catch {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`Bucket ${BUCKET} created successfully`);
    } catch (createError) {
      console.log('Bucket creation error:', createError);
    }
  }
}

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  key: string;
  url: string;
  contentType: string;
  size: number;
}

export async function uploadFile(
  file: Express.Multer.File,
  folder: string = 'documents'
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error(`File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const ext = file.originalname.split('.').pop() || 'jpg';
  const key = `${folder}/${uuidv4()}.${ext}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
  const publicUrl = `${s3Endpoint}/${BUCKET}/${key}`;

  return {
    key,
    url: publicUrl,
    contentType: file.mimetype,
    size: file.size,
  };
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
