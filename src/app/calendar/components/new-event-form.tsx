import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { format, parse } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { LocationInput } from '@/components/location-input';

const eventSchema = z.object({
  title: z.string().min(1, 'כותרת האירוע נדרשת'),
  description: z.string().optional(),
  location: z.string().optional(),
  start_time: z.string().min(1, 'תאריך ושעת התחלה נדרשים'),
  end_time: z.string().min(1, 'תאריך ושעת סיום נדרשים'),
});

export type EventFormValues = z.infer<typeof eventSchema>;

interface NewEventFormProps {
  onSubmit: (data: EventFormValues) => Promise<void>;
  onCancel: () => void;
  initialDate?: Date;
  initialValues?: EventFormValues;
}

export function NewEventForm({ onSubmit, onCancel, initialDate, initialValues }: NewEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Format initial dates
  const now = initialDate || new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // Set the time to the start of the hour for better UX
  if (initialDate) {
    now.setMinutes(0);
    oneHourLater.setMinutes(0);
  }

  const formatDateForInput = (date: Date) => {
    return format(date, 'dd/MM/yyyy HH:mm');
  };

  const parseInputToDate = (value: string) => {
    try {
      return parse(value, 'dd/MM/yyyy HH:mm', new Date());
    } catch (error) {
      return null;
    }
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialValues || {
      title: '',
      description: '',
      location: '',
      start_time: formatDateForInput(now),
      end_time: formatDateForInput(oneHourLater),
    },
  });

  const handleSubmit = async (data: EventFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>כותרת</FormLabel>
              <FormControl>
                <Input placeholder="הכנס כותרת לאירוע" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>מועד התחלה</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="DD/MM/YYYY HH:mm"
                    value={value}
                    onChange={(e) => {
                      onChange(e.target.value);
                      const newStartDate = parseInputToDate(e.target.value);
                      if (newStartDate) {
                        const currentEndDate = parseInputToDate(form.getValues('end_time'));
                        if (currentEndDate && currentEndDate <= newStartDate) {
                          const newEndDate = new Date(newStartDate.getTime() + 60 * 60 * 1000);
                          form.setValue('end_time', formatDateForInput(newEndDate));
                        }
                      }
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>מועד סיום</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="DD/MM/YYYY HH:mm"
                    value={value}
                    onChange={(e) => {
                      const endDate = parseInputToDate(e.target.value);
                      const startDate = parseInputToDate(form.getValues('start_time'));
                      if (endDate && startDate && endDate <= startDate) {
                        toast.error('מועד הסיום חייב להיות אחרי מועד ההתחלה');
                        return;
                      }
                      onChange(e.target.value);
                    }}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>מיקום</FormLabel>
              <FormControl>
                <LocationInput 
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="הכנס מיקום (אופציונלי)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>תיאור</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="הכנס תיאור לאירוע (אופציונלי)" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            ביטול
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              initialValues ? 'עדכן אירוע' : 'צור אירוע'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 