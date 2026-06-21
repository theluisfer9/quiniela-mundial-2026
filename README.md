# quiniela-mundial-2026

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Router, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **PWA** - Progressive Web App support

## Development Workflow

This is a Bun workspace. Use Bun from the repo root so workspace filters and shared packages resolve correctly.

Install dependencies:

```bash
bun install
```

Set up Convex before the first run:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Run the full development stack:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

Run the web app and backend separately when you want independent logs or processes:

```bash
bun run dev:web
bun run dev:server
```

Check types across the workspace:

```bash
bun run check-types
```

Build all workspace packages and apps:

```bash
bun run build
```

Deploy or destroy the Cloudflare infrastructure through the root scripts:

```bash
bun run deploy
bun run destroy
```

For more details, see the guide on [Deploying to Cloudflare with Alchemy](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### DESIGN.md references

The repo includes `awesome-design-md/` as a git submodule with reference `DESIGN.md` files you can use for UI direction.

- Browse available design systems in `awesome-design-md/design-md/*`
- Copy the `DESIGN.md` you want to use into the project root when you want the agent to follow that visual language

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@quiniela-mundial-2026/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project Structure

```
quiniela-mundial-2026/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the Convex backend
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
- `bun run deploy`: Deploy Cloudflare infrastructure
- `bun run destroy`: Destroy Cloudflare infrastructure
- `cd apps/web && bun run generate-pwa-assets`: Generate PWA assets
