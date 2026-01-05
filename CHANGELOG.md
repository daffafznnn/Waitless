# Changelog - Waitless Queue Management System

Semua perubahan penting pada proyek ini didokumentasikan dalam file ini.  
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan proyek ini menggunakan [Semantic Versioning](https://semver.org/).

---

## [0.1.0-beta] - 2026-01-05

> **🎉 Initial Beta Release**  
> Rilis awal aplikasi Waitless - Sistem Manajemen Antrean Modern berbasis web.

### ✨ Added (Fitur Baru)

#### 🔐 Authentication & Authorization

- **Multi-role Authentication System**
  - Support untuk 3 role: `VISITOR`, `ADMIN`, dan `OWNER`
  - JWT-based authentication dengan token expiry management
  - Password hashing menggunakan bcrypt dengan salt rounds 12
- **Google OAuth 2.0 Integration**
  - Login menggunakan akun Google untuk kemudahan akses
  - Auto-create user baru saat pertama kali login via Google
  - Migrasi database `20241224000001-add-google-oauth-to-users.js`
- **Role-based Middleware**
  - `auth.ts` middleware untuk proteksi route
  - `admin.ts` middleware untuk validasi akses admin
  - `owner.ts` middleware untuk validasi akses owner
  - `guest.ts` middleware untuk redirect user yang sudah login

#### 👥 User Management

- **User Model** (`user.model.ts`)
  - Fields: id, email, password_hash, name, phone, role, google_id, avatar_url
  - Unique constraint pada email dan google_id
  - Timestamps (created_at, updated_at)
- **AuthService** (`AuthService.ts`)
  - Login/Register dengan validasi Zod schema
  - Password strength validation
  - Token refresh mechanism
- **GoogleOAuthService** (`GoogleOAuthService.ts`)
  - OAuth callback handling
  - Token exchange dengan Google API
  - User profile fetching

#### 🏢 Location & Branch Management

- **Service Location Model** (`service_location.model.ts`)
  - Multi-branch support untuk satu Owner
  - Fields: name, address, city, lat, lng, is_active
  - Foreign key ke owner (user_id)
- **Location Member Model** (`location_member.model.ts`)
  - Assigning staff ke branch tertentu
  - Role-based access per location
- **OwnerService** (`OwnerService.ts` - 25KB)
  - CRUD operations untuk locations
  - Staff invitation & management
  - Analytics per branch
  - Report generation

#### 🎫 Queue Management System

- **Ticket Model** (`ticket.model.ts`)
  - Status workflow: `WAITING` → `CALLING` → `SERVING` → `DONE`
  - Additional status: `HOLD`, `CANCELLED`
  - Auto-generated queue number dengan prefix (A0001, B0001, dst)
  - Sequence tracking per counter per tanggal
- **Counter Model** (`counter.model.ts`)
  - Multiple counters per location
  - Configurable: prefix, capacity_per_day, open_time, close_time
  - Active/inactive toggle
- **QueueService** (`QueueService.ts` - 13KB)
  - Issue ticket dengan duplicate check (1 user = 1 active ticket per counter)
  - Call next, recall, hold, resume, done actions
  - Estimated wait time calculation
  - Position tracking dalam antrean
- **Ticket Event Model** (`ticket_event.model.ts`)
  - Audit trail untuk setiap perubahan status
  - Tracking actor (siapa yang melakukan aksi)
  - Notes/reason untuk hold

#### 📊 Analytics & Reporting

- **Daily Summary Model** (`daily_summary.model.ts`)
  - Agregasi statistik harian per location
  - Metrics: total_issued, total_done, total_hold, total_cancel, avg_service_seconds
- **Owner Dashboard Analytics**
  - Real-time statistics dari tickets table
  - Multi-location overview
  - Completion rate calculation
  - Top performing branches
- **Admin Dashboard**
  - Counter-specific stats
  - Queue status per counter
  - Recent tickets display

#### 🎨 Frontend - Visitor Experience

- **VisitorHeader Component** - Header dengan user info dan navigation
- **BottomNavigation Component** - Mobile-first bottom navigation bar
- **LocationCard Component** - Card display untuk outlet/branch
- **LocationSelector Component** - Fixed location selector (readonly mode)
- **SearchBar Component** - Search dengan filter functionality
- **CategoryTabs Component** - Category filtering tabs
- **TicketCard Component** - Display nomor antrean dengan status
- **StatusBadge Component** - Badge untuk status tiket
- **CounterCard Component** - Counter selection card

#### 🖥️ Frontend - Admin Panel

- **Admin Sidebar** - Navigation sidebar dengan role display
- **Admin Header** - Header dengan search, notifications, profile
- **StatsCard Component** - Statistics card dengan icon dan value
- **DataTable Component** - Reusable data table dengan sorting
- **CounterFormModal** - Modal untuk add/edit counter
- **QuickActionCard** - Quick action buttons

#### 🏠 Frontend - Owner Dashboard

- **Chart.js Integration** - Bar dan Doughnut charts untuk analytics
- **vue-chartjs** - Vue wrapper untuk Chart.js
- **Branch management UI** - CRUD interface untuk cabang
- **Staff management UI** - Invite dan manage staff
- **Reports page** - Detailed reports dengan date range

#### 📱 Pages & Routing

**Public Pages:**

- `/` - Homepage dengan location listing
- `/welcome` - Welcome/landing page
- `/login` - Unified login & register page
- `/queue/:id` - Queue page per location
- `/queue/me` - My tickets monitoring
- `/profile` - User profile settings

**Admin Pages:**

- `/admin/login` - Admin login portal
- `/admin/dashboard` - Operational dashboard
- `/admin/queue` - Queue control panel
- `/admin/settings` - Counter settings
- `/admin/reports` - Daily reports
- `/admin/profile` - Admin profile

**Owner Pages:**

- `/owner/login` - Owner login portal
- `/owner/dashboard` - Analytics dashboard
- `/owner/branches` - Branch management
- `/owner/staff` - Staff management
- `/owner/reports` - Business reports
- `/owner/profile` - Owner profile

#### 🔧 Backend Architecture

- **Express.js Server** dengan TypeScript
- **Sequelize ORM** dengan MySQL2 driver
- **Repository Pattern**
  - `UserRepository`, `TicketRepository`, `LocationRepository`
  - `CounterRepository`, `SummaryRepository`, `LocationMemberRepository`
- **Service Layer Pattern**
  - `BaseService` untuk common functionality
  - Domain-specific services
- **Controller Layer** - Request handling dengan validation
- **Custom Error Classes** - `NotFoundError`, `ConflictError`, `ForbiddenError`, `BusinessLogicError`
- **Job Scheduler**
  - Daily summary job untuk agregasi statistik
  - Weekly cleanup job
  - Queue worker dengan background processing

#### 🗄️ Database Migrations

1. `20241211000001-create-users.js` - Users table
2. `20241211000002-create-service-locations.js` - Locations table
3. `20241211000003-create-location-members.js` - Location members table
4. `20241211000004-create-counters.js` - Counters table
5. `20241211000005-create-tickets.js` - Tickets table
6. `20241211000006-create-ticket-events.js` - Ticket events table
7. `20241211000007-create-daily-summaries.js` - Daily summaries table
8. `20241224000001-add-google-oauth-to-users.js` - Google OAuth support

#### 🎨 UI/UX Features

- **Tailwind CSS** dengan custom design system
- **Dark mode ready** color palette
- **Responsive design** - Mobile-first approach
- **Toast notifications** via vue-toastification
- **Modal system** - Custom modal plugin dengan alert, confirm, prompt
- **Loading states** - Skeleton dan spinner components
- **Form validation** - Real-time validation dengan Zod

#### ⚙️ Composables (Frontend Logic)

- `useAuth` - Authentication state management
- `useAuthApi` - Auth API calls
- `useApi` - Base API wrapper dengan error handling
- `useAdminApi` - Admin-specific API calls
- `useOwnerApi` - Owner-specific API calls
- `useQueueApi` - Queue operations API
- `useVisitorApi` - Visitor/public API calls
- `useLocationApi` - Location API calls
- `useBusiness` - Business logic helpers
- `useErrorHandler` - Centralized error handling
- `useLoadingState` - Loading state management
- `useToast` - Toast notification wrapper
- `useValidation` - Form validation helpers
- `useSystemApi` - System status API

#### 📦 State Management (Pinia Stores)

- `auth.ts` - Authentication state
- `admin.ts` - Admin dashboard state
- `queue.ts` - Queue operations state
- `location.ts` - Location selection state
- `business.ts` - Business data state
- `system.ts` - System status state

### 🚀 Deployment

- **Vercel Serverless** deployment configuration
- **Nitro Server Engine** integration untuk monolith architecture
- **API proxy** dalam development mode
- **Environment variables** management
- **MySQL production database** support

### 🔒 Security

- **bcrypt** password hashing
- **JWT** token-based authentication
- **CORS** configuration
- **Input validation** dengan Zod schemas
- **SQL injection protection** via Sequelize parameterized queries
- **XSS protection** via Vue's built-in escaping

---

## Technical Stack

| Category           | Technology                         |
| ------------------ | ---------------------------------- |
| Frontend Framework | Nuxt 3 (Vue 3 + TypeScript)        |
| Backend Framework  | Express.js                         |
| Database ORM       | Sequelize v6                       |
| Database           | MySQL2 (Production) / SQLite (Dev) |
| State Management   | Pinia                              |
| UI Framework       | Tailwind CSS v3                    |
| Charts             | Chart.js + vue-chartjs             |
| Validation         | Zod                                |
| Authentication     | JWT + Google OAuth 2.0             |
| Deployment         | Vercel Serverless                  |

---

## Contributors

- **Muhammad Daffa Fauzan** (24552011140) - Fullstack Developer & DevOps
- **Harfin Taufiq** (24552011171) - Backend Developer
- **Salman Sopandi** (24552011383) - Frontend Developer
- **Hifzhan Manna Maula** (25552012002) - UI/UX Designer & QA

---

**Teknik Informatika - Universitas Teknologi Bandung**  
_Tugas Kelompok 5 - Rekayasa Perangkat Lunak (Semester 3)_
