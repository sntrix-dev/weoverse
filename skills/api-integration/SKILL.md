---
name: api-integration
description: Wire a WeOverse screen to the weo-3.0 backend — verify the endpoint, generate types, write adapter + TanStack Query hooks + MSW handler + tests. Use whenever a screen needs server data or a mutation.
---

# API integration

Reference: `docs/05-api-integration.md`, backend inventory `docs/reference/backend-inventory.md` §5, Swagger `http://localhost:3002/api/docs`.

## Steps

1. **Verify in code, not docs.** In `weo-3.0`: find the route (`src/routes/frontend/index.ts` → `src/modules/<m>/*.route.ts`), its Zod schema (`*.validate.ts`), controller → service → projection (`*.projection.ts` defines the wire shape).
2. **Capture a real response** with the dev token:
   `curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3002/api/frontend/<path>" | jq . > /tmp/<name>.json`
   Scrub personal data, save to `src/test/fixtures/<feature>/<name>.json`.
3. **Types**: `npm run api:types`; alias the DTO in the feature: `type WeoCardDto = components['schemas']['WeoCardView']`. If Swagger is wrong vs the live response, fix the backend YAML (module branch) and regenerate — code wins.
4. **Adapter** `features/<f>/model/to<Model>.ts`: DTO → view model the design components expect (field names from the design data files). Pure; unit-test every branch.
5. **Hooks** `features/<f>/api/queries.ts` / `mutations.ts`:
   ```ts
   export const useWeoDetail = (id: string) =>
     useQuery({ queryKey: qk.weos.detail(id), queryFn: () => api.get<WeoDetailDto>(`/frontend/weos/${id}`), select: toWeoView });
   ```
   Mutations: optimistic `onMutate` (snapshot + set), `onError` rollback + toast, `onSettled` invalidate related keys. Add keys to `api/queryKeys.ts`.
6. **MSW handler** in `src/test/msw/handlers.ts` returning the fixture inside the envelope `{success:true,message:'OK',data}`; add error variants (401 plain text, 422 with `errors[]`, 429).
7. **Tests**: adapter unit tests; hook tests with MSW (success, error, optimistic rollback).
8. **Update docs**: module spec API map row + `docs/05-api-integration.md` endpoint table.

## Rules
- Components never receive DTOs.
- Respect the 70 req/min/IP limit: prefer screen-shaped endpoints (`nav-summary`, `wallet/overview`, `*/snapshot`, `users/me/passport`); sensible `staleTime`; no polling loops.
- Pagination: `useInfiniteQuery` with `pagination.page < pagination.totalPages`.
- A missing field is a **gap**: log it in the module spec, don't fake it. Additive backend change → `backend-endpoint` skill.
