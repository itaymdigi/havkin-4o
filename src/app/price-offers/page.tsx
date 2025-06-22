'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PriceOffer, PriceOfferItem } from '@/types/price-offer';
import { Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/use-auth';
import { generatePriceOfferPDF } from '@/lib/pdf-utils';
import { DashboardLayout } from "@/components/dashboard-layout";

// Validation schema
const priceOfferSchema = z.object({
  customer: z.object({
    name: z.string().min(2, { message: 'נא להזין שם מלא' }),
    email: z.string().email({ message: 'נא להזין כתובת אימייל תקינה' }),
    phone: z.string().min(9, { message: 'נא להזין מספר טלפון תקין' }),
    address: z.string().min(5, { message: 'נא להזין כתובת מלאה' }),
    company: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, { message: 'נא להזין תיאור לפריט' }),
    quantity: z.coerce.number().min(1, { message: 'כמות חייבת להיות לפחות 1' }),
    unitPrice: z.coerce.number().min(0, { message: 'מחיר חייב להיות חיובי' }),
    total: z.number(),
    currency: z.enum(['USD', 'ILS']),
  })).optional().default([]),
  notes: z.string().optional().default(''),
  validUntil: z.string(),
});

export default function PriceOffersPage() {
  const router = useRouter();
  const { user, isLoading, userId } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [items, setItems] = useState<PriceOfferItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  const form = useForm<z.infer<typeof priceOfferSchema>>({
    resolver: zodResolver(priceOfferSchema),
    defaultValues: {
      customer: {
        name: '',
        email: '',
        phone: '',
        address: '',
        company: '',
      },
      items: [],
      notes: '',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle auth state - redirect to login if not authenticated
  useEffect(() => {
    if (isClient && !isLoading && !user) {
      router.replace('/login?redirectTo=/price-offers');
    }
  }, [isClient, isLoading, user, router]);

  // Update form items when items state changes
  useEffect(() => {
    const formattedItems = items.map(item => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Number(item.total),
    }));
    form.setValue('items', formattedItems, { shouldValidate: true });
  }, [items, form]);

  // Show loading state while checking auth
  if (isLoading || !isClient || !user) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>טוען...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const updateItemTotal = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    if (value < 0) return;
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = Number((newItems[index].quantity * newItems[index].unitPrice).toFixed(2));
    setItems(newItems);
  };

  const updateItemCurrency = (index: number, currency: 'USD' | 'ILS') => {
    const newItems = [...items];
    newItems[index].currency = currency;
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const amount = item.currency === 'USD' ? item.total * 3.7 : item.total;
      return sum + amount;
    }, 0);
    
    return {
      subtotal,
      tax: subtotal * 0.18,
      total: subtotal * 1.18
    };
  };

  // Add form submission handler
  const onSubmit = form.handleSubmit(async (formData) => {
    try {
      if (!userId) {
        toast.error('יש להתחבר למערכת');
        router.push('/login');
        return;
      }

      // Validate items array
      if (items.length === 0) {
        toast.error('נא להוסיף לפחות פריט אחד');
        return;
      }

      // Create the price offer data first
      const totals = calculateTotals();
      const priceOffer: PriceOffer = {
        id: crypto.randomUUID(),
        customer: formData.customer,
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        date: new Date().toISOString(),
        validUntil: formData.validUntil,
        notes: formData.notes || '',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
      };

      setIsGenerating(true);

      try {
        // Save the price offer via API route
        const response = await fetch('/api/price-offers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(priceOffer),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save price offer');
        }

        await response.json(); // Parse response but don't store in unused variable
        toast.success('הצעת המחיר נשמרה בהצלחה');
        
                  // Generate PDF using our new client-side function
          const pdfUrl = generatePriceOfferPDF(priceOffer);
          
          // Open PDF in new tab
          window.open(pdfUrl, '_blank');
        toast.success('ה-PDF נוצר בהצלחה');
        
        // Reset form for new price offer
        form.reset();
        setItems([]);
        
      } catch (error) {
        console.error('Error in save/generate process:', error);
        toast.error(error instanceof Error ? error.message : 'אירעה שגיאה בשמירת הצעת המחיר');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error instanceof Error ? error.message : 'אירעה שגיאה ביצירת הצעת המחיר');
    } finally {
      setIsGenerating(false);
    }
  });

  const addItem = () => {
    const newItem: PriceOfferItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      currency: 'ILS',
    };
    setItems([...items, newItem]);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6" dir="rtl">
        <PageHeader title="הצעת מחיר חדשה" />
        
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">פרטי לקוח</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customer.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם מלא</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="שם מלא"
                              className="text-right"
                              id="customer-name"
                              autoComplete="name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customer.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימייל</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="אימייל"
                              type="email"
                              className="text-right"
                              id="customer-email"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customer.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="טלפון"
                              className="text-right"
                              id="customer-phone"
                              autoComplete="tel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customer.company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>חברה (אופציונלי)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="חברה (אופציונלי)"
                              className="text-right"
                              id="customer-company"
                              autoComplete="organization"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="customer.address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>כתובת</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="כתובת"
                              className="text-right"
                              id="customer-address"
                              autoComplete="street-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">פריטים</h3>
                    <Button type="button" onClick={addItem}>הוסף פריט</Button>
                  </div>

                  {items.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      לא נוספו פריטים. לחץ על &quot;הוסף פריט&quot; כדי להתחיל.
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-semibold mb-2">
                        <div className="md:col-span-4">תיאור</div>
                        <div className="md:col-span-2">כמות</div>
                        <div className="md:col-span-2">מחיר ליחידה</div>
                        <div className="md:col-span-2">מטבע</div>
                        <div className="md:col-span-1">סה&quot;כ</div>
                        <div className="md:col-span-1"></div>
                      </div>
                      
                      {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              defaultValue=""
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={items[index].description}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        const newItems = [...items];
                                        newItems[index].description = e.target.value;
                                        setItems(newItems);
                                      }}
                                      placeholder="תיאור"
                                      className="text-right"
                                      id={`item-description-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              defaultValue={1}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || 1}
                                      type="number"
                                      min="0"
                                      step="1"
                                      placeholder="כמות"
                                      className="text-right"
                                      id={`item-quantity-${index}`}
                                      onChange={(e) => {
                                        const value = Math.max(0, Number(e.target.value));
                                        field.onChange(value);
                                        updateItemTotal(index, 'quantity', value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              defaultValue={0}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || 0}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="מחיר ליחידה"
                                      className="text-right"
                                      id={`item-price-${index}`}
                                      onChange={(e) => {
                                        const value = Math.max(0, Number(e.target.value));
                                        field.onChange(value);
                                        updateItemTotal(index, 'unitPrice', value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.currency`}
                              defaultValue="ILS"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Select
                                      value={field.value || 'ILS'}
                                      onValueChange={(value: 'USD' | 'ILS') => {
                                        field.onChange(value);
                                        updateItemCurrency(index, value);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="מטבע" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ILS">₪ (ILS)</SelectItem>
                                        <SelectItem value="USD">$ (USD)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-1">
                            <div className="text-right font-semibold">
                              {item.currency === 'USD' ? '$' : '₪'}{item.total.toFixed(2)}
                            </div>
                          </div>
                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {items.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <div className="text-left space-y-2">
                            <div>סה&quot;כ לפני מע&quot;מ: ₪{calculateTotals().subtotal.toFixed(2)}</div>
                            <div>מע&quot;מ (18%): ₪{calculateTotals().tax.toFixed(2)}</div>
                            <div className="font-bold">סה&quot;כ כולל מע&quot;מ: ₪{calculateTotals().total.toFixed(2)}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">פרטים נוספים</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תוקף הצעת המחיר</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              className="text-right"
                              id="valid-until"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>הערות</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="הערות"
                              className="text-right"
                              id="notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    ביטול
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isGenerating || !form.formState.isValid}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מייצר PDF...
                      </>
                    ) : (
                      'צור הצעת מחיר PDF'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 