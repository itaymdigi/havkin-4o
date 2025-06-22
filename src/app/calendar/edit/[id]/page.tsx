"use client";

import { format, parse } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { type EventFormValues, NewEventForm } from "../../components/new-event-form";

interface EventDetails {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  user_id: string;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          toast.error("יש להתחבר כדי לערוך אירוע");
          router.push("/login");
          return;
        }

        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            toast.error("האירוע לא נמצא");
            router.push("/calendar");
            return;
          }
          throw error;
        }

        if (data) {
          setEvent(data as EventDetails);
        }
      } catch (_error) {
        toast.error("אירעה שגיאה בטעינת פרטי האירוע");
        router.push("/calendar");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, router]);

  const handleUpdateEvent = async (data: EventFormValues) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("יש להתחבר כדי לערוך אירוע");
        return;
      }

      // Parse the formatted dates back to ISO format for storage
      const startDate = parse(data.start_time, "dd/MM/yyyy HH:mm", new Date());
      const endDate = parse(data.end_time, "dd/MM/yyyy HH:mm", new Date());

      const { error } = await supabase
        .from("calendar_events")
        .update({
          title: data.title,
          description: data.description || "",
          location: data.location || "",
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("האירוע עודכן בהצלחה");
      router.push("/calendar");
      router.refresh();
    } catch (_error) {
      toast.error("אירעה שגיאה בעדכון האירוע");
    }
  };

  const handleCancel = () => {
    router.push("/calendar");
  };

  if (isLoading || !event) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const formatDateForForm = (isoDate: string) => {
    return format(new Date(isoDate), "dd/MM/yyyy HH:mm");
  };

  const initialValues: EventFormValues = {
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    start_time: formatDateForForm(event.start_time),
    end_time: formatDateForForm(event.end_time),
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" dir="rtl">
        <Dialog open={true}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>עריכת אירוע</DialogTitle>
            </DialogHeader>
            <NewEventForm
              onSubmit={handleUpdateEvent}
              onCancel={handleCancel}
              initialValues={initialValues}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
