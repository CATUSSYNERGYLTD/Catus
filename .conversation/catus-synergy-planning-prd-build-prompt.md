# Catus Synergy Limited
## Planning → PRD → Final Build Prompt

**Status:** Planning deliverable only. Do not begin implementation from this document in the current step.

**Source:** User-provided Catus Synergy website brief.

**Logo assets supplied:** `attached_assets/DP_3_1790557201461.png` is the standalone gorilla mark; `attached_assets/DP_1_1790557201513.png` is the full Catus Synergy Limited wordmark. Both are PNGs with a royal-blue field visible in the artwork. Use the supplied logo artwork faithfully; do not redraw, recolor, or remove its background. Check how that blue field will sit against the site palette before placing the image.

---

# 1. Planning

## Product vision

Create a premium, motion-led parent-company website that presents Catus Synergy Limited as a company that builds, connects, manages, and grows ventures across multiple business areas. The digital experience should feel corporate and international, while making the original Catus gorilla mark a distinctive, recognizable part of the brand.

**Creative concept:** “A company that moves.”

## Objectives

1. Establish a confident, coherent corporate identity for Catus Synergy Limited.
2. Explain the company’s role as a diversified parent company.
3. Introduce its six stated business areas.
4. Communicate its cooperative growth philosophy and operating approach.
5. Leave room for future subsidiaries and brands without implying that they already exist.
6. Make it easy for prospective clients and partners to start a business conversation.
7. Deliver a memorable experience without sacrificing clarity, accessibility, or performance.

## Intended visitors

- Prospective clients looking for the company’s services.
- Potential partners and business collaborators.
- People seeking to understand Catus Synergy and its business portfolio.

These audiences are inferred from the supplied brief. The site should not make unsupported claims about investors, employees, operating history, project results, or subsidiaries.

## Experience direction

- **Visual character:** powerful, premium, corporate, futuristic, confident, restrained.
- **Palette:** deep navy, royal/electric blue, and white. Avoid gold and avoid gradient-heavy decoration.
- **Typography:** geometric, editorial, high-contrast scale; concise copy and prominent headings.
- **Layout:** spacious, section-led, and expressive. Use a few strong interactive panels rather than a generic card grid.
- **Motion:** slow, deliberate, cinematic, and useful. Motion should guide attention and reinforce the brand rather than compete with content.
- **Imagery:** no stock photography, random gorilla illustrations, or unrelated decorative imagery.

## Content and section plan

1. **Hero** — “Building What Moves Growth.” Company name, concise parent-company description, and two clear paths into the site.
2. **About** — “We Build With Purpose.” Introduce Catus Synergy as a diversified parent company.
3. **Businesses** — Present Real Estate & Construction, Environmental Management, Property Management, Import & Export, Consultancy, and Cleaning Services.
4. **The Synergy** — Express “Cooperative Attitude Towards Growth” through Cooperation, Partnership, People, Innovation, and Growth.
5. **The Symbol** — Explain the gorilla as the company’s visual symbol without assigning unsupported traits or history to the mark.
6. **Our Approach** — Build, Connect, Manage, Grow.
7. **Ecosystem** — Show Catus Synergy as the parent company, with a structure ready for future subsidiaries. Do not fabricate subsidiary names.
8. **Contact** — Lagos, Nigeria; info@catussynergy.com; 09063412678; @Catus_synergy; and a prominent conversation CTA.
9. **Footer** — Original logo, tagline, navigation, contact details, social handle, and current year.

## Brand-mark and motion strategy

The supplied logo artwork is the single source of truth. Use the full wordmark where the complete company signature is needed and the standalone gorilla mark for large visual moments or compact placements. Preserve proportions, appearance, and recognizable silhouette. Do not redraw, replace, warp, or create a new gorilla.

The supplied PNGs show a royal-blue field. Keep each image's appearance intact and compose it on a matching blue field or in a layout where that field feels intentional. Do not key out, recolor, or otherwise alter the background. If the desired deep-navy treatment requires a transparent/vector original, request that source asset rather than editing the provided logo.

Motion must respect what the supplied asset can actually support:

- If the source logo contains separate, user-supplied layers or vector components, animate those components conservatively while preserving the original artwork.
- If it is a single flattened image, animate the complete mark with non-destructive techniques such as opacity, scale, slight positional parallax, and light passing across it. Do not fake independent facial or body movement by distorting the artwork.
- Cursor response must be subtle and desktop-only; scrolling may alter position, scale, reveal, or lighting while keeping the logo legible.
- Keep decorative particles sparse and low contrast. They must not block interaction or the initial render.

## Readiness and open dependencies

