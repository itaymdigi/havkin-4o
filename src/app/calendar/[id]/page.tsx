'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

interface EventDetails {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  created_at: string;
  user_id: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function EventDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        // First verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          toast.error('יש להתחבר כדי לצפות באירוע');
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            toast.error('האירוע לא נמצא');
            router.push('/calendar');
            return;
          }
          throw error;
        }

        if (data) {
          setEvent(data as EventDetails);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        toast.error('אירעה שגיאה בטעינת פרטי האירוע');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchEventDetails();
    }
  }, [params.id, router]);

  const handleDelete = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast.error('יש להתחבר כדי למחוק אירוע');
        return;
      }

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('האירוע נמחק בהצלחה');
      router.push('/calendar');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('אירעה שגיאה במחיקת האירוע');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold">האירוע לא נמצא</h2>
            <Button
              variant="link"
              onClick={() => router.push('/calendar')}
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
      <div className="container mx-auto p-6" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <PageHeader title={event.title} backUrl="/calendar" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push(`/calendar/${params.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
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
                <div>
                  <h3 className="font-semibold mb-2">מיקום</h3>
                  <p>{event.location}</p>
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
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                מחק
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
} 