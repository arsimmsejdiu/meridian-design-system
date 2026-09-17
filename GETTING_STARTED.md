# Publishing this to GitHub

```bash
cd meridian
git init -b main
git add .
git commit -m "feat: Meridian design system — tokens, components, React adapters"

gh repo create arsimmsejdiu/meridian-design-system --public --source=. --push
# or, without the gh CLI:
# git remote add origin git@github.com:arsimmsejdiu/meridian-design-system.git
# git push -u origin main
```

## Then, in the repository settings

| Setting | Why |
|---|---|
| Branch protection on `main`, requiring the `quality`, `tokens`, `unit` and `a11y` checks | The gates only mean something if they block |
| Secret `CHROMATIC_PROJECT_TOKEN` | Visual regression on pull requests |
| Secret `NPM_TOKEN` | Only if you actually publish to npm |
| Pages → GitHub Actions | `docs.yml` deploys Storybook there |

`ci.yml` runs without any secrets. The Chromatic job is skipped when its token
is absent, so the build stays green on a fresh clone.

## Running it locally

```bash
pnpm install
pnpm build          # tokens → components → bindings
pnpm storybook      # docs at :6006
pnpm example        # the React checkout at :5173
pnpm test
pnpm audit:contrast
```

Node 20.11+ and pnpm 9+. The versions are pinned in `package.json` under
`engines` and `packageManager`, so `corepack enable` picks up the right pnpm.

## What to say about it

This is a portfolio project. Present it as one — something built to work
through a set of problems end to end, not as production experience. What makes
it worth showing is that the decisions are written down and the constraints are
enforced rather than described:

- **The contrast audit found a real bug in this repo.** `border.default` was at
  1.78:1 against the light canvas — the border of every text input, against a
  3:1 requirement. The fix was to split the token, because a divider and the
  edge of a control have different requirements. `docs/adr` and the token
  changeset have the reasoning.
- **The React Hook Form adapter exists because three things fail silently.**
  Custom events React never sees, properties stringified into attributes, and
  error focus that cannot cross a shadow boundary. ADR 0005.
- **`MeridianForm` had a focus bug that the tests caught.** The error summary
  and RHF's `shouldFocusError` both wanted focus; RHF ran second and won, so
  the summary appeared and announced nothing. Now RHF's is disabled while the
  summary is rendered.

Those three are the answers to "tell me about a technical decision you made",
and each one is verifiable in the repository.
