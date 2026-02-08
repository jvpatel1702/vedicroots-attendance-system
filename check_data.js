const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
    console.log('Fetching profiles...');
    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }
    console.log('Profiles found:', profiles.length);
    console.log(JSON.stringify(profiles, null, 2));

    console.log('Fetching persons...');
    const { data: persons, error: err2 } = await supabase.from('persons').select('*');
    if (err2) {
        console.error('Error fetching persons:', err2);
    } else {
        console.log('Persons found:', persons.length);
        console.log(JSON.stringify(persons, null, 2));
    }
}

check();
