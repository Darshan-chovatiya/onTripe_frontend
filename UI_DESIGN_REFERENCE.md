# UI design reference — all panels

Shared visual language for **admin panel**, **customer**, **child**, **perents** (parents), and **sub child**. Keep layouts calm, sparse, and consistent.

---

## Brand color

| Role | Hex | Usage |
|------|-----|--------|
| **Primary (brand)** | `#3B2FA3` | Main actions, active nav, key accents, links (on light backgrounds) |
| **Primary hover** | `#312885` | Buttons and interactive fills on hover |
| **Primary pressed** | `#29206E` | Active / pressed state |
| **On-primary text** | `#FFFFFF` | Label text on solid primary buttons and primary sidebars |

**Contrast:** On `#3B2FA3`, always use **white** (`#FFFFFF`) for primary button labels and icon strokes where the shape is filled with primary.

### Suggested scale (for `primary-*` tokens)

Use these as the single source when updating each app’s `@theme` / CSS variables so all panels match.

| Token | Hex | Typical use |
|-------|-----|-------------|
| `primary-50` | `#F4F3FC` | Page tint, subtle highlights |
| `primary-100` | `#E8E6F7` | Selected row background, soft chips |
| `primary-200` | `#D4CFEF` | Borders, dividers with brand hint |
| `primary-300` | `#B5ADE4` | Disabled primary, decorative borders |
| `primary-400` | `#8A7DD4` | Secondary emphasis |
| **`primary-500`** | **`#3B2FA3`** | **Brand default** |
| `primary-600` | `#312885` | Hover |
| `primary-700` | `#29206E` | Active / pressed |
| `primary-800` | `#221B5A` | Dark UI accents |
| `primary-900` | `#1A1548` | Darkest brand shade |

**Implementation note:** Panels currently use Tailwind v4 `@theme` in `src/index.css`. Replace the existing `--color-primary-*` values with the table above so `bg-primary-500`, `text-primary-600`, etc. stay in sync everywhere.

---

## Minimal design principles

1. **One focal action per screen** — avoid competing primary buttons.
2. **Generous whitespace** — prefer empty space over extra borders and boxes.
3. **Limited decoration** — no extra gradients unless they clarify hierarchy (e.g. sidebar already uses a subtle vertical tone).
4. **Neutral surfaces** — white / near-white (light) and gray-900 / gray-950 (dark); brand color is for **accent**, not full-page fill.
5. **Consistent components** — same button height, input height, and radius across panels.

---

## Spacing system

Base unit: **4px** (Tailwind `1` = 4px). Stick to this scale for padding, gaps, and margins.

| Token | px | Use |
|-------|-----|-----|
| `1` | 4 | Tight icon gaps, inline tweaks |
| `2` | 8 | Related label + control, compact stacks |
| `3` | 12 | Default gap inside small groups |
| `4` | 16 | **Default** section padding, card padding (mobile) |
| `5` | 20 | Comfortable field spacing |
| `6` | 24 | **Standard** section padding (tablet/desktop), card padding |
| `8` | 32 | Between major blocks on a page |
| `10`–`12` | 40–48 | Page hero / large separations only |

**Layout**

- **Page shell (main content):** `p-4` sm:`p-6` lg:`p-8` (16 → 24 → 32px).
- **Max content width:** `max-w-7xl` (1280px) centered with horizontal padding as above.
- **Card / panel inner padding:** `p-5` or `p-6` (20–24px).
- **Stacked form fields:** `space-y-4` or `space-y-5` (16–20px).
- **Sidebar nav items:** `px-4 py-3` (16px / 12px) with `space-y-1.5` (6px) between items.

Avoid arbitrary values (`px-[13px]`) unless there is a strong reason.

---

## Typography

- **Font:** `Inter`, system UI fallback (already used in customer; align other panels the same).
- **Page title:** `text-2xl` sm:`text-3xl`, `font-bold`, `text-gray-900` / `dark:text-gray-100`.
- **Section title:** `text-lg`–`text-xl`, `font-semibold`.
- **Body:** `text-sm`–`text-base`, `text-gray-600` / `dark:text-gray-300`–`400`.
- **Uppercase labels (optional):** `text-xs`, `font-medium`, `tracking-wide`, muted gray.

**Hierarchy:** At most three levels (title → section → body). No decorative script fonts in admin/organizer shells unless the product explicitly needs it on marketing-only surfaces.

---

## Radius and elevation (minimal)

- **Buttons & inputs:** `rounded-lg` (8px).
- **Cards & modals:** `rounded-xl` (12px).
- **Sidebar / header:** `rounded-xl` on nav pills only; outer chrome stays square to the viewport.

**Shadow**

- Default cards: `shadow-sm` or `border border-gray-200` (light) / `dark:border-gray-700` with **no** or very light shadow.
- Primary button: `shadow-md` on hover at most; avoid heavy drop shadows on static content.

---

## Components (cross-panel)

### Primary button

- Background: `primary-500`, hover `primary-600`, active `primary-700`.
- Text: white (`text-white`).
- Padding: `py-2.5 px-5` (align with existing `.btn-primary` where present).
- No extra lift animation unless you keep it subtle (`translate-y` ≤ 0.5).

### Secondary / ghost

- Border `gray-300` / `dark:border-gray-600`, background transparent or `white` / `gray-800`.
- Text `gray-700` / `dark:text-gray-300`.

### Inputs

- Height aligned with buttons (`py-2.5`, comfortable `px-4`).
- Focus ring: `ring-2 ring-primary-500/20` with border `primary-500` / `primary-400` (dark).

### Sidebar (dark rail)

- Background: `gray-900` → `gray-950` (or single `gray-900`).
- **Active item:** gradient `from-primary-500 to-primary-600` or solid `primary-500`; use **`text-white`** (or `text-gray-50`) on the pill so contrast on `#3B2FA3` meets accessibility.
- Inactive: `text-gray-300`, hover `bg-gray-800/50`.

### Tables / lists (when added later)

- Row height ≥ 44px touch-friendly.
- Zebra optional; prefer whitespace + light border between rows.

---

## Dark mode

- Background: `gray-900` body, `gray-800` elevated cards.
- Primary accents stay **the same hex family**; slightly softer borders (`primary-400` for focus in dark if needed).
- Avoid pure black (`#000`) for large areas; use `gray-950`.

---

## Checklist when adding a new screen

- [ ] Primary actions use `#3B2FA3` (or mapped `primary-500`) and white label text.
- [ ] Spacing uses only the 4px scale (Tailwind spacing tokens).
- [ ] One clear primary CTA per view.
- [ ] Card = border + light shadow or border only.
- [ ] Tested in light and dark (customer + any panel with `dark`).

---

## File locations to sync

After adopting this reference, update **`@theme` primary variables** in each app:

| App | Typical path |
|-----|----------------|
| Admin | `admin  panel/src/index.css` |
| Customer | `customer/src/index.css` |
| Child | `child/src/index.css` |
| Parents | `perents/src/index.css` |
| Sub child | `sub child/src/index.css` |

Keep **spacing and radius** conventions in shared documentation only, or extract shared tokens later if you introduce a package or copied theme file.

---

*Last aligned to brand primary `#3B2FA3` — minimal spacing and component rules for all panels.*
