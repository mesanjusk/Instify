# Instify — Project Summary

Instify is a full-featured **Educational Institute Management System (ERP)** built as a monorepo. It supports both a cloud-hosted web application and a fully offline-capable Windows desktop application. The system covers every operational need of an educational institute: student admissions, academic management, finance, HR, WhatsApp automation, and analytics.

---

## Architecture Overview

The project is structured as three tightly integrated layers:

```
Instify/
├── SocialBackend/   # Node.js + Express REST API
├── SocialFront/     # React 18 + Vite web/desktop frontend
└── electron/        # Electron desktop wrapper (Windows)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Material-UI 7, React Router 6 |
| State & Offline | Context API, Dexie (IndexedDB), crypto-js, PWA (Workbox) |
| Backend API | Node.js, Express.js 4.18 |
| Database | MongoDB 7.6 (Mongoose ODM) |
| Authentication | JWT, OTP, Magic Link email login |
| File Storage | Cloudinary |
| Messaging | Baileys (WhatsApp Web self-hosted) + Meta Cloud API (official) |
| Payments | Razorpay + UPI |
| Design Tools | Fabric.js canvas editor |
| PDF / Reports | jsPDF + jsPDF AutoTable |
| Data Import | PapaParse (CSV), SheetJS XLSX |
| Charts | Recharts |
| Desktop | Electron 30, bundled MongoDB, electron-builder, auto-updater |
| Security | Helmet, CORS whitelist, JWT rate limiting, AES encryption |

---

## Backend (`SocialBackend/`)

### Framework & Entry Point
- **Express.js** server (`index.js`) handles routing, middleware, and startup
- **MongoDB** connection via Mongoose with 35 data schemas

### Database Models
| Category | Models |
|---|---|
| Core | User, Institute, Account, Transaction, Employee |
| Academic | Student, Admission, Enquiry, Lead, Course, Batch, Exam, Education, Attendance |
| Features | WASession, Forms, Templates, IDCards, Fees, Messages |
| Admin | OrgCategory, AppConfig, License, OTP, Audit |

### API Routes
| Route | Purpose |
|---|---|
| `/api/auth/*` | Login, signup, OTP verification, JWT refresh, magic links |
| `/api/record/*` | CRM records: leads, enquiries, follow-ups, admissions |
| `/api/student/*` | Student data, enrollment, attendance |
| `/api/course/*`, `/api/batch/*` | Academic structure management |
| `/api/baileys/*` | WhatsApp session control and messaging |
| `/api/transaction/*`, `/api/fees/*` | Financial records and fee tracking |
| `/api/csvImport/*` | Bulk data import with validation |
| `/api/institute/*` | Multi-tenant institute management |
| `/api/dashboard-stats` | Analytics and reporting data |

### Key Services
- **baileysService.js** — Manages WhatsApp Web sessions via Baileys, with MongoDB persistence and auto-reconnect
- **whatsappService.js** — Meta Cloud API integration for OTP and notification messages
- **cronService.js** — Scheduled jobs: auto-reconnect sessions, data cleanup
- **metaApiService.js** — Handles incoming Meta webhook payloads

### Security
- JWT tokens with automatic refresh
- Auth rate limiting: 10 attempts per 15 minutes per IP
- Multi-tenant isolation: every query is scoped to `institute_uuid` extracted from JWT
- Helmet middleware for HTTP security headers
- CORS whitelist for production domains

---

## Frontend (`SocialFront/`)

### Key Libraries
- **MUI 7** — Component library and theming
- **Dexie** — IndexedDB wrapper for offline data storage
- **Fabric.js** — Canvas-based ID card and document editor
- **Recharts** — Dashboard charts and funnel visualizations
- **jsPDF** — PDF generation for reports and receipts

### Pages & Features
| Area | Pages |
|---|---|
| Auth | Login, Signup, ForgotPassword, ResetPassword, MagicLogin |
| Dashboard | Dashboard (analytics), AcademicHub, AdminHub |
| CRM | Enquiry, Followup, Leads report |
| Admissions | AllAdmission report, AddAdmission dialog |
| Academic | Courses, Batches, Exams, Education levels, Students, Attendance |
| Finance | Fees, Payments, Receipts, Transactions, Trial Balance, P&L |
| HR | Employees, Payroll |
| Admin | Users, Institute profile, Owner settings, OrgCategories |
| Tools | IDCardManager, CanvasEditor, WhatsApp panels, BulkImport |

### State Management
- **AppContext** — Global auth, institute data, theme, module flags
- **BrandingContext** — Per-institute custom colors, fonts, logos
- **MetadataContext** — Master data cache (students, courses, batches, payment modes)
- **WhatsAppCloudContext** — Cloud API settings and session state

### Offline-First Architecture
- **IndexedDB via Dexie** stores encrypted local copies of all major data tables
- **offlineMutations** table queues writes made while offline
- **useOfflineQueue** hook syncs the queue when connectivity is restored
- **PWA** with Workbox: network-first for API calls, cache-first for static assets and Cloudinary images
- AES encryption of sensitive IndexedDB fields using `VITE_DB_SECRET_KEY`

### API Client (`apiClient.js`)
- Axios instance with request interceptors
- Injects JWT from localStorage on every request
- Handles 401 responses with silent token refresh and request replay
- After write operations, triggers Electron sync when running in desktop mode

### Build Configuration (`vite.config.js`)
- Manual chunk splitting: React, MUI, Fabric.js, PDF tools in separate bundles
- PWA plugin generates service worker with Workbox caching strategies
- `npm run build:desktop` mode sets `VITE_IS_DESKTOP=true` for Electron packaging

---

## Desktop App (`electron/`)

### Overview
The Electron app packages the full stack into a standalone Windows installer. It bundles:
- The compiled React frontend (served via `file://`)
- The Node.js/Express backend (started as a child process on port 5000)
- A MongoDB 6.0 binary (started on port 27017)

This gives users a fully offline-capable application with no server dependency.

### Key Features
- **Auto-updater** via `electron-updater` pulling from GitHub releases
- **Machine-tied encryption** — AES key derived from hostname and app data path
- **electron-store** — Persists settings and license data locally
- **IPC bridge** (`preload.js`) — Exposes `window.electronAPI.syncNow()` to the renderer
- **Cloud sync engine** (`sync/`) — HTTP-based sync to push local data to the cloud
- **Tray icon** with quick-access menu
- **NSIS installer** — Custom setup screen, desktop shortcut, vc_redist bundled

### `main.js` Responsibilities
1. Launch MongoDB daemon
2. Start Express backend
3. Create BrowserWindow and load frontend
4. Register IPC handlers for sync and database control
5. Manage app lifecycle (minimize to tray, auto-start, update checks)

---

## Core Feature Modules

### Student & Admission Management
Complete lifecycle from enquiry to enrollment. Tracks enquiry source, follow-up status, conversion, batch assignment, and academic progress.

### Lead / CRM
Pipeline management with stages, follow-up scheduling, and funnel reports to track conversion rates across lead sources.

### Academic Management
Course and batch setup, examination scheduling, attendance tracking (with bulk mark and report export), and education level configuration.

### Finance
Fee structures per course/batch, payment recording with multiple payment modes, receipt generation (PDF), trial balance, and profit & loss reports.

### WhatsApp Automation
- **Baileys** integration: scan QR to connect a WhatsApp number, send bulk messages to leads/students, use message templates
- **Meta Cloud API**: official WhatsApp Business API for OTP delivery and transactional notifications

### ID Card & Document Designer
Fabric.js canvas editor with drag-and-drop fields, image uploads, and batch print support for ID cards and certificates.

### Bulk Import
CSV and Excel import with column mapping and validation for students, leads, admissions, attendance, and transactions.

### Dashboard & Analytics
Charts and KPI cards for student counts, admission funnels, revenue, attendance rates, and lead conversion — all scoped to date ranges.

---

## Multi-Tenancy

Every institute is isolated by `institute_uuid` embedded in its JWT. All database queries and API responses are filtered through this UUID, ensuring complete data separation between institutes on the same deployment.

---

## White-Label & Branding

The `BrandingContext` allows each institute to configure:
- Primary and secondary colors
- Custom logo
- Font family
- Custom domain (via CORS whitelist configuration)

---

## Environment Configuration

| File | Used For |
|---|---|
| `SocialFront/.env.development` | Local development |
| `SocialFront/.env.production` | Web deployment (Render/Vercel) |
| `SocialFront/.env.desktop` | Electron build |
| `SocialBackend/.env` | Backend secrets (JWT, Cloudinary, Razorpay, Meta API) |

---

## Deployment

| Target | Platform |
|---|---|
| Web frontend | Vercel |
| Backend API | Render |
| Desktop app | GitHub Releases (NSIS installer, Windows x64) |
| Database | MongoDB Atlas (cloud) / bundled MongoDB (desktop) |

CI/CD is handled via GitHub Actions, which automatically builds the Windows desktop installer and publishes it as a GitHub release when a version tag is pushed.

---

## Version History (Recent)

| Version | Changes |
|---|---|
| v1.1.5 | Performance: eliminated redundant API calls, parallel dashboard fetches |
| v1.1.4 | Instant loading screen, reduced installer size |
| v1.1.3 | Fixed blank white screen in desktop app |
| v1.1.2 | Desktop version bump |
| v1.1.1 | License control system (Phase 1) |
| v1.1.0 | HTTP-based cloud sync for desktop (Phase 2) |
| v1.0.x | Full UI/UX refactor: migrated 25 pages from Tailwind to MUI, responsive grid layouts, breadcrumbs |

---

## Repository

- **GitHub:** https://github.com/mesanjusk/Instify
- **License:** ISC
- **Node.js Requirement:** v20+ (required by Baileys)
- **Author:** Instify
