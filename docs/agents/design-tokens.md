# Design Tokens: Project Scanning Pointers

- All color, spacing, typography, and shadow values are defined in Tailwind CSS config (`apps/web/src/tailwind.config.ts`).
- Custom color palettes and semantic tokens are set in the `theme.extend.colors` section.
- Font families and sizes are managed in `tailwind.config.ts` and referenced in CSS/JSX via Tailwind classes.
- For UI consistency, check for usage of Tailwind classes in component files under `apps/web/src/components/ui/`.
- If you need to update or add tokens, always update `tailwind.config.ts` and verify with `pnpm dev` for hot reload.
- Scan for hardcoded styles in components and refactor to use tokens/classes where possible.
- Shared UI primitives may also use tokens from `packages/ui/src/components/`.
- Use the `cn` utility (`packages/ui/src/lib/cn.ts`) for conditional class merging.
- Index.css is the main css file for `apps/web/`
