import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Simple env parser
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.join('=').trim().replace(/"/g, '')
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumn() {
    console.log('Checking for cost_per_class column...')
    // Try to select the specific column. If it fails, it doesn't exist.
    const { data, error } = await supabase
        .from('elective_offerings')
        .select('cost_per_class')
        .limit(1)

    if (error) {
        console.error('Error selecting column:', error.message)
        if (error.message.includes('does not exist')) {
            console.log('RESULT: MISSING')
        } else {
            console.log('RESULT: ERROR (' + error.message + ')')
        }
    } else {
        console.log('RESULT: EXISTS')
    }
}

checkColumn()
