import { supabase } from "./supabase"
import type { Contact } from "@/types"

export async function getContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      company:companies(*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contacts:", error)
    throw error
  }

  return data as Contact[]
}

export async function createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User must be authenticated to create contacts")
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert([{ ...contact, user_id: user.id }])
    .select()

  if (error) {
    console.error("Error creating contact:", error)
    throw error
  }

  return data[0] as Contact
}

export async function updateContact(id: string, contact: Partial<Contact>) {
  const { data, error } = await supabase
    .from("contacts")
    .update(contact)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating contact:", error)
    throw error
  }

  return data[0] as Contact
}

export async function deleteContact(id: string) {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting contact:", error)
    throw error
  }
} 