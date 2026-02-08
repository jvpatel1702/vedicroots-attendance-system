const { createClient } = require('@supabase/supabase-js');

// Using the key found in .env.local
const url = 'https://yfptbcxhsfgxulboqbia.supabase.co';
const key = 'sb_publishable_ABu7DGLOImq-lFu1mDedcQ_hSb-nwFN';

async function inspectStudents() {
    const supabase = createClient(url, key);

    console.log('Fetching students raw data...');
    // Select everything from students to see if old columns exist and if person_id is set
    const { data: students, error } = await supabase
        .from('students')
        .select('*');

    if (error) {
        console.error('Error fetching students:', error);
        return;
    }

    console.log(`Found ${students.length} students.`);

    if (students.length > 0) {
        console.log('Sample student record:', JSON.stringify(students[0], null, 2));

        const nullPersonIds = students.filter(s => !s.person_id).length;
        console.log(`Students with NULL person_id: ${nullPersonIds} / ${students.length}`);
    }

    // Check persons table count
    const { count, error: countError } = await supabase
        .from('persons')
        .select('*', { count: 'exact', head: true });

    console.log('Total entries in persons table:', count);
}

inspectStudents();
