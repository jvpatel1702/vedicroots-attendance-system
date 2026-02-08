
-- Seed Organizations
INSERT INTO public.organizations (name, type)
VALUES 
('Vedic Roots Montessori Academy', 'SCHOOL'),
('Vedic Roots School', 'SCHOOL')
ON CONFLICT DO NOTHING;

-- Get IDs (for manual usage if needed, but we can subselect)
-- Seed Locations for Academy
INSERT INTO public.locations (organization_id, name, address)
SELECT id, 'Academy Main Campus', '123 Montessori Ln'
FROM public.organizations WHERE name = 'Vedic Roots Montessori Academy'
ON CONFLICT DO NOTHING;

-- Seed Locations for School
INSERT INTO public.locations (organization_id, name, address)
SELECT id, 'School North Campus', '456 School Rd'
FROM public.organizations WHERE name = 'Vedic Roots School'
ON CONFLICT DO NOTHING;