- **Logo assets:** the standalone gorilla mark and full wordmark have been supplied as PNGs. Confirm the target project's asset paths and ensure the visible royal-blue field is intentionally accommodated. A transparent/vector version has not been supplied.
- **Subsidiary names and profiles:** not provided. Use clearly labeled future placeholders or a parent-company diagram; do not invent portfolio companies.
- **Social destination:** the brief provides `@Catus_synergy` but no verified profile URL. Display the handle as text until the destination is confirmed.
- **Contact details:** use the supplied email and phone number exactly as written. Do not silently normalize or change them.
- **Company claims:** no founding date, leadership, project portfolio, certifications, or performance claims were supplied. Do not create any.

---

# 2. Product Requirements Document

## Product summary

**Product:** Catus Synergy Limited parent-company website  
**Tagline:** Cooperative Attitude Towards Growth  
**Primary concept:** A company that moves  
**Primary action:** Start a business conversation  
**Experience type:** Responsive, motion-led corporate website

## Problem to solve

Visitors need to understand quickly what Catus Synergy is, which business areas it brings together, how it approaches growth, and how to contact the company. The site must communicate this clearly while creating a distinctive brand experience around the original gorilla logo.

## Scope

### In scope

- A polished, responsive website with the sections defined below.
- Clear navigation between the main sections.
- Interactive presentation of the six business areas.
- Purposeful motion, including hero reveal, scroll-based reveals, hover/touch states, and restrained parallax.
- An accessible reduced-motion experience.
- A future-ready ecosystem section that does not misrepresent placeholders as active companies.
- Working contact links where the supplied information supports them.

### Out of scope unless separately supplied or requested

- Creating or redesigning the Catus Synergy logo.
- Inventing subsidiary brands, service descriptions, case studies, testimonials, or company credentials.
- A CMS, authenticated user area, payment flow, or database-backed portfolio.
- A contact form that implies messages are delivered unless a working submission backend is implemented and tested.
- Unverified social profile URLs.

## Information architecture and requirements

### Global navigation

Provide navigation for **Home, About, Businesses, Approach, Ecosystem, Contact**. It must work on desktop and mobile, indicate the active section where practical, and remain keyboard accessible. The gorilla-story section may be reached through About or the page’s section flow; it need not create a redundant top-level navigation item.

### Hero

- Fill the initial viewport on desktop and adapt deliberately to mobile.
- Use a deep-navy background with subtle atmosphere, not a busy particle field.
- Make the original Catus Synergy logo the dominant visual when the canonical asset is available.
- Display the company name, headline **“Building What Moves Growth.”**, and this supporting copy:
  “A diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.”
- Include **“Explore Catus Synergy”** and **“Our Businesses”** actions. Each must navigate to a meaningful section.
- Reveal content progressively without blocking the initial render or delaying access to navigation and page content.

### About

- Lead with **“We Build With Purpose.”**
- Describe Catus Synergy as a diversified parent company, using only information supported by the brief.
- Use large editorial typography and restrained scroll reveals; maintain readable contrast and text flow when motion is disabled.

### Businesses

Show all six stated areas:

1. Real Estate & Construction
2. Environmental Management
3. Property Management
4. Import & Export
5. Consultancy
6. Cleaning Services

Each area may use an expandable row or panel with a clear hover, focus, and touch state. Do not invent detailed service descriptions. Interaction should reveal emphasis or a provided description, not hide essential names behind hover alone.

### Synergy

- Feature **“Cooperative Attitude Towards Growth.”**
- Present **Cooperation, Partnership, People, Innovation, Growth** as the supporting principles.
- Use a sequential or scroll-linked reveal. A visual convergence toward the logo is optional and must only be used if it can be achieved without altering or obscuring the canonical mark.

### The Symbol

- Explain that the gorilla is the company’s visual symbol.
- Make the original logo visually prominent and recognizable.
- Use subtle breathing-like movement only if the source asset supports it without warping; otherwise use restrained movement of the whole logo, lighting, and surrounding composition.
- Do not invent a backstory or claim specific symbolic meanings beyond the supplied brief.

### Our Approach

Present four distinct principles with concise supplied copy:

- **BUILD** — “We build.”
- **CONNECT** — “We connect opportunities and people.”
- **MANAGE** — “We manage with discipline.”
- **GROW** — “We grow sustainably.”

Give each principle a cinematic transition or reveal while keeping all text available in the document and to assistive technology.

### Ecosystem

- Show Catus Synergy as the parent company and make the structure extensible for future subsidiaries.
- Do not present generic “Company / Brand 01” items as real entities. If placeholders are needed, label them explicitly as future portfolio slots or use an empty-state message.
- Only make a company node clickable when it has a real profile or meaningful destination. Avoid dead-end interactions.

### Contact and footer

Display:

- Lagos, Nigeria
- info@catussynergy.com
- 09063412678
- @Catus_synergy

