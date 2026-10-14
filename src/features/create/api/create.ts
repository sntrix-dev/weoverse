import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, timeoutSignal, timeouts } from '@/api/client';
import { tokens } from '@/api/tokens';
import { objectKey, putToS3, s3Config } from '@/lib/s3Upload';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import type { BuiltPayload } from '../model/composer';

type S = components['schemas'];
export type TemplateDto = S['WeoTemplate'];
export type OConfigDto = S['OConfig'];
export type UploadedMediaDto = S['UploadedMedia'];

/** `POST /frontend/media/presign` — a signed S3 PUT for one file (type and exact size signed). */
export type PresignedMediaDto = S['PresignedMedia'];

export interface TemplatesDto {
  templates: TemplateDto[];
  myTier: { name: string; rank: number };
  plans: { tier: number; name: string; unlockOs: number; requiresTier: string }[];
  locked: number;
}

/** `GET /frontend/categories` answers the rows as stored (+ `weoCount`). */
export interface CategoryDto {
  _id: string;
  name: string;
  slug?: string;
  weoCount?: number;
}

/** One open ask from `GET /frontend/request-weos` (title is stored lower-case). */
export interface AskDto {
  _id: string;
  title: string;
  description?: string;
  price?: { min?: number; max?: number };
  deadline?: string;
  status?: string;
  userId?: string;
  creator?: { _id?: string; name?: string; profileImage?: string | null } | null;
  /** who asked (M08) */
  by?: { id: string; name: string; avatarUrl: string | null } | null;
  mine?: boolean;
}

/** The O ↔ dollar peg every price conversion uses (D-051). */
export function useOPeg() {
  return useQuery({
    queryKey: qk.create.peg(),
    queryFn: () => api.get<OConfigDto>('/frontend/config/o'),
    staleTime: Infinity,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: qk.create.templates(),
    queryFn: () => api.get<TemplatesDto>('/frontend/templates'),
    staleTime: 5 * 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: qk.create.categories(),
    queryFn: () => api.get<CategoryDto[]>('/frontend/categories'),
    staleTime: 10 * 60_000,
  });
}

/** Open asks — the hero's "Asked for" count and the post sheet's "One person". */
export function useAsks() {
  return useQuery({
    queryKey: qk.create.asks(),
    queryFn: () =>
      api.get<{ requestOffers: AskDto[]; total: number }>('/frontend/request-weos', {
        query: { status: 'open', limit: 20 },
      }),
    staleTime: 60_000,
  });
}

/** Some browsers leave `File.type` empty (HEIC on desktop); the extension decides then. */
const BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};
const typeOf = (file: File) =>
  file.type || BY_EXT[file.name.split('.').pop()?.toLowerCase() ?? ''] || 'application/octet-stream';

const STORAGE_TROUBLE = 'The file didn’t reach storage — your draft is kept, try again in a moment.';

/** What a WeO can hold — checked here too, because a direct upload never meets the API's check. */
const IMAGE_MAX = 10 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;
const kindOf = (t: string) =>
  /^image\/(jpeg|png|webp|gif|avif|heic)$/.test(t)
    ? 'image'
    : /^video\/(mp4|webm|quicktime)$/.test(t)
      ? 'video'
      : null;

/** The signed-in person's id, read from the access token (`sub`), for the object key. */
function ownerId(): string {
  const t = tokens.getAccess();
  try {
    const part = t?.split('.')[1];
    if (!part) return 'web';
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: unknown };
    return typeof json.sub === 'string' && json.sub ? json.sub : 'web';
  } catch {
    return 'web';
  }
}

const storageError = (e: unknown): ApiError => {
  const name = (e as { name?: unknown } | null)?.name;
  if (name === 'TimeoutError' || name === 'AbortError')
    return new ApiError(504, 'The upload is taking too long — try a smaller file.');
  // AccessDenied (key without PutObject), a bucket without a CORS rule for this origin, or no network
  return new ApiError(502, STORAGE_TROUBLE, { detail: String((e as Error)?.message ?? e).slice(0, 300) });
};

/**
 * The browser uploads the file straight to S3 with the AWS SDK, as the previous build did
 * (Surya, 2026-10-14, D-100), when the build carries the bucket settings (`VITE_S3_BUCKET_NAME`,
 * `VITE_AWS_*`). Without them it asks the API for a signed one-file PUT
 * (`POST /frontend/media/presign`) and sends the file there. Either way the bytes go from the
 * browser to the bucket; the answer is the `{ url, type }` a WeO holds.
 */
