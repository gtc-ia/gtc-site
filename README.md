# GTC Site

## Overview
GTC Site is a streamlined Next.js landing page for the GTStor AI procurement platform. The homepage blends a performant hero overlay with an animated Three.js scene to showcase the product while keeping the rest of the layout minimal and ready for expansion.

## Features
- Hero overlay with actionable CTAs for launching the AI assistant, reading curated news, and purchasing access.
- Animated 3D hero background rendered with React Three Fiber and Three.js primitives.
- Minimal global styling powered by Tailwind CSS directives and the Inter font family.
- SEO-ready static assets such as robots.txt and sitemap.xml shipped by default.

## Tech Stack
- [Next.js 14](https://nextjs.org/) with React 18
- TypeScript for type safety
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) and [Three.js](https://threejs.org/) for WebGL rendering
- Tailwind CSS and PostCSS for utility-first styling

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` to view the site.
3. Create a production build:
   ```bash
   npm run build
   ```
4. Start the production server locally:
   ```bash
   npm run start
   ```

## Deployment
Follow the production build steps above and deploy the generated output on your hosting provider of choice. Run `npm run build` to compile the app and `npm run start` to serve the production server in your target environment.

## Структура проекта
- `src/pages/_app.tsx` — точка входа Next.js, подключает глобальные стили и оборачивает страницы приложением.
- `src/pages/index.tsx` — главная страница с ленивой загрузкой 3D-сцены и размещением оверлея героя.
- `src/components/HeroOverlay.tsx` — компонент с заголовками, описанием и кнопками призывов к действию.
- `src/components/Hero3DCanvas.tsx` — сцена React Three Fiber с анимированными геометриями и освещением.
- `src/styles/globals.css` — глобальные стили, подключающие слои Tailwind и базовые шрифты.
- `tsconfig.json` — конфигурация TypeScript, определяющая алиасы и параметры компилятора.
- `tailwind.config.js` — настройка Tailwind CSS, где управляются темы, пресеты и пути сканирования классов.
- `public/` — статические ресурсы (например, `fallback-hero.png`, `robots.txt`, `sitemap.xml`) для SEO и резервных изображений.

## Настройка и обслуживание
- **Тексты и CTA в герое** редактируются в `src/components/HeroOverlay.tsx`. Обновите заголовок, описание и ссылки, чтобы отражать актуальные продукты или кампании.
- **3D-сцена** конфигурируется в `src/components/Hero3DCanvas.tsx`. Там можно менять используемые геометрии, цвета материалов, интенсивность света и скорость анимаций.
- **Секции ниже героя** дополняются напрямую в `src/pages/index.tsx`. Добавьте новые блоки JSX под секцией `<section>` для расширения лендинга.
- **Темизация и базовые стили** управляются через Tailwind: обновляйте токены в `tailwind.config.js`, а глобальные правила и импорты — в `src/styles/globals.css`.
- **Типы и алиасы** поддерживаются в `tsconfig.json`, что упрощает рефакторинг и внедрение новых директорий.
- **SEO и статические файлы** следите за актуальностью ресурсов в `public/` (например, обновляйте `robots.txt`, `sitemap.xml`, а также изображения, используемые как резервные).

