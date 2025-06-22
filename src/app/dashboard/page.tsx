import { endOfYear, format, startOfMonth, startOfYear, subMonths, subYears } from "date-fns";
import { ArrowUpRight, Building2, Calendar, FileText, Users } from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthenticatedUser } from "@/lib/clerk-server";
import { formatCurrency } from "@/lib/utils";
import type { CalendarEvent } from "@/types";

// Server component to fetch dashboard data
export const revalidate = 60; // Revalidate every 60 seconds

// Add metadata export
export const metadata = {
  title: "Dashboard",
  description: "View your business analytics and metrics",
};

// Add dynamic configuration
export const dynamic = "force-dynamic";

interface PriceOfferItem {
  quantity: number;
  unit_price: number;
  currency: "USD" | "ILS";
}

interface SupabasePriceOffer {
  created_at: string;
  price_offer_items: PriceOfferItem[];
}

interface MonthlyPriceOffer {
  price_offer_items: PriceOfferItem[];
}

async function getDashboardData() {
  try {
    const { userId, supabase } = await getAuthenticatedUser();

    // Get date ranges
    const now = new Date();

    const startCurrentYear = startOfYear(now);
    const endCurrentYear = endOfYear(now);
    const startLastYear = startOfYear(subYears(now, 1));
    const endLastYear = endOfYear(subYears(now, 1));

    const currentMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));

    // Fetch all required data in parallel
    const [
      { data: contacts, error: contactsError },
      { data: companies, error: companiesError },
      { data: events, error: eventsError },
      { data: currentYearOffers, error: currentYearOffersError },
      { data: lastYearOffers, error: lastYearOffersError },
      { data: currentMonthOffers },
      { data: lastMonthOffers },
      { data: uploadedFiles, error: filesError },
      { count: totalOffers, error: totalOffersError },
    ] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", userId),
      supabase.from("companies").select("*").eq("user_id", userId),
      supabase
        .from("calendar_events")
        .select("*, contact:contacts(first_name, last_name)")
        .eq("user_id", userId)
        .order("start_time", { ascending: true }),
      // Current year offers with items
      supabase
        .from("price_offers")
        .select(`
          created_at,
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", userId)
        .gte("created_at", startCurrentYear.toISOString())
        .lte("created_at", endCurrentYear.toISOString()),
      // Last year offers with items
      supabase
        .from("price_offers")
        .select(`
          created_at,
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", userId)
        .gte("created_at", startLastYear.toISOString())
        .lte("created_at", endLastYear.toISOString()),
      // Current month offers with items
      supabase
        .from("price_offers")
        .select(`
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", userId)
        .gte("created_at", currentMonth.toISOString()),
      // Last month offers with items
      supabase
        .from("price_offers")
        .select(`
          price_offer_items (
            quantity,
            unit_price,
            currency
          )
        `)
        .eq("user_id", userId)
        .gte("created_at", lastMonth.toISOString())
        .lt("created_at", currentMonth.toISOString()),
      // Uploaded files
      supabase
        .from("files")
        .select("*")
        .eq("uploaded_by", userId),
      // Total price offers
      supabase
        .from("price_offers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    // Handle errors
    if (contactsError) {
    }
    if (companiesError) {
    }
    if (eventsError) {
    }
    if (currentYearOffersError) {
    }
    if (lastYearOffersError) {
    }
    if (filesError) {
    }
    if (totalOffersError) {
    }

    // Calculate monthly data for both years
    const getMonthlyData = (offers: SupabasePriceOffer[] | null) => {
      const monthlyTotals = Array(12).fill(0);
      offers?.forEach((offer) => {
        const month = new Date(offer.created_at).getMonth();
        // Calculate total from items
        const offerTotal =
          offer.price_offer_items?.reduce((sum: number, item: PriceOfferItem) => {
            const amount =
              item.currency === "USD"
                ? item.quantity * item.unit_price * 3.7
                : // Convert USD to ILS
                  item.quantity * item.unit_price;
            return sum + amount;
          }, 0) || 0;
        monthlyTotals[month] += offerTotal;
      });
      return monthlyTotals;
    };

    const calculateMonthlyTotal = (offers: MonthlyPriceOffer[] | null) => {
      return (
        offers?.reduce((sum, offer) => {
          const offerTotal =
            offer.price_offer_items?.reduce((itemSum: number, item: PriceOfferItem) => {
              const amount =
                item.currency === "USD"
                  ? item.quantity * item.unit_price * 3.7
                  : // Convert USD to ILS
                    item.quantity * item.unit_price;
              return itemSum + amount;
            }, 0) || 0;
          return sum + offerTotal;
        }, 0) || 0
      );
    };

    const calculateTotal = (offers: SupabasePriceOffer[] | null) => {
      return (
        offers?.reduce((sum, offer) => {
          const offerTotal =
            offer.price_offer_items?.reduce((itemSum: number, item: PriceOfferItem) => {
              const amount =
                item.currency === "USD"
                  ? item.quantity * item.unit_price * 3.7
                  : // Convert USD to ILS
                    item.quantity * item.unit_price;
              return itemSum + amount;
            }, 0) || 0;
          return sum + offerTotal;
        }, 0) || 0
      );
    };

    const currentYearMonthly = getMonthlyData(currentYearOffers);
    const lastYearMonthly = getMonthlyData(lastYearOffers);
    const currentMonthTotal = calculateMonthlyTotal(currentMonthOffers);
    const lastMonthTotal = calculateMonthlyTotal(lastMonthOffers);
    const currentYearTotal = calculateTotal(currentYearOffers);
    const lastYearTotal = calculateTotal(lastYearOffers);

    // Calculate year-over-year and month-over-month changes
    const yearChange = lastYearTotal
      ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100
      : 0;
    const monthChange = lastMonthTotal
      ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    // Filter upcoming events for next 7 days
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const upcomingEvents =
      (events as CalendarEvent[] | null)?.filter(
        (event: CalendarEvent) =>
          new Date(event.start_time) >= now && new Date(event.start_time) <= nextWeek
      ) || [];

    return {
      totalContacts: contacts?.length || 0,
      totalCompanies: companies?.length || 0,
      totalFiles: uploadedFiles?.length || 0,
      totalOffers: totalOffers || 0,
      upcomingEvents,
      salesData: {
        months: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ],
        data2022: lastYearMonthly,
        data2023: currentYearMonthly,
      },
      yearlyTotal: currentYearTotal,
      yearChange,
      monthlyTotal: currentMonthTotal,
      monthChange,
    };
  } catch (_error) {
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
    };
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
  } = await getDashboardData();

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
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your business performance and activities
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, index) => (
            <Card
              key={stat.name}
              className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg ${index === 0 ? "bg-primary/10" : "bg-muted/50"}`}>
                  <stat.icon
                    className={`h-4 w-4 ${index === 0 ? "text-primary" : "text-muted-foreground"}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
              {index === 0 && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-3xl" />
              )}
            </Card>
          ))}
        </div>

        {/* Revenue Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Total Revenue
                </CardTitle>
                <div className="flex items-baseline mt-2">
                  <span className="text-3xl font-bold text-foreground">
                    {formatCurrency(yearlyTotal)}
                  </span>
                  <span
                    className={`ml-2 text-sm flex items-center ${yearChange >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    <ArrowUpRight className={`h-4 w-4 mr-1 ${yearChange < 0 ? "rotate-45" : ""}`} />
                    {yearChange >= 0 ? "+" : ""}
                    {yearChange.toFixed(1)}% from last month
                  </span>
                </div>
              </div>
              <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option>{format(new Date(), "MMMM yyyy")}</option>
              </select>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] chart-container">
                <BarChart data={salesData} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Subscriptions</CardTitle>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">
                  +{(monthlyTotal / 1000).toFixed(1)}K
                </span>
                <span className="ml-2 text-sm text-green-400 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />+{Math.abs(monthChange).toFixed(1)}% from
                  last month
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <LineChart />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards and Team Members */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Upgrade Plan Card */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Upgrade your subscription
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                You are currently on the free plan. Upgrade to the pro plan to get access to all
                features.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Name</label>
                  <input
                    type="text"
                    placeholder="Evil Rabbit"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    placeholder="example@acme.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Card Number</label>
                <input
                  type="text"
                  placeholder="1234 1234 1234 1234"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-4">
                <button className="flex-1 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80">
                  Cancel
                </button>
                <button className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Upgrade Plan
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Create Account Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">
                Create an account
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                  GitHub
                </button>
                <button className="flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Google
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">OR CONTINUE WITH</span>
                </div>
              </div>
              <div className="space-y-2">
                <input
                  type="email"
                  placeholder="m@example.com"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Create account
              </button>
            </CardContent>
          </Card>

          {/* Team Members Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Team Members</CardTitle>
              <p className="text-sm text-muted-foreground">
                Invite your team members to collaborate.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  S
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Sofia Davis</p>
                  <p className="text-xs text-muted-foreground">m@example.com</p>
                </div>
                <select className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground">
                  <option>Owner</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Hi, how can I help you today?</div>
                <div className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                  Hey, I&apos;m having trouble with my account.
                </div>
                <div className="text-sm text-muted-foreground">What seems to be the problem?</div>
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
                  I can&apos;t log in.
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <button className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                  →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
