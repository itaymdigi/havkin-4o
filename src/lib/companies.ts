import type { Company } from "@/types";

export async function getCompanies(): Promise<Company[]> {
  const response = await fetch("/api/companies");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch companies");
  }

  return response.json();
}

export async function createCompany(
  company: Omit<Company, "id" | "created_at" | "updated_at">
): Promise<Company> {
  const response = await fetch("/api/companies", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(company),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create company");
  }

  return response.json();
}

export async function updateCompany(id: string, company: Partial<Company>): Promise<Company> {
  const response = await fetch(`/api/companies/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(company),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update company");
  }

  return response.json();
}

export async function deleteCompany(id: string): Promise<void> {
  const response = await fetch(`/api/companies/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete company");
  }
}