export async function uploadMedia(
  file: File,
  folder: 'weos' | 'profile' = 'weos',
): Promise<UploadedMediaDto> {
  const contentType = typeOf(file);
  const kind = kindOf(contentType);
  if (!kind)
    throw new ApiError(415, 'Send a photo (JPEG, PNG, WebP, GIF, AVIF, HEIC) or a video (MP4, WebM, MOV).');
  if (file.size > (kind === 'image' ? IMAGE_MAX : VIDEO_MAX))
    throw new ApiError(
      413,
      kind === 'image' ? 'A photo can be up to 10 MB.' : 'A video can be up to 100 MB.',
    );

  const cfg = s3Config();
  if (cfg) {
    try {
      const url = await putToS3(cfg, file, {
        key: objectKey(ownerId(), folder, contentType),
        contentType,
        signal: timeoutSignal(timeouts.uploadMs),
      });
      return { url, type: kind, size: file.size, contentType };
    } catch (e) {
      throw storageError(e);
    }
  }

  const link = await api.post<PresignedMediaDto>('/frontend/media/presign', {
    contentType,
    size: file.size,
    filename: file.name.slice(0, 200),
  });
  let res: Response;
  try {
    // no Authorization header: the signature in the URL is the only credential S3 sees
    res = await fetch(link.uploadUrl, {
      method: link.method,
      headers: link.headers,
      body: file,
      signal: timeoutSignal(timeouts.uploadMs),
    });
  } catch (e) {
    throw storageError(e);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new ApiError(res.status >= 500 ? res.status : 502, STORAGE_TROUBLE, { detail });
  }
  return { url: link.url, type: link.type, size: file.size, contentType: link.contentType };
}

/** "Ask Mya to draft it" — one to three one-line descriptions. */
export function useDescribe() {
  return useMutation({
    mutationFn: (body: {
      title: string;
      format: 'Listing' | 'Bid' | 'Pool' | 'Request';
      category?: string;
    }) => api.post<{ lines: string[] }>('/frontend/ai/describe', body),
  });
}

export interface PostedDto {
  _id: string;
  title?: string;
}

/** Post (or, with `editId`, update) — a WeO to `/weos`, a Request to `/request-weos`. */
export function usePostWeo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, editId }: { payload: BuiltPayload; editId?: string }) =>
      payload.endpoint === 'request'
        ? api.post<PostedDto>('/frontend/request-weos', payload.body)
        : editId
          ? api.put<PostedDto>(`/frontend/weos/${encodeURIComponent(editId)}`, payload.body)
          : api.post<PostedDto>('/frontend/weos', payload.body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.listings.all });
      void qc.invalidateQueries({ queryKey: qk.weos.all });
      void qc.invalidateQueries({ queryKey: qk.discover.all });
      void qc.invalidateQueries({ queryKey: qk.community.myWeos() });
      void qc.invalidateQueries({ queryKey: qk.create.asks() });
    },
  });
}

/* ---------- drafts (autosave) ---------- */

export interface DraftWrite {
  weoType: 'regular' | 'crowdfund' | null;
  format?: string;
  title: string;
  coverUrl: string | null;
  ready: number;
  payload: Record<string, unknown>;
}

export interface DraftFullDto {
  _id: string;
  format?: string;
  title?: string;
  coverUrl?: string | null;
  payload?: Record<string, unknown>;
  ready?: number;
}

export function useDraft(id: string | null) {
  return useQuery({
    queryKey: qk.create.draft(id ?? ''),
    queryFn: () => api.get<DraftFullDto>(`/frontend/me/drafts/${encodeURIComponent(id ?? '')}`),
    enabled: !!id,
    staleTime: Infinity,
  });
}

const invalidateDrafts = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: qk.community.drafts() });
  void qc.invalidateQueries({ queryKey: qk.listings.all });
};

/** Write the composer into a draft: create the first time, merge after. */
export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: DraftWrite }) =>
      id
        ? api.put<DraftFullDto>(`/frontend/me/drafts/${encodeURIComponent(id)}`, body)
        : api.post<DraftFullDto>('/frontend/me/drafts', body),
    onSuccess: () => invalidateDrafts(qc),
  });
}

/** A posted draft is no longer a draft. */
export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<unknown>(`/frontend/me/drafts/${encodeURIComponent(id)}`),
    onSuccess: () => invalidateDrafts(qc),
  });
}
