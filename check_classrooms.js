const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkClassrooms() {
    console.log('Attempting old query...');
    const { data, error } = await supabase
        .from('classrooms')
        .select(`
            *,
            teacher_classrooms (
                profiles (name)
            )
        `)
        .limit(1);

    if (error) {
        console.error('Old query failed as expected:', error.message);
    } else {
        console.log('Old query success (unexpected):', data);
    }

    console.log('Attempting new query...');
    const { data: newData, error: newError } = await supabase
        .from('classrooms')
        .select(`
            *,
            teacher_classrooms (
                staff (
                    persons (first_name, last_name)
                )
            )
        `)
        .limit(1);

    if (newError) {
        console.error('New query failed:', newError);
    } else {
        console.log('New query success:', JSON.stringify(newData, null, 2));
    }
}

checkClassrooms();
