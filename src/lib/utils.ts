import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatInTimeZone } from "date-fns-tz"
import { he } from "date-fns/locale"

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to locale string with Israel timezone
export function formatDate(date: Date): string {
  return formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy', { locale: he })
}

// Format date and time with Israel timezone
export function formatDateTime(date: Date): string {
  return formatInTimeZone(date, 'Asia/Jerusalem', 'dd/MM/yyyy HH:mm', { locale: he })
}

// Convert local date to Israel timezone ISO string
export function toIsraelTimezone(date: Date): string {
  return formatInTimeZone(date, 'Asia/Jerusalem', "yyyy-MM-dd'T'HH:mm")
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  }).format(amount)
}

// Generate a consistent color based on a string (contact ID in our case)
export function stringToColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

// Get event style based on contact
export function getEventStyle(event: { contact_id: string | null }) {
  if (!event.contact_id) {
    return {
      style: {
        backgroundColor: "#3b82f6", // Default blue color
      },
    }
  }

  const backgroundColor = stringToColor(event.contact_id)
  return {
    style: {
      backgroundColor,
    },
  }
}
