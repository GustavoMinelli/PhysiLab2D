# PhysiLab2D

An interactive React + TypeScript + Vite project showcasing mathematical motion in 2D. The current demo uses Matter.js to visualize the parametric sum e^(iθ) + e^(iπθ) as two rigid rods of equal length: the inner rod rotates at θ, and the outer at πθ. The endpoint leaves a trail that never exactly closes because π is irrational, but you will observe striking near-closures at rational approximations like 22/7 and 355/113.

## Features

- Matter.js-powered scene with kinematic rods (no gravity/collisions)
- Smooth trail rendering of the endpoint path
- Responsive canvas that adapts to the page/container size
- Clean React setup with TypeScript

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

3. Open the URL shown in your terminal (typically http://localhost:5173).

## Scripts

- `npm run dev` – Start Vite dev server with HMR
- `npm run build` – Type-check and build for production
- `npm run preview` – Preview the production build
- `npm run lint` – Run ESLint

## Project Structure

- `src/App.tsx` – Main component that sets up the Matter.js engine/render loop and draws the two-rod animation and trail
- `src/main.tsx` – React entry point
- `public/` – Static assets

## How the Demo Works

- The inner rod position is center + L·[cos θ, sin θ].
- The outer rod is attached to the inner tip and uses an absolute angle πθ.
- The endpoint at each frame is (x1, y1) + L·[cos(πθ), sin(πθ)].
- As θ increases uniformly, the endpoint path never repeats exactly (π is irrational), but near-closures occur at good rational approximations.

## Customization

Open `src/App.tsx` and tweak:

- Angular speed: `dTheta` (default 0.008)
- Trail length: `maxTrail` (default 3000)
- Rod length scale: `L` (derived from canvas size; adjust the multiplier 0.35)

## Requirements

- Node.js LTS or newer
- npm (comes with Node)

## License

This project is licensed under the MIT License. See `LICENSE` for details.

## Roadmap / TODO

- Next: Granular physics (2D). Particle-based sand/grains using circles with collision, friction, and optional cohesion. Demos: pouring from a hopper, piling with angle of repose, and interactions with simple obstacles.
- Maybe: Fluids. Explore a lightweight 2D fluid effect (e.g., SPH-inspired particles, grid-based advection, or a visual approximation like metaballs). Performance-first approach with graceful fallbacks for low-end devices.
