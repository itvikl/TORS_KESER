---
name: deploy-dev
description: Commit outstanding work on the current branch and fast-forward-push it to the dev branch (or another target branch) on origin, so Vercel picks it up. Use when the user asks to deploy/push/upload the current version to dev — including Hebrew phrasing like "תעלה לגיט", "תעלה ל-DEV", "תדחוף ל-דב".
---

# Deploy current branch to dev

Automates the workflow: commit outstanding local changes on the current
branch, push the branch to origin, then fast-forward `origin/dev` (or the
branch named in `$ARGUMENTS`, if given) to match and push that too.

This repo's convention: feature work happens on branches like `VITOL+DB`;
`dev` is the branch Vercel deploys from for the DEV environment. `main` is
production — never push there with this skill unless the user explicitly
names `main` as the target.

## Steps

1. **Inspect state.**
   - `git status` to see staged/unstaged/untracked files.
   - `git branch --show-current` for the source branch.
   - Target branch = first word of `$ARGUMENTS`, else `dev`.
   - `git log --oneline origin/<target>..HEAD` and
     `git rev-list --left-right --count origin/<target>...HEAD` to confirm
     `origin/<target>` is an ancestor of `HEAD` (fast-forward possible). If
     `origin/<target>` has commits not in `HEAD` (left count > 0), STOP and
     tell the user it's diverged — don't force-push or merge without asking
     how they want to resolve it.

2. **Check for secrets before staging.** Look at the untracked/modified file
   list for anything like `.env*`, `*.pem`, `credentials*.json`, service
   account keys, etc. If found, flag it to the user and exclude it from
   staging rather than committing it silently.

3. **Stage and commit**, if there are uncommitted changes:
   - Stage by explicit path (no blind `git add -A`).
   - Write a commit message in the imperative, following this repo's
     existing log style (`git log --oneline -10` for reference) — type(scope):
     summary, focused on why/what changed, not a restatement of filenames.
   - Append the standard `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
     trailer.
   - If there's nothing to commit, skip this step and just push/fast-forward
     the existing commits.

4. **Confirm before touching the shared branch.** Summarize what will be
   pushed (commit(s), source branch, target branch) and confirm with the
   user before pushing — pushing to `dev` deploys it. Skip this confirmation
   only if the user's invocation already explicitly authorized it (e.g. they
   named the target branch and said "just push it").

5. **Push.**
   - `git push origin <source-branch>`
   - `git push origin <source-branch>:<target-branch>` (fast-forward update
     of the target ref — do not use `--force`).

6. **Report.** Tell the user what was pushed and remind them to check the
   Vercel deployment for the target branch/environment if relevant.
