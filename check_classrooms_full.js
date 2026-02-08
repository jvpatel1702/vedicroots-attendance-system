const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkClassroomsFull() {
    console.log('Attempting FULL query...');
    const { data, error } = await supabase
        .from('classrooms')
        .select(`
            *,
            classroom_grades (
                grades (name)
            ),
            teacher_classrooms (
                staff (
                    persons (first_name, last_name)
                )
            ),
            enrollments (count)
        `)
        .order('name');

    if (error) {
        console.error('Query failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Query success:', JSON.stringify(data, null, 2));
    }
}

checkClassroomsFull();
