# Bhavna Space — AI Rules

## 1. Brand Identity

**Brand Name:** Bhavna Space  
**Website:** bhavnaspace.com  
**Industry:** Interior Design & Architecture  

The brand should feel:
* Premium
* Minimal
* Elegant
* Warm
* Architectural
* Sophisticated
* Modern
* Calm
* Timeless

Avoid designs that feel:
* Overly colorful
* Cheap or generic
* Too playful or cartoonish
* Excessively decorative
* Visually crowded
* Template-like

---

## 2. Brand Color Palette

Use these colors consistently across the website and all digital products.

### Primary Colors

| Color | HEX | RGB | Usage |
| --- | --- | --- | --- |
| Warm Terracotta | `#DB9558` | `rgb(219, 149, 88)` | Primary accent, buttons, highlights |
| Warm Ivory | `#FCF9EA` | `rgb(252, 249, 234)` | Main background, light sections |
| Olive Sage | `#97A87A` | `rgb(151, 168, 122)` | Secondary accent, nature-inspired elements |
| Soft Sage | `#A8BBA3` | `rgb(168, 187, 163)` | Secondary backgrounds, subtle sections |

### Text & Support Colors

The brand colors above are too light to use as text on ivory. Use these instead.

| Token | HEX | Usage |
| --- | --- | --- |
| `--color-text` | `#2B2A26` | Body text, headings, button labels |
| `--color-text-muted` | `#5E5B52` | Captions, secondary text |
| `--color-primary-text` | `#8A5420` | Terracotta-toned text or links on ivory |
| `--color-secondary-text` | `#4F5E38` | Sage-toned text or links on ivory |
| `--color-primary-hover` | `#C9803F` | Primary button hover |
| `--color-border` | `#E3DCC4` | Thin borders and dividers on ivory |

### CSS Variables

Always use CSS variables instead of repeating raw color values.

```css
:root {
    /* Brand */
    --color-primary: #DB9558;
    --color-primary-hover: #C9803F;
    --color-background: #FCF9EA;
    --color-secondary: #97A87A;
    --color-sage: #A8BBA3;

    /* Text & support */
    --color-text: #2B2A26;
    --color-text-muted: #5E5B52;
    --color-primary-text: #8A5420;
    --color-secondary-text: #4F5E38;
    --color-border: #E3DCC4;

    /* Shape & spacing */
    --radius: 2px;
    --radius-lg: 4px;
    --space-section: clamp(4rem, 10vw, 9rem);
    --space-gutter: clamp(1.25rem, 4vw, 3rem);
}
```

### Color Usage Rules

* `#FCF9EA` is the dominant background color.
* `#DB9558` is for important accents and calls to action.
* `#97A87A` is a secondary brand color.
* `#A8BBA3` is for subtle backgrounds and supporting elements.
* Do not use all four colors equally.
* Maintain plenty of negative space.
* Colors should feel muted and sophisticated, never saturated.

### Color Contrast Rules (required)

Contrast ratios below were measured against WCAG AA (4.5:1 for normal text).

| Combination | Ratio | Allowed for text? |
| --- | --- | --- |
| `#2B2A26` on `#FCF9EA` | 13.6:1 | Yes |
| `#5E5B52` on `#FCF9EA` | 6.4:1 | Yes |
| `#2B2A26` on `#DB9558` (buttons) | 5.8:1 | Yes |
| `#2B2A26` on `#97A87A` | 5.6:1 | Yes |
| `#2B2A26` on `#A8BBA3` | 7.1:1 | Yes |
| `#2B2A26` on `#C9803F` (hover) | 4.5:1 | Yes |
| `#8A5420` on `#FCF9EA` | 5.9:1 | Yes |
| `#4F5E38` on `#FCF9EA` | 6.7:1 | Yes |
| `#DB9558` on `#FCF9EA` | 2.4:1 | **No** |
| `#97A87A` on `#FCF9EA` | 2.4:1 | **No** |
| White on `#DB9558` | 2.5:1 | **No** |

Rules:

* Never use white text on terracotta. Use `--color-text` on terracotta buttons.
* Never use `#DB9558` or `#97A87A` for body text, links or small text on ivory.
* Terracotta and sage are fine for large decorative shapes, borders, icons with text labels, and backgrounds.
* Use `--color-primary-text` or `--color-secondary-text` when text needs to carry the accent color.

---

## 3. Design Direction

The visual language is inspired by **premium architectural and interior-design studios**.

Think: **Architecture + Editorial Design + Luxury Interiors + Minimalism**

Prioritize:

1. Strong typography
2. High-quality imagery
3. Generous whitespace
4. Clean layouts
5. Balanced proportions
6. Subtle animations
7. Elegant details

Avoid unnecessary UI elements.

---

## 4. Logo Rules

The logo should be:

* Minimal
* Recognizable
* Elegant
* Scalable
* Suitable for desktop, mobile and favicon use

It should work in full-color, dark, light and monochrome versions, and at small favicon size.

Do not create overly complicated logo marks.

---

## 5. Typography

Typography should feel architectural and premium. Use a maximum of **2 font families**.

| Role | Font | Fallback |
| --- | --- | --- |
| Headings | Cormorant Garamond (or Playfair Display) | `Georgia, 'Times New Roman', serif` |
| Body, UI | Inter (or DM Sans) | `system-ui, -apple-system, sans-serif` |

```css
:root {
    --font-heading: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
    --font-body: 'Inter', system-ui, -apple-system, sans-serif;

    --text-xs: 0.8125rem;
    --text-sm: 0.9375rem;
    --text-base: 1.0625rem;
    --text-lg: 1.25rem;
    --text-xl: clamp(1.5rem, 2.5vw, 2rem);
    --text-2xl: clamp(2rem, 4vw, 3.25rem);
    --text-hero: clamp(2.75rem, 7vw, 6rem);
}
```

