---
name: push-to-main
description: Fast-forward-push origin/dev (or a named branch) to origin/main, promoting the current DEV state to PRODUCTION on Firebase App Hosting. Use when the user asks to push/promote/deploy dev to main, ship to production, or go live — including Hebrew phrasing like "תדחוף לmain", "תעלה גירסה מ-DEV ל-MAIN", "תשחרר לפרודקשן".
---

# Push dev to main (production release)

Promotes the branch Vercel/Firebase App Hosting deploys as DEV (`dev` by
default) up to `main`, which Firebase App Hosting serves as PRODUCTION
(`mainprod--kesertors...`, see `apphosting.yaml`). This is a release action,
not a feature-branch push — treat it with more caution than `deploy-dev`.

Source branch = `dev`, unless `$ARGUMENTS` names a different one.
Target branch is always `main` (this skill's whole purpose), unless
`$ARGUMENTS` explicitly overrides it.

## Steps

1. **Fetch and compare.**
   - `git fetch origin --quiet`
   - `git log origin/main..origin/<source>` — commits that will land on
     `main`. Show these to the user.
   - `git log origin/<source>..origin/main` — commits on `main` that are
     NOT in `<source>`. If this is non-empty, STOP: a plain fast-forward
     isn't possible (main has diverged, e.g. a hotfix committed directly
     there). Tell the user and ask how to reconcile — do not merge or
     force-push to resolve it yourself.

2. **Sanity-check the source is deployable.** This is production — favor
   asking over assuming:
   - If there are commits on `<source>` that look unfinished, experimental,
     or explicitly marked WIP, flag them before proceeding.
   - Uncommitted local changes on the user's *current* working branch are
     irrelevant to this push (it operates on remote refs) — don't stage or
     commit them as part of this skill; mention them only if the user seems
     to expect their local work to be included.

3. **Confirm before pushing to production**, unless the user's request
   already explicitly authorized it in this message (e.g. they gave an
   unambiguous "just do it" alongside the push request). Summarize: which
   commits, source → target, and that this deploys to production.

4. **Push**: `git push origin origin/<source>:<target>` (fast-forward
   update of the ref on origin — never `--force`).

5. **Report** the old → new SHA range on `main` and remind the user that
   Firebase App Hosting will build and deploy production from this push.
