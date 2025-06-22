import type { Contact } from "@/types"

export async function getContacts(): Promise<Contact[]> {
  const response = await fetch('/api/contacts')
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch contacts')
  }
  
  return response.json()
}

export async function createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">): Promise<Contact> {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contact),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create contact')
  }
  
  return response.json()
}

export async function updateContact(id: string, contact: Partial<Contact>): Promise<Contact> {
  const response = await fetch(`/api/contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(contact),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update contact')
  }
  
  return response.json()
}

export async function deleteContact(id: string): Promise<void> {
  const response = await fetch(`/api/contacts/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete contact')
  }
} 