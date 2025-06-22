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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, industry, website, address, phone } = body

    // First verify the company belongs to the user
    const { data: existingCompany, error: fetchError } = await supabase
      .from('companies')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (existingCompany.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('companies')
      .update({
        name,
        industry: industry || null,
        website: website || null,
        address: address || null,
        phone: phone || null
      })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating company:', error)
      return NextResponse.json({ error: 'Failed to update company' }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('Error in companies PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First verify the company belongs to the user
    const { data: existingCompany, error: fetchError } = await supabase
      .from('companies')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingCompany) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (existingCompany.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting company:', error)
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in companies DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 