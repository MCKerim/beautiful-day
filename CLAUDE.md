# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (hot reload)
npm run build     # tsc type-check then Vite production build
npm run preview   # serve the production build locally
```

There are no tests. Type-check only via `tsc` (already part of `build`).

## Architecture

**Two-pass render loop** — every frame the scene is drawn into a low-resolution `WebGLRenderTarget` (45% of screen size, nearest-neighbor filter), then a full-screen quad composites it to the display with the VHS shader in `PostFXPipeline`. All visual effects live in that single fragment shader — do not add a second pass or a postprocessing library.

**Terrain system** — `Chunk.ts` owns the noise function (`sampleHeight`/`getHeightAt`). Both `Chunk` and `FPSController` rely on this shared function; it must stay deterministic and side-effect free. `ChunkManager` keeps a `Map<string, Chunk>` keyed by `"cx,cz"` and loads/unloads a 7×7 grid around the player each frame.

**Player height** is derived each frame by querying `getHeightAt` directly from `FPSController.update` — there is no physics or collision system.

**Sky** is a single inverted sphere with a GLSL gradient shader (depth-write off, `renderOrder -1`). Clouds are `THREE.Group` hierarchies of flat `PlaneGeometry` meshes that drift each frame in `Sky.update`.

**No audio, no physics, no assets** — everything is procedural geometry and shaders. The aesthetic goal is liminal/uncanny; avoid adding HUD elements, skyboxes from textures, or game-mechanics systems.

## Key constraints

- `tsconfig.json` enforces `noUnusedLocals` and `noUnusedParameters` — unused variables are compile errors.
- `postprocessing` is in `devDependencies` but not currently used; the pipeline is hand-rolled in `Pipeline.ts`.
- Canvas uses `image-rendering: pixelated` in CSS — this is intentional, not a bug.