Guidelines:

* Headings: editorial feel, light or regular weight, tight line-height (1.05–1.2), slightly negative letter-spacing on large sizes.
* Body: line-height 1.6–1.75, minimum 16px on mobile.
* Small uppercase labels may use wide letter-spacing (0.08–0.14em), sparingly.
* Keep a strong, consistent hierarchy: one hero size, one section heading size, one subheading size, one body size.

Avoid:

* Cartoon, decorative or excessively rounded fonts
* More than 2 font families

---

## 6. Layout

Use a spacious layout.

* Large margins and generous padding
* Clear grid systems and strong alignment
* Asymmetric layouts where appropriate
* Large visual sections and full-width imagery
* Editorial-style compositions
* Use `--space-section` between sections and `--space-gutter` for page margins

Do not fill every empty space. **Whitespace is part of the design.**

---

## 7. Images

Interior photography is a major part of the brand. Images should feel:

* High-end
* Architectural
* Natural
* Warm
* Clean
* Professionally photographed

Prefer natural lighting, neutral interiors, and warm materials such as wood, stone, fabric, plants, natural textures and architectural details.

Avoid overly edited or artificial-looking imagery.

Rules:

* Give images breathing room. Do not cover them with heavy text.
* If text sits on an image, add a subtle overlay so it stays readable (4.5:1).
* Always set width and height (or aspect-ratio) to prevent layout shift.
* Lazy-load images below the fold.
* Write meaningful alt text for content images. Use empty alt (`alt=""`) for decorative ones.

---

## 8. UI Components

All components follow the same visual language.

### Buttons

Buttons should be minimal, clean, refined and easy to understand.

* **Primary:** background `--color-primary`, text `--color-text`, hover `--color-primary-hover`.
* **Secondary:** background `--color-secondary`, text `--color-text`, or an outlined version with `--color-text` border and text.
* Border radius: `var(--radius)`. Avoid pill-shaped buttons unless specifically requested.
* Minimum tap target: 44 × 44px.
* Visible focus state on every button (see Accessibility).

### Cards

Keep cards minimal.

Avoid excessive shadows, heavy borders, too many badges, too much text and overly rounded corners. Use subtle borders (`--color-border`), spacing and typography instead.

---

## 9. Borders & Shadows

Prefer subtle visual separation.

Use:

* Thin 1px borders
* Soft, low-opacity shadows
* Subtle contrast

Avoid:

* Heavy drop shadows
* Glowing effects
* Neumorphism
* Excessive gradients

The interface should feel **premium and calm**.

---

## 10. Animation

Animations should be subtle and enhance the design rather than become it.

Preferred:

* Fade-in
* Slow image reveal
* Gentle hover transitions
* Small scale effects
* Smooth scrolling
* Text reveal animations

Guidelines:

* Durations of roughly 300–800ms with ease-out or ease-in-out easing.
* Do not animate every element.
* Respect `prefers-reduced-motion`. Disable or minimize motion for those users.

```css
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

Avoid bouncing, fast transitions, flashing effects and distracting motion.

---

## 11. Responsive Design

Every design must work on desktop, laptop, tablet and mobile.

Mobile layouts should not simply shrink the desktop version. Restructure the layout intelligently for smaller screens.

* Maintain typography hierarchy and whitespace
* Keep buttons easily tappable
* No horizontal scrolling
* Keep images visually strong
* Preserve the premium appearance

---

## 12. Accessibility (hard requirement)

Accessibility is not a trade-off against aesthetics. A design that fails these rules is not finished.

* Meet WCAG AA contrast (4.5:1 for normal text, 3:1 for large text and UI boundaries). See Section 2.
* Readable font sizes
* Proper heading hierarchy (one `h1` per page, no skipped levels)
* Accessible buttons and links with clear labels
* Visible keyboard focus on all interactive elements
* Alt text for meaningful images
* Keyboard-friendly interactions
* Respect reduced-motion preferences

Focus style:

```css
:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 3px;
}
```

---

## 13. Design Decision Rule

When several design solutions are possible, prioritize in this order:

1. **Brand consistency**
2. **Accessibility** (a hard requirement, never traded away)
3. **User experience**
4. **Simplicity**
5. **Visual hierarchy**
6. **Performance**
7. **Decorative effects**

Never add a design element simply because it "looks cool." Every element should have a purpose.

---

## 14. Overall Design Principle

The final result should feel like:

> A premium interior design studio website: warm, architectural, minimal, sophisticated and timeless.

Communicate quality through **simplicity, proportion, typography, imagery and whitespace**, not decoration.

**When in doubt, simplify.**

---

# Development Rules

## 15. Code Quality

* Keep code clean and maintainable.
* Use reusable components and avoid duplication.
* Use semantic HTML.
* Keep CSS organized.
* Use the CSS variables above. Never hardcode brand colors repeatedly.
* Follow the existing project's architecture and conventions.
* Do not introduce unnecessary libraries.
* Do not modify unrelated functionality.
* Understand the current implementation before changing existing code.

## 16. Modifying Existing Pages

1. Preserve existing functionality.
2. Preserve existing content unless asked to change it.
3. Preserve existing routes and APIs.
4. Do not remove working components without a reason.
5. Do not add unnecessary dependencies.
6. Follow the Bhavna Space visual identity.
7. Reuse existing components whenever possible.
8. Check responsive behavior after making changes.
9. Check visual consistency with the rest of the website.
10. Prefer small, controlled improvements over unnecessary redesigns.
