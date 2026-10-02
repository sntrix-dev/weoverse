import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';
import type { BuiltPayload } from '../model/composer';

type S = components['schemas'];
export type TemplateDto = S['WeoTemplate'];
export type OConfigDto = S['OConfig'];
export type UploadedMediaDto = S['UploadedMedia'];

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
      api.get<{ requestOffers: AskDto[]; total: number }>('/frontend/request-weos', { query: { limit: 20 } }),
    staleTime: 60_000,
  });
}

/** `POST /frontend/media` — the file is the body; the answer is the `{ url, type }` a WeO holds. */
export const uploadMedia = (file: File) =>
  api.post<UploadedMediaDto>('/frontend/media', file, { query: { filename: file.name.slice(0, 200) } });

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
