
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
    staff?.forEach(s => {
        console.log(`- ID: ${s.id} | Email: ${s.email} | Role: ${s.role}`);
        if (s.persons) {
            console.log(`  Person: ${s.persons.first_name} ${s.persons.last_name} (Org: ${s.persons.organization_id})`);
        } else {
            console.log(`  Person: NULL`);
        }
    });
}

debugStaff();
