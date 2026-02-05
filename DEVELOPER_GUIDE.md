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

## 5. Architecture & Data Model (UPDATED)

### Core Refactor: Persons Table
We have introduced a unified `persons` table to handle identity management across Students, Guardians, and Staff.
-   **`persons`**: Stores shared fields (`first_name`, `last_name`, `dob`, `photo_url`, `contact_info`).
-   **`students`**: Links to `persons` and stores student-specific data (`student_number`, `medical_info`).
-   **`guardians`**: Links to `persons` and stores guardian-specific data.
-   **`enrollments`**: Links `students` to `classrooms` and `grades` for a specific `academic_year`.

### Key Workflows
#### Student Enrollment (Wizard)
-   Located at `src/components/admin/StudentForm.tsx`.
-   A 4-step wizard process:
    1.  **Person Info**: Creates/Selects the core person record.
    2.  **Student Details**: Captures medical/academic info.
    3.  **Guardians**: Links multiple guardians to the student.
    4.  **Enrollment**: Assigns the student to a classroom/grade.
-   **Data Flow**: The form performs a transactional write sequence (Person -> Student -> Guardians -> Links -> Enrollment).

## 6. Getting Started

### Prerequisites
-   Node.js (v18+)
-   Docker Desktop (Required for local Supabase)
-   Supabase CLI (`npm install -g supabase`)

### Local Setup
1.  **Clone & Install**:
    ```bash
    git clone <repo>
    npm install
    ```
2.  **Start Local Database**:
    Make sure Docker is running, then:
    ```bash
    npx supabase start
    ```
3.  **Apply Schema & Seed Data**:
    If you need to reset the database to a clean state with test data:
    ```bash
    npx supabase db reset
    ```
4.  **Run App**:
    ```bash
    npm run dev
    ```

## 7. Folder Structure
-   `src/app`: App Router pages.
-   `src/components/admin`: Admin-specific components (StudentForm, VacationModal).
-   `supabase/migrations`: SQL history.
-   `supabase/seed.sql`: Test data generation.

## 8. Development Guidelines
-   **Strict Types**: We are moving towards strict TypeScript. Ensure `Student` interfaces matches the database joins (see `src/app/admin/students/page.tsx`).
-   **Supabase Client**: Use `createClient()` from `@/lib/supabaseClient` for client-side operations.
-   **UI Library**: Tailwind CSS + Shadcn UI (in `src/components/ui`).

