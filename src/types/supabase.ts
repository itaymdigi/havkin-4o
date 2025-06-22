export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      calendar_events: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          description: string | null;
          start_time: string;
          end_time: string;
          location: string | null;
          contact_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          description?: string | null;
          start_time: string;
          end_time: string;
          location?: string | null;
          contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          description?: string | null;
          start_time?: string;
          end_time?: string;
          location?: string | null;
          contact_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          industry: string | null;
          website: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          industry?: string | null;
          website?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          industry?: string | null;
          website?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          position: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id?: string | null;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          name: string;
          file_path: string;
          file_type: string;
          size_bytes: number;
          uploaded_by: string;
          company_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_path: string;
          file_type: string;
          size_bytes: number;
          uploaded_by: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_path?: string;
          file_type?: string;
          size_bytes?: number;
          uploaded_by?: string;
          company_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_id: string | null;
          read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          related_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          related_id?: string | null;
          read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      price_offers: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          valid_until: string;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: string;
          valid_until: string;
          total_amount: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: string;
          valid_until?: string;
          total_amount?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      price_offer_items: {
        Row: {
          id: string;
          price_offer_id: string;
          quantity: number;
          unit_price: number;
          description: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          price_offer_id: string;
          quantity: number;
          unit_price: number;
          description: string;
          currency: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          price_offer_id?: string;
          quantity?: number;
          unit_price?: number;
          description?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          event_id: string;
          remind_at: string;
          type: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          remind_at: string;
          type: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          remind_at?: string;
          type?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
