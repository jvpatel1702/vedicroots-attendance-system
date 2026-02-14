
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env vars assuming running from root
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars. Ensure .env.local exists and has SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTest() {
    console.log('--- Starting Staff Attendance Test ---');

    // 1. Setup: Get or Create Org and Staff
    const { data: org } = await supabase.from('organizations').select('id').limit(1).single();
    if (!org) { console.error('No org found'); return; }
    console.log('Using Org:', org.id);

    // Create a dummy staff
    const { data: person } = await supabase.from('persons').insert({
        first_name: 'Test',
        last_name: 'Staff',
        email: `teststaff_${Date.now()}@example.com`, // Unique email
        organization_id: org.id
    }).select().single();

    if (!person) { console.error('Failed to create person'); return; }

    const { data: staff } = await supabase.from('staff').insert({
        person_id: person.id,
        role: 'TEACHER',
        is_active: true
    }).select().single();

    if (!staff) { console.error('Failed to create staff'); return; }
    console.log('Created Test Staff:', staff.id);

    // 2. Create Pay Period
    const startDate = new Date().toISOString().split('T')[0]; // Today
    const endDate = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];

    // Check if period exists
    let payPeriodId;
    const { data: existingPeriod } = await supabase.from('pay_periods')
        .select('id')
        .eq('organization_id', org.id)
        .lte('start_date', startDate)
        .gte('end_date', startDate)
        .maybeSingle(); // Use maybeSingle to avoid 406 if multiple match (though shouldn't) or 0 match

    if (existingPeriod) {
        payPeriodId = existingPeriod.id;
        console.log('Using existing Pay Period:', payPeriodId);
    } else {
        const { data: pp, error: ppErr } = await supabase.from('pay_periods').insert({
            organization_id: org.id,
            name: 'Test Period ' + Date.now(),
            start_date: startDate,
            end_date: endDate,
            status: 'OPEN'
        }).select().single();
        if (ppErr) { console.error('PP Error', ppErr); return; }
        payPeriodId = pp.id;
        console.log('Created Pay Period:', payPeriodId);
    }

    // 3. Clock In
    console.log('--- Testing Clock In ---');

    // Check if already clocked in (in case re-running)
    await supabase.from('staff_attendance').delete().eq('staff_id', staff.id).eq('date', startDate);

    const { error: clockInErr } = await supabase.from('staff_attendance').insert({
        staff_id: staff.id,
        date: startDate,
        check_in: new Date().toISOString(),
        status: 'PRESENT',
        pay_period_id: payPeriodId
    });

    if (clockInErr) console.error('Clock In Failed:', clockInErr.message);
    else console.log('Clock In DB Insert Success');

    // 4. Verify Record
    const { data: record } = await supabase.from('staff_attendance').select('*').eq('staff_id', staff.id).single();
    console.log('Attendance Record:', record);

    if (record) {
        // 5. Clock Out
        console.log('--- Testing Clock Out ---');
        const { error: clockOutErr } = await supabase.from('staff_attendance')
            .update({
                check_out: new Date().toISOString(),
                work_minutes: 60 // Simulate 1 hour
            })
            .eq('id', record.id);

        if (clockOutErr) console.error('Clock Out Failed:', clockOutErr.message);
        else {
            const { data: updated } = await supabase.from('staff_attendance').select('*').eq('id', record.id).single();
            console.log('Updated Record:', updated);
        }
    }

    // 6. Cleanup
    console.log('Cleaning up...');
    await supabase.from('staff_attendance').delete().eq('staff_id', staff.id);
    await supabase.from('staff').delete().eq('id', staff.id);
    await supabase.from('persons').delete().eq('id', person.id);
    // Don't delete pay period

    console.log('--- Test Complete ---');
}

runTest().catch(e => console.error("Unhandled:", e));
