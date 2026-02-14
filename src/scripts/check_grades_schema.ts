
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(__dirname, '../../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envvars: Record<string, string> = {};

envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envvars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envvars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envvars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase keys in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log('Testing insert into classroom_grades...');

    // 1. Get a classroom
    const { data: classrooms, error: cError } = await supabase.from('classrooms').select('id, name').limit(1);
    if (cError || !classrooms?.length) {
        console.error('Could not fetch classrooms:', cError);
        return;
    }
    const classroom = classrooms[0];
    console.log(`Using Classroom: ${classroom.name} (${classroom.id})`);

    // 2. Get a grade
    const { data: grades, error: gError } = await supabase.from('grades').select('id, name').limit(1);
    if (gError || !grades?.length) {
        console.error('Could not fetch grades:', gError);
        return;
    }
    const grade = grades[0];
    console.log(`Using Grade: ${grade.name} (${grade.id})`);

    // 3. Try Insert
    const { data: insertData, error: insertError } = await supabase
        .from('classroom_grades')
        .insert({
            classroom_id: classroom.id,
            grade_id: grade.id
        })
        .select();

    if (insertError) {
        console.error('INSERT FAILED:', insertError);
    } else {
        console.log('INSERT SUCCESS:', insertData);

        // Cleanup (Delete)
        const { error: deleteError } = await supabase
            .from('classroom_grades')
            .delete()
            .eq('classroom_id', classroom.id)
            .eq('grade_id', grade.id);

        if (deleteError) {
            console.error('DELETE FAILED:', deleteError);
        } else {
            console.log('DELETE SUCCESS');
        }
    }
}

testInsert();
