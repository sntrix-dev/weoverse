# M10 — Notifications & company

| Status | FE branch | BE branch | Report |
|---|---|---|---|
| planned | `feat/m10-notifications` | `redesign/m10-notifications` | `reports/M10-notifications.md` |

## Screens

| Path | Design | Blocks |
|---|---|---|
| `/notifications` | `notifications.jsx` | H1 "N waiting on you" · Unread only / Mark all read / Settings · category chips with counts · day groups of Card rows (colour bar, orb/O mark, title, body, time, unread badge) · EmptyState. Click → mark read → navigate (`collect` target opens CollectSheet) |
| `/company/:doc?` | `company.jsx` | about / careers / privacy / terms / cookies — static content from `data-more.js` `COMPANY` |

## API map

| Block | Endpoint |
|---|---|
| list | `GET /frontend/notifications` |
| counts | `GET /frontend/notifications/unread-count`, `/category-counts` |
| read | `PATCH /frontend/notifications/:id/read`, `PATCH /notifications/read-all` |
| delete | `DELETE /frontend/notifications/:id` |
| push token (later) | `POST /frontend/notifications/fcm-token` |

## Mapping

Design categories → backend `category`: weo→weo, request→weo-request, collection→collection, payment→payment, resell→resell, wallet→wallet, general→general (+ community, system). Tone ← `type` (info/success/warning/error). Navigation target ← `relatedEntity{entityType, entityId}` / `actionUrl` → app route.

## Gaps

- **Bug:** `DELETE /notifications/read` is shadowed by `DELETE /notifications/:id` (register before `/:id`).
- Real-time bell: socket.io exists but emits nothing; optional additive emit on notification create (`/authenticated` namespace).

## Acceptance criteria

- List, filters, unread-only, mark one/all read, navigation targets correct.
- Company docs render all five sections.
