export interface Contact {
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
  // Include company relation type
  company?: Company;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
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
  contact?: Contact;
  reminders?: Reminder[];
}

export interface Reminder {
  id: string;
  event_id: string;
  remind_at: string;
  type: "email" | "notification";
  status: "pending" | "sent" | "failed";
  created_at: string;
  updated_at: string;
  event?: CalendarEvent;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}
