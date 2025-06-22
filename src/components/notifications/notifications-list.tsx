"use client";

import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNotifications } from "@/components/providers/notifications-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NotificationsList() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    setLoading(true);
    try {
      await markAsRead(id);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">No notifications</Card>
      ) : (
        notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`p-4 cursor-pointer transition-colors ${
              !notification.read ? "bg-muted/50" : ""
            }`}
            onClick={() => handleMarkAsRead(notification.id)}
          >
            <div className="space-y-1">
              <h3 className="font-medium">{notification.title}</h3>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
