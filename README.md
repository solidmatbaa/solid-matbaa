# Solid Matbaa — Premium Printing Services Website

A modern, multilingual (Arabic/English/Turkish) printing services website built with **Next.js 15**, **React 19**, **Tailwind CSS 4**, and **Supabase**.

## Features

- **4 Main Pages**: Home, Our Designs, Custom Printing, About Us
- **Responsive Navigation** with mobile menu and language switcher (AR/EN/TR)
- **Hero Section** with editable Arabic-first content and CTA buttons
- **Custom Printing Form** — PDF upload + quantity → quote request
- **Full Auth** — Signup, Login, Email Verification via **Resend API**
- **Admin Dashboard** (username: `solid` only) — Products CRUD, website content, orders
- **Footer** — info@solidmatbaa.com, Instagram & Facebook icons
- **Floating WhatsApp Button** — 00905015554010

## File Structure

```
solid-matbaa/
├── messages/                    # i18n translations (ar, en, tr)
├── public/
│   ├── images/                  # Hero & product images
│   └── uploads/custom/          # Uploaded PDF files
├── supabase/migrations/
│   ├── 001_initial_schema.sql   # Core DB schema
│   └── 002_auth_content.sql     # Auth, site content fields
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx           # Home
│   │   │   ├── designs/page.tsx   # Our Designs
│   │   │   ├── custom-printing/   # Custom Printing form
│   │   │   ├── about/page.tsx     # About Us
│   │   │   ├── admin/page.tsx     # Admin dashboard
│   │   │   └── auth/              # Login & Register
│   │   └── api/
│   │       ├── auth/              # Register, verify, resend
│   │       ├── custom-printing/   # PDF quote submission
│   │       ├── products/          # Product CRUD
│   │       └── admin/orders/      # Order management
│   ├── components/
│   │   ├── admin/ProductManager.tsx
│   │   ├── custom-printing/CustomPrintingForm.tsx
│   │   └── layout/                # Header, Footer, WhatsApp
│   └── lib/
│       ├── auth.ts                # Admin check (username: solid)
│       └── resend.ts              # Email verification
├── .env.example
└── package.json
```

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in Supabase credentials and Resend API key.

3. **Run Supabase migrations**
   Execute `001_initial_schema.sql` and `002_auth_content.sql` in the Supabase SQL Editor.

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000/ar](http://localhost:3000/ar)

## Admin Access

Register with username **`solid`** to receive admin privileges. Only this username can access `/admin`.

## Tech Stack

- Next.js 15 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Supabase (Auth + PostgreSQL)
- Resend (Email Verification)
- next-intl (i18n)
