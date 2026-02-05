# Product Requirements Documentation (PRD)

## **1\. Executive Summary**

Product: Multi-Location Educational Management System

Organization: Vedic Roots

Target Implementation: September 2026 School Year

Primary Users: Admin Staff, Teachers (Year 1); Parents (Year 2\)

Current State: Paper-based \+ Google Sheets

Future State: Unified web application with accurate invoicing, attendance tracking, and centralized student data

---

## **2\. Problem Statement**

### **Current Pain Points**

| Pain Point | Impact | Current Workaround |
| :---- | :---- | :---- |
| Scattered Data | Information retrieval takes 15-30 minutes | Searching through multiple Google Sheets |
| Missing Data | Processes get stuck (registration, billing, reporting) | Manual follow-ups, delayed decisions |
| Inconsistent Records | Student information varies by location | Verbal confirmation, duplicate entry |
| Manual Invoice Creation | Error-prone, time-consuming | Manual calculation in QuickBooks |
| No Historical Tracking | Can't see student progression across years | Paper files in storage |
| Limited Access Control | All staff see all data | Trust-based system |
| Payroll Processing | Time-consuming, inaccuracy due to manual tracking | Memory or trust-based entries |

### **Success Metrics**

* Data Retrieval Time: From 15-30 minutes → \< 30 seconds  
* Invoice Accuracy: 95%+ accuracy (validated against QuickBooks)  
* Data Completeness: 100% of required fields for active students  
* Staff Adoption: 80%+ daily active usage within 3 months

---

## **3\. User Personas**

### **Primary Personas (Year 1\)**

#### **Persona 1: Office Administrator**

* Role: System coordinator, data entry, invoice generation  
* Tech Comfort: High (Google Sheets power user)  
* Goals:  
  * Accurate invoice creation for QuickBooks  
  * Centralized student information  
  * Cross-location visibility  
* Pain Points: Data scattered, manual calculations, inconsistent formats  
* Device: Laptop (primary), Phone (on-the-go)

Key Workflows:

1. Enroll new student with complete family info  
2. Generate monthly invoices with extended care adjustments  
3. Track staff certifications and expiry dates  
4. Run enrollment reports for director

#### **Persona 2: Location Administrator (Future hire/Supervisor)**

* Role: Manages specific location operations  
* Tech Comfort: Medium  
* Goals:  
  * Daily attendance overview  
  * Classroom roster management  
  * Staff scheduling  
* Pain Points: Can't see real-time classroom status  
* Device: Laptop, occasional phone

Key Workflows:

1. View daily attendance by classroom  
2. Check enrollment numbers vs. capacity  
3. Monitor staff-to-child ratios  
4. Review student allergy/medical alerts

#### **Persona 3: Teacher**

* Role: Classroom instruction, daily attendance  
* Tech Comfort: Medium (uses phone apps regularly)  
* Goals:  
  * Quick attendance marking  
  * Access to student emergency info  
  * View classroom roster  
* Pain Points: No mobile access to student data  
* Device: Phone (primary), Laptop (planning)

Key Workflows:

1. Mark daily attendance (present/absent/late)  
2. View student medical alerts  
3. Access guardian contact info for emergencies  
4. View classroom roster with photos

#### **Persona 4: Director (Decision Maker)**

