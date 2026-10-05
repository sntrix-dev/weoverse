# 07 — Git & release

## Repositories

| Repo | Remote | Base | Work branches |
|---|---|---|---|
| Frontend `v2-redesign-app` | `github.com/sntrix-dev/weoverse` (**public**) | `develop` (integration; `master` is never merged into, D-069) | `feat/mNN-<slug>` → merged into `develop` |
| Backend `weo-3.0` | `github.com/ksanjiv05/weo-3.0` | branch chain starting at `phase1/v3` | `redesign/mNN-<slug>`, each cut from the previous module's branch |

Backend chain: `phase1/v3 → redesign/m00-setup → redesign/m01-foundation → …`. Merging the chain into `phase1/v3`/`main` is the user's call (open a PR when asked).

## Commits

- Conventional style: `feat(m04): discover floor wired to /weos`, `fix(m04): …`, `docs(m04): test report`, `test(m04): …`.
- Backend messages use `feat(redesign-mNN): …` and never contain emojis (backend CLAUDE.md §14).
- Stage specific paths (`git add <paths>`), never `git add -A` in the backend.
- Never `--no-verify`, never amend a pushed commit, never force-push.
- Each commit message ends with the attribution lines required by the session.

## Secrets (the frontend repo is public)

- Never commit `.env*` (except `.env.example` with names only), tokens, client secrets, or captured responses that contain real personal data.
- The GitHub token used for pushing lives only in the local `.git/config` remote URL — never in docs, scripts or commit messages.
- Fixtures: scrub emails/ids of real users before committing.

## End of module

1. Both repos green (see `04-module-workflow.md` §7–8).
2. Backend: commit on `redesign/mNN-<slug>`, `git push -u origin redesign/mNN-<slug>`.
3. Frontend: commit on `feat/mNN-<slug>`, push it, `git switch develop && git merge --ff-only feat/mNN-<slug> && git push` (a `--no-ff` merge when `develop` moved on). Never merge or push into `master` (Surya, D-069).
4. Tag the frontend: `git tag mNN-done && git push --tags`.
