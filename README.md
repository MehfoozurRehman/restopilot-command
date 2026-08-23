# RestoPilot Command: Local-First Restaurant POS & Operations Suite

A local-first, offline-tolerant restaurant point-of-sale (POS) workstation, kitchen display coordinator, order dispatch terminal, and live table billing management system built with Electron 42, React 19, Vite 8, and Convex.

## Overview

`restopilot-command` delivers a fast desktop POS terminal for busy restaurants:
- **Local-First Speed & Offline Tolerance**: Electron desktop runtime with instantaneous local state changes powered by Zustand and local caching.
- **Real-Time Synchronized Kitchen & Tables**: Live reactive database layer using Convex (`convex`) for table statuses, ticket items, modifier selections, and split-bill payments.
- **Fast UI & Modern Tooling**: React 19 with React Compiler (`babel-plugin-react-compiler`), Vite 8, Tailwind CSS v4, Lucide icons, and Date-fns formatting.
- **Cross-Platform Desktop Packaging**: Production desktop builds for Windows (`.exe` / portable), macOS, and Linux via `electron-builder`.

## Tech Stack

- **Desktop Framework**: [Electron](https://www.electronjs.org/) (v42), `vite-plugin-electron`, `vite-plugin-electron-renderer`
- **Frontend Core**: React 19, TypeScript, [Vite](https://vitejs.dev/) (v8), React Router DOM (v7)
- **Real-Time Backend**: [Convex](https://convex.dev/) (`convex`)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (v5)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Packaging**: `electron-builder`

## Prerequisites

- Node.js (v20 or higher recommended)
- Package manager (`npm` or `pnpm`)
- Convex project account (`npx convex dev`)

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the Convex Backend**:
   ```bash
   npx convex dev
   ```

3. **Run Desktop Application in Development Mode**:
   ```bash
   npm run electron:dev
   ```

4. **Run Web Version Only**:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run electron:dev` - Starts the Vite development server and launches the Electron desktop app with live reload.
- `npm run dev` - Starts the Vite web development server at `http://127.0.0.1:5173`.
- `npm run build` - Generates brand assets, type-checks with `tsc`, compiles the Vite build, and packages the desktop installer using `electron-builder`.
- `npm run build:web` - Compiles the web production bundle.
- `npm run lint` - Runs ESLint code quality checks.

## Author

Created by [Mehfooz-ur-Rehman](https://github.com/MehfoozurRehman).
