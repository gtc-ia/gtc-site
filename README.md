# GTC Site

## Purpose
GTC Site is the marketing home for GTStor, giving procurement teams a fast introduction to the AI-powered sourcing platform. The landing page mixes narrative copy, calls to action, and an animated hero experience so visitors can launch the Telegram assistant, read procurement news, or purchase access in just a few clicks.

## Primary Features
- **Actionable hero overlay** with clear CTAs that link directly to the Telegram analyst bot, curated news portal, and payments page.
- **Immersive WebGL background** composed with React Three Fiber and Three.js primitives for a dynamic first impression.
- **Performance-oriented layout** that keeps supporting sections lightweight and ready for future content expansion.
- **SEO-friendly static assets** including sitemap and robots directives shipped in the public folder.

## Technology Stack
- [Next.js 14](https://nextjs.org/) with React 18 for the application framework.
- TypeScript for type-safe component development.
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) and [Three.js](https://threejs.org/) to render the 3D hero scene.
- Tailwind CSS and PostCSS for utility-first styling.

## Local Development Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
   Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build & Preview
1. Create an optimized production build:
   ```bash
   npm run build
   ```
2. Launch the production server locally:
   ```bash
   npm run start
   ```
   The server will default to [http://localhost:3000](http://localhost:3000).

## Deployment
The live marketing site is deployed at [https://gtstor.com/](https://gtstor.com/).
