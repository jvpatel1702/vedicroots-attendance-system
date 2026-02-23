-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academic_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  CONSTRAINT academic_years_pkey PRIMARY KEY (id)
);
CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'LATE'::text, 'VACATION'::text, 'UNMARKED'::text])),
  marked_by uuid,
  timestamp timestamp with time zone DEFAULT now(),
  arrival_time time without time zone,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.classroom_grades (
  classroom_id uuid NOT NULL,
  grade_id uuid NOT NULL,
  CONSTRAINT classroom_grades_pkey PRIMARY KEY (classroom_id, grade_id),
  CONSTRAINT classroom_grades_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id),
  CONSTRAINT classroom_grades_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id)
);
CREATE TABLE public.classrooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL,
  name text NOT NULL,
  capacity integer,
  CONSTRAINT classrooms_pkey PRIMARY KEY (id),
  CONSTRAINT classrooms_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.elective_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'LATE'::text, 'TEACHER_ABSENT'::text, 'SCHOOL_CLOSED'::text])),
  is_rollover boolean DEFAULT false,
  rollover_note text,
  marked_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elective_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT elective_attendance_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.elective_enrollments(id),
  CONSTRAINT elective_attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.elective_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  offering_id uuid NOT NULL,
  enrolled_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'ACTIVE'::text CHECK (status = ANY (ARRAY['ACTIVE'::text, 'DROPPED'::text])),
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elective_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT elective_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT elective_enrollments_offering_id_fkey FOREIGN KEY (offering_id) REFERENCES public.elective_offerings(id)
);
CREATE TABLE public.elective_offerings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL,
  teacher_id uuid,
  academic_year_id uuid NOT NULL,
  name text NOT NULL,
  day_of_week text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  capacity integer,
  cost_per_session numeric DEFAULT 0.00,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elective_offerings_pkey PRIMARY KEY (id),
  CONSTRAINT elective_offerings_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.elective_subjects(id),
  CONSTRAINT elective_offerings_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id),
  CONSTRAINT elective_offerings_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.elective_subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  code text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elective_subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  classroom_id uuid NOT NULL,
  grade_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  status text DEFAULT 'ACTIVE'::text CHECK (status = ANY (ARRAY['ACTIVE'::text, 'INACTIVE'::text, 'GRADUATED'::text])),
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  transport_mode text DEFAULT 'PARENT'::text CHECK (transport_mode = ANY (ARRAY['PARENT'::text, 'BUS'::text, 'TAXI'::text])),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT enrollments_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id),
  CONSTRAINT enrollments_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grades(id),
  CONSTRAINT enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.extended_care_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subscription_id uuid,
  adjustment_date date NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type = ANY (ARRAY['ABSENCE_DEDUCTION'::text, 'HOLIDAY_DEDUCTION'::text, 'LATE_FEE'::text, 'CREDIT'::text, 'OTHER'::text])),
  deduction_minutes integer DEFAULT 0,
  deduction_amount numeric DEFAULT 0,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT extended_care_adjustments_pkey PRIMARY KEY (id),
  CONSTRAINT extended_care_adjustments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT extended_care_adjustments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.extended_care_subscriptions(id)
);
CREATE TABLE public.extended_care_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  subscription_id uuid,
  date date NOT NULL,
  actual_dropoff_time time without time zone,
  actual_pickup_time time without time zone,
  late_pickup_fee numeric DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT extended_care_checkins_pkey PRIMARY KEY (id),
  CONSTRAINT extended_care_checkins_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT extended_care_checkins_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.extended_care_subscriptions(id)
);
CREATE TABLE public.extended_care_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  month date NOT NULL,
  drop_off_time time without time zone,
  pickup_time time without time zone,
  days_of_week jsonb,
  manual_discount_amount numeric DEFAULT 0,
  manual_discount_reason text,
  final_fee numeric NOT NULL,
  audit_log jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subscription_id uuid,
  CONSTRAINT extended_care_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT extended_care_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT extended_care_enrollments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.extended_care_subscriptions(id)
);
CREATE TABLE public.extended_care_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  drop_off_time time without time zone,
  pickup_time time without time zone,
  days_of_week jsonb DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT extended_care_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT extended_care_subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.fee_structures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  academic_year_id uuid NOT NULL,
  amount numeric NOT NULL,
  frequency text DEFAULT 'MONTHLY'::text CHECK (frequency = ANY (ARRAY['MONTHLY'::text, 'ANNUALLY'::text])),
  CONSTRAINT fee_structures_pkey PRIMARY KEY (id),
  CONSTRAINT fee_structures_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT fee_structures_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid,
  name text NOT NULL,
  order integer NOT NULL,
  organization_id uuid,
  CONSTRAINT grades_pkey PRIMARY KEY (id),
  CONSTRAINT grades_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT grades_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.guardians (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  person_id uuid,
  CONSTRAINT guardians_pkey PRIMARY KEY (id),
  CONSTRAINT guardians_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.invoice_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  CONSTRAINT invoice_items_pkey PRIMARY KEY (id),
  CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  billing_month date NOT NULL,
  total_amount numeric NOT NULL,
  status text DEFAULT 'DRAFT'::text CHECK (status = ANY (ARRAY['DRAFT'::text, 'SENT'::text, 'PAID'::text, 'OVERDUE'::text])),
  due_date date,
  organization_id uuid,
  enrollment_id uuid,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT invoices_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT invoices_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  capacity integer,
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['SCHOOL'::text, 'DAYCARE'::text])),
  logo_url text,
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid,
  student_id uuid,
  organization_id uuid,
  amount numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method text CHECK (method = ANY (ARRAY['CASH'::text, 'CHECK'::text, 'CARD'::text, 'ACH'::text, 'OTHER'::text])),
  reference_number text,
  notes text,
  recorded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id),
  CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT payments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.persons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date,
  email text,
  phone text,
  photo_url text,
  address text,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  gender text,
  CONSTRAINT persons_pkey PRIMARY KEY (id),
  CONSTRAINT persons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.program_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  cutoff_time time without time zone,
  dropoff_time time without time zone,
  pickup_time time without time zone,
  late_fee_per_minute numeric DEFAULT 1.00,
  extended_care_rate_monthly numeric DEFAULT 80.00,
  open_time time without time zone,
  close_time time without time zone,
  late_pickup_fee numeric DEFAULT 5.00,
  CONSTRAINT program_settings_pkey PRIMARY KEY (id),
  CONSTRAINT program_settings_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.programs(id),
  CONSTRAINT program_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  age_range_start integer,
  age_range_end integer,
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.scholarships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  organization_id uuid,
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['PERCENT'::text, 'FIXED'::text])),
  discount_value numeric NOT NULL,
  start_date date,
  end_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scholarships_pkey PRIMARY KEY (id),
  CONSTRAINT scholarships_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT scholarships_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.school_holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  academic_year_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid,
  CONSTRAINT school_holidays_pkey PRIMARY KEY (id),
  CONSTRAINT school_holidays_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id),
  CONSTRAINT school_holidays_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.school_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE,
  cutoff_time time without time zone DEFAULT '09:30:00'::time without time zone,
  late_fee_per_minute numeric DEFAULT 1.00,
  cutoff_time_kg time without time zone DEFAULT '09:15:00'::time without time zone,
  cutoff_time_elementary time without time zone DEFAULT '09:00:00'::time without time zone,
  pickup_time_kg time without time zone DEFAULT '15:30:00'::time without time zone,
  pickup_time_elementary time without time zone DEFAULT '15:15:00'::time without time zone,
  dropoff_time_kg time without time zone DEFAULT '08:45:00'::time without time zone,
  dropoff_time_elementary time without time zone DEFAULT '08:15:00'::time without time zone,
  extended_care_rate_monthly numeric DEFAULT 80.00,
  open_time time without time zone DEFAULT '07:30:00'::time without time zone,
  close_time time without time zone DEFAULT '18:00:00'::time without time zone,
  late_pickup_fee numeric DEFAULT 5.00,
  CONSTRAINT school_settings_pkey PRIMARY KEY (id),
  CONSTRAINT school_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  person_id uuid,
  role text DEFAULT 'TEACHER'::text CHECK (role = ANY (ARRAY['ADMIN'::text, 'TEACHER'::text, 'STAFF'::text])),
  email text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id),
  CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.staff_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL CHECK (status = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'LATE'::text, 'VACATION'::text, 'HALF_DAY'::text, 'SICK'::text])),
  check_in timestamp with time zone,
  check_out timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_attendance_pkey PRIMARY KEY (id),
  CONSTRAINT staff_attendance_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.student_guardians (
  student_id uuid NOT NULL,
  guardian_id uuid NOT NULL,
  relationship text NOT NULL,
  is_primary boolean DEFAULT false,
  is_pickup_authorized boolean DEFAULT true,
  is_emergency_contact boolean DEFAULT true,
  has_billing_responsibility boolean DEFAULT false,
  emergency_contact_priority integer DEFAULT 1,
  custody_notes text,
  CONSTRAINT student_guardians_pkey PRIMARY KEY (student_id, guardian_id),
  CONSTRAINT student_guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id)
);
CREATE TABLE public.student_medical (
  student_id uuid NOT NULL,
  allergies text,
  medical_conditions text,
  medications text,
  doctor_name text,
  doctor_phone text,
  CONSTRAINT student_medical_pkey PRIMARY KEY (student_id),
  CONSTRAINT student_medical_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.student_vacations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT student_vacations_pkey PRIMARY KEY (id),
  CONSTRAINT student_vacations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_picture text,
  student_number text UNIQUE,
  person_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.persons(id)
);
CREATE TABLE public.teacher_classrooms (
  classroom_id uuid NOT NULL,
  is_primary boolean DEFAULT true,
  staff_id uuid NOT NULL,
  CONSTRAINT teacher_classrooms_pkey PRIMARY KEY (staff_id, classroom_id),
  CONSTRAINT teacher_classrooms_classroom_id_fkey FOREIGN KEY (classroom_id) REFERENCES public.classrooms(id),
  CONSTRAINT teacher_classrooms_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['SUPER_ADMIN'::text, 'ADMIN'::text, 'ORG_ADMIN'::text, 'OFFICE'::text, 'TEACHER'::text, 'ELECTIVE_TEACHER'::text, 'PARENT'::text])),
  organization_id uuid,
  location_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT user_roles_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);