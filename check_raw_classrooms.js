const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkRawClassrooms() {
    console.log("Checking raw classrooms...");
    const { data: classrooms, error } = await supabase
        .from('classrooms')
        .select('*');

    if (error) {
        console.error('Error fetching classrooms:', error.message);
        return;
    }

    console.log(`Found ${classrooms.length} classrooms:`);
    console.log(JSON.stringify(classrooms, null, 2));

    if (classrooms.length > 0) {
        console.log("\nChecking associated locations...");
        const locationIds = [...new Set(classrooms.map(c => c.location_id))];
        const { data: locations, error: locError } = await supabase
            .from('locations')
            .select('*')
            .in('id', locationIds);

        if (locError) console.error("Error fetching locations:", locError);
        else {
            console.log("Found associated locations:", JSON.stringify(locations, null, 2));

            // Check for missing locations
            const foundLocIds = locations.map(l => l.id);
            const missing = locationIds.filter(id => !foundLocIds.includes(id));
            if (missing.length > 0) {
                console.log("WARNING: Classrooms point to missing location IDs:", missing);
            }
        }
    }
}

checkRawClassrooms();
