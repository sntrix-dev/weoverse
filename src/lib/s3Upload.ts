/**
 * Browser → S3 upload with the AWS SDK, as the previous build did (Surya, 2026-10-14, D-100).
 *
 * The credentials come from `VITE_AWS_*` build variables, so they are part of the public JS:
 * give this app an IAM user that can only `s3:PutObject` on `<bucket>/weoverse/app/*` — never
 * delete, list, or touch another bucket. Nothing here logs a credential.
 *
 * The SDK is loaded on the first upload only, so it never weighs on the first paint.
 */

const env = import.meta.env;

export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBase: string;
}

/** The bucket settings, or null when the build has none (uploads then go through the API). */
export function s3Config(): S3Config | null {
  const bucket = env.VITE_S3_BUCKET_NAME;
  const region = env.VITE_AWS_REGION || env.VITE_AWS_S3_REGION;
  const accessKeyId = env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.VITE_AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
  const publicBase = (env.VITE_S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(
    /\/+$/,
    '',
  );
  return { bucket, region, accessKeyId, secretAccessKey, publicBase };
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const two = (n: number) => String(n).padStart(2, '0');
const uuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/**
 * The object key: the same layout the backend uses for app uploads, so one bucket rule covers
 * both — `weoverse/app/<owner>/<folder>/<yyyy>/<mm>/<uuid>.<ext>`. The extension comes from the
 * type, never from the file's own name.
 */
export function objectKey(owner: string, folder: string, contentType: string, now = new Date()): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 40) || 'web';
  return `weoverse/app/${safe(owner)}/${safe(folder)}/${now.getUTCFullYear()}/${two(now.getUTCMonth() + 1)}/${uuid()}.${EXT[contentType] ?? 'bin'}`;
}

/** Puts one file into the bucket (multipart for large ones) and answers its public URL. */
export async function putToS3(
  cfg: S3Config,
  file: Blob,
  opts: { key: string; contentType: string; signal?: AbortSignal },
): Promise<string> {
  const [{ S3Client }, { Upload }] = await Promise.all([
    import('@aws-sdk/client-s3'),
    import('@aws-sdk/lib-storage'),
  ]);
  const client = new S3Client({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    // no default CRC headers: the bucket's CORS rule then only has to allow the usual ones
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  const upload = new Upload({
    client,
    params: { Bucket: cfg.bucket, Key: opts.key, Body: file, ContentType: opts.contentType },
    queueSize: 3,
    partSize: 8 * 1024 * 1024,
    leavePartsOnError: false,
  });
  const abort = () => void upload.abort();
  opts.signal?.addEventListener('abort', abort, { once: true });
  try {
    await upload.done();
  } finally {
    opts.signal?.removeEventListener('abort', abort);
    client.destroy();
  }
  return `${cfg.publicBase}/${opts.key.split('/').map(encodeURIComponent).join('/')}`;
}
