import { http, HttpResponse } from 'msw';
import { ApiError } from '@/api/client';
import { fail, url } from '@/test/msw/handlers';
import { server } from '@/test/msw/server';
import { uploadMedia } from '../api/create';

describe('uploadMedia — straight from the browser to S3', () => {
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
