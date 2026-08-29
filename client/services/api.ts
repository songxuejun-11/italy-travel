const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Trip Info
export const getTripInfo = () => request<TripInfo>('/trip-info');

// Days
export const getDays = () => request<Day[]>('/days');
export const getDay = (id: number) => request<Day>(`/days/${id}`);
export const updateDayContent = (id: number, content: Record<string, unknown>) =>
  request<{ success: boolean }>(`/days/${id}/content`, {
    method: 'PUT',
    body: JSON.stringify({ content_json: content }),
  });

// Expenses
export const getExpenses = () => request<Expense[]>('/expenses');
export const createExpense = (data: CreateExpense) =>
  request<{ id: number }>('/expenses', { method: 'POST', body: JSON.stringify(data) });
export const updateExpense = (id: number, data: CreateExpense) =>
  request<{ success: boolean }>(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteExpense = (id: number) =>
  request<{ success: boolean }>(`/expenses/${id}`, { method: 'DELETE' });

// Checklist
export const getChecklist = () => request<ChecklistItem[]>('/checklist');
export const createChecklistItem = (label: string) =>
  request<{ id: number }>('/checklist', { method: 'POST', body: JSON.stringify({ label }) });
export const updateChecklistItem = (item: ChecklistItem) =>
  request<{ success: boolean }>(`/checklist/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
export const deleteChecklistItem = (id: number) =>
  request<{ success: boolean }>(`/checklist/${id}`, { method: 'DELETE' });

// Bookings
export const getBookings = () => request<Booking[]>('/bookings');

// Types
export interface TripInfo {
  title: string;
  dateRange: string;
  totalDays: number;
  travelDays: number;
  destination: string;
  cities: string[];
  notices: { transport: string[]; travel: string[]; daily: string };
  flights: {
    outbound: FlightInfo;
    inbound: FlightInfo;
  };
}

export interface FlightInfo {
  title: string;
  date: string;
  segments: FlightSegment[];
  tips: string[];
}

export interface FlightSegment {
  type: 'flight' | 'transit';
  label: string;
  departure?: { city: string; time: string; airport?: string };
  arrival?: { city: string; time: string };
  duration: string;
  airline?: string;
  flightNo?: string;
  location?: string;
}

export interface Day {
  id: number;
  day_number: number;
  date: string;
  weekday: string;
  city: string;
  city_en: string;
  content_json: string;
  sort_order: number;
}

export interface DayContent {
  overview?: { text: string; cityIntro?: string };
  accommodation?: Accommodation | null;
  tips?: { items: string[]; packingList: string[] };
  locations?: Location[];
  transport?: { intercity: TransportItem[]; intracity: TransportItem[] };
}

export interface Accommodation {
  city?: string;
  checkIn?: string;
  address?: string;
  condition?: string;
  checkInMethod?: string;
  tips?: string;
  sameAsPrevious?: boolean;
  lat?: number;
  lng?: number;
}

export interface Location {
  name: string;
  nameIt?: string;
  hours?: string;
  cost?: string;
  tags?: string[];
  duration?: string;
  tips?: string;
  intro?: string;
  lat?: number;
  lng?: number;
  order?: number;
  address?: string;
}

export interface TransportItem {
  desc?: string;
  mode?: string;
  details?: string;
  duration?: string;
  cost?: string;
  departure?: string;
  time?: string;
  tips?: string;
}

export interface Expense {
  id: number;
  date: string;
  category: string;
  sub_category: string;
  amount: number;
  currency: string;
  split_count: number;
  per_person: number;
  note: string;
}

export interface CreateExpense {
  date: string;
  category: string;
  sub_category: string;
  amount: number;
  currency: string;
  split_count: number;
  note: string;
}

export interface ChecklistItem {
  id: number;
  label: string;
  checked: number;
  sort_order: number;
}

export interface Booking {
  id: number;
  city: string;
  date: string;
  attraction: string;
  price: string;
  need_reservation: number;
  booking_link: string;
  note: string;
  sort_order: number;
}
