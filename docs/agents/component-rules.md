# Component Rules: Project Scanning Pointers

- All UI components should be placed in `apps/web/src/components/` or `packages/ui/src/components/` for shared primitives.
- Prefer using shared UI primitives from `packages/ui` for consistency and reusability.
- Component files should be PascalCase (e.g., `TradeDetailModal.tsx`).
- Use Tailwind CSS classes for styling; avoid inline styles unless necessary.
- Props should be typed with TypeScript interfaces or types.
- For forms, use TanStack Form and Zod schemas from `@edgerift/contracts` for validation.
- State management should use React hooks or Zustand (for global state).
- Avoid prop drilling by using context or Zustand where appropriate.
- Scan for duplicate logic or UI—refactor to shared components in `packages/ui` if reused.
- Test components in isolation before integrating into pages.
- Use the `cn` utility for conditional class names.
- Keep components focused: one responsibility per file.
- Document component props and usage with JSDoc or comments if non-obvious.
- For icons, use Lucide or Radix UI icons as per project convention.
- Always check for accessibility (aria-\*, keyboard navigation) in interactive components.