* Role: Strategic oversight, Ministry reporting  
* Tech Comfort: Low-Medium (views reports, doesn't enter data)  
* Goals:  
  * High-level enrollment statistics  
  * Compliance reporting  
  * Financial summaries  
* Pain Points: No real-time visibility into operations  
* Device: Laptop

Key Workflows:

1. View dashboard with enrollment trends  
2. Export data for Ministry reporting  
3. Review outstanding invoices summary  
4. Monitor location capacity utilization

---

### **Secondary Personas (Year 2\)**

#### **Persona 5: Parent/Guardian**

* Role: View child's info, receive announcements  
* Tech Comfort: High (smartphone native)  
* Goals:  
  * See child's attendance  
  * View invoices  
  * Receive school announcements  
* Pain Points: Currently phone calls for simple info  
* Device: Phone (primary)

Key Workflows (Future):

1. View child's daily attendance  
2. See outstanding invoices  
3. Read school announcements  
4. Update contact information

---

## **4\. Functional Requirements**

### **Module 1: Core Infrastructure**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| CORE-001 | Manage multiple organizations (Daycare, School) | P0 | Can create/edit organizations with unique branding |
| CORE-002 | Manage multiple locations per organization | P0 | Each location has address, contact, capacity settings |
| CORE-003 | School year management with date ranges | P0 | Can define academic years, set current year |
| CORE-004 | Calendar events (holidays, PD days) | P1 | Events display on dashboards, affect attendance marking |
| CORE-005 | Organization-specific branding | P2 | Logo, colors per organization |

### **Module 2: People Management**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| PPL-001 | Unified person record (student/staff/guardian) | P0 | One person can have multiple roles over time |
| PPL-002 | Student enrollment with historical tracking | P0 | Never update enrollments, only create new records |
| PPL-003 | Medical info tracking (allergies, conditions) | P0 | Visible alerts on classroom roster |
| PPL-004 | Multi-guardian support with relationships | P0 | Track primary, pickup authorization, billing responsibility |
| PPL-005 | Staff certification tracking with expiry alerts | P0 | 90-day warning for expiring certs |
| PPL-006 | Student photo upload | P1 | Teachers can recognize students |
| PPL-007 | Guardian contact management | P0 | Phone, email, emergency priority |

### **Module 3: Academic Structure**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| ACAD-001 | Program management (Toddler, Preschool, K-7) | P0 | Each program has age ranges, descriptions |
| ACAD-002 | Grade levels with ordering | P0 | JK → SK → Grade 1, etc. |
| ACAD-003 | Classroom management | P0 | Max capacity, room number, multi-grade support |
| ACAD-004 | Staff classroom assignments | P0 | Primary teacher, assistant teacher roles |
| ACAD-005 | Student classroom enrollment | P0 | Links student to classroom for current year |

### **Module 4: Attendance**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| ATTN-001 | Daily attendance marking (Present/Absent/Late) | P0 | Mobile-optimized interface |
| ATTN-002 | Bulk attendance marking | P1 | Mark all present, then adjust exceptions |
| ATTN-003 | Pre-scheduled vacation tracking | P1 | Auto-mark as vacation, no manual entry needed |
| ATTN-004 | Late arrival tracking with time | P1 | Record arrival time for late students |
| ATTN-005 | Attendance reports by classroom | P0 | Monthly summary for admin |

### **Module 5: Financial Management**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| FIN-001 | Fee structure management by program | P0 | Tuition, registration, extended care rates |
| FIN-002 | Monthly invoice generation | P0 | One-click generate for all active enrollments |
| FIN-003 | Extended care with time-based billing | P0 | 30-min increments, before/after care |
| FIN-004 | Extended care adjustments for activities | P1 | Chess club deduction from extended care |
| FIN-005 | Scholarship/discount application | P1 | Percentage or fixed amount, applied to invoices |
| FIN-006 | Invoice export for QuickBooks | P0 | CSV format with all line items |
| FIN-007 | Payment recording (not processing) | P0 | Record cash/cheque/Pre-Authorized Debit |
| FIN-008 | Outstanding balance tracking | P0 | Real-time balance per guardian |

### **Module 6: Extended Care & Activities**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| ACT-001 | Extended care enrollment | P0 | Start/end dates, duration, monthly fee |
| ACT-002 | Activity program management | P2 | Chess club, flute lessons, etc. |
| ACT-003 | Field trip management | P3 | Permissions, participant tracking |

### **Module 7: Staff Management**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| STF-001 | Staff work time logging | P1 | Clock in/out by location, work type |
| STF-002 | Cross-location work tracking | P1 | Track hours at different locations for payroll |
| STF-003 | Certification expiry dashboard | P1 | Visual alert for expiring certs |
| STF-004 | Staff-to-child ratio monitoring | P2 | Real-time ratio calculation |

### **Module 8: Communication (Future/Phase 2\)**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| COMM-001 | Broadcast announcements by organization | P2 | Rich text, priority levels |
| COMM-002 | Announcement targeting (org/location/classroom) | P3 | Granular audience selection |
| COMM-003 | Email notifications via SendGrid | P2 | Welcome emails, announcement alerts |

### **Module 9: Reporting & Analytics**

| ID | Requirement | Priority | Acceptance Criteria |
| :---- | :---- | :---- | :---- |
| RPT-001 | Enrollment summary by location/program | P0 | Real-time counts, capacity utilization |
| RPT-002 | Attendance summary by month/classroom | P1 | Exportable to Google Sheets |
| RPT-003 | Outstanding invoices report | P0 | Filter by location, guardian |
| RPT-004 | Staff certification report | P1 | Expiry dates, status |
| RPT-005 | Revenue summary (for Google Sheets export) | P1 | Monthly billing totals |

---

## **5\. Non-Functional Requirements**

### **Performance**

| Requirement | Target | Measurement |
| :---- | :---- | :---- |
| Page load time | \< 2 seconds | Lighthouse performance score |
| Database query time | \< 200ms | 95th percentile |
| Invoice generation (50 students) | \< 10 seconds | Edge function execution time |
| Concurrent users | 20+ | Load testing |
| Mobile responsiveness | Works on 375px width | iPhone SE testing |

### **Security**

| Requirement | Implementation |
| :---- | :---- |
| Data encryption at rest | Supabase default (AES-256) |
| Data encryption in transit | TLS 1.3 |
| Row-level security | All tables have RLS policies |
| Role-based access | SUPER\_ADMIN, ORG\_ADMIN, LOCATION\_ADMIN, TEACHER |
| Audit logging | Track all data modifications with timestamps |
| Password policy | Min 8 chars, complexity requirements |

### **Reliability**

| Requirement | Target |
| :---- | :---- |
| Uptime | 99.9% (Supabase SLA) |
| Data backup | Daily automated, point-in-time recovery |
| Error tracking | Sentry integration |

### **Usability**

| Requirement | Implementation |
| :---- | :---- |
| Mobile-first design | Responsive, touch-optimized |
| Accessibility | WCAG 2.1 AA compliance |
| Browser support | Chrome, Safari, Firefox, Edge (last 2 versions) |
| Offline indication | Clear messaging when connection lost |

---

## **6\. Data Migration Requirements**

### **Scope**

| Data Type | Source | Volume | Priority |
| :---- | :---- | :---- | :---- |
| Current students | Google Sheets | \~150 | P0 |
| Student history | Google Sheets | \~300 | P1 |
| Guardian contacts | Google Sheets | \~400 | P0 |
| Staff records | Google Sheets | \~30 | P0 |
| Fee structures | Paper/QuickBooks | \~10 | P0 |
| Financial history | QuickBooks | N/A | Out of scope |

### **Migration Process**

1. Data Cleansing (Week \-4)  
   * Standardize formats in Google Sheets  
   * Resolve duplicates  
   * Fill missing required fields  
2. Scripted Import (Week \-2)  
   * Python script using Supabase API  
   * Validation checks  
   * Error reporting  
3. Verification (Week \-1)  
   * Spot-check records  
   * Validate relationships  
   * User acceptance testing

---

## **7\. Out of Scope (Phase 2+)**

| Feature | Reason | Future Timeline |
| :---- | :---- | :---- |
| Parent portal | Focus on internal operations first | Year 2 (2027) |
| Online payment processing | Pre-authorized debit works for now | Summer 2027 (camps) |
| PDF report card generation | View-online sufficient initially | 2027 |
| Two-way messaging | Broadcast announcements sufficient | TBD |
| Mobile native app | Web app works cross-platform | TBD |
| QuickBooks integration | Manual CSV export sufficient | TBD |
| SMS notifications | Email sufficient for now | TBD |
| AI/ML features | Not needed at current scale | TBD |

---

# Application Flow & User Journeys

**Application Flow & User Journeys**

Multi-Location Educational Management System

*Design Documentation*

# 

# **1\. Information Architecture**

The system is organized hierarchically with role-based access control determining what users can see and access. The dashboard serves as the central hub, adapting its content based on the user's role.

## **System Architecture Overview**

The application follows a modular structure with the following main sections:

•  	**Dashboard \- Role-based view (Admin sees all, Teacher sees classroom)**

•  	**Students \- Search, enroll, view, and edit student records**

•  	**Staff \- Manage teachers, assistants, and administrative personnel**

•  	**Financial \- Invoices, payments, fee management, outstanding balances**

•  	**Academic \- Attendance, grades, report cards, curriculum**

•  	**Reports \- Analytics, enrollment statistics, financial reports**

## **Navigation Structure**

The navigation adapts based on user role:

•  	Admin: Full access to all sections across all locations and organizations

•  	Teacher: Limited to assigned classroom(s) and student information

•  	Parent: Access to their children's information across all locations

 

# **2\. User Flow Diagrams**

## **Flow 1: New Student Enrollment (Admin)**

This workflow guides administrators through enrolling a new student in the system, from initial inquiry to active enrollment with financial setup.

### **Step 1: Check for Existing Person Record**

Before creating a new person record, search the database by name, phone, or email to prevent duplicates. If found, link to the existing record; if not found, create a new person record.

### **Step 2: Create Student Record**

Generate a unique student number (auto-generated) and capture essential information:

•  	Student number (auto-generated)

•  	Allergies and medical information

•  	Special needs or notes

### **Step 3: Add Guardians**

For each guardian (minimum one required), complete the following:

•  	Search for existing person or create new

•  	Define relationship type (Mother, Father, Guardian, Grandparent, Other)

•  	Set permissions: Primary contact, Pickup authorized, Billing responsible, Emergency contact priority

### **Step 4: Create Enrollment**

Configure the enrollment details:

•  	Select organization (Daycare or School)

•  	Select location

•  	Select school year (defaults to current)

•  	Select program (Toddler, Preschool, K-7)

•  	Select grade level

•  	Assign to classroom

•  	Set enrollment date

•  	Calculate pro-rated first month (if applicable)

### **Step 5: Set Up Financials**

Configure billing and fees:

•  	Select fee structure (tuition amount based on program)

•  	Add extended care if needed (before/after school or both)

•  	Apply scholarships or discounts

•  	Calculate and generate first invoice

### **Step 6: Review & Confirm**

Display a comprehensive summary for review:

•  	Student information and guardian details

•  	Enrollment details (location, program, classroom)

•  	Monthly fees breakdown

### **Completion**

Upon confirmation:

•  	Student becomes active in the system

•  	Added to classroom roster

•  	First invoice generated in draft status

•  	Optional: Generate welcome letter

 

## **Flow 2: Daily Attendance (Teacher)**

Teachers use this streamlined workflow to mark daily attendance for their assigned classroom(s). The system is optimized for both desktop and mobile use.

### **Dashboard View**

Upon login, teachers see their assigned classroom(s) with attendance status:

•  	Classroom name and student count

•  	Last attendance marked timestamp

•  	Current status (Marked or Not Marked)

### **Classroom Selection**

If the teacher has:

•  	Single classroom: Roster loads automatically

•  	Multiple classrooms: Dropdown selector to choose classroom

### **Attendance Screen Features**

The attendance interface includes:

**Quick Actions:**

•  	Mark All Present button

•  	Mark All Absent button

**Student List with:**

•  	Student name

•  	Status buttons: Present, Absent, Late, Vacation

•  	Arrival time picker (for Late status)

•  	Visual indicators: Allergy alerts, pre-scheduled vacation

### **Marking Process**

For each student:

1\.	Tap or click the appropriate status button

2\.	If marking Late, time picker appears (defaults to current time)

3\.	Vacation status only available if pre-scheduled by office

4\.	Allergy alerts display as visual warning but don't block action

### **Confirmation & Saving**

Before saving, display summary:

•  	Count of Present, Absent, Late students

•  	Number of unmarked students (must be zero to save)

Upon saving:

•  	Record timestamp of when attendance was marked

•  	Record teacher ID who marked attendance

•  	Update dashboard status to show completion

•  	Make attendance visible to admin in real-time

•  	Trigger staff-to-child ratio compliance check

 

## **Flow 3: Monthly Invoice Generation (Admin)**

This automated workflow generates monthly invoices for all active students, typically run on the first of each month.

### **Step 1: Select Billing Parameters**

Configure the billing run:

•  	Billing period (e.g., February 2026\)

•  	Organization filter: Daycare, School, or Both

•  	Location filter: All locations or specific location

•  	Preview mode: Yes (review before creating) or No (generate immediately)

### **Step 2: System Calculation**

The system automatically calculates invoices using an edge function. For each active enrollment:

•  	Base tuition from fee structure

•  	Extended care charges (if enrolled)

•  	Activity and elective fees (if enrolled)

•  	Scholarships and discounts (if applicable)

•  	Pro-rated amounts for mid-month enrollments

A progress indicator displays the calculation status (e.g., 45/120 students processed).

### **Step 3: Review Preview**

If preview mode is enabled, display summary statistics:

•  	Total number of invoices to be generated

•  	Total billing amount

•  	Count of new enrollments with pro-rated amounts

•  	Count of extended care adjustments

Available actions:

•  	View detailed breakdown

•  	Export to CSV for review

•  	Generate invoices (proceed)

•  	Cancel (discard preview)

### **Step 4: Post-Generation Review**

After invoice generation, all invoices are created in DRAFT status. Admin can:

•  	Review individual invoices and make edits if needed

•  	Export all invoices to QuickBooks (CSV format)

•  	Finalize all invoices and notify parents

### **Finalization Options**

**Export to QuickBooks:**

•  	Generate CSV with columns: Invoice \#, Guardian, Student, Line Items, Total

**Finalize & Notify:**

•  	Change invoice status from DRAFT to SENT

•  	Record date sent

•  	Send email notifications to billing-responsible guardians

 

## **Flow 4: Cross-Location Staff Tracking**

This workflow enables staff members to clock in and out at different locations, ensuring accurate payroll allocation and cost tracking across the organization.

### **Scenario**

A staff member whose primary location is Daycare Location 1 is asked to work at School Location 1 for the day.

### **Step 1: Staff Login**

Upon logging in, the dashboard displays:

•  	Primary assignment: 'You're assigned to Daycare Loc 1'

•  	Clock In button prominently displayed

### **Step 2: Clock In at Different Location**

When clicking Clock In, a location selector appears:

•  	Daycare \- Location 1 (Primary) \- marked as their home location

•  	Daycare \- Location 2 \- available option

•  	School \- Location 1 \- selected for this shift

Staff member also selects work type:

•  	Regular shift

•  	Supply/substitute work

•  	Overtime

•  	Volunteer hours

### **Step 3: Active Work Session**

While clocked in, the dashboard shows:

•  	Current status: 'Working at School \- Location 1'

•  	Time since clock-in (e.g., 'since 8:00 AM')

•  	Clock Out button

### **Step 4: Clock Out**

When clocking out, the system:

•  	Records end time

•  	Calculates total hours worked

•  	Logs classroom assignment if applicable

•  	Associates hours with the selected location for cost allocation

### **Benefits**

This workflow ensures:

•  	Accurate payroll reporting with location breakdown

•  	Proper cost allocation for each location

•  	Compliance tracking for staff-to-child ratios at each location

•  	Historical record of staff mobility across locations

 

# **3\. Screen Specifications**

## **Screen 1: Login & Organization Selection**

The login screen provides a clean, professional interface for users to access the system. The screen adapts based on user permissions.

| Element | Description |
| :---- | :---- |
| Logo | Organization logo (if single org) or generic system logo |
| Email | Input field for user email address |
| Password | Input field with visibility toggle (show/hide password) |
| Organization | Dropdown selector (only shown if user has access to multiple organizations) |
| Location | Dropdown selector (only shown if user has access to multiple locations) |
| Remember me | Checkbox option to save login credentials |
| Forgot password | Link to password recovery flow |

**Post-Login Behavior:**

After successful authentication, users are redirected to their role-appropriate dashboard (Admin Dashboard, Teacher Dashboard, or Parent Portal).

 

## **Screen 2: Admin Dashboard**

The Admin Dashboard provides a comprehensive overview of the entire system with real-time statistics, alerts, and quick actions.

### **Layout Structure**

**Header Navigation:**

•  	Organization logo

•  	Main navigation: Dashboard, Students, Staff, Financial, Reports

•  	User greeting with name

•  	Organization selector dropdown

**Left Sidebar \- Quick Stats:**

•  	Total active students count

•  	Outstanding invoices amount

•  	Staff on duty today

•  	Quick action buttons: Add Student, Create Invoice, Mark Attendance

•  	Quick search bar

**Main Content Area:**

*1\. Enrollment Overview*

Grid view showing student counts by organization and location:

•  	Daycare \- Location 1: 45 students

•  	Daycare \- Location 2: 33 students

•  	School \- Location 1: 78 students

•  	Total: 156 students

*2\. Capacity Alerts*

Visual indicators for classrooms approaching capacity:

•  	Warning icon: Daycare Loc 1 at 95% full

•  	Success icon: School Loc 1 at 78% full

*3\. Upcoming Expiries*

Compliance alerts for staff certifications:

•  	First Aid certification: 3 staff members (expires within 30 days)

•  	Police verification: 1 staff member (expires within 90 days)

*4\. Today's Attendance*

Real-time attendance summary:

•  	Daycare Location 1: 42 of 45 students present

•  	School Location 1: 75 of 78 students present

 

## **Screen 3: Student Enrollment Form**

A comprehensive multi-step form with progress indicator to guide administrators through the student enrollment process.

### **Step 1 of 4: Person Information**

•  	**First Name (required)**

•  	**Last Name (required)**

•  	Preferred Name (optional)

•  	**Date of Birth (required, with age calculator)**

•  	Gender (dropdown: Male, Female, Other, Prefer not to say)

•  	Photo upload (optional, accepts JPG/PNG)

### **Step 2 of 4: Student Details**

•  	Student Number (auto-generated, editable)

•  	Allergies (textarea with tag input for common allergies)

•  	Medical Conditions (textarea)

•  	Medications (textarea)

•  	Doctor Name and Phone Number

•  	Special Needs (textarea)

### **Step 3 of 4: Guardians**

Dynamic list interface with 'Add Guardian' button. For each guardian:

•  	Search existing persons or create new guardian

•  	Relationship type: Mother, Father, Guardian, Grandparent, Other

•  	Permission checkboxes:

 	\- Primary Contact

 	\- Pickup Authorized

 	\- Billing Responsible

 	\- Emergency Contact

•  	Emergency Contact Priority (if emergency contact checked)

•  	Custody Notes (optional, if applicable)

### **Step 4 of 4: Enrollment & Financials**

•  	Organization (radio buttons: Daycare or School)

•  	Location (dropdown, filtered by selected organization)

•  	School Year (dropdown, defaults to current year)

•  	Program (dropdown, filtered by organization: Toddler, Preschool, K-7)

•  	Grade Level (dropdown, filtered by program)

•  	Classroom (dropdown, filtered by grade level and location)

•  	Enrollment Date (date picker, defaults to today)

•  	Fee Structure (auto-selected based on program, shows monthly amount)

•  	Extended Care enrollment (optional checkbox with time selection)

•  	Scholarships (optional, allows admin to apply discounts)

 

## **Screen 4: Mobile Attendance View**

Optimized for phone screens (375px width) with touch-friendly buttons and clear visual hierarchy.

### **Header**

•  	Back button (← Attendance)

•  	Current date (e.g., Feb 5, 2026\)

•  	Classroom name (e.g., Classroom A)

### **Quick Actions**

Two prominent buttons:

•  	Mark All Present (green button)

•  	Mark All Absent (gray button)

### **Student List**

Each student entry displays:

**Student Name Row:**

•  	Student name (e.g., John A.)

•  	Visual indicators: Allergy warning (⚠️) if applicable

•  	Status indicator (colored dot): Red \= absent, Green \= present, etc.

**Status Buttons (full width, stacked):**

•  	Present button (green when selected)

•  	Absent button (red when selected)

•  	Late button (yellow when selected, shows time picker)

•  	Vacation button (blue, only if pre-scheduled)

**Special Indicators:**

•  	Allergy alerts display below student name (e.g., 'Nut allergy') with warning icon

•  	Selected time for late arrivals shows inline (e.g., '9:15am')

### **Footer**

Fixed footer with:

•  	Save button (full width, disabled until all students are marked)

•  	Summary count (e.g., '15 of 18 marked')

### **Interaction Design**

•  	Tap any status button to select (buttons are mutually exclusive)

•  	Selected button changes color and shows checkmark

•  	Late button expands to show time picker when selected

•  	Swipe down to refresh if needed

•  	Auto-saves attendance when Save button is tapped

 

*End of Document*

# Tech Stack (Finalized)

## **Final Architecture**

Based on your requirements, here's the optimized stack:

Copy

Frontend: Next.js 14 (App Router) \+ TypeScript  
Styling:  Tailwind CSS \+ shadcn/ui \+ Lucide icons  
State:    React Query (server) \+ Zustand (client)  
Backend:  Supabase (PostgreSQL, Auth, Storage, Edge Functions)  
Email:    SendGrid (transactional)  
Hosting:  Vercel (frontend) \+ Supabase (backend)  
Monitoring: Sentry (errors) \+ Vercel Analytics

---

## **Key Decisions Explained**

### **1\. No Offline Support Required**

Since you confirmed no offline capability needed, we can rely on Supabase Realtime for live updates without complex service workers.

### **2\. QuickBooks Integration: CSV Export Only**

No API integration needed initially. Admin exports CSV from app, imports to QuickBooks. This is actually more reliable for your use case.

### **3\. SendGrid for Email**

Confirmed preference. Used for:

* Welcome emails to new guardians  
* Password reset  
* Announcement notifications (Phase 2\)

### **4\. Separate Organizations, Shared Database**

Your schema supports this perfectly. Use `organization_id` \+ RLS policies for isolation. No data leaks between daycare and school.

### **5\. UUID Primary Keys**

I'm strongly recommending this despite migration effort. Reason: You have 2 organizations that may merge data or transfer students. UUIDs prevent collisions and are future-proof for any external integrations.

---

## **Technology Details**

### **Frontend: Next.js 14 App Router**

Why App Router over Pages Router?

* Server Components reduce client-side JavaScript by 70%+  
* Built-in caching strategies  
* Nested layouts (persistent sidebar per role)  
* Server Actions for mutations (no API route boilerplate)

Project Structure:

Copy

app/  
├── (auth)/  
│   ├── login/  
│   └── reset-password/  
├── (dashboard)/  
│   ├── layout.tsx          \# Role-based sidebar  
│   ├── page.tsx            \# Dashboard home  
│   ├── students/  
│   │   ├── page.tsx        \# List  
│   │   ├── new/  
│   │   │   └── page.tsx    \# Enrollment wizard  
│   │   └── \[id\]/  
│   │       └── page.tsx    \# Student detail  
│   ├── attendance/  
│   ├── financial/  
│   └── reports/  
├── api/                    \# Webhooks, CSV exports  
└── layout.tsx              \# Root layout

### **Backend: Supabase Configuration**

Database Plan: Pro ($25/month) to start

Estimated Growth: Upgrade to Team ($60/month) when exceeding 500 students

Key Settings:

* Realtime: Enabled on: `attendance_records`, `announcements`, `student_enrollments`  
* Auth: Email/password with email confirmation disabled (internal users only)  
* Storage: 10GB for student photos, 5GB for documents

---

## **Integration: SendGrid**

Usage:

TypeScriptCopy

*// lib/email.ts*  
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID\_API\_KEY);