Use a `mailto:` link for the email and a `tel:` link for the phone. Show the social handle as text unless a verified profile URL is supplied. The **“Start a Conversation”** CTA should open the email client or navigate to an implemented, tested contact form.

The footer must include the canonical logo when available, tagline, working section links, contact details, social handle, and copyright year. Do not add unsupported legal, corporate, or social claims.

## Motion, accessibility, and performance requirements

- Provide an intentional first-load reveal, logo/visual reveal, text reveals, section transitions, hover/focus feedback, and restrained background movement.
- Use cursor parallax only on fine-pointer devices. Provide touch-friendly interactions on mobile.
- Honor `prefers-reduced-motion`: remove or greatly reduce nonessential movement, parallax, particles, and scroll-linked animation while preserving content and navigation.
- Keep keyboard focus visible and ensure interactions work without a mouse.
- Do not rely on motion or color alone to convey information.
- Ensure readable color contrast, semantic headings, accessible link names, and suitable alternative text for meaningful imagery.
- Lazy-load noncritical assets; keep the logo and essential hero content available immediately.
- Avoid animation that blocks rendering, causes layout shifts, or creates excessive CPU/GPU work. Prefer transform/opacity-based movement and avoid animating the logo in ways that distort its proportions.
- Test mobile, tablet, and desktop layouts, plus reduced-motion behavior.

## Acceptance criteria

The deliverable is acceptable when:

1. Visitors can identify Catus Synergy as a parent company that builds, connects, manages, and grows.
2. All six business areas and the supplied contact details appear accurately.
3. Navigation and both hero actions reach the intended sections.
4. The supplied standalone mark and full wordmark are used without redesign, distortion, recoloring, or background removal; their blue field is composed intentionally.
5. Future portfolio structure is clearly presented as future-facing and contains no fabricated subsidiaries.
6. Motion feels restrained and intentional, and the site remains usable with reduced motion enabled.
7. Desktop, tablet, and mobile layouts are readable and operable, including with a keyboard.
8. No visible control is a dead link or nonfunctional form.
9. The initial page content is not blocked by animation, and noncritical visual effects do not prevent normal use.
10. No unsupported company history, credentials, portfolio results, testimonials, or service claims are introduced.

---

# 3. Final Build Prompt

Build a premium, cinematic, motion-first parent-company website for **Catus Synergy Limited**.

## Company facts

- **Company:** Catus Synergy Limited
- **Tagline:** “Cooperative Attitude Towards Growth”
- **Location:** Lagos, Nigeria
- **Email:** info@catussynergy.com
- **Phone:** 09063412678
- **Social handle:** @Catus_synergy

Use these details exactly. Do not invent a founding date, leadership team, clients, project results, certifications, subsidiaries, testimonials, or other company claims.

## Critical logo requirement

The supplied Catus Synergy logo files are the single source of truth:

- `attached_assets/DP_3_1790557201461.png` — standalone gorilla mark.
- `attached_assets/DP_1_1790557201513.png` — full Catus Synergy Limited wordmark.

Use the full wordmark when the complete company signature is needed and the standalone mark for large visual moments or compact placements. Confirm that these files are available in the target project's assets. Do not redraw, create a new gorilla, replace or reinterpret the mark, or distort its proportions.

The supplied PNGs show a royal-blue field. Preserve the artwork as provided and compose it on a matching blue field or in a layout where that field feels intentional. Do not remove the background, recolor, or use a substitute gorilla. If a transparent/vector version is required for the intended design, ask for that source file rather than modifying these assets.

If the artwork is a flattened image, animate the whole logo only with non-destructive effects such as subtle opacity, scale, position, parallax, or a light pass. Animate separate facial or body elements only when the supplied source includes those elements as genuine, separately provided layers. Keep the gorilla recognizable at all times.

## Creative direction

The central concept is **“A company that moves.”** Make this feel like a premium global parent-company experience, not a generic SaaS or corporate template. The gorilla is the central visual identity, but the site must also communicate the business clearly and quickly.

Visual character: powerful, premium, corporate, futuristic, confident, elegant, and restrained.

Use deep navy, royal/electric blue, and white. Avoid gold, excessive gradients, stock photography, unrelated illustrations, generic gorilla imagery, excessive cards, and decorative effects that reduce clarity. Use large editorial headings, geometric typography, generous space, and minimal interface chrome.

## Website structure

Create a responsive, section-led website with these navigation links: **Home, About, Businesses, Approach, Ecosystem, Contact**.

### Hero

Create a full-screen cinematic hero with a deep-navy background and subtle atmospheric movement. When available, make the original Catus Synergy logo the dominant visual.

