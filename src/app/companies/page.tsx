"use client"

import { useEffect, useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CompanyFormDialog } from "@/components/companies/company-form-dialog"
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
import { getCompanies, deleteCompany } from "@/lib/companies"
import type { Company } from "@/types"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [industryFilter, setIndustryFilter] = useState<string>("all")

  useEffect(() => {
    loadCompanies()
  }, [])

  async function loadCompanies() {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (error) {
      console.error("Failed to load companies:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        await deleteCompany(id)
        setCompanies(companies.filter(company => company.id !== id))
      } catch (error) {
        console.error("Failed to delete company:", error)
      }
    }
  }

  // Get unique industries for filter
  const industries = useMemo(() => {
    const uniqueIndustries = new Set(companies.map(c => c.industry).filter(Boolean))
    return Array.from(uniqueIndustries)
  }, [companies])

  // Filter companies based on search query and industry
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const matchesSearch = 
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.phone?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesIndustry = 
        industryFilter === "all" || company.industry === industryFilter

      return matchesSearch && matchesIndustry
    })
  }, [companies, searchQuery, industryFilter])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
            <p className="text-muted-foreground">
              Manage your companies and their information
            </p>
          </div>
          <CompanyFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            }
            onSuccess={loadCompanies}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Search companies..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem 
                  key={industry} 
                  value={industry ?? ''} // Handle potential null value
                >
                  {industry ?? 'Unknown Industry'} {/* Show fallback text if null */}
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
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
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
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {companies.length === 0
                      ? "No companies found. Add your first company to get started."
                      : "No companies match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.industry || "-"}</TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{company.phone || "-"}</TableCell>
                    <TableCell>{company.address || "-"}</TableCell>
                    <TableCell className="flex gap-2">
                      <CompanyFormDialog
                        company={company}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        onSuccess={loadCompanies}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id)}
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