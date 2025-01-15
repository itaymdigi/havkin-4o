export interface Contact {
  id: string
  company_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  position: string | null
  created_at: string
  updated_at: string
  // Include company relation type
  company?: Company
}

export interface Company {
  id: string
  name: string
  industry: string | null
  website: string | null
  address: string | null
  phone: string | null
  created_at: string
  updated_at: string
} 