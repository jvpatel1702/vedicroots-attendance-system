# Developer Guide - VedicRoots Attendance System

Welcome to the development documentation for the VedicRoots Attendance System. This guide is designed to help improved understanding of the codebase key components, and development workflows.

## 1. Project Overview

The **VedicRoots Attendance System** is a web application designed to manage student attendance across various classrooms and grades. It features distinct roles for **Admins** and **Teachers**, allowing for efficient class management and attendance tracking.

### Key Features
- **Role-Based Access Control (RBAC)**: Distinct portals for Admins and Teachers.
- **Attendance Tracking**: Teachers can mark attendance (Present, Absent, Late) for their assigned classes.
- **Classroom Management**: Organization of students into Classrooms and Grades.
- **Smart Attendance Rules**:
    - **Swipe Actions**: Swipe Right (Present/Late) / Swipe Left (Absent/Late).
    - **Time-Based Cutoffs**: Automatically restricts marking to "Late" after the drop-off window (9:15 AM for KG, 9:00 AM for Elementary).
    - **Vacation Handling**: Students on vacation are automatically hidden from daily lists.

## 2. Technology Stack

This project is built using a modern React-based stack:

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: Functional React components
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Date Handling**: [date-fns](https://date-fns.org/)

## 3. Folder Structure

The project follows the standard Next.js App Router structure within the `src` directory.

```text
vedicroots-attendance-system/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── admin/           # Admin-specific routes and dashboards
│   │   ├── teacher/         # Teacher-specific routes (class views, attendance)
│   │   ├── login/           # Authentication page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page / Redirect logic
│   ├── lib/                 # Shared utilities and configuration
│   │   └── supabase/        # Supabase client instantiation (likely here)
│   │   └── attendanceTime.ts # Time-based business logic
│   │   └── classroomUtils.ts # Classroom helper functions
│   └── components/          # Reusable UI components
├── supabase/                # Supabase specific files
│   ├── seed.sql             # Database seed data (UPDATED 2026)
│   └── migrations/          # SQL migrations
├── public/                  # Static assets (images, icons)
├── database_design.md       # Detailed database schema documentation
└── package.json             # Project dependencies and scripts
```

## 4. Key Directories & Modules

### `src/app`
This is the core of the application routing.
-   **`admin/`**: Contains pages restricted to users with the `ADMIN` role.
-   **`teacher/`**: Contains pages for `TEACHER` users, such as classroom lists and attendance forms.
-   **`login/`**: Handles user sign-in using Supabase Auth.

### `database_design.md`
For a deep dive into the data model (Relationships, Tables like `profiles`, `attendance`, `classrooms`), please refer to the [Database Design Document](./database_design.md).

## 5. Getting Started

### Prerequisites
-   Node.js (v18 or higher recommended)
-   npm or yarn
-   A local or remote Supabase instance

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd vedicroots-attendance-system
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env.local` file in the root directory with your Supabase credentials:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup (Important)**:
    -   Run the migration file: `supabase/migrations/20250601000000_update_schema.sql` to create new tables and update columns.
    -   Run the seed file: `supabase/seed.sql` to populate the specific 2025-2026 classroom structure (KG 1, KG 2, Lower/Upper Elementary).

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## 6. Development Guidelines

*   **Type Safety**: Always define interfaces or types for props and data objects. Avoid using `any`.
*   **Server vs Client Components**: 
    -   Use Server Components (default in Next.js 15) for data fetching.
    -   Use Client Components (`'use client'`) only when interactivity (hooks, event listeners) is needed.
*   **Styling**: Use utility classes from Tailwind CSS. Avoid writing custom CSS files unless necessary for global styles.

## 7. Common Workflows

### Adding a New Page
1.  Determine the role access needed (Admin or Teacher).
2.  Create a folder in `src/app/admin` or `src/app/teacher`.
3.  Add a `page.tsx` file.
4.  Implement the UI and data fetching.

### Modifying the Database
1.  Update the SQL definitions in Supabase.
2.  Update `database_design.md` to reflect the changes.
3.  If using TypeScript types for Supabase, assume they need to be regenerated or updated manually if not automated.

---
*Maintained by the creating agent and development team.*
