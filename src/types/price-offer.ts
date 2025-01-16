export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
}

export interface PriceOfferItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: 'USD' | 'ILS';
}

export interface PriceOffer {
  id: string;
  customer: Customer;
  items: PriceOfferItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  validUntil: string;
  notes?: string;
} 