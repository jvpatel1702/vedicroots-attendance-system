
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    fs.writeFileSync('debug_error.log', 'Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    try {
        const { data, error } = await supabase.from('enrollments').select('start_date').limit(1);
        if (error) {
            fs.writeFileSync('debug_error.log', JSON.stringify(error, null, 2));
            console.log('Error logged to debug_error.log');
        } else {
            console.log('Success! Data:', data);
            fs.writeFileSync('debug_error.log', 'Success');
        }
    } catch (e: any) {
        fs.writeFileSync('debug_error.log', 'Exception: ' + e.message);
    }
}

debug();
