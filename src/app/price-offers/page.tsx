'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { PriceOffer, PriceOfferItem } from '@/types/price-offer';
import { generatePDF } from '@/lib/pdf-generator';
import { savePriceOffer } from '@/lib/price-offers';
import { Trash2, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// Validation schema
const priceOfferSchema = z.object({
  customer: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(9, 'Phone number is required'),
    address: z.string().min(5, 'Address is required'),
    company: z.string().optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.number().min(0, 'Unit price must be positive'),
    total: z.number(),
    currency: z.enum(['USD', 'ILS']),
  })).min(1, 'At least one item is required'),
  notes: z.string().optional(),
  validUntil: z.string(),
});

export default function PriceOffersPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
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

  // Handle auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !isLoading) {
        router.replace('/login?redirectTo=/price-offers');
      }
    };

    if (isClient) {
      checkAuth();
    }
  }, [isClient, isLoading, router]);

  // Update form items when items state changes
  useEffect(() => {
    form.setValue('items', items);
  }, [items, form]);

  // Show loading state while checking auth
  if (isLoading || !isClient || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>טוען...</p>
          </div>
        </div>
      </div>
    );
  }

  const updateItemTotal = (index: number, field: 'quantity' | 'unitPrice', value: number) => {
    if (value < 0) return;
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    setItems(newItems);
  };

  const updateItemCurrency = (index: number, currency: 'USD' | 'ILS') => {
    const newItems = [...items];
    newItems[index].currency = currency;
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    if (items.length === 1) {
      toast.error('חייב להיות לפחות פריט אחד');
      return;
    }
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

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      
      if (!user?.id) {
        toast.error('יש להתחבר למערכת');
        router.push('/login');
        return;
      }

      // Validate customer details
      const formData = form.getValues();
      console.log('Form data:', formData);

      const customerValidation = z.object({
        customer: z.object({
          name: z.string().min(2, 'Name is required'),
          email: z.string().email('Invalid email address'),
          phone: z.string().min(9, 'Phone number is required'),
          address: z.string().min(5, 'Address is required'),
          company: z.string().optional(),
        }),
      }).safeParse(formData);

      if (!customerValidation.success) {
        console.log('Customer validation failed:', customerValidation.error);
        toast.error('נא למלא את כל פרטי הלקוח');
        return;
      }

      if (items.length === 0) {
        console.log('No items found');
        toast.error('נא להוסיף לפחות פריט אחד');
        return;
      }

      // Validate items
      const invalidItems = items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0);
      if (invalidItems) {
        console.log('Invalid items found:', items);
        toast.error('נא למלא את כל פרטי הפריטים');
        return;
      }

      const totals = calculateTotals();
      console.log('Calculated totals:', totals);

      const priceOffer: PriceOffer = {
        id: Date.now().toString(),
        customer: formData.customer,
        items: items,
        date: new Date().toISOString(),
        validUntil: formData.validUntil || new Date().toISOString().split('T')[0],
        notes: formData.notes,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
      };

      console.log('Price offer data:', priceOffer);

      // First save the price offer to the database
      const savedOffer = await savePriceOffer(priceOffer, user.id);
      console.log('Saved offer:', savedOffer);

      // Then generate the PDF
      const result = await generatePDF(priceOffer, user.id);
      console.log('PDF generation result:', result);

      if (result?.url) {
        window.open(result.url, '_blank');
        toast.success('הצעת המחיר נוצרה בהצלחה');
        router.push('/dashboard');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'אירעה שגיאה ביצירת הצעת המחיר');
    } finally {
      setIsGenerating(false);
    }
  };

  const addItem = () => {
    const newItem: PriceOfferItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
      currency: items[0]?.currency || 'ILS',
    };
    setItems([...items, newItem]);
  };

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <PageHeader title="הצעת מחיר חדשה" />
      
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">פרטי לקוח</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    {...form.register('customer.name')}
                    placeholder="שם מלא"
                    className="text-right"
                    id="customer-name"
                    autoComplete="name"
                  />
                  <Input
                    {...form.register('customer.email')}
                    placeholder="אימייל"
                    type="email"
                    className="text-right"
                    id="customer-email"
                    autoComplete="email"
                  />
                  <Input
                    {...form.register('customer.phone')}
                    placeholder="טלפון"
                    className="text-right"
                    id="customer-phone"
                    autoComplete="tel"
                  />
                  <Input
                    {...form.register('customer.company')}
                    placeholder="חברה (אופציונלי)"
                    className="text-right"
                    id="customer-company"
                    autoComplete="organization"
                  />
                  <Input
                    {...form.register('customer.address')}
                    placeholder="כתובת"
                    className="text-right md:col-span-2"
                    id="customer-address"
                    autoComplete="street-address"
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
                    לא נוספו פריטים. לחץ על "הוסף פריט" כדי להתחיל.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center font-semibold mb-2">
                      <div className="md:col-span-4">תיאור</div>
                      <div className="md:col-span-2">כמות</div>
                      <div className="md:col-span-2">מחיר פריט</div>
                      <div className="md:col-span-2">מטבע</div>
                      <div className="md:col-span-1">סה"כ</div>
                      <div className="md:col-span-1"></div>
                    </div>
                    
                    {items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        <div className="md:col-span-4">
                          <Input
                            {...form.register(`items.${index}.description`)}
                            placeholder="תיאור"
                            className="text-right"
                            id={`item-description-${index}`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            {...form.register(`items.${index}.quantity`)}
                            placeholder="כמות"
                            className="text-right"
                            id={`item-quantity-${index}`}
                            onChange={(e) => updateItemTotal(index, 'quantity', Math.max(0, Number(e.target.value)))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register(`items.${index}.unitPrice`)}
                            placeholder="מחיר ליחידה"
                            className="text-right"
                            id={`item-price-${index}`}
                            onChange={(e) => updateItemTotal(index, 'unitPrice', Math.max(0, Number(e.target.value)))}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Select
                            value={item.currency}
                            onValueChange={(value: 'USD' | 'ILS') => updateItemCurrency(index, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="מטבע" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ILS">₪ (ILS)</SelectItem>
                              <SelectItem value="USD">$ (USD)</SelectItem>
                            </SelectContent>
                          </Select>
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
                          <div>סה"כ לפני מע"מ: ₪{calculateTotals().subtotal.toFixed(2)}</div>
                          <div>מע"מ (18%): ₪{calculateTotals().tax.toFixed(2)}</div>
                          <div className="font-bold">סה"כ כולל מע"מ: ₪{calculateTotals().total.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">פרטים נוספים</h3>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    {...form.register('validUntil')}
                    type="date"
                    className="text-right"
                    id="valid-until"
                  />
                  <Textarea
                    {...form.register('notes')}
                    placeholder="הערות"
                    className="text-right"
                    id="notes"
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
                  type="button" 
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
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
  );
} 