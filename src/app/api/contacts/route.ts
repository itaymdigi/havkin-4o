import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from '@/config/supabase'

// Create Supabase client with service role key (bypasses RLS)
// Note: For production, you should use a service role key instead of anon key
const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey, // TODO: Replace with service role key for production
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in contacts GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, email, phone, position, company_id } = body

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        user_id: userId,
        first_name,
        last_name,
        email: email || null,
        phone: phone || null,
        position: position || null,
        company_id: company_id || null
      }])
      .select()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error in contacts POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 