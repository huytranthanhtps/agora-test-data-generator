# Git Workflow

## Hard rules

1. **Branch-first.** Never commit on `main`. Cut a feature branch before any
   change.
2. **Never `git push`, open a PR, or merge without explicit user approval in the
   current turn.** Local commits on a feature branch are fine; sharing them is a
   separate, explicit decision.
3. **Pushing `main` is a production deploy.** `.github/workflows/deploy.yml`
   runs on every push to `main` (and manual dispatch): `npm ci` → `npm test` →
   `npm run build` → deploy `dist` to GitHub Pages. So a `main` push publishes
   the live site — treat it as an outward-facing action needing explicit
   approval, and make sure `npm test` + `npm run build` are green first (CI will
   fail the deploy otherwise).
4. **Delete the branch after merge.** Once a feature branch is merged into
   `main` (with approval per rule 2) and you've confirmed the merge landed
   (`git branch --merged main` lists it), delete it to keep the branch list
   clean: `git branch -d <branch>` locally — lowercase `-d` refuses an unmerged
   branch, a built-in safety net — and `git push origin --delete <branch>` for
   the remote. Nothing is lost: the commits live on in `main`; the branch name
   was only a pointer.

## Commit messages

- English, imperative mood.
- Follow the existing `type(scope): summary` convention seen in `git log`
  (`feat:`, `fix:`, `docs:`, `design(ui):`, `feat(content):`).
- Keep the subject focused on *what changed and why*, not "added for task X".

## Artefacts ride the code branch

Specs (`docs/superpowers/specs/`), plans (`docs/superpowers/plans/`), and rule
edits (`docs/rules/`) go on the **same branch** as the code they describe — not
a separate branch.
