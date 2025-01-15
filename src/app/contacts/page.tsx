"use client"

import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog"
import { SearchInput } from "@/components/ui/search-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { getContacts, deleteContact } from "@/lib/contacts"
import { getCompanies } from "@/lib/companies"
import type { Contact, Company } from "@/types"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [companyFilter, setCompanyFilter] = useState<string>("all")

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [contactsData, companiesData] = await Promise.all([
        getContacts(),
        getCompanies()
      ])
      setContacts(contactsData)
      setCompanies(companiesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact(id)
        setContacts(contacts.filter(contact => contact.id !== id))
      } catch (error) {
        console.error("Failed to delete contact:", error)
      }
    }
  }

  // Filter contacts based on search query and company
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = 
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCompany = 
        companyFilter === "all" || contact.company_id === companyFilter

      return matchesSearch && matchesCompany
    })
  }, [contacts, searchQuery, companyFilter])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
            <p className="text-muted-foreground">
              Manage your contacts and their information
            </p>
          </div>
          <ContactFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            }
            onSuccess={loadData}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {contacts.length === 0
                      ? "No contacts found. Add your first contact to get started."
                      : "No contacts match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell>{contact.company?.name || "-"}</TableCell>
                    <TableCell>{contact.position || "-"}</TableCell>
                    <TableCell>{contact.email || "-"}</TableCell>
                    <TableCell>{contact.phone || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <ContactFormDialog
                        contact={contact}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        onSuccess={loadData}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
} 