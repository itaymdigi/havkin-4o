"use client"

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import he from 'date-fns/locale/he';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createCalendarEvent, getCalendarEvents } from '@/lib/calendar-events';
import { NewEventForm } from './components/new-event-form';
import { DashboardLayout } from "@/components/dashboard-layout";

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

interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
}

import { ToolbarProps as BigCalendarToolbarProps } from 'react-big-calendar';

type ToolbarProps = BigCalendarToolbarProps<CalendarEvent>;

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewEventDialogOpen, setIsNewEventDialogOpen] = useState(false);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getCalendarEvents();

      const formattedEvents: CalendarEvent[] = data.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        description: event.description || undefined,
        location: event.location || undefined,
      }));
      setEvents(formattedEvents);
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
    allDay: 'כל היום',
    work_week: 'שבוע עבודה',
    yesterday: 'אתמול',
    tomorrow: 'מחר',
    showMore: (total: number) => `עוד ${total}`,
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      const startDate = parse(data.start_time, 'dd/MM/yyyy HH:mm', new Date());
      const endDate = parse(data.end_time, 'dd/MM/yyyy HH:mm', new Date());

      if (!startDate || !endDate) {
        toast.error('פורמט התאריך אינו תקין');
        return;
      }

      await createCalendarEvent({
        title: data.title,
        description: data.description || '',
        location: data.location || '',
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        user_id: null, // This will be set by the API
        contact_id: null
      });

      await fetchEvents(); // Refresh the events list
      toast.success('האירוע נוצר בהצלחה');
      setIsNewEventDialogOpen(false);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('אירעה שגיאה ביצירת האירוע');
    }
  };

  // Custom event formats
  const formats = {
    dateFormat: 'dd',
    monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: he }),
    dayHeaderFormat: (date: Date) => format(date, 'EEEE dd/MM/yyyy', { locale: he }),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'dd/MM/yyyy', { locale: he })} - ${format(end, 'dd/MM/yyyy', { locale: he })}`,
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'HH:mm', { locale: he })} - ${format(end, 'HH:mm', { locale: he })}`,
    timeGutterFormat: (date: Date) => format(date, 'HH:mm', { locale: he }),
    agendaDateFormat: (date: Date) => format(date, 'dd/MM/yyyy', { locale: he }),
    agendaTimeFormat: (date: Date) => format(date, 'HH:mm', { locale: he }),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'HH:mm', { locale: he })} - ${format(end, 'HH:mm', { locale: he })}`,
  };

  return (
    <DashboardLayout>
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
              formats={formats}
              components={{
                toolbar: (props: ToolbarProps) => (
                  <div className="flex justify-between items-center mb-4 p-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => props.onNavigate('PREV')}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => props.onNavigate('NEXT')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => props.onNavigate('TODAY')}
                      >
                        {messages.today}
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold">
                      {format(props.date, 'MMMM yyyy', { locale: he })}
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onView(Views.MONTH)}
                        className={props.view === Views.MONTH ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {messages.month}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onView(Views.WEEK)}
                        className={props.view === Views.WEEK ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {messages.week}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onView(Views.DAY)}
                        className={props.view === Views.DAY ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {messages.day}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => props.onView(Views.AGENDA)}
                        className={props.view === Views.AGENDA ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {messages.agenda}
                      </Button>
                    </div>
                  </div>
                ),
              }}
              view={view}
              onView={(newView: string) => setView(newView as typeof view)}
              date={date}
              onNavigate={setDate}
              onSelectEvent={(event) => router.push(`/calendar/${event.id}`)}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              popup
              selectable
              onSelectSlot={(slotInfo) => {
                setDate(slotInfo.start);
                setIsNewEventDialogOpen(true);
              }}
            />
          )}
        </Card>

        <Dialog open={isNewEventDialogOpen} onOpenChange={setIsNewEventDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>אירוע חדש</DialogTitle>
            </DialogHeader>
            <NewEventForm 
              onSubmit={(data: EventFormData) => handleCreateEvent(data)} 
              onCancel={() => setIsNewEventDialogOpen(false)}
              initialDate={date}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 