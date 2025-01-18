import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Building2, FileText, Calendar, ArrowUpRight } from "lucide-react"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { formatDateTime, formatCurrency } from "@/lib/utils"
import { cookies } from "next/headers"
import type { CalendarEvent } from "@/types"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { startOfYear, endOfYear, format, subYears, startOfMonth, endOfMonth, subMonths } from "date-fns"

// Server component to fetch dashboard data
export const revalidate = 60 // Revalidate every 60 seconds

// Add metadata export
export const metadata = {
  title: 'Dashboard',
  description: 'View your business analytics and metrics',
}

// Add dynamic configuration
export const dynamic = 'force-dynamic'

async function getDashboardData() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("User not authenticated")

    // Get date ranges
    const now = new Date()
    const currentYear = now.getFullYear()
    const lastYear = currentYear - 1
    
    const startCurrentYear = startOfYear(now)
    const endCurrentYear = endOfYear(now)
    const startLastYear = startOfYear(subYears(now, 1))
    const endLastYear = endOfYear(subYears(now, 1))
    
    const currentMonth = startOfMonth(now)
    const lastMonth = startOfMonth(subMonths(now, 1))

    // Fetch all required data in parallel
    const [
      { data: contacts, error: contactsError },
      { data: companies, error: companiesError },
      { data: events, error: eventsError },
      { data: currentYearOffers, error: currentYearOffersError },
      { data: lastYearOffers, error: lastYearOffersError },
      { data: currentMonthOffers, error: currentMonthOffersError },
      { data: lastMonthOffers, error: lastMonthOffersError },
      { data: uploadedFiles, error: filesError },
      { count: totalOffers, error: totalOffersError }
    ] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", user.id),
      supabase.from("companies").select("*").eq("user_id", user.id),
      supabase.from("calendar_events")
        .select(`*, contact:contacts(first_name, last_name)`)
        .eq("user_id", user.id)
        .order("start_time", { ascending: true }),
      // Current year offers with items
      supabase.from("price_offers")
        .select(`
          created_at,
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", user.id)
        .gte("created_at", startCurrentYear.toISOString())
        .lte("created_at", endCurrentYear.toISOString()),
      // Last year offers with items
      supabase.from("price_offers")
        .select(`
          created_at,
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", user.id)
        .gte("created_at", startLastYear.toISOString())
        .lte("created_at", endLastYear.toISOString()),
      // Current month offers with items
      supabase.from("price_offers")
        .select(`
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", user.id)
        .gte("created_at", currentMonth.toISOString()),
      // Last month offers with items
      supabase.from("price_offers")
        .select(`
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", user.id)
        .gte("created_at", lastMonth.toISOString())
        .lt("created_at", currentMonth.toISOString()),
      // Uploaded files
      supabase.from("files")
        .select("*")
        .eq("uploaded_by", user.id),
      // Total price offers
      supabase.from("price_offers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
    ])

    // Handle errors
    if (contactsError) console.error("Error fetching contacts:", contactsError)
    if (companiesError) console.error("Error fetching companies:", companiesError)
    if (eventsError) console.error("Error fetching events:", eventsError)
    if (currentYearOffersError) console.error("Error fetching current year offers:", currentYearOffersError)
    if (lastYearOffersError) console.error("Error fetching last year offers:", lastYearOffersError)
    if (filesError) console.error("Error fetching files:", filesError)
    if (totalOffersError) console.error("Error fetching total offers:", totalOffersError)

    // Calculate monthly data for both years
    const getMonthlyData = (offers: any[]) => {
      const monthlyTotals = Array(12).fill(0)
      offers?.forEach(offer => {
        const month = new Date(offer.created_at).getMonth()
        // Calculate total from items
        const offerTotal = offer.price_offer_items?.reduce((sum: number, item: any) => {
          const amount = item.currency === 'USD' ? 
            (item.quantity * item.unit_price * 3.7) : // Convert USD to ILS
            (item.quantity * item.unit_price)
          return sum + amount
        }, 0) || 0
        monthlyTotals[month] += offerTotal
      })
      return monthlyTotals
    }

    const currentYearMonthly = getMonthlyData(currentYearOffers || [])
    const lastYearMonthly = getMonthlyData(lastYearOffers || [])

    // Calculate totals
    const calculateTotal = (offers: any[]) => {
      return offers?.reduce((sum, offer) => {
        const offerTotal = offer.price_offer_items?.reduce((itemSum: number, item: any) => {
          const amount = item.currency === 'USD' ? 
            (item.quantity * item.unit_price * 3.7) : // Convert USD to ILS
            (item.quantity * item.unit_price)
          return itemSum + amount
        }, 0) || 0
        return sum + offerTotal
      }, 0) || 0
    }

    const currentYearTotal = calculateTotal(currentYearOffers || [])
    const lastYearTotal = calculateTotal(lastYearOffers || [])
    const currentMonthTotal = calculateTotal(currentMonthOffers || [])
    const lastMonthTotal = calculateTotal(lastMonthOffers || [])

    // Calculate year-over-year and month-over-month changes
    const yearChange = lastYearTotal ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100 : 0
    const monthChange = lastMonthTotal ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0

    // Filter upcoming events for next 7 days
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    
    const upcomingEvents = (events as CalendarEvent[] | null)?.filter(
      (event: CalendarEvent) => 
        new Date(event.start_time) >= now && 
        new Date(event.start_time) <= nextWeek
    ) || []

    return {
      totalContacts: contacts?.length || 0,
      totalCompanies: companies?.length || 0,
      totalFiles: uploadedFiles?.length || 0,
      totalOffers: totalOffers || 0,
      upcomingEvents,
      salesData: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        data2022: lastYearMonthly,
        data2023: currentYearMonthly,
      },
      yearlyTotal: currentYearTotal,
      yearChange,
      monthlyTotal: currentMonthTotal,
      monthChange,
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      totalContacts: 0,
      totalCompanies: 0,
      totalFiles: 0,
      totalOffers: 0,
      upcomingEvents: [],
      salesData: {
        months: [],
        data2022: [],
        data2023: [],
      },
      yearlyTotal: 0,
      yearChange: 0,
      monthlyTotal: 0,
      monthChange: 0,
    }
  }
}

