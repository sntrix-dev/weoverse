import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { components } from '@/api/generated/schema';
import { qk } from '@/api/queryKeys';

export type CompanyPageDto = components['schemas']['CompanyPage'];
export type CompanyKey = CompanyPageDto['key'];

/** `GET /frontend/company` — the five pages, in footer order (D-080). Text changes rarely. */
export function useCompanyPages() {
  return useQuery({
    queryKey: qk.company.all,
    queryFn: () => api.get<CompanyPageDto[]>('/frontend/company', { auth: false }),
    staleTime: 10 * 60_000,
  });
}

export interface CareersInterest {
  name: string;
  email: string;
  role: string;
  experience: string;
  portfolio?: string;
}

/** `POST /weo-website/careers-module` — the website's careers form (D-083). */
export function useCareersInterest() {
  return useMutation({
    mutationFn: (body: CareersInterest) =>
      api.post<{ id: string }>(
        '/weo-website/careers-module',
        { ...body, portfolio: body.portfolio || undefined },
        { auth: false },
      ),
  });
}

/** The values the form takes, said in words. */
export const ROLE_LABEL: Record<string, string> = {
  engineering: 'Engineering',
  design: 'Design',
  marketing: 'Marketing',
  operations: 'Operations',
  other: 'Something else',
};

export const EXPERIENCE_LABEL: Record<string, string> = {
  '0-2years': 'Up to 2 years',
  '2-5years': '2 to 5 years',
  '5-10years': '5 to 10 years',
  '10+years': 'More than 10 years',
};
