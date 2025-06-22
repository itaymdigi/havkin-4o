'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapView } from '@/components/map-view';

interface EventDetails {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  created_at: string;
  user_id: string;
  contact_id?: string | null;
}

interface SupabaseError {
  code: string;
  message: string;
  details?: string;
}

export default function EventDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, isLoading: authLoading, userId } = useAuth();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        
        if (authLoading) return; // Wait for auth to load
        
        if (!user || !userId) {
          toast.error('יש להתחבר כדי לצפות באירוע');
          router.push('/login');
          return;
        }

        // Use fetch to call our API route
        const response = await fetch(`/api/calendar-events/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('האירוע לא נמצא');
            router.push('/calendar');
            return;
          }
          throw new Error('Failed to fetch event');
        }

        const data = await response.json();

        setEvent({
          ...data,
          description: data.description || undefined,
          location: data.location || undefined,
          contact_id: data.contact_id || null,
        } as EventDetails);
      } catch (error: unknown) {
        const err = error as Error | SupabaseError;
        console.error('Error fetching event details:', err);
        toast.error('אירעה שגיאה בטעינת פרטי האירוע');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, router, user, userId, authLoading]);

  const handleDelete = async () => {
    try {
      if (!user || !userId) {
        toast.error('יש להתחבר כדי למחוק אירוע');
        return;
      }

      const response = await fetch(`/api/calendar-events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('האירוע נמחק בהצלחה');
      router.push('/calendar');
      router.refresh();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('אירעה שגיאה במחיקת האירוע');
    }
  };

  const handleClose = () => {
    router.push('/calendar');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="container py-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">האירוע לא נמצא</h2>
            <p className="mt-2 text-gray-600">האירוע המבוקש אינו קיים או שאין לך הרשאות לצפות בו</p>
            <Button
              onClick={handleClose}
              className="mt-4"
            >
              חזור ללוח השנה
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              סגור
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/calendar/edit/${event.id}`)}
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              ערוך
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              מחק
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>פרטי האירוע</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">מועד התחלה</h3>
                <p>{format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">מועד סיום</h3>
                <p>{format(new Date(event.end_time), 'dd/MM/yyyy HH:mm', { locale: he })}</p>
              </div>
              {event.location && (
                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">מיקום</h3>
                  <p className="mb-4">{event.location}</p>
                  <MapView address={event.location} className="w-full" />
                </div>
              )}
              {event.description && (
                <div className="col-span-2">
                  <h3 className="font-semibold mb-2">תיאור</h3>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את האירוע?</AlertDialogTitle>
              <AlertDialogDescription>
                פעולה זו היא בלתי הפיכה. האירוע יימחק לצמיתות.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
} 