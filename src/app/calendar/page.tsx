"use client"

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import he from 'date-fns/locale/he';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createCalendarEvent } from '@/lib/calendar-events';
import { NewEventForm, type EventFormValues } from './components/new-event-form';

// Setup the localizer for react-big-calendar
const locales = {
  'he': he,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define event type
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('calendar_events')
        .select('*');

      if (supabaseError) {
        throw supabaseError;
      }

      if (data) {
        const formattedEvents: CalendarEvent[] = data.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start_time),
          end: new Date(event.end_time),
          description: event.description,
          location: event.location,
        }));
        setEvents(formattedEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('אירעה שגיאה בטעינת האירועים');
      toast.error('אירעה שגיאה בטעינת האירועים');
    } finally {
      setIsLoading(false);
    }
  };

  const messages = {
    today: 'היום',
    previous: 'הקודם',
    next: 'הבא',
    month: 'חודש',
    week: 'שבוע',
    day: 'יום',
    agenda: 'סדר יום',
    date: 'תאריך',
    time: 'שעה',
    event: 'אירוע',
    noEventsInRange: 'אין אירועים בטווח זה',
  };

  const handleCreateEvent = async (data: EventFormValues) => {
    try {
      const newEvent = await createCalendarEvent({
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      });

      // Refresh events list
      await fetchEvents();
      toast.success('האירוע נוצר בהצלחה');
      setIsNewEventDialogOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('אירעה שגיאה ביצירת האירוע');
    }
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <PageHeader title="לוח שנה" />
        <Button onClick={() => setIsNewEventDialogOpen(true)}>
          <Plus className="h-4 w-4 ml-2" />
          אירוע חדש
        </Button>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[600px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-[600px] text-red-500">
            {error}
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            messages={messages}
            culture="he"
            rtl={true}
            onSelectEvent={(event) => router.push(`/calendar/${event.id}`)}
            views={['month', 'week', 'day', 'agenda']}
          />
        )}
      </Card>

      <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>אירוע חדש</DialogTitle>
          </DialogHeader>
          <NewEventForm onSubmit={handleCreateEvent} onCancel={() => setIsNewEventDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
} 