export async function sendWelcomeEmail(guardianEmail: string, studentName: string) {  
  await sgMail.send({  
    to: guardianEmail,  
    from: 'admin@yourschool.com',  
    templateId: 'd-xxxxx', *// SendGrid dynamic template*  
    dynamicTemplateData: {  
      studentName,  
      loginUrl: \`${process.env.NEXT\_PUBLIC\_URL}/login\`,  
    },  
  });

}

---

## **Development Tools**

| Tool | Purpose | Cost |
| :---- | :---- | :---- |
| VS Code | IDE | Free |
| GitHub | Version control | Free (private repo) |
| Vercel | CI/CD \+ Hosting | $20/month Pro |
| Supabase | Database \+ Auth | $25/month Pro |
| SendGrid | Email (100/day free) | $15/month (20k emails) |
| Sentry | Error tracking | $26/month |
| Total |  | \~$86/month |

---

# Frontend Guidelines

## **1\. Design System**

### **Color Palette**

cssCopy

:root {  
  */\* Primary \- Trust/Professional (Blue) \*/*  
  \--primary-50: \#eff6ff;  
  \--primary-100: \#dbeafe;  
  \--primary-200: \#bfdbfe;  
  \--primary-500: \#3b82f6;  
  \--primary-600: \#2563eb;  */\* Main action color \*/*  
  \--primary-700: \#1d4ed8;  
  \--primary-900: \#1e3a8a;  
    
  */\* Secondary \- Growth/Education (Green) \*/*  
  \--secondary-50: \#f0fdf4;  
  \--secondary-500: \#22c55e;  
  \--secondary-600: \#16a34a;  
    
  */\* Semantic Colors \*/*  
  \--success: \#10b981;  
  \--warning: \#f59e0b;  
  \--danger: \#ef4444;  
  \--info: \#3b82f6;  
    
  */\* Neutral \*/*  
  \--gray-50: \#f9fafb;  
  \--gray-100: \#f3f4f6;  
  \--gray-200: \#e5e7eb;  
  \--gray-700: \#374151;  
  \--gray-900: \#111827;

}

### **Typography**

* Headings: Inter, 600-700 weight  
* Body: Inter, 400 weight  
* Monospace: JetBrains Mono (for student numbers, dates)

### **Spacing Scale**

Base unit: 4px (0.25rem)

* xs: 4px  
* sm: 8px  
* md: 16px  
* lg: 24px  
* xl: 32px  
* 2xl: 48px

---

## **2\. Component Architecture**

### **Shadcn/ui Components (Install via CLI)**

bashCopy

npx shadcn add button  
npx shadcn add card  
npx shadcn add dialog  
npx shadcn add dropdown-menu  
npx shadcn add form  
npx shadcn add input  
npx shadcn add select  
npx shadcn add table  
npx shadcn add tabs  
npx shadcn add toast  
npx shadcn add badge  
npx shadcn add avatar  
npx shadcn add calendar  
npx shadcn add popover  
npx shadcn add command  
npx shadcn add checkbox  
npx shadcn add radio-group  
npx shadcn add textarea  
npx shadcn add skeleton

npx shadcn add data-table

### **Custom Components**

1\. OrganizationSwitcher

TypeScriptCopy

*// components/organization-switcher.tsx*  
interface OrganizationSwitcherProps {  
  organizations: Organization\[\];  
  currentOrg: Organization;  
  onSwitch: (orgId: string) \=\> void;  
}  
*// Dropdown with organization logo, name*

*// Shows checkmark for current selection*

2\. StudentCard

TypeScriptCopy

*// components/student-card.tsx*  
interface StudentCardProps {  
  student: StudentWithGuardians;  
  showAllergies?: boolean;  
  compact?: boolean; *// For mobile lists*  
  onClick?: () \=\> void;  
}

*// Photo, name, grade, allergy alerts*

3\. AttendanceGrid

TypeScriptCopy

*// components/attendance-grid.tsx*  
interface AttendanceGridProps {  
  enrollments: Enrollment\[\];  
  date: Date;  
  onMark: (enrollmentId: string, status: AttendanceStatus) \=\> void;  
}  
*// Mobile-optimized grid*

*// Bulk actions toolbar*

4\. InvoicePreview

TypeScriptCopy

*// components/invoice-preview.tsx*  
interface InvoicePreviewProps {  
  invoice: InvoiceWithLineItems;  
  onDownloadPDF?: () \=\> void; *// Future*  
  onExportCSV: () \=\> void;  
}

*// Read-only preview before finalizing*

---

## **3\. State Management Patterns**

### **Server State (React Query)**

TypeScriptCopy

*// hooks/use-students.ts*  
export function useStudents(filters: StudentFilters) {  
  return useQuery({  
    queryKey: \['students', filters\],  
    queryFn: async () \=\> {  
      let query \= supabase  
        .from('students')  
        .select('\*, person:persons(\*), enrollments:student\_enrollments(\*)')  
        .eq('is\_active', true);  
        
      if (filters.organizationId) {  
        query \= query.eq('enrollments.location\_id.organizations.id', filters.organizationId);  
      }  
        
      const { data, error } \= await query;  
      if (error) throw error;  
      return data;  
    },  
    staleTime: 5 \* 60 \* 1000, *// 5 minutes*  
  });  
}

*// hooks/use-mark-attendance.ts*  
export function useMarkAttendance() {  
  const queryClient \= useQueryClient();  
    
  return useMutation({  
    mutationFn: async ({ enrollmentId, date, status }: AttendanceInput) \=\> {  
      const { error } \= await supabase  
        .from('attendance\_records')  
        .upsert({ enrollment\_id: enrollmentId, attendance\_date: date, attendance\_status: status });  
      if (error) throw error;  
    },  
    onSuccess: (\_, variables) \=\> {  
      *// Invalidate and refetch*  
      queryClient.invalidateQueries(\['attendance', variables.date\]);  
    },  
  });

}

### **Client State (Zustand)**

TypeScriptCopy

*// stores/ui-store.ts*  
interface UIState {  
  sidebarOpen: boolean;  
  currentOrganizationId: string | null;  
  currentLocationId: string | null;  
  attendanceDate: Date;  
    
  toggleSidebar: () \=\> void;  
  setOrganization: (id: string) \=\> void;  
  setLocation: (id: string) \=\> void;  
  setAttendanceDate: (date: Date) \=\> void;  
}

export const useUIStore \= create\<UIState\>((set) \=\> ({  
  sidebarOpen: true,  
  currentOrganizationId: null,  
  currentLocationId: null,  
  attendanceDate: new Date(),  
    
  toggleSidebar: () \=\> set((state) \=\> ({ sidebarOpen: \!state.sidebarOpen })),  
  setOrganization: (id) \=\> set({ currentOrganizationId: id }),  
  setLocation: (id) \=\> set({ currentLocationId: id }),  
  setAttendanceDate: (date) \=\> set({ attendanceDate: date }),

}));

---

## **4\. Mobile-First Responsive Design**

### **Breakpoints**

cssCopy

*/\* Mobile first approach \*/*  
sm: 640px   */\* Large phones \*/*  
md: 768px   */\* Tablets \*/*  
lg: 1024px  */\* Laptops \*/*

xl: 1280px  */\* Desktops \*/*

### **Pattern: Collapsible Cards for Mobile**

TypeScriptCopy

*// Attendance screen on mobile*  
\<Card className\="mb-2"\>  
  \<CardHeader className\="p-4"\>  
    \<div className\="flex items-center justify-between"\>  
      \<div className\="flex items-center gap-3"\>  
        \<Avatar className\="h-10 w-10"\>  
          \<AvatarImage src\={student.photoUrl} /\>  
          \<AvatarFallback\>{student.initials}\</AvatarFallback\>  
        \</Avatar\>  
        \<div\>  
          \<p className\="font-medium"\>{student.name}\</p\>  
          {student.hasAllergy && (  
            \<Badge variant\="destructive" className\="text-xs"\>⚠️ Allergy\</Badge\>  
          )}  
        \</div\>  
      \</div\>  
      \<ChevronDown className\={cn("transition", isOpen && "rotate-180")} /\>  
    \</div\>  
  \</CardHeader\>  
  {isOpen && (  
    \<CardContent className\="px-4 pb-4"\>  
      \<div className\="grid grid-cols-2 gap-2"\>  
        \<Button variant\={status \=== 'PRESENT' ? 'default' : 'outline'}\>  
          Present  
        \</Button\>  
        \<Button variant\={status \=== 'ABSENT' ? 'destructive' : 'outline'}\>  
          Absent  
        \</Button\>  
        \<Button variant\={status \=== 'LATE' ? 'warning' : 'outline'}\>  
          Late {arrivalTime && \`(${arrivalTime})\`}  
        \</Button\>  
        \<Button variant\={status \=== 'VACATION' ? 'secondary' : 'outline'}\>  
          Vacation  
        \</Button\>  
      \</div\>  
    \</CardContent\>  
  )}

\</Card\>

---

## **5\. Form Handling with React Hook Form \+ Zod**

TypeScriptCopy

*// Schemas/student-schema.ts*  
export const studentSchema \= z.object({  
  person: z.object({  
    firstName: z.string().min(1, 'First name is required'),  
    lastName: z.string().min(1, 'Last name is required'),  
    dateOfBirth: z.date({  
      required\_error: 'Date of birth is required',  
    }),  
  }),  
  allergies: z.string().optional(),  
  medicalConditions: z.string().optional(),  
  guardians: z.array(guardianSchema).min(1, 'At least one guardian required'),  
  enrollment: z.object({  
    organizationId: z.string().uuid(),  
    locationId: z.string().uuid(),  
    programId: z.string().uuid(),  
    gradeLevelId: z.string().uuid(),  
    classroomId: z.string().uuid(),  
    enrollmentDate: z.date(),  
  }),  
});

type StudentFormData \= z.infer\<typeof studentSchema\>;

*// Components/student-form.tsx*  
export function StudentForm() {  
  const form \= useForm\<StudentFormData\>({  
    resolver: zodResolver(studentSchema),  
    defaultValues: {  
      guardians: \[{}\],  
    },  
  });  
    
  const onSubmit \= async (data: StudentFormData) \=\> {  
    await createStudent.mutateAsync(data);  
    toast.success('Student enrolled successfully');  
    router.push('/students');  
  };  
    
  return (  
    \<Form {...form}\>  
      \<form onSubmit\={form.handleSubmit(onSubmit)} className\="space-y-8"\>  
        {*/\* Form sections \*/*}  
      \</form\>  
    \</Form\>  
  );

}

---

## **6\. Error Handling & Loading States**

### **Error Boundary**

TypeScriptCopy

*// components/error-boundary.tsx*  
export function ErrorBoundary({ error, reset }: { error: Error; reset: () \=\> void }) {  
  return (  
    \<div className\="flex h-\[400px\] flex-col items-center justify-center gap-4"\>  
      \<AlertCircle className\="h-12 w-12 text-destructive" /\>  
      \<h2 className\="text-lg font-semibold"\>Something went wrong\</h2\>  
      \<p className\="text-muted-foreground"\>{error.message}\</p\>  
      \<Button onClick\={reset}\>Try again\</Button\>  
    \</div\>  
  );

}

### **Loading Skeletons**

TypeScriptCopy

*// components/student-skeleton.tsx*  
export function StudentListSkeleton() {  
  return (  
    \<div className\="space-y-4"\>  
      {Array.from({ length: 5 }).map((\_, i) \=\> (  
        \<div key\={i} className\="flex items-center gap-4 p-4 border rounded-lg"\>  
          \<Skeleton className\="h-12 w-12 rounded-full" /\>  
          \<div className\="space-y-2 flex-1"\>  
            \<Skeleton className\="h-4 w-\[200px\]" /\>  
            \<Skeleton className\="h-4 w-\[150px\]" /\>  
          \</div\>  
        \</div\>  
      ))}  
    \</div\>  
  );

}

---

# Backend Structure

## **1\. Database Schema (Modified for Supabase)**

### **Key Changes from Original**

| Change | Original | Modified | Reason |
| :---- | :---- | :---- | :---- |
| Primary Keys | `SERIAL` (int) | `UUID` | Security, Realtime compatibility |
| Tenant Isolation | `organization_id` FK | `tenant_id` \+ RLS | Performance, security |
| Auth Integration | Separate `users` table | Link to `auth.users` | Supabase Auth integration |
| Timestamps | `created_at` | `created_at` \+ `created_by` | Audit trail |

### **Schema DDL (Key Tables)**

sqlCopy

*\-- Enable UUID extension*  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

*\-- Core: Organizations*  
CREATE TABLE organizations (  
    tenant\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    organization\_name VARCHAR(100) NOT NULL,  
    organization\_type VARCHAR(50) CHECK (organization\_type IN ('DAYCARE', 'SCHOOL')),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Core: Locations*  
CREATE TABLE locations (  
    location\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    location\_name VARCHAR(100) NOT NULL,  
    address\_line1 VARCHAR(200),  
    city VARCHAR(100),  
    province\_state VARCHAR(50) DEFAULT 'Ontario',  
    postal\_code VARCHAR(20),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- People: Unified person table*  
CREATE TABLE persons (  
    person\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    first\_name VARCHAR(100) NOT NULL,  
    last\_name VARCHAR(100) NOT NULL,  
    date\_of\_birth DATE,  
    email VARCHAR(100),  
    primary\_phone VARCHAR(20),  
    address\_line1 VARCHAR(200),  
    city VARCHAR(100),  
    photo\_url VARCHAR(500),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    created\_by UUID REFERENCES auth.users(id)  
);

*\-- Students*  
CREATE TABLE students (  
    student\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    person\_id UUID REFERENCES persons(person\_id),  
    student\_number VARCHAR(50) UNIQUE,  
    allergies TEXT,  
    medical\_conditions TEXT,  
    medications TEXT,  
    doctor\_name VARCHAR(100),  
    doctor\_phone VARCHAR(20),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Guardians*  
CREATE TABLE guardians (  
    guardian\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    person\_id UUID REFERENCES persons(person\_id),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Student-Guardian Relationships*  
CREATE TABLE student\_guardian\_relationships (  
    relationship\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    student\_id UUID REFERENCES students(student\_id),  
    guardian\_id UUID REFERENCES guardians(guardian\_id),  
    relationship\_type VARCHAR(50),  
    is\_primary BOOLEAN DEFAULT FALSE,  
    has\_pickup\_authorization BOOLEAN DEFAULT TRUE,  
    has\_billing\_responsibility BOOLEAN DEFAULT FALSE,  
    is\_emergency\_contact BOOLEAN DEFAULT TRUE,  
    emergency\_contact\_priority INTEGER,  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE,  
    UNIQUE(student\_id, guardian\_id)  
);

*\-- Staff*  
CREATE TABLE staff (  
    staff\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    person\_id UUID REFERENCES persons(person\_id),  
    employee\_number VARCHAR(50) UNIQUE,  
    primary\_organization\_id UUID REFERENCES organizations(tenant\_id),  
    primary\_location\_id UUID REFERENCES locations(location\_id),  
    staff\_type VARCHAR(50),  
    hire\_date DATE,  
    employment\_status VARCHAR(50),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE,  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Staff Certifications*  
CREATE TABLE staff\_certifications (  
    certification\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    staff\_id UUID REFERENCES staff(staff\_id),  
    certification\_type VARCHAR(100),  
    certification\_name VARCHAR(200),  
    expiry\_date DATE,  
    is\_current BOOLEAN DEFAULT TRUE,  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Academic: Programs*  
CREATE TABLE programs (  
    program\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    program\_name VARCHAR(100) NOT NULL,  
    program\_code VARCHAR(20),  
    program\_type VARCHAR(50),  
    age\_min\_months INTEGER,  
    age\_max\_months INTEGER,  
    is\_active BOOLEAN DEFAULT TRUE  
);

*\-- Academic: Grade Levels*  
CREATE TABLE grade\_levels (  
    grade\_level\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    program\_id UUID REFERENCES programs(program\_id),  
    grade\_name VARCHAR(50),  
    grade\_code VARCHAR(20),  
    grade\_order INTEGER,  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE  
);

*\-- Academic: Classrooms*  
CREATE TABLE classrooms (  
    classroom\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    location\_id UUID REFERENCES locations(location\_id),  
    school\_year\_id UUID REFERENCES school\_years(school\_year\_id),  
    classroom\_name VARCHAR(100),  
    classroom\_type VARCHAR(50),  
    max\_capacity INTEGER,  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    is\_active BOOLEAN DEFAULT TRUE  
);

*\-- Academic: Enrollments (Historical)*  
CREATE TABLE student\_enrollments (  
    enrollment\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    student\_id UUID REFERENCES students(student\_id),  
    location\_id UUID REFERENCES locations(location\_id),  
    school\_year\_id UUID REFERENCES school\_years(school\_year\_id),  
    program\_id UUID REFERENCES programs(program\_id),  
    grade\_level\_id UUID REFERENCES grade\_levels(grade\_level\_id),  
    classroom\_id UUID REFERENCES classrooms(classroom\_id),  
    enrollment\_status VARCHAR(50) CHECK (enrollment\_status IN ('ACTIVE', 'WITHDRAWN', 'GRADUATED', 'TRANSFERRED')),  
    enrollment\_date DATE NOT NULL,  
    withdrawal\_date DATE,  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Attendance*  
CREATE TABLE attendance\_records (  
    attendance\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    enrollment\_id UUID REFERENCES student\_enrollments(enrollment\_id),  
    attendance\_date DATE NOT NULL,  
    attendance\_status VARCHAR(20),  
    arrival\_time TIME,  
    recorded\_by\_staff\_id UUID REFERENCES staff(staff\_id),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW(),  
    UNIQUE(enrollment\_id, attendance\_date)  
);

*\-- Financial: Fee Structures*  
CREATE TABLE fee\_structures (  
    fee\_structure\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    program\_id UUID REFERENCES programs(program\_id),  
    school\_year\_id UUID REFERENCES school\_years(school\_year\_id),  
    fee\_category VARCHAR(50),  
    fee\_name VARCHAR(200),  
    fee\_amount DECIMAL(10,2),  
    billing\_frequency VARCHAR(50),  
    is\_active BOOLEAN DEFAULT TRUE  
);

*\-- Financial: Invoices*  
CREATE TABLE invoices (  
    invoice\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    enrollment\_id UUID REFERENCES student\_enrollments(enrollment\_id),  
    guardian\_id UUID REFERENCES guardians(guardian\_id),  
    invoice\_number VARCHAR(50) UNIQUE,  
    invoice\_date DATE NOT NULL,  
    due\_date DATE NOT NULL,  
    billing\_period\_start DATE,  
    billing\_period\_end DATE,  
    subtotal DECIMAL(10,2),  
    total\_amount DECIMAL(10,2),  
    amount\_paid DECIMAL(10,2) DEFAULT 0,  
    balance\_due DECIMAL(10,2),  
    invoice\_status VARCHAR(50) DEFAULT 'DRAFT',  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW()  
);

*\-- Financial: Invoice Line Items*  
CREATE TABLE invoice\_line\_items (  
    line\_item\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    invoice\_id UUID REFERENCES invoices(invoice\_id),  
    description VARCHAR(500),  
    quantity DECIMAL(10,2),  
    unit\_price DECIMAL(10,2),  
    line\_total DECIMAL(10,2),  
    tenant\_id UUID REFERENCES organizations(tenant\_id)  
);

*\-- Financial: Payments*  
CREATE TABLE payments (  
    payment\_id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
    invoice\_id UUID REFERENCES invoices(invoice\_id),  
    payment\_date DATE NOT NULL,  
    payment\_amount DECIMAL(10,2),  
    payment\_method VARCHAR(50),  
    reference\_number VARCHAR(100),  
    received\_by\_staff\_id UUID REFERENCES staff(staff\_id),  
    tenant\_id UUID REFERENCES organizations(tenant\_id),  
    created\_at TIMESTAMPTZ DEFAULT NOW()

);

---

## **2\. Row Level Security (RLS) Policies**

sqlCopy

*\-- Enable RLS on all tables*  
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;  
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;  
ALTER TABLE students ENABLE ROW LEVEL SECURITY;  
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;  
ALTER TABLE student\_guardian\_relationships ENABLE ROW LEVEL SECURITY;  
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;  
ALTER TABLE student\_enrollments ENABLE ROW LEVEL SECURITY;  
ALTER TABLE attendance\_records ENABLE ROW LEVEL SECURITY;  
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;  
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

*\-- Helper function to get current user's role*  
CREATE OR REPLACE FUNCTION get\_user\_role()  
RETURNS TEXT AS $$  
BEGIN  
  RETURN current\_setting('request.jwt.claims', true)::json\-\>\>'role';  
EXCEPTION  
  WHEN OTHERS THEN RETURN NULL;  
END;  
$$ LANGUAGE plpgsql;

*\-- Helper function to get user's organization*  
CREATE OR REPLACE FUNCTION get\_user\_organization()  
RETURNS UUID AS $$  
BEGIN  
  RETURN (current\_setting('request.jwt.claims', true)::json\-\>\>'organization\_id')::UUID;  
EXCEPTION  
  WHEN OTHERS THEN RETURN NULL;  
END;  
$$ LANGUAGE plpgsql;

*\-- Organizations: Only super admin sees all, org admin sees own*  
CREATE POLICY "Organizations access" ON organizations  
  FOR ALL USING (  
    get\_user\_role() \= 'SUPER\_ADMIN' OR  
    tenant\_id \= get\_user\_organization()  
  );

*\-- Students: Multi-tier access*  
CREATE POLICY "Students access" ON students  
  FOR ALL USING (  
    *\-- Super admin: all*  
    get\_user\_role() \= 'SUPER\_ADMIN'  
    *\-- Org admin: org only*  
    OR (get\_user\_role() \= 'ORGANIZATION\_ADMIN' AND tenant\_id \= get\_user\_organization())  
    *\-- Teacher: classroom only (via enrollments)*  
    OR (get\_user\_role() \= 'TEACHER' AND EXISTS (  
      SELECT 1 FROM student\_enrollments se  
      JOIN staff\_classroom\_assignments sca ON se.classroom\_id \= sca.classroom\_id  
      JOIN staff s ON sca.staff\_id \= s.staff\_id  
      WHERE se.student\_id \= students.student\_id  
      AND s.person\_id \= auth.uid()  
      AND se.enrollment\_status \= 'ACTIVE'  
    ))  
  );

*\-- Invoices: Admin only (teachers don't see financials)*  
CREATE POLICY "Invoices access" ON invoices  
  FOR ALL USING (  
    get\_user\_role() IN ('SUPER\_ADMIN', 'ORGANIZATION\_ADMIN', 'LOCATION\_ADMIN')  
    AND tenant\_id \= get\_user\_organization()

  );

---

## **3\. Edge Functions**

### **Function 1: Generate Monthly Invoices**

TypeScriptCopy

*// supabase/functions/generate-invoices/index.ts*  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) \=\> {  
  const { organizationId, billingMonth, preview \= true } \= await req.json();  
    
  const supabase \= createClient(  
    Deno.env.get('SUPABASE\_URL')\!,  
    Deno.env.get('SUPABASE\_SERVICE\_ROLE\_KEY')\!  
  );  
    
  *// Get all active enrollments for organization*  
  const { data: enrollments } \= await supabase  
    .from('student\_enrollments')  
    .select('\*, student:students(\*), fee\_structure:fee\_structures(\*)')  
    .eq('tenant\_id', organizationId)  
    .eq('enrollment\_status', 'ACTIVE');  
    
  const invoices \= \[\];  
    
  for (const enrollment of enrollments || \[\]) {  
    *// Calculate base tuition*  
    const tuitionAmount \= enrollment.fee\_structure?.fee\_amount || 0;  
      
    *// Get extended care*  
    const { data: extendedCare } \= await supabase  
      .from('extended\_care\_enrollments')  
      .select('\*')  
      .eq('enrollment\_id', enrollment.enrollment\_id)  
      .eq('is\_active', true)  
      .single();  
      
    const extendedCareAmount \= extendedCare?.monthly\_fee || 0;  
      
    *// Get adjustments for this month*  
    const { data: adjustments } \= await supabase  
      .from('extended\_care\_adjustments')  
      .select('deduction\_amount')  
      .eq('extended\_care\_id', extendedCare?.extended\_care\_id)  
      .gte('adjustment\_date', \`${billingMonth}\-01\`)  
      .lte('adjustment\_date', \`${billingMonth}\-31\`);  
      
    const totalAdjustments \= adjustments?.reduce((sum, a) \=\> sum \+ a.deduction\_amount, 0) || 0;  
      
    *// Get scholarships*  
    const { data: scholarships } \= await supabase  
      .from('scholarships')  
      .select('\*')  
      .eq('student\_id', enrollment.student\_id)  
      .eq('is\_active', true);  
      
    let scholarshipAmount \= 0;  
    for (const scholarship of scholarships || \[\]) {  
      if (scholarship.discount\_type \=== 'PERCENTAGE') {  
        scholarshipAmount \+= tuitionAmount \* (scholarship.discount\_value / 100);  
      } else {  
        scholarshipAmount \+= scholarship.discount\_value;  
      }  
    }  
      
    *// Calculate totals*  
    const subtotal \= tuitionAmount \+ (extendedCareAmount \- totalAdjustments);  
    const total \= Math.max(0, subtotal \- scholarshipAmount);  
      
    if (\!preview) {  
      *// Create actual invoice*  
      const { data: invoice } \= await supabase  
        .from('invoices')  
        .insert({  
          enrollment\_id: enrollment.enrollment\_id,  
          invoice\_number: \`INV-${billingMonth}\-${enrollment.enrollment\_id.slice(0, 8)}\`,  
          invoice\_date: new Date().toISOString().split('T')\[0\],  
          due\_date: \`${billingMonth}\-15\`,  
          billing\_period\_start: \`${billingMonth}\-01\`,  
          billing\_period\_end: \`${billingMonth}\-28\`, *// Simplified*  
          subtotal,  
          total\_amount: total,  
          balance\_due: total,  
          tenant\_id: organizationId,  
        })  
        .select()  
        .single();  
        
      *// Create line items*  
      await supabase.from('invoice\_line\_items').insert(\[  
        {  
          invoice\_id: invoice.invoice\_id,  
          description: \`Tuition \- ${enrollment.fee\_structure?.fee\_name}\`,  
          quantity: 1,  
          unit\_price: tuitionAmount,  
          line\_total: tuitionAmount,  
          tenant\_id: organizationId,  
        },  
        {  
          invoice\_id: invoice.invoice\_id,  
          description: 'Extended Care',  
          quantity: 1,  
          unit\_price: extendedCareAmount \- totalAdjustments,  
          line\_total: extendedCareAmount \- totalAdjustments,  
          tenant\_id: organizationId,  
        },  
        {  
          invoice\_id: invoice.invoice\_id,  
          description: 'Scholarships/Discounts',  
          quantity: 1,  
          unit\_price: \-scholarshipAmount,  
          line\_total: \-scholarshipAmount,  
          tenant\_id: organizationId,  
        },  
      \]);  
        
      invoices.push(invoice);  
    } else {  
      *// Preview mode: just return calculated values*  
      invoices.push({  
        enrollment\_id: enrollment.enrollment\_id,  
        student\_name: enrollment.student?.person?.first\_name \+ ' ' \+ enrollment.student?.person?.last\_name,  
        tuition: tuitionAmount,  
        extended\_care: extendedCareAmount \- totalAdjustments,  
        scholarship: scholarshipAmount,  
        total,  
      });  
    }  
  }  
    
  return new Response(JSON.stringify({ invoices, count: invoices.length }), {  
    headers: { 'Content-Type': 'application/json' },  
  });

});

### **Function 2: Check Certification Expiry**

TypeScriptCopy

*// supabase/functions/check-certifications/index.ts*  
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (\_req) \=\> {  
  const supabase \= createClient(  
    Deno.env.get('SUPABASE\_URL')\!,  
    Deno.env.get('SUPABASE\_SERVICE\_ROLE\_KEY')\!  
  );  
    
  *// Find certifications expiring in 30, 60, 90 days*  
  const alerts \= \[\];  
  const warningDays \= \[30, 60, 90\];  
    
  for (const days of warningDays) {  
    const targetDate \= new Date();  
    targetDate.setDate(targetDate.getDate() \+ days);  
      
    const { data: certs } \= await supabase  
      .from('staff\_certifications')  
      .select('\*, staff:staff(\*)')  
      .eq('is\_current', true)  
      .lte('expiry\_date', targetDate.toISOString().split('T')\[0\])  
      .gte('expiry\_date', new Date().toISOString().split('T')\[0\]);  
      
    for (const cert of certs || \[\]) {  
      alerts.push({  
        staff\_name: cert.staff?.person?.first\_name \+ ' ' \+ cert.staff?.person?.last\_name,  
        certification\_type: cert.certification\_type,  
        expiry\_date: cert.expiry\_date,  
        days\_remaining: days,  
        severity: days \<= 30 ? 'urgent' : days \<= 60 ? 'warning' : 'notice',  
      });  
    }  
  }  
    
  *// Could send email notification here via SendGrid*  
    
  return new Response(JSON.stringify({ alerts }), {  
    headers: { 'Content-Type': 'application/json' },  
  });

});

---

## **4\. Database Views**

sqlCopy

*\-- Current active enrollments with full details*  
CREATE VIEW vw\_active\_students AS  
SELECT   
    s.student\_id,  
    s.student\_number,  
    p.first\_name,  
    p.last\_name,  
    p.date\_of\_birth,  
    p.email,  
    p.primary\_phone,  
    o.organization\_name,  
    l.location\_name,  
    sy.year\_name as school\_year,  
    pr.program\_name,  
    gl.grade\_name,  
    c.classroom\_name,  
    se.enrollment\_date,  
    s.allergies,  
    s.medical\_conditions  
FROM students s  
JOIN persons p ON s.person\_id \= p.person\_id  
JOIN student\_enrollments se ON s.student\_id \= se.student\_id  
JOIN locations l ON se.location\_id \= l.location\_id  
JOIN organizations o ON l.tenant\_id \= o.tenant\_id  
JOIN school\_years sy ON se.school\_year\_id \= sy.school\_year\_id  
JOIN programs pr ON se.program\_id \= pr.program\_id  
JOIN grade\_levels gl ON se.grade\_level\_id \= gl.grade\_level\_id  
LEFT JOIN classrooms c ON se.classroom\_id \= c.classroom\_id  
WHERE se.enrollment\_status \= 'ACTIVE'  
    AND sy.is\_current \= TRUE;

*\-- Outstanding invoices with guardian info*  
CREATE VIEW vw\_outstanding\_invoices AS  
SELECT   
    i.invoice\_id,  
    i.invoice\_number,  
    i.invoice\_date,  
    i.due\_date,  
    i.total\_amount,  
    i.amount\_paid,  
    i.balance\_due,  
    i.invoice\_status,  
    s.student\_number,  
    p.first\_name || ' ' || p.last\_name as student\_name,  
    pg.first\_name || ' ' || pg.last\_name as guardian\_name,  
    pg.email as guardian\_email,  
    o.organization\_name,  
    l.location\_name,  
    CASE   
        WHEN i.due\_date \< CURRENT\_DATE THEN 'OVERDUE'  
        ELSE i.invoice\_status  
    END as current\_status,  
    CURRENT\_DATE \- i.due\_date as days\_overdue  
FROM invoices i  
JOIN student\_enrollments se ON i.enrollment\_id \= se.enrollment\_id  
JOIN students s ON se.student\_id \= s.student\_id  
JOIN persons p ON s.person\_id \= p.person\_id  
JOIN guardians g ON i.guardian\_id \= g.guardian\_id  
JOIN persons pg ON g.person\_id \= pg.person\_id  
JOIN locations l ON se.location\_id \= l.location\_id  
JOIN organizations o ON l.tenant\_id \= o.tenant\_id  
WHERE i.balance\_due \> 0  
    AND i.invoice\_status \!= 'CANCELLED'  
ORDER BY i.due\_date;

*\-- Staff with upcoming certification expiries*  
CREATE VIEW vw\_certification\_alerts AS  
SELECT   
    st.employee\_number,  
    p.first\_name || ' ' || p.last\_name as staff\_name,  
    l.location\_name as primary\_location,  
    sc.certification\_type,  
    sc.certification\_name,  
    sc.expiry\_date,  
    sc.expiry\_date \- CURRENT\_DATE as days\_until\_expiry,  
    CASE   
        WHEN sc.expiry\_date \- CURRENT\_DATE \<= 30 THEN 'URGENT'  
        WHEN sc.expiry\_date \- CURRENT\_DATE \<= 60 THEN 'WARNING'  
        ELSE 'NOTICE'  
    END as alert\_level  
FROM staff\_certifications sc  
JOIN staff st ON sc.staff\_id \= st.staff\_id  
JOIN persons p ON st.person\_id \= p.person\_id  
JOIN locations l ON st.primary\_location\_id \= l.location\_id  
WHERE sc.expiry\_date IS NOT NULL  
    AND sc.expiry\_date \<= CURRENT\_DATE \+ INTERVAL '90 days'  
    AND sc.is\_current \= TRUE

ORDER BY sc.expiry\_date;

---

## **5\. API Routes (Next.js)**

### **Route 1: Export Invoices to CSV**

TypeScriptCopy

*// app/api/invoices/export/route.ts*  
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';  
import { cookies } from 'next/headers';  
import { NextResponse } from 'next/server';

export async function GET(request: Request) {  
  const { searchParams } \= new URL(request.url);  
  const organizationId \= searchParams.get('organizationId');  
  const month \= searchParams.get('month'); *// YYYY-MM*  
    
  const supabase \= createRouteHandlerClient({ cookies });  
    
  *// Fetch invoices with line items*  
  const { data: invoices } \= await supabase  
    .from('invoices')  
    .select(\`  
      \*,  
      enrollment:student\_enrollments(  
        student:students(  
          person:persons(first\_name, last\_name)  
        )  
      ),  
      guardian:guardians(  
        person:persons(first\_name, last\_name)  
      ),  
      line\_items:invoice\_line\_items(\*)  
    \`)  
    .eq('tenant\_id', organizationId)  
    .gte('invoice\_date', \`${month}\-01\`)  
    .lte('invoice\_date', \`${month}\-31\`);  
    
  *// Convert to CSV format for QuickBooks*  
  const csvRows \= \[  
    \['Invoice \#', 'Date', 'Due Date', 'Guardian', 'Student', 'Description', 'Amount', 'Total'\].join(','),  
  \];  
    
  for (const invoice of invoices || \[\]) {  
    for (const item of invoice.line\_items) {  
      csvRows.push(\[  
        invoice.invoice\_number,  
        invoice.invoice\_date,  
        invoice.due\_date,  
        \`${invoice.guardian?.person?.first\_name} ${invoice.guardian?.person?.last\_name}\`,  
        \`${invoice.enrollment?.student?.person?.first\_name} ${invoice.enrollment?.student?.person?.last\_name}\`,  
        \`"${item.description}"\`, *// Quote to handle commas*  
        item.line\_total,  
        invoice.total\_amount,  
      \].join(','));  
    }  
  }  
    
  const csv \= csvRows.join('\\n');  
    
  return new NextResponse(csv, {  
    headers: {  
      'Content-Type': 'text/csv',  
      'Content-Disposition': \`attachment; filename="invoices-${month}.csv"\`,  
    },  
  });

}

---

# Implementation Plan

## **Phase Overview**

| Phase | Duration | Focus | Deliverable |
| :---- | :---- | :---- | :---- |
| Phase 0 | 2 weeks | Setup, schema finalization | Development environment |
| Phase 1 | 4 weeks | Core infrastructure \+ People | Working login, student enrollment |
| Phase 2 | 3 weeks | Academic \+ Attendance | Teachers marking attendance |
| Phase 3 | 4 weeks | Financial system | Invoice generation, QuickBooks export |
| Phase 4 | 2 weeks | Reporting \+ Polish | Dashboards, exports, bug fixes |
| Phase 5 | 2 weeks | Data migration \+ Training | Historical data, staff training |
| Phase 6 | 1 week | Go-live prep | Soft launch, monitoring |
| Buffer | 2 weeks | Contingency | Unexpected issues |
| Total | 20 weeks |  | \~5 months |

Target Start: March 2026

Target Go-Live: September 2026

---

## **Detailed Phase Breakdown**

### **Phase 0: Foundation (Weeks 1-2)**

Goals: Development environment ready, schema finalized

Tasks:

* \[ \] Set up Supabase project (Pro plan)  
* \[ \] Set up Next.js 14 project with shadcn/ui  
* \[ \] Configure TypeScript, ESLint, Prettier  
* \[ \] Set up Vercel project with preview deployments  
* \[ \] Configure SendGrid account  
* \[ \] Set up Sentry error tracking  
* \[ \] Create database migrations (UUID schema)  
* \[ \] Set up RLS policies (basic)  
* \[ \] Create seed data for development  
* \[ \] Set up CI/CD pipeline (GitHub Actions)

Deliverables:

* \[ \] Development environment URL  
* \[ \] Staging environment URL  
* \[ \] Database schema deployed  
* \[ \] CI/CD passing

---

### **Phase 1: Core Infrastructure (Weeks 3-6)**

Goals: User management, student enrollment working

Week 3: Authentication & Organizations

* \[ \] Supabase Auth integration  
* \[ \] Login page with role selection  
* \[ \] Organization switcher component  
* \[ \] Location switcher component  
* \[ \] Dashboard layout with sidebar  
* \[ \] RLS policies for organization isolation

Week 4: Person Management

* \[ \] Person creation form  
* \[ \] Photo upload to Supabase Storage  
* \[ \] Search/Filter persons  
* \[ \] Person detail view

Week 5: Student Enrollment (Part 1\)

* \[ \] Student creation wizard (Step 1-2)  
* \[ \] Medical info section  
* \[ \] Student number generation  
* \[ \] Student list view with filters

Week 6: Student Enrollment (Part 2\)

* \[ \] Guardian management (Step 3\)  
* \[ \] Relationship configuration  
* \[ \] Enrollment creation (Step 4\)  
* \[ \] Fee structure assignment (Step 5\)  
* \[ \] Enrollment confirmation/summary

Deliverables:

* \[ \] Admin can enroll complete student with guardians  
* \[ \] Data properly isolated by organization  
* \[ \] Student photos displaying  
* \[ \] Search working across all students

---

### **Phase 2: Academic Operations (Weeks 7-9)**

Goals: Teachers can manage classrooms and mark attendance

Week 7: Academic Structure

* \[ \] Program management (Admin)  
* \[ \] Grade level management  
* \[ \] Classroom management with capacity  
* \[ \] School year management  
* \[ \] Staff creation and assignments

Week 8: Teacher Views

* \[ \] Teacher dashboard (classroom-centric)  
* \[ \] Classroom roster view  
* \[ \] Student medical alerts on roster  
* \[ \] Guardian contact quick view

Week 9: Attendance

* \[ \] Daily attendance marking interface  
* \[ \] Mobile-optimized attendance grid  
* \[ \] Bulk attendance actions  
* \[ \] Pre-scheduled vacation marking  
* \[ \] Attendance history view  
* \[ \] Real-time updates (Supabase Realtime)

Deliverables:

* \[ \] Teachers can view their classroom rosters  
* \[ \] Daily attendance can be marked on phone  
* \[ \] Attendance reports available to admin  
* \[ \] Vacation scheduling works

---

### **Phase 3: Financial System (Weeks 10-13)**

Goals: Accurate invoice generation and QuickBooks integration

Week 10: Fee Management

* \[ \] Fee structure CRUD  
* \[ \] Extended care enrollment  
* \[ \] Extended care adjustments UI  
* \[ \] Scholarship management

Week 11: Invoice Generation (Backend)

* \[ \] Edge Function: Calculate invoices  
* \[ \] Handle extended care adjustments  
* \[ \] Apply scholarships  
* \[ \] Pro-ration for mid-month enrollments  
* \[ \] Preview mode

Week 12: Invoice Generation (Frontend)

* \[ \] Invoice generation UI  
* \[ \] Preview and review screen  
* \[ \] Individual invoice editing  
* \[ \] Bulk finalize/sent  
* \[ \] Invoice detail view

Week 13: Payments & Export

* \[ \] Payment recording UI  
* \[ \] Outstanding balance reports  
* \[ \] QuickBooks CSV export  
* \[ \] Payment history view  
* \[ \] Financial dashboard (revenue summary)

Deliverables:

* \[ \] Monthly invoices generated accurately  
* \[ \] CSV export matches QuickBooks format  
* \[ \] Extended care calculations correct  
* \[ \] Outstanding balances tracked

---

### **Phase 4: Reporting & Polish (Weeks 14-15)**

Goals: Useful dashboards, data exports, performance optimization

Week 14: Reporting

* \[ \] Admin dashboard with stats  
* \[ \] Enrollment reports by location/program  
* \[ \] Attendance summary reports  
* \[ \] Staff certification expiry report  
* \[ \] Export to Google Sheets format

Week 15: Polish

* \[ \] Performance optimization (React Query tuning)  
* \[ \] Mobile responsiveness audit  
* \[ \] Error handling improvements  
* \[ \] Loading states throughout  
* \[ \] Empty states for new users

Deliverables:

* \[ \] Dashboard shows useful metrics  
* \[ \] All reports exportable  
* \[ \] App feels fast and responsive  
* \[ \] Error handling user-friendly

---

### **Phase 5: Data Migration & Training (Weeks 16-17)**

Goals: Historical data imported, staff trained

Week 16: Data Migration

* \[ \] Export current Google Sheets to CSV  
* \[ \] Data cleansing scripts  
* \[ \] Import current students  
* \[ \] Import historical students (optional)  
* \[ \] Import staff records  
* \[ \] Verify data integrity  
* \[ \] Spot-check with paper records

Week 17: Training

* \[ \] Create user guides (screenshots)  
* \[ \] Record video tutorials (Loom)  
* \[ \] Train admin staff (2-3 sessions)  
* \[ \] Train teachers (1-2 sessions)  
* \[ \] Create quick reference cards  
* \[ \] Set up support channel (Slack/WhatsApp)

Deliverables:

* \[ \] All current students in system  
* \[ \] Staff trained and comfortable  
* \[ \] Documentation complete  
* \[ \] Support process established

---

### **Phase 6: Go-Live (Week 18\)**

Goals: Soft launch, monitoring, feedback

Week 18: Launch

* \[ \] Soft launch: One location first  
* \[ \] Daily check-ins with users  
* \[ \] Bug fixes as reported  
* \[ \] Performance monitoring  
* \[ \] User feedback collection  
* \[ \] Quick iterations based on feedback

Deliverables:

* \[ \] System live in production  
* \[ \] Users actively using  
* \[ \] No critical bugs  
* \[ \] Positive user feedback

---

## **Resource Requirements**

### **Development Team**

| Role | Hours/Week | Duration | Responsibility |
| :---- | :---- | :---- | :---- |
| Lead Developer | 20-30 | 20 weeks | Architecture, backend, database |
| Frontend Developer | 20 | 10 weeks (phases 1-3) | UI components, forms |
| UI/UX Designer | 10 | 4 weeks (phase 0-1) | Wireframes, mockups, icons |

Alternative if solo:

* Extend timeline to 7-8 months  
* Use shadcn/ui components (minimal custom design)  
* Focus on functionality over polish initially

### **Budget Estimate**

| Category | Cost | Notes |
| :---- | :---- | :---- |
| Infrastructure (Annual) |  |  |
| Supabase Pro | $300 | $25/month |
| Vercel Pro | $240 | $20/month |
| SendGrid | $180 | $15/month |
| Sentry | $312 | $26/month |
| Total Annual | $1,032 |  |
| Development (One-time) |  |  |
| Developer contractor (optional) | $5,000-10,000 | If you need help |
| Design assets | $500 | Icons, illustrations |

---

## **Risk Management**

| Risk | Probability | Impact | Mitigation |
| :---- | :---- | :---- | :---- |
| Schema changes mid-development | Medium | High | Extensive upfront design, migration scripts |
| Invoice calculation errors | Low | Critical | Extensive testing, preview mode, manual verification |
| Teacher resistance to new system | Medium | Medium | Involve teachers in design, training, show time savings |
| Data migration issues | Medium | High | Parallel run with old system for 2 weeks |
| Performance with 500+ students | Low | Medium | Proper indexing, pagination, React Query caching |
| Supabase downtime | Low | Medium | Status monitoring, offline indication |

---

## **Success Criteria by Phase**

| Phase | Success Metric | Measurement |
| :---- | :---- | :---- |
| 1 | Student enrollment time | \< 5 minutes vs. 30 minutes paper-based |
| 2 | Attendance marking | 100% of teachers use daily |
| 3 | Invoice accuracy | 100% match with manual calculations |
| 4 | Report generation | \< 10 seconds vs. 30 minutes manual |
| 5 | Data completeness | 100% of active students migrated |
| 6 | User satisfaction | 4/5 rating from admin staff |

---

## **Post-Launch Roadmap (Year 2+)**

| Feature | Quarter | Priority |
| :---- | :---- | :---- |
| Parent portal access | Q1 2027 | High |
| Push notifications | Q1 2027 | Medium |
| Stripe integration (camps) | Q2 2027 | Medium |
| Advanced reporting (charts) | Q2 2027 | Low |
| Two-way messaging | Q3 2027 | Low |
| Mobile native app | Q4 2027 | Low |

