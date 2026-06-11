# 🎵 Sai Music Academy — Premium Web Portal

Sai Music Academy is an enterprise-grade, highly responsive web application built for a music education institution. It features a premium dark-themed interface, interactive media controls, class schedules, and automated deployment pipelines.

---

## 🚀 Technology Stack
* **Core:** [React 19](https://react.dev) & [TypeScript](https://www.typescriptlang.org)
* **Build System:** [Vite 7](https://vite.dev) (configured with HMR optimizations)
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com) (utility-first, modern architecture)
* **Hosting:** [Vercel Edge Network](https://vercel.com) (global asset CDN & routing)

---

## ✨ Features
1. **Interactive Hero Section:** Auto-playing loop backgrounds with custom controls.
2. **Dynamic Course Listings:** Category-based filters for Indian Classical and Western instruments.
3. **Advanced Contact Portal:** Built-in form validation and messaging.
4. **Ops Automation:** Real-time files watching, autocommit, release tag bookmarks, and rollbacks.

---

## 💻 Local Development

### Prerequisites
Ensure you have [Node.js (v18+)](https://nodejs.org) and npm installed.

### Setup & Run
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Launch the hot-reloading development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. Compile the production-ready bundle:
   ```bash
   npm run build
   ```

---

## ⚡ Operations & DevOps Suite

We have automated common developer operations to speed up deployment and versioning:

### 1. Real-Time Local-to-Cloud Sync (`auto-sync.cjs`)
Automatically tracks changes in code and assets. Once you stop typing for 3 seconds, it packages modifications, commits, and pushes to GitHub, triggering a live rebuild on Vercel:
```bash
node auto-sync.cjs
```

### 2. Milestone Release Tagging (`tag-release.cjs`)
Saves a stable milestone checkpoint on GitHub:
```bash
node tag-release.cjs v1.0.0
```

### 3. Interactive Cloud Rollback (`rollback.cjs`)
Rolls back both your local workspace and live website to any previous commit or tag using an interactive, color-coded terminal menu:
```bash
node rollback.cjs
```

---

## 📘 Documentation
For more detailed infrastructure guides, refer to:
* **[DevOps & Operations Manual](DEVOPS.md):** Complete guide to DNS settings, Vercel edge caching, and data pipelines.
* **[MCP Setup Guide](docs/mcp_setup.md):** Configuring AI developer environments.
