import { DashboardLayout } from "@/components/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, Building2, FileText, Calendar } from "lucide-react"
import { createServerClient } from "@/lib/supabase-server"
import { formatDateTime } from "@/lib/utils"
import { cookies } from "next/headers"
import type { CalendarEvent } from "@/types"

// Server component to fetch dashboard data
async function getDashboardData() {
  try {
    // Create server supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Fetch all required data in parallel
    const [
      { data: contacts, error: contactsError },
      { data: companies, error: companiesError },
      { data: events, error: eventsError },
      { count: priceOffersCount, error: offersError }
    ] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", user.id),
      supabase.from("companies").select("*").eq("user_id", user.id),
      supabase.from("calendar_events")
        .select(`
          *,
          contact:contacts(first_name, last_name)
        `)
        .eq("user_id", user.id)
        .order("start_time", { ascending: true }),
      supabase
        .from("price_offers")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)
        .gte("created_at", new Date(new Date().setDate(1)).toISOString())
    ])

    // Handle any errors
    if (contactsError) console.error("Error fetching contacts:", contactsError)
    if (companiesError) console.error("Error fetching companies:", companiesError)
    if (eventsError) console.error("Error fetching events:", eventsError)
    if (offersError) console.error("Error fetching price offers:", offersError)

    // Filter upcoming events for next 7 days
    const now = new Date()
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
      monthlyPriceOffers: priceOffersCount || 0,
      upcomingEvents: upcomingEvents,
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      totalContacts: 0,
      totalCompanies: 0,
      monthlyPriceOffers: 0,
      upcomingEvents: [],
    }
  }
}

export default async function DashboardPage() {
  const {
    totalContacts,
    totalCompanies,
    monthlyPriceOffers,
    upcomingEvents,
  } = await getDashboardData()

  const stats = [
    {
      name: "Total Contacts",
      value: totalContacts.toString(),
      icon: Users,
      description: "Active contacts in your CRM",
    },
    {
      name: "Companies",
      value: totalCompanies.toString(),
      icon: Building2,
      description: "Registered companies",
    },
    {
      name: "Price Offers",
      value: monthlyPriceOffers.toString(),
      icon: FileText,
      description: "Created this month",
    },
    {
      name: "Upcoming Events",
      value: upcomingEvents.length.toString(),
      icon: Calendar,
      description: "Scheduled for next 7 days",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your business activities
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent interactions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No recent activity to display.
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Your scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map((event: CalendarEvent) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.contact ? `${event.contact.first_name} ${event.contact.last_name}` : 'No contact'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(new Date(event.start_time))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No upcoming events scheduled.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
} 