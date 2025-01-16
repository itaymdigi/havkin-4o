import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

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
}

export function NewEventForm({ onSubmit, onCancel }: NewEventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      start_time: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour later
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>מועד התחלה</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>מועד סיום</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
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
                <Input placeholder="הכנס מיקום (אופציונלי)" {...field} />
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
              'צור אירוע'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 