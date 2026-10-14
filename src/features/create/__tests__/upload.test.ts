import { http, HttpResponse } from 'msw';
import { ApiError } from '@/api/client';
import { fail, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { tokens } from '@/api/tokens';
import { uploadMedia } from '../api/create';

const s3 = vi.hoisted(() => ({ params: [] as Record<string, unknown>[], fail: null as Error | null }));
vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class {
    constructor(o: { params: Record<string, unknown> }) {
      s3.params.push(o.params);
    }
    done() {
      return s3.fail ? Promise.reject(s3.fail) : Promise.resolve({});
    }
    abort() {
      return Promise.resolve();
    }
  },
}));

describe('uploadMedia — signed link from the API (no bucket settings in the build)', () => {
  it('asks for a signed link with the type and exact size, then PUTs the file there', async () => {
    let asked: unknown;
    let put: { type: string | null; auth: string | null; size: number } | null = null;
    server.use(
      http.post(url('/frontend/media/presign'), async ({ request }) => {
        asked = await request.json();
        return HttpResponse.json(
          {
            success: true,
            message: 'Upload link ready',
            data: {
              uploadUrl: 'https://s3.test/weoverse/app/u/weos/2026/10/k.jpg?X-Amz-Signature=sig',
              method: 'PUT',
              headers: { 'Content-Type': 'image/jpeg' },
              url: 'https://cdn.test/weoverse/app/u/weos/2026/10/k.jpg',
              key: 'weoverse/app/u/weos/2026/10/k.jpg',
              type: 'image',
              contentType: 'image/jpeg',
              expiresIn: 300,
            },
          },
          { status: 201 },
        );
      }),
      http.put('https://s3.test/*', async ({ request }) => {
        put = {
          type: request.headers.get('content-type'),
          auth: request.headers.get('authorization'),
          size: (await request.arrayBuffer()).byteLength,
        };
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const file = new File(['12345'], 'cover.jpg', { type: 'image/jpeg' });
    const out = await uploadMedia(file);

    expect(asked).toEqual({ contentType: 'image/jpeg', size: 5, filename: 'cover.jpg' });
    expect(put).toEqual({ type: 'image/jpeg', auth: null, size: 5 });
    expect(out).toEqual({
      url: 'https://cdn.test/weoverse/app/u/weos/2026/10/k.jpg',
      type: 'image',
      size: 5,
      contentType: 'image/jpeg',
    });
  });

  it('reads the type from the extension when the browser leaves it empty (HEIC)', async () => {
    let asked: { contentType?: string } = {};
    server.use(
      http.post(url('/frontend/media/presign'), async ({ request }) => {
        asked = (await request.json()) as { contentType: string };
        return fail(415, 'Send a photo or a video.');
      }),
    );
    await uploadMedia(new File(['x'], 'IMG_0001.HEIC', { type: '' })).catch(() => undefined);
    expect(asked.contentType).toBe('image/heic');
  });

  it('a refusal from the bucket keeps the draft and says so', async () => {
    server.use(
      http.put(
        'https://s3.test/*',
        () => new HttpResponse('<Error>SignatureDoesNotMatch</Error>', { status: 403 }),
      ),
    );
    const err = (await uploadMedia(new File(['x'], 'a.png', { type: 'image/png' })).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('The file didn’t reach storage — your draft is kept, try again in a moment.');
    expect(err.detail).toContain('SignatureDoesNotMatch');
  });

  it('what a WeO cannot hold is said before anything is sent to the bucket', async () => {
    let putCalled = false;
    server.use(
      http.post(url('/frontend/media/presign'), () =>
        fail(415, 'Send a photo (JPEG, PNG, WebP, GIF, AVIF, HEIC) or a video (MP4, WebM, MOV).'),
      ),
      http.put('https://s3.test/*', () => {
        putCalled = true;
        return new HttpResponse(null, { status: 200 });
      }),
    );
    const err = (await uploadMedia(new File(['x'], 'a.svg', { type: 'image/svg+xml' })).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(err.status).toBe(415);
    expect(err.message).toMatch(/^Send a photo/);
    expect(putCalled).toBe(false);
  });
});

describe('uploadMedia — the AWS SDK in the browser, as the previous build (D-100)', () => {
  const token = (sub: string) => `h.${btoa(JSON.stringify({ sub, typ: 'access' }))}.s`;
  beforeEach(() => {
    s3.params.length = 0;
    s3.fail = null;
    vi.stubEnv('VITE_S3_BUCKET_NAME', 'weo-media-bucket');
    vi.stubEnv('VITE_AWS_S3_REGION', 'us-east-1');
    vi.stubEnv('VITE_AWS_ACCESS_KEY_ID', 'test-key-id');
    vi.stubEnv('VITE_AWS_SECRET_ACCESS_KEY', 'test-only');
    tokens.set(token('651f8c2a3b9c0d12e4567890'));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    tokens.clear();
  });

  it('puts the file under the person’s own prefix and answers its public URL — no API call', async () => {
    let apiCalled = false;
    server.use(
      http.post(url('/frontend/media/presign'), () => {
        apiCalled = true;
        return fail(500, 'no');
      }),
    );
    const out = await uploadMedia(new File(['12345'], 'my cover.JPG', { type: 'image/jpeg' }));
    expect(apiCalled).toBe(false);
    expect(s3.params).toHaveLength(1);
    const p = s3.params[0]!;
    expect(p.Bucket).toBe('weo-media-bucket');
    expect(p.ContentType).toBe('image/jpeg');
    expect(p.Key).toMatch(/^weoverse\/app\/651f8c2a3b9c0d12e4567890\/weos\/\d{4}\/\d{2}\/[\w-]+\.jpg$/);
    expect(out).toEqual({
      url: `https://weo-media-bucket.s3.us-east-1.amazonaws.com/${String(p.Key)}`,
      type: 'image',
      size: 5,
      contentType: 'image/jpeg',
    });
  });

  it('a profile photo goes under profile/', async () => {
    await uploadMedia(new File(['x'], 'me.png', { type: 'image/png' }), 'profile');
    expect(String(s3.params[0]!.Key)).toMatch(/\/profile\/\d{4}\/\d{2}\/[\w-]+\.png$/);
  });

  it('a refusal from the bucket keeps the draft and says so', async () => {
    s3.fail = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
    const err = (await uploadMedia(new File(['x'], 'a.png', { type: 'image/png' })).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(err.message).toBe('The file didn’t reach storage — your draft is kept, try again in a moment.');
    expect(err.detail).toBe('Access Denied');
  });

  it('refuses what a WeO cannot hold before anything is sent', async () => {
    const svg = (await uploadMedia(new File(['x'], 'a.svg', { type: 'image/svg+xml' })).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(svg.status).toBe(415);
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    const tooBig = (await uploadMedia(big).catch((e: unknown) => e)) as ApiError;
    expect(tooBig.status).toBe(413);
    expect(tooBig.message).toBe('A photo can be up to 10 MB.');
    expect(s3.params).toHaveLength(0);
  });
});
