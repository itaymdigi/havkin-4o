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
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching companies:', error)
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in companies GET:', error)
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
    const { name, industry, website, address, phone } = body

    if (!name) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('companies')
      .insert([{
        user_id: userId,
        name,
        industry: industry || null,
        website: website || null,
        address: address || null,
        phone: phone || null
      }])
      .select()

    if (error) {
      console.error('Error creating company:', error)
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error in companies POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 