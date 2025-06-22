import { DashboardLayout } from "@/components/dashboard-layout";
import { NotificationsList } from "@/components/notifications/notifications-list";

export const metadata = {
  title: "Notifications",
  description: "View your notifications",
};

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
        <NotificationsList />
      </div>
    </DashboardLayout>
  );
}
