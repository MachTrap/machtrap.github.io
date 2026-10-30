# machtrap

A compact bilingual developer site with a touch-reactive, ray-marched surface, inertial gestures, character-decoding text. Built with Astro, TypeScript, original WebGL2 effects, HTML and SVG.

## Develop

Use Node.js 22 or newer.

```sh
npm ci
npm run dev
```

`npm run check`, `npm test`, and `npm run build` validate the production output. `npm run preview` serves the build.

## Customize

- `src/data/site.ts`: shared palette, EN/RU copy, links and technologies. The accent is passed to CSS and WebGL from this one source.
- `src/data/capabilities.ts`: bilingual mobile, AI/bot/backend scenarios, and full development cycle content.
- `src/scripts/motion.ts` and `src/scripts/surface-motion.ts`: frame-rate independent motion, noise rejection, critically damped drag tracking, release-only momentum, and geometry-driven fade-out.
- `src/scripts/scene.ts`: WebGL2 renderer, pointer/scroll interaction and adaptive resolution. The rounded sculpture and sparse particle glow live in `src/shaders/ambient.frag`. `src/shaders/coding.frag` renders the mobile demonstration through a scissored region of the same context.

English: `/`. Russian: `/ru/`. Native static navigation works without the client router. Reduced motion displays static shaders and resolves all text immediately.

## Deployment

The GitHub Actions workflow checks, tests and publishes `dist/` after a push to `main`. Select **GitHub Actions** as the Pages source in repository Settings → Pages. No backend or secrets are needed. The site is configured for `https://machtrap.github.io`.

`.local/` contains private research inputs and is ignored; it is never copied into the build. No CV, personal name, analytics or third-party embeds are published. The contact window intentionally exposes the approved email and Telegram link.

## Design provenance

Lambda's AI infrastructure page informed the editorial hierarchy, dropdown structure, quick navigation feedback and RGB-edged button treatment. All site code, graphics and shader effects are original implementations.

Local Shadertoy references informed techniques only: `lccXWH` (brief chromatic displacement), `XcBGDK` (sparse procedural marks), `llcyD2` (bitmap glyph fragments), `3sGyWz` (visible signal/state transitions). `w3tcDf` informed the editor-to-device composition; the new original SDF material uses the shared mint palette and a procedural glyph editor and scrolling phone preview. All graphics are generated in the shader; there are no SwiftUI snippets or haptic shake. No reference GLSL or textures are distributed.

Self-hosted IBM Plex Sans and Mono are distributed under the SIL Open Font License. See `public/fonts/OFL.txt`.

## Verification

Production build, TypeScript checks and twenty-four capability, gesture, particle, architecture, and coding-scene tests pass. Chromium QA covers EN/RU, 360/390/768/844/1440/1920 px widths, scenario/delivery tabs, node selection, reduced motion, WebGL context loss/restoration, fallback and repeated client navigation. The renderer exposes frame timing through canvas data attributes for local QA; these are not physical-device benchmarks.

The output contains only two static pages, shared assets and self-hosted fonts. Private CV and reference files remain excluded. Append `?effects=off` to review the static visual fallback.

Physical iOS/Android devices and Safari/Firefox must be checked separately before claiming verified support or device frame rates.

## Interaction details

The coding study renders a perspective workbench and a synchronized Workspace mobile interface in `coding.frag`. The DOM supplies a localized accessible description. Animation runs automatically while visible and suspends off-screen or when the tab is hidden. Portrait layouts stack the phone above the editor. Reduced motion keeps the scene static, and WebGL failure displays a CSS fallback.

Backend scenario tabs update their descriptions, technologies, and architecture diagram without a request console. No API requests are made.

Liquid Energy renders a solid ray-marched torus with flowing illumination and outward particles in one persistent WebGL2 context. Geometry and illumination have independent clocks: a stationary hold settles rotation while the material continues moving. Both stop off-screen or when hidden.

A fixed pool emits outward-moving particles as instanced quads (256 desktop / 128 mobile, halved when rendering density drops). Birth positions stay in world space, finite lifetimes recycle slots, and the hero's depth buffer occludes particles behind its surface. No feedback textures or full-screen bloom are used. `hero-model.ts` contains the shared transform, picking and particle model.

The architecture explorer uses typed localized scenario graphs (`src/data/architecture.ts`), CSS Grid cards, and SVG routes measured from node bounds. Mobile cards form a vertical flow with a side gutter for branching. Hover/focus previews nodes; click/tap/Enter/Space pins them. Scenario changes preserve the pinned role. Explanations live below the map; only explicit selections trigger live announcements. Reduced motion disables traveling signals and pulses.

Word-level entrances preserve natural wrapping and stable screen-reader copy. Panel reveals and small scroll depth effects use native scrolling, while reduced motion keeps all content stable and accessible.

## Cinematic coding workbench

`coding-model.ts` drives a 24-second structure → behavior → polish sequence and a continuous reset. Editor edits complete before their light transfers trigger app changes. The illustrative Workspace app assembles three task cards, expands the middle card, completes it, and returns to an updated dashboard. These are shader-rendered illustrations, not a functioning task application or SwiftUI source samples.

`coding-atlas.ts` generates one cached 1024×512 Plex glyph/label atlas and a small deterministic document texture. It includes EN/RU UI labels, uses system font fallbacks if loading fails, and is re-uploaded after WebGL context restoration. Perspective plane projection, beveled rims, glass, shadows, and a shared-element card avoid a full-scene ray march.

Optional inspection uses bounded critically damped tilt. Touch waits for 8px horizontal intent; vertical gestures remain native scrolling. Arrow keys inspect, Enter sends a light pulse, and Escape returns to neutral. Timeline and gestures suspend off-screen or when hidden; reduced motion renders the finished dashboard without animation. No playback buttons are added.

Workbench QA covered both locales, the six listed responsive sizes, mouse/keyboard inspection, build pulses, off-screen suspension, reduced motion, denied font requests, and context loss/restoration. The local Chromium preview reported frame cadence around 16.7 ms with one visible WebGL canvas; this is not a physical-device GPU benchmark. Touch intent is unit-tested, but physical touch testing and Safari/Firefox checks remain outstanding.
