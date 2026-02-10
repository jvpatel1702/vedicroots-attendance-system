-- Extended Care Subscriptions (replaces monthly records with subscription model)
-- A student can have only one ACTIVE subscription at a time

CREATE TABLE IF NOT EXISTS public.extended_care_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  
  -- Subscription period
  start_date date NOT NULL,           -- When extended care began
  end_date date,                      -- NULL = currently active
  
  -- Care schedule
  drop_off_time time,                 -- e.g., '07:30'
  pickup_time time,                   -- e.g., '17:00'
  days_of_week jsonb DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]'::jsonb,
  
  -- Audit trail
  notes text,                         -- Any notes about start/stop reason
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.extended_care_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read Extended Care Subscriptions" ON public.extended_care_subscriptions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Write Extended Care Subscriptions" ON public.extended_care_subscriptions
    FOR ALL TO authenticated USING (true);

-- Index for quick lookup of active subscriptions
CREATE INDEX idx_extended_care_active ON public.extended_care_subscriptions (student_id) 
    WHERE end_date IS NULL;

-- Comment explaining the invoicing logic
COMMENT ON TABLE public.extended_care_subscriptions IS 
'Subscription-based extended care. To find active subscriptions for a billing month:
WHERE start_date <= month_end AND (end_date IS NULL OR end_date >= month_start)
Proration: (days_in_subscription / total_billing_days) * monthly_rate';
