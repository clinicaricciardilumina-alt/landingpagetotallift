/**
 * Type definitions for the admin application
 */

// Landing Settings
export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_date: string;
  hero_description: string;
  cta_text: string;
  hero_image: string;
  selected_images: string[];
  image_urls: Record<string, string>;
}

// Question/Q&A
export interface Question {
  id: string;
  text: string;
  type: "single" | "multiple" | "text" | "rating";
  options: string[];
  required?: boolean;
  order?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Booking Slot
export interface BookingSlot {
  id: string;
  date: string;
  time: string;
  capacity: number;
  booked?: number;
  created_at?: Date;
}

// Booking
export interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  notes?: string;
  payment_status: "pending" | "paid" | "failed";
  created_at: Date;
  updated_at?: Date;
}

// Statistics
export interface Statistics {
  total_bookings: number;
  paid_bookings: number;
  pending_bookings: number;
  available_slots: number;
  conversion_rate: number;
  avg_time: number;
}

// Builder Block (for future use)
export interface Block {
  id: string;
  type:
    | "heading"
    | "paragraph"
    | "image"
    | "button"
    | "form"
    | "input"
    | "textarea"
    | "divider"
    | "cta"
    | "video"
    | "link"
    | "spacer"
    | "container"
    | "html";
  properties: Record<string, any>;
  children?: Block[];
}

// Landing Page (for future use)
export interface LandingPage {
  id: string;
  title: string;
  blocks: Block[];
  slug?: string;
  published?: boolean;
  created_at: Date;
  updated_at: Date;
}

// Automation Trigger (for future use)
export interface Trigger {
  type:
    | "formSubmit"
    | "bookingCreated"
    | "questionAnswered"
    | "tagAdded"
    | "manual";
  sourceId?: string;
  condition?: Record<string, any>;
}

// Automation Action (for future use)
export interface Action {
  type:
    | "sendEmail"
    | "createNotification"
    | "callWebhook"
    | "addTag"
    | "updateField";
  config: Record<string, any>;
}

// Automation (for future use)
export interface Automation {
  id: string;
  name: string;
  trigger: Trigger;
  actions: Action[];
  active: boolean;
  created_at: Date;
  updated_at: Date;
}
