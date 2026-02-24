# PlayMatch Frontend

Frontend app for PlayMatch, built with React, TypeScript, Vite, Tailwind, and shadcn/ui.

## Tech Stack

- React 19 + TypeScript
- Vite 7 (`@vitejs/plugin-react`)
- Tailwind CSS 4 (`@tailwindcss/vite`) + `tw-animate-css`
- shadcn/ui + Radix + Vaul + Lucide icons
- React Router 7
- `react-hook-form` + Zod
- `better-auth` + onboarding plugin
- ESLint 9 (flat config)

## Getting Started

### Prerequisites

- Node.js + npm
- Backend running at `http://localhost:3000` (required for auth flows)

### Install and Run

```bash
npm install
npm run dev
```

### Build and Quality

```bash
npm run build
npm run lint
npm run preview
```

## Project Structure

```txt
src/
  components/
    ui/          # shadcn primitives and shared drawers/forms
    activity/    # activity domain components
    community/   # community domain components
    auth/        # auth forms/buttons
    navbar/      # navbar and theme toggle
    profile/     # profile cards/stats
  pages/
    activity/
    community/
    auth/
    user/
    admin/
    onboarding/
  layouts/       # AuthLayout, MainLayout, AdminLayout
  router/        # app routes
  hooks/         # shared hooks (theme, role)
  lib/           # auth client, utilities
  data/          # mock JSON data
```

### Conventions Used

- Route pages are grouped by domain in `src/pages/*`.
- Components are grouped by domain in `src/components/*`.
- Shared building blocks live in `src/components/ui/*`.
- Path alias `@/` points to `src/`.
- Files are generally `PascalCase` for components/pages and `camelCase` for utilities/hooks.

## Design System

The project uses shadcn/ui with CSS variable tokens and light/dark theming.

### Source of Truth

- Design tokens and theme variables: `src/index.css`
- shadcn configuration: `components.json`
- Utility class merge helper: `src/lib/utils.ts` (`cn()`)

### Tokens in Use

- **Color tokens:** `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- **Radius:** `--radius` with derived `--radius-sm/md/lg/xl`
- **Typography:** `--font-sans`, `--font-serif`, `--font-mono`
- **Spacing scale root:** `--spacing: 0.25rem`
- **Shadows:** `--shadow-2xs` to `--shadow-2xl`

### Design Notes

- Use semantic tokens (`bg-background`, `text-foreground`, etc.) over hardcoded colors. See index.css
- Prefer existing shadcn components before creating new base primitives.
- For variants, follow existing `class-variance-authority` patterns (see `Button`).
- Keep interactions consistent with existing drawer/form patterns.

## What To Take Note Of

- Auth client is configured against `http://localhost:3000` in `src/lib/client-auth.ts`.
- Most product data (activities, groups, discussions, stats) currently comes from `src/data/*.json`.
- Navbar includes a link to `/settings`, but there is no `/settings` route in `src/router/index.tsx`.
- Several flows are UI-complete but not yet connected to backend APIs.
- Admin area (`UsersPage`) is currently a placeholder.

## Current Gaps and TODOs

In general, search for "TODO" in the codebase!

### Next (feature-complete baseline)

- Replace mock JSON usage with real API calls in:
  - `ExplorePage`
  - `CommunityPage`
  - `GroupDetailPage`
  - `DiscussionPostPage`
  - `MyActivitiesPage`
  - `ProfilePage`
- Wire submit flows to backend:
  - `CreatePostDrawer`
  - `CreateGroupDrawer`
  - `HostActivityDrawer`
  - `EditProfileDrawer`
- Implement profile image upload persistence in edit profile flow.
- Implement Admin users table in `UsersPage`.

### Later (polish and UX)

- Implement search behavior in `SearchDrawer`.
- Implement like/share/report/cancel RSVP actions for discussion/activity cards.
- Implement comment posting and discussion reporting in discussion detail page.
- Implement join group behavior in group detail page.
- Move filtering/sorting logic server-side where appropriate.
- Add formatting workflow (`Prettier` + `npm run format`) to standardize style.

## For FE Contributors

- Reuse existing domain structure when adding pages/components.
- Keep UI state local unless cross-page state is truly needed.
- Centralize API calls in `lib`/hooks when backend integration expands.
- Add loading/empty/error states for async features.
- Keep TODOs specific (action + owner/system boundary).
