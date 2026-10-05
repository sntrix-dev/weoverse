import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

type S = components['schemas'];
export type SettingsDto = S['SettingsView'];
export type SettingsPatch = S['SettingsPatch'];
export type ChannelGroup = keyof S['ChannelMatrix'];
export type Channel = keyof S['ChannelRow'];
export type AccountRequestKind = 'deactivate' | 'delete';

/** `GET /frontend/users/me/settings` — account, notifications, time zone, receipts, a pending request. */
export function useSettings() {
  return useQuery({
    queryKey: qk.me.settings(),
    queryFn: () => api.get<SettingsDto>('/frontend/users/me/settings'),
    staleTime: 60_000,
  });
}

/** Deep-merge a patch into the settings held, so a switch moves on tap. */
function merge(d: SettingsDto, p: SettingsPatch): SettingsDto {
  const n = p.notifications;
  const channels = { ...d.notifications.channels };
  if (n?.channels)
    for (const [g, row] of Object.entries(n.channels)) {
      const k = g as ChannelGroup;
      if (channels[k]) channels[k] = { ...channels[k], ...row };
    }
  return {
    ...d,
    timezone: p.timezone ?? d.timezone,
    receipts: p.receipts ?? d.receipts,
    notifications: {
      ...d.notifications,
      channels,
      digest: n?.digest ?? d.notifications.digest,
      quiet: { ...d.notifications.quiet, ...(n?.quiet ?? {}) },
    },
  };
}

/** `PATCH /frontend/users/me/settings` — optimistic; rolls back if the save fails. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) => api.patch<SettingsDto>('/frontend/users/me/settings', patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.me.settings() });
      const prev = qc.getQueryData<SettingsDto>(qk.me.settings());
      if (prev) qc.setQueryData(qk.me.settings(), merge(prev, patch));
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.me.settings(), ctx.prev);
    },
    onSuccess: (d) => qc.setQueryData(qk.me.settings(), d),
  });
}

/** `POST /frontend/users/me/account-request` — a request a person confirms; nothing is removed by it (D-070). */
export function useAccountRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { kind: AccountRequestKind; reason?: string }) =>
      api.post<SettingsDto>('/frontend/users/me/account-request', body),
    onSuccess: (d) => qc.setQueryData(qk.me.settings(), d),
  });
}

/** `DELETE /frontend/users/me/account-request` — take it back. */
export function useCancelAccountRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<SettingsDto>('/frontend/users/me/account-request'),
    onSuccess: (d) => qc.setQueryData(qk.me.settings(), d),
  });
}

/** Hand a JSON value to the browser as a file to save. */
export function saveJson(data: unknown, name: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** `GET /frontend/users/me/export` — everything you have here, as one file. */
export function useExportData() {
  return useMutation({
    mutationFn: () => api.get<unknown>('/frontend/users/me/export'),
    onSuccess: (d) => saveJson(d, `weoverse-export-${new Date().toISOString().slice(0, 10)}.json`),
  });
}
