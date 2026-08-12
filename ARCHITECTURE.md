# Client Architecture Reference

This document explains the directory structure, design patterns, and engineering decisions of the Oakbridge E-Reader front-end client.

---

## 1. Directory Structure

The codebase follows a feature-driven module architecture:

```
src/
├── app/                  # Application core wrappers and route definitions
├── assets/               # Static assets, fonts (Mona-Sans), and global icons
├── components/           # Generic, reusable UI components (modals, inputs, buttons)
├── config/               # Environment variable bindings and constants
├── data/                 # Static metadata, category lists, definitions
├── features/             # Feature modules (isolated page & business logic)
│   ├── auth/             # User signin, signup, subscription levels
│   ├── books/            # Book lists, book details, and catalogs
│   ├── cart/             # Checkout views and cart items listing
│   ├── categories/       # Category filters and catalogs
│   ├── library/          # Reading shelves, search logs, resumed books
│   ├── payments/         # Subscription tiers and transaction handling
│   ├── public_store/     # Bookstore shelves, grid galleries, search results
│   └── reader/           # Core reading page and custom PDF viewer
├── hooks/                # Global React hooks
├── layout/               # Outer layout frames (header bars, admin containers)
├── store/                # Zustand global state managers (Auth, Cart, Bookmarks)
├── styles/               # Global SCSS mixins and core variables
└── utils/                # Security utils, DRM, IndexedDB managers
```

---

## 2. Reading System & Viewport Architecture

The E-Reader is engineered as a secure, containerized reader layout.

### Viewport Layout

```
+-------------------------------------------------------------+
|                     Main Header Bar                         |
|  [Back]            Title             [TOC] [Bookmarks] [Aa] |
+-------------------------------------------------------------+
|                                                             |
|                       PDF Toolbar                           |
|      [Prev]  Page [  ] of X  [Next]     [Zoom Out] 100% [+] |
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                        Canvas View                          |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
```

- **Sticky Navigation Header:** Displays manuscript metadata, Table of Contents panel triggers, bookmark drop-downs, notes panel, and theme settings.
- **Adaptive PDF Toolbar:** Coordinates scale changes, page updates, and centers controls on mobile viewports using CSS flexbox column transformations.

---

## 3. Security & DRM System

To prevent intellectual property theft, multiple layers of defensive measures are enforced:

### A. Dynamic Watermarking
Every canvas page rendered has an overlay containing a repeating diagonal tile pattern.
- Generated via a memory canvas (`buildWatermarkDataUrl`) containing the current user's `username` and `email` timestamp.
- Tiled as a CSS background property above the PDF pages to make unauthorized distribution immediately traceable.

### B. Screen-Capture & Recording Shield
- Pipes a black 1x1 canvas stream into a GPU-accelerated video tag (`reader__capture_shield`) overlay.
- During normal reading, browser hardware acceleration displays content cleanly.
- If a screen capture tool (e.g., Snipping Tool, OBS, Zoom Screen Share) intercepts the hardware frame buffer, the video overlay compositor blacks out the capture stream, resulting in a dark screenshot.

### C. OS Key and Click Interception
Interceptors are registered in a global `useEffect` when the reader loads:
- **Right-Click Block:** Context menu triggers are blocked via `e.preventDefault()`.
- **Keyboard Block:** Intercepts `F12`, `Ctrl+Shift+I` (DevTools), `PrintScreen` (OS screenshot), and `Ctrl+P` (Print to PDF).

---

## 4. State & API Flow

State management is split between server database entities and client Zustand stores:

```
                  +--------------------------------+
                  |           API Engine           |
                  +--------------------------------+
                                  |
                                  v
                  +--------------------------------+
                  |         Zustand Store          |
                  |  - Auth State                  |
                  |  - Cart / Bookmark State       |
                  +--------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
+-----------------------+                   +-----------------------+
|  Bookstore Page       |                   |  Reader Page          |
|  - Saved bookmarks    |                   |  - Book highlights    |
|  - Cart checkout      |                   |  - Reading progress   |
+-----------------------+                   +-----------------------+
```

- **Token Interceptor:** Axios automatically appends the `Authorization: Bearer <token>` header, handles 401 token expiration, and issues refresh requests.
- **Progress Debounce:** Reading progress is debounced (1 second) as the user changes pages before syncing progress to the backend, reducing server traffic.

---

## 5. Offline Cache System

Offline access uses a double-key verification cache in IndexedDB:
1. **Cache Verification:** `isBookCached` verifies if the decrypted book content matches the local index.
2. **Decrypted Caching:** Manuscripts are decrypted in memory using the user's specific DRM token, then saved locally. When offline, `loadBookOffline` loads the document directly from IndexedDB using the logged-in user ID as the decryption verification signature, preventing access if another user logs into the device.
