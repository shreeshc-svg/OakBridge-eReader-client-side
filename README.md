# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
     globalIgnores(['dist']),
     {
          files: ['**/*.{ts,tsx}'],
          extends: [
               // Other configs...

               // Remove tseslint.configs.recommended and replace with this
               tseslint.configs.recommendedTypeChecked,
               // Alternatively, use this for stricter rules
               tseslint.configs.strictTypeChecked,
               // Optionally, add this for stylistic rules
               tseslint.configs.stylisticTypeChecked,

               // Other configs...
          ],
          languageOptions: {
               parserOptions: {
                    project: ['./tsconfig.node.json', './tsconfig.app.json'],
                    tsconfigRootDir: import.meta.dirname,
               },
               // other options...
          },
     },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
     globalIgnores(['dist']),
     {
          files: ['**/*.{ts,tsx}'],
          extends: [
               // Other configs...
               // Enable lint rules for React
               reactX.configs['recommended-typescript'],
               // Enable lint rules for React DOM
               reactDom.configs.recommended,
          ],
          languageOptions: {
               parserOptions: {
                    project: ['./tsconfig.node.json', './tsconfig.app.json'],
                    tsconfigRootDir: import.meta.dirname,
               },
               // other options...
          },
     },
]);
```

---

# 📖 Oakbridge E-Reader Client

A high-performance, secure digital library and bookstore client interface. Built with **React**, **TypeScript**, **Vite**, and **SCSS**, this application delivers a premium, fast reading experience while enforcing strict digital rights management (DRM) and offline capabilities.

---

## ✨ Key Features

### 🔒 Enterprise-Grade DRM Protection
* **Screen-Capture Shield:** Prevents screen-sharing tools (OBS, Zoom, Snipping Tool) from capturing readable content by overlaying a hardware-accelerated video black-out layer.
* **Tiled Dynamic Watermarking:** Overlays a diagonal grid pattern dynamically generated with the active user's name, email, and security identifier to discourage camera screenshots and distribution.
* **Input Interception:** Globally disables right-clicks, block developer console hotkeys (`F12`, `Ctrl+Shift+I`), print-screen capture triggers, and print-to-PDF (`Ctrl+P`) commands.

### 📚 Interactive PDF Reader
* **Fluid Layout Navigation:** Custom slider overlays, sidebar navigation arrows, keyboard-arrows handler, and a direct page jumping input.
* **Zoom Engine:** Supports *Fit to Width*, *Fit to Page*, and step-by-step percentage zooming (`-` and `+` controls) with canvas scale-rendering optimizations.
* **Annotations & Tools:**
  - Highlighting text in multiple colors (yellow, green, pink, blue).
  - Pop-up notes creator & editor.
  - Sidebar notes listing with single-click page navigation.
  - Interactive dictionary definitions lookup.
  - Interactive Table of Contents panel (TOC).

### 🛒 Integrated Digital Bookstore
* **Smart Catalog & Shelves:** Scrollable category filters, horizontal book shelves, and visual grid search results page.
* **Bookmark / Save for Later:** Interactive bookmark toggle on grid cards that automatically inserts/removes items from the user's permanent backend wishlist.
* **Shopping Cart & Checkout:** Quick checkout, multi-item cart management, and profile subscription tier indicators.

### 💾 Offline Synchronization
* **IndexedDB Local Storage:** Automatically syncs and saves user progress, bookmarks, and decrypted book files to the local database.
* **Offline Access Guard:** Validates logged-in session signatures offline to guarantee that files are only decrypted if the active user matches the cached DRM owner token.

---

## 🛠️ Tech Stack & Ecosystem

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | React 18+ | Component-driven UI framework with TypeScript compilation |
| **Styling** | Vanilla CSS & SCSS | Modular component styles with variables & media-queries |
| **State** | Zustand | Global stores for cart, bookmarks, and auth session tokens |
| **DRM Decrypt** | Web Cryptography API | High-speed client-side AES-128/256 decryption |
| **Local Cache** | IndexedDB | Secure offline storage structure |
| **Bundler** | Vite | Ultra-fast local HMR and Rolldown build pipeline |

---

## 📂 Project Structure

```
src/
├── app/                  # Route configuration & global providers
├── components/           # Generic buttons, input widgets, modals
├── config/               # API endpoint configurations & env helpers
├── features/             # Business logic modules
│   ├── auth/             # Login, signup, payment tier modals
│   ├── books/            # Catalogs, cards, metadata details
│   ├── cart/             # Shopping lists & wishlists
│   ├── library/          # Started reading list, reading history
│   ├── public_store/     # Grid galleries, shelves, Bookstore home page
│   └── reader/           # Secure PDF render viewports, panels, popups
├── store/                # Zustand stores (auth.store, cart.store)
├── utils/                # drm_decrypt, offline_manager helpers
└── index.scss            # Core design system stylesheet tokens
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (version 18 or above) installed.

### Setup
1. Clone the project and navigate to the client folder:
   ```bash
   cd oakbridge-e-reader-client
   ```
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the hot-reload server:
```bash
npm run dev
```
Open `http://localhost:3000` in your web browser.

### Building for Production
To compile and minify the app for deployment:
```bash
npm run build
```
The output files will be compiled inside the `/dist` directory. The main reading page bundle is fully optimized (under 460 kB) for blazing fast loads.
