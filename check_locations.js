const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkLocations() {
    const { data, error } = await supabase.from('locations').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Locations:', JSON.stringify(data, null, 2));
    }
}

checkLocations();
