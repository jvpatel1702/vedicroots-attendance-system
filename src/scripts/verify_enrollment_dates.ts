
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEnrollmentDates() {
    console.log('Verifying enrollment dates...');

    // 1. Check for enrollments without start_date
    const { data: missingStartDate, error: error1 } = await supabase
        .from('enrollments')
        .select('id, student_id')
        .is('start_date', null);

    if (error1) {
        console.error('Error checking missing start_date:', error1);
    } else {
        const count = missingStartDate?.length || 0;
        console.log(`Enrollments missing start_date: ${count}`);
        if (count > 0) {
            console.warn('WARNING: Some enrollments are missing start_date!');
        } else {
            console.log('PASS: All enrollments have start_date.');
        }
    }

    // 2. Fetch a sample enrollment with dates
    const { data: sample, error: error2 } = await supabase
        .from('enrollments')
        .select('id, start_date, end_date')
        .limit(5);

    if (error2) {
        console.error('Error fetching sample:', error2);
    } else {
        console.log('Sample enrollments:');
        sample?.forEach(e => {
            console.log(`- ID: ${e.id}, Start: ${e.start_date}, End: ${e.end_date}`);
        });
    }

    // 3. Test Date Filter Query (Simulate Teacher Dashboard)
    const today = new Date().toISOString().split('T')[0];
    const { data: activeStudents, error: error3 } = await supabase
        .from('enrollments')
        .select('id')
        .eq('status', 'ACTIVE')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`);

    if (error3) {
        console.error('Error testing date filter:', error3);
    } else {
        console.log(`Active enrollments today (${today}): ${activeStudents?.length}`);
    }
}

verifyEnrollmentDates().catch(console.error);
