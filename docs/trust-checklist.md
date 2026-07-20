# SPYRAL OS — Trust Checklist

> Trust is not a feature. It is the accumulated result of every interaction.

## Session Integrity
- [ ] User can create a session from any intent
- [ ] Session survives full-page reload (localStorage persistence)
- [ ] Session stage is preserved across navigation
- [ ] User can return to a previous session and resume
- [ ] Inactive sessions are visible in the session history

## Error Recovery
- [ ] If a studio crashes, the user sees a branded error with recovery options
- [ ] "Try again" button restores the studio without losing context
- [ ] "Go home" link navigates to a safe state
- [ ] Error details are logged for debugging (dev mode shows stack trace)
- [ ] Critical errors (layout-level) show a full-page recovery screen

## Clarity & Transparency
- [ ] AI recommendations include reasoning (not just a score)
- [ ] Confidence levels are displayed alongside predictions
- [ ] User can see what information the system is using to make decisions
- [ ] Trade-offs are explained when alternatives exist

## Data Safety
- [ ] Session data persists in localStorage (no unexpected data loss)
- [ ] Navigation state is serializable and reconstructable
- [ ] User can clear their data (settings → reset/clear)

## Navigation Journey
- [ ] First interaction: user types a prompt → system clarifies intent
- [ ] Clarification: system asks targeted questions → user answers
- [ ] Reality: system confirms understanding → user validates
- [ ] Gap analysis: system identifies discrepancies → user reviews
- [ ] Decision: system presents options → user selects
- [ ] Execution: system creates work items → user tracks progress

## Performance Trust
- [ ] Studio transitions complete in < 150ms
- [ ] localStorage operations complete in < 50ms
- [ ] Initial page load is < 200 KB JS
- [ ] No visible layout shift during navigation
- [ ] Loading states (skeletons/spinners) shown during async work

## Accessibility Trust
- [ ] All interactive elements have visible focus indicators
- [ ] Navigation is fully operable via keyboard
- [ ] Screen readers can announce studio content
- [ ] Colour contrast meets WCAG AA standards
- [ ] Motion respects `prefers-reduced-motion`

## CI/CD Trust
- [ ] Every PR runs TypeScript check, lint, unit tests, build, E2E tests
- [ ] Broken builds block merging to main
- [ ] E2E tests cover the canonical user journey
- [ ] Bug fixes include a regression test (Principle #9)
- [ ] Test results are visible in PR status checks