export default async function DashboardPage() {
  const {
    totalContacts,
    totalCompanies,
    totalFiles,
    totalOffers,
    upcomingEvents,
    salesData,
    yearlyTotal,
    yearChange,
    monthlyTotal,
    monthChange,
  } = await getDashboardData()

  const stats = [
    {
      name: "Total Contacts",
      value: totalContacts,
      icon: Users,
      description: "Active contacts in your CRM",
    },
    {
      name: "Companies",
      value: totalCompanies,
      icon: Building2,
      description: "Registered companies",
    },
    {
      name: "Price Offers",
      value: totalOffers,
      icon: FileText,
      description: "Total price offers created",
    },
    {
      name: "Uploaded Files",
      value: totalFiles,
      icon: FileText,
      description: "Total files in storage",
    },
    {
      name: "Upcoming Events",
      value: upcomingEvents.length,
      icon: Calendar,
      description: "Scheduled for next 7 days",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales Overview Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">Sales Overview</CardTitle>
              </div>
              <select className="rounded-md border px-3 py-1 text-sm">
                <option>{format(new Date(), 'MMMM yyyy')}</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <BarChart data={salesData} />
              </div>
            </CardContent>
          </Card>

          {/* Yearly and Monthly Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Yearly Breakup</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-3xl font-bold">{formatCurrency(yearlyTotal)}</span>
                    <span className={`ml-2 text-sm ${yearChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <ArrowUpRight className={`inline h-4 w-4 ${yearChange < 0 ? 'rotate-45' : ''}`} />
                      {yearChange >= 0 ? '+' : ''}{yearChange.toFixed(1)}% last year
                    </span>
                  </div>
                </div>
                <div className="h-[100px]">
                  <LineChart />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div>
                <h3 className="text-lg font-medium">Monthly Earnings</h3>
                <div className="mt-2 flex items-baseline">
                  <span className="text-3xl font-bold">{formatCurrency(monthlyTotal)}</span>
                  <span className={`ml-2 text-sm ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight className={`inline h-4 w-4 ${monthChange < 0 ? 'rotate-45' : ''}`} />
                    {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(1)}% last month
                  </span>
                </div>
                <div className="h-[100px] mt-4">
                  <LineChart />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions and Product Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(new Date(event.start_time))}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                    <p className="text-2xl font-bold">{totalContacts}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                    <p className="text-2xl font-bold">{totalCompanies}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                    <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 