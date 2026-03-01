import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLS () {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number')
    .eq('phone_number', '+971555219217')

  console.log('RLS Check Data:', data)
  console.log('RLS Check Error:', error?.message)
}

testRLS()