Opening sequence: dark background → a few subtle particles or ambient details → canonical logo reveal → company wordmark → headline and supporting copy → calls to action. Keep the page content and navigation usable immediately; the animation must never block the initial render.

Display:

- Company name: **CATUS SYNERGY**
- Headline: **“Building What Moves Growth.”**
- Supporting copy: **“A diversified parent company building, managing and connecting ventures, services and opportunities for sustainable growth.”**
- CTA 1: **“EXPLORE CATUS SYNERGY”**
- CTA 2: **“OUR BUSINESSES”**

Make both CTAs navigate to their corresponding sections. Add subtle cursor parallax on desktop only; make touch interaction intentional on mobile.

### About

Headline: **“WE BUILD WITH PURPOSE.”**

Introduce Catus Synergy as a diversified parent company. Use large typography, progressive but restrained scroll reveals, and clear, concise copy based only on the supplied facts.

### Businesses

Headline: **“OUR BUSINESSES”**

Present these six business areas:

- Real Estate & Construction
- Environmental Management
- Property Management
- Import & Export
- Consultancy
- Cleaning Services

Use sophisticated interactive rows or panels rather than a generic grid of cards. Add useful hover, focus, and touch responses. Keep every business name visible without requiring hover, and do not invent detailed descriptions.

### Synergy

Present **“COOPERATIVE ATTITUDE TOWARDS GROWTH”** through the principles **COOPERATION, PARTNERSHIP, PEOPLE, INNOVATION, GROWTH**. Reveal them with deliberate motion. A convergence toward the original logo is optional; never alter or obscure the logo to achieve it.

### The Symbol

Create a dedicated section explaining the gorilla as Catus Synergy’s visual symbol. Make the canonical mark large and prominent. Use restrained lighting, parallax, and scroll-driven transitions. Do not invent a backstory or deform a flattened logo to simulate facial or body movement.

### Our Approach

Present four principles with this exact copy:

- **BUILD** — “We build.”
- **CONNECT** — “We connect opportunities and people.”
- **MANAGE** — “We manage with discipline.”
- **GROW** — “We grow sustainably.”

Give each a distinct, smooth reveal or transition without hiding content from keyboard or assistive-technology users.

### Ecosystem

Create an interactive, extensible parent-company ecosystem visualization with **CATUS SYNERGY** at the center or top. The architecture should support future subsidiaries and brands.

No subsidiary names were supplied. Do not fabricate any. Use a clearly labeled future-portfolio empty state or neutral placeholder slots. Make a node clickable only when it has a real profile and working destination; do not create dead links.

### Contact

Headline: **“LET’S BUILD WHAT’S NEXT.”**

Display **Lagos, Nigeria**, **info@catussynergy.com**, **09063412678**, and **@Catus_synergy**. Use working `mailto:` and `tel:` links. The social handle must remain plain text unless a verified profile destination is available.

CTA: **“START A CONVERSATION”**. Link it to the email client or to a real, tested contact form. Do not present a form that silently fails or claims to send when no submission path exists.

### Footer

Include the original Catus Synergy logo when available, the tagline, working section navigation, contact details, social handle, and current copyright year.

## Motion and accessibility

Use high-performance CSS/Web Animations and, where suitable for the project, Framer Motion or GSAP. Keep movement slow, powerful, and intentional—not flashy or distracting. Use transforms and opacity where practical.

Include a restrained page-load reveal, text reveals, scroll-linked section transitions, hover/focus interactions, subtle desktop cursor response, and sparse ambient particles. Keep mobile motion lighter and interactions touch-friendly. Respect `prefers-reduced-motion` by removing or significantly reducing nonessential animation while keeping all content and controls usable.

Provide semantic page structure, readable contrast, descriptive accessible names, keyboard operation, and visible focus states. Do not use motion, color, or hover as the only way to understand or operate any content.

## Responsive design and performance

Design specifically for desktop, tablet, and mobile; do not merely shrink the desktop composition. Keep headings, navigation, logo, and CTAs legible at small sizes. Reduce particle count and animation complexity on mobile.

Lazy-load noncritical assets, optimize supplied logo assets without changing their appearance, and do not let animation block the first render. Avoid layout shifts and heavy continuous effects. Keep animation modular and test the site with reduced motion enabled.

## Final verification

Before considering the build complete, verify that:

- The canonical logo is used faithfully, or its absence is explicitly surfaced without substituting another mark.
- The company’s parent-company role is immediately understandable.
- All six business areas, five synergy principles, four approach principles, and supplied contact details are present and accurate.
- Navigation, section CTAs, contact links, and any interactive ecosystem items work.
- No fake subsidiaries, unsupported company claims, dead controls, or nonfunctional contact form are present.
- Desktop, tablet, mobile, keyboard, and reduced-motion experiences remain usable.
- Motion is polished but does not block content or impair performance.