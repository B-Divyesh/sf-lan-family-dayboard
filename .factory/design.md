# LAN Family Dayboard — visual thesis

## Direction: generative household geometry

The dayboard treats a family's day as a set of shapes that meet without becoming identical: circles for people, tracks for time, and softly imperfect tiles for responsibilities. It should feel like a useful object hanging in a kitchen, not a miniature office dashboard. Geometry explains the product—an illustrated orbit resolves into the three parts of the day—and never competes with the schedule.

## Palette

The light treatment borrows from paper, pencil, tomato-red kitchen timers, and blue morning light. The dark treatment resembles a dimmed e-ink display after sunset.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| Canvas | `#F4F0E6` | `#151B1E` | Warm paper / dim room |
| Surface | `#FFFCF4` | `#20282C` | Independent schedule blocks |
| Ink | `#172427` | `#F4F0E6` | Primary text |
| Muted ink | `#586568` | `#B7C2C1` | Secondary metadata |
| Morning | `#1A6775` | `#72C3D1` | Primary action and time tracks |
| Tomato | `#BE3B2F` | `#FF8E7F` | Attention and overdue states |
| Mustard | `#D5A927` | `#E9C95F` | Chore geometry and warnings |
| Leaf | `#387052` | `#75BE91` | Completion and online state |
| Focus | `#7745A4` | `#D8A7FF` | Keyboard focus only |

All body text combinations meet 4.5:1; shape color is always reinforced by a label or icon. The UI follows the operating-system light/dark preference and offers a manual display-mode override.

## Type and spacing

- **Display:** Georgia, `ui-serif`, serif. Its human, editorial numerals make dates feel like a household noticeboard.
- **Utility:** Inter-compatible system sans (`ui-sans-serif`, system stack). No network or font files are required, keeping LAN/offline deployment small.
- Scale: 14 / 16 / 20 / 28 / fluid 40–72 px. Body is never below 16 px. Times use tabular numerals.
- Spacing: 4 px base; common intervals 8, 12, 16, 24, 32, 48, 64. Corners use 12, 20, and a large asymmetric 36 px shape.

## Layout and interaction grammar

The header reads like a paper masthead; the current date is the anchor. Today and tomorrow form a responsive two-column timeline, with chores on a distinct mustard rail. Events use a colored owner pip and a time track rather than nested generic cards. At 390 px, actions move into a labelled menu, dates stack, and nonessential illustration detail drops away. Display mode enlarges the current day and hides setup chrome; any key or tap reveals it again.

Every control is a plain-language verb, at least 44 px tall, with a purple offset focus ring. Imported content appears from the file/input control that created it. Delete operations require named confirmation; completing a chore can be undone from a live status toast.

## Motion

State changes use 180–240 ms opacity and 6 px translation, as if a paper slip were placed onto the board. The current-time marker advances without animation. No decorative loop runs. With `prefers-reduced-motion`, transitions and smooth scrolling become instant while hierarchy, borders, and scale preserve depth.

## Original asset plan and provenance

One wide hero illustration is used only in the first-run empty state and setup introduction. Art direction: **an abstract household day orbit**, overlapping circles and time tracks, paper-cut and screen-printed materials, warm oblique morning light, flat orthographic lens, warm paper / deep teal / tomato / mustard / leaf palette; no people, text, numbers, calendar UI, logos, watermarks, brand marks, gradients, photorealism, or tiny decorative clutter. It clarifies that separate family rhythms meet in one shared day.

- Generator: Azure OpenAI image generation through the Param Factory `factory-image` deployment.
- Date: 2026-08-28.
- License/provenance: generated specifically for LAN Family Dayboard; original product asset, shipped under the repository's MIT license.
- Source candidate and exact prompt live in `assets/src/day-orbit.json`; optimized WebP/AVIF renditions ship with explicit dimensions. Each candidate is visually reviewed for text artifacts, seams, unintended symbols, and palette consistency.

Interface icons are original inline SVG paths or typographic marks authored for this repository; they are not copied from an icon library.
