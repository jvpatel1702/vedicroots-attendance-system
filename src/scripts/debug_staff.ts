
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function debugStaff() {
    console.log('Fetching all staff...');
    const { data: staff, error } = await supabase
        .from('staff')
        .select(`
            id,
            email,
            role,
            persons (
                id,
                first_name,
                last_name,
                organization_id
            )
        `);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${staff?.length} staff records.`);
    staff?.forEach((s: any) => {
        console.log(`- ID: ${s.id} | Email: ${s.email} | Role: ${s.role}`);
        const person = Array.isArray(s.persons) ? s.persons[0] : s.persons;
        if (person) {
            console.log(`  Person: ${person.first_name} ${person.last_name} (Org: ${person.organization_id})`);
        } else {
            console.log(`  Person: NULL`);
        }
    });
}

debugStaff();
