import { supabase } from "./supabase"
import type { Company } from "@/types"

export async function getCompanies() {
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching companies:", error)
    throw error
  }

  return data as Company[]
}

export async function createCompany(company: Omit<Company, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("companies")
    .insert([company])
    .select()

  if (error) {
    console.error("Error creating company:", error)
    throw error
  }

  return data[0] as Company
}

export async function updateCompany(id: string, company: Partial<Company>) {
  const { data, error } = await supabase
    .from("companies")
    .update(company)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating company:", error)
    throw error
  }

  return data[0] as Company
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting company:", error)
    throw error
  }
} 