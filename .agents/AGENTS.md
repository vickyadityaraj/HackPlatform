# Workspace Rules: Master UI/UX Guidelines - Enterprise SaaS Design

All frontend components, views, styles, and page layouts in this repository must strictly adhere to the following UI/UX specifications.

---

## 1. Primary Design Goal
Create an enterprise-grade SaaS experience that is modern, clean, premium, professional, fast, accessible, responsive, consistent, and information-rich without feeling cluttered.
Design as if it is used daily by thousands of organizers, judges, recruiters, and participants, aiming for the polish level of Stripe, GitHub, Linear, Notion, and Vercel.

---

## 2. Spacing & Typography Scale
- Use an **8-point spacing grid** for all padding, margins, gaps, and layouts.
- Establish a strict typography hierarchy:
  - **Display / Heading 1-4**: Use weights correctly (never overuse bold).
  - **Body (Large, Medium, Small)**
  - **Caption & Label**
  - **Special Contexts**: Buttons, Tables, Statistics, Cards.

---

## 3. Visual Styling & Color System
- **Tone**: Clean, premium, professional, muted colors, soft shadows, strong contrast, smooth transitions, and glass accents only where appropriate.
- Avoid cartoon styles, oversized buttons, flashy/neon colors, or unnecessary animations.
- Maintain a complete semantic color palette (Primary, Secondary, Accent, Background, Success, Warning, Danger, Info, Muted, Border, Active/Hover/Focus/Selected states, Dark/Light modes).
- Ensure all color schemes comply with WCAG 2.1 AA accessibility contrast ratios.

---

## 4. Navigation & Layouts
- **Navigation**: Desktop-first responsive grids with Sidebar, Top Nav, Breadcrumbs, Page Titles, User Menus, Notifications, and Command Palette (Ctrl/Cmd + K) support.
- **Page Structure**: Every page must have a Header, Breadcrumbs, Title, Description, Primary/Secondary Action triggers, Filters/Search, and clear states (Content, Loading, Empty, Error).
- **Tables**: Use professional data tables with sorting, filtering, pagination, bulk actions, status badges, and loading skeletons.
- **Forms**: Implement multi-step forms with section groupings, inline validations, draft/autosave support, and helper text.

---

## 5. Dashboard Specifications

### Event Pages (Microsites)
- Hero, registration CTA, timeline, tracks, prizes, sponsors, judges, FAQs, rules, and sticky registration card.

### Team Workspace
- Member status, invite links, feed, project submissions, checklist, and deadlines.

### Organizer Workspace
- Live registrations, revenue metrics, submission status, judge reviews, timeline, and calendar widgets.

### Participant Workspace
- Upcoming/applied events, certificates, achievements, leaderboard, profile completion, and suggested events.

---

## 6. Code Generation Workflow
Before generating or modifying any UI component or page:
1. Explain the UX reasoning.
2. Describe the information hierarchy.
3. Explain why each section exists.
4. Generate/modify the React component using reusable primitives. Do not duplicate styling or logic.
