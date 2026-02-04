-- Fix missing profiles for existing Auth Users (IDs retrieved from logs)
-- Admin User
INSERT INTO public.profiles (id, name, email, role)
VALUES 
    ('ce4be3b3-fc18-4ca7-81df-dff7976c798e', 'Admin User', 'admin@vedicroots.com', 'ADMIN'),
    ('c89300c4-d1d1-4c6b-b6e0-95714be6e4d1', 'Teacher User', 'teacher@vedicroots.com', 'TEACHER')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role; -- Ensure roles are correct if they exist

-- Enable Insert Policy for Authenticated Users (so users can create their own profile if needed)
CREATE POLICY "Insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a Trigger to handle future User Signups automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'TEACHER') -- Default to TEACHER if not specified
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger checks
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
