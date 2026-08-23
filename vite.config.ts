import tailwindcss from '@tailwindcss/vite'
import babel from '@rolldown/plugin-babel'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    process.env.ELECTRON_DEV === 'true' || process.env.NODE_ENV === 'production'
      ? electron({
          main: {
            entry: 'electron/main.ts',
          },
          preload: {
            input: 'electron/preload.ts',
          },
        })
      : undefined,
  ],
})
