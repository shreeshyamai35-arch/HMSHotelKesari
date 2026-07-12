import { Role } from './types';

export const CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: 'MAIN_ELECTRICITY', label: 'Main Electricity Supply Working' },
  { key: 'LIFT', label: 'Lift Working' },
  { key: 'WIFI', label: 'WiFi Working' },
  { key: 'CCTV', label: 'CCTV Working' },
  { key: 'FIRE_SAFETY', label: 'Fire Safety System Working' },
  { key: 'RO_WATER', label: 'RO Water Available' },
  { key: 'PARKING_CLEAN', label: 'Parking Area Clean' },
  { key: 'HOUSEKEEPING', label: 'Housekeeping Status' },
  { key: 'BOREWELL', label: 'Borewell Status' },
  { key: 'GENERATOR_DIESEL', label: 'Generator Diesel Stock Checked' },
];

export const WATER_SLOTS: { value: string; label: string }[] = [
  { value: 'SLOT_0700', label: '7:00 AM' },
  { value: 'SLOT_1200', label: '12:00 PM' },
  { value: 'SLOT_1600', label: '4:00 PM' },
  { value: 'SLOT_2100', label: '9:00 PM' },
];

export const OCCUPANCY_SLOTS: { value: string; label: string; window: string }[] = [
  { value: 'SLOT_1000', label: '10:00 AM', window: '10 AM – 12 PM' },
  { value: 'SLOT_1600', label: '4:00 PM', window: '4 PM – 6 PM' },
  { value: 'SLOT_2200', label: '10:00 PM', window: '10 PM – 12 AM' },
];

export const ROOM_SALE_SOURCES: { value: string; label: string }[] = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'PUJARI', label: 'Pujari Ji' },
];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  FRONT_OFFICE: 'Front Office',
  REVENUE: 'Revenue Team',
  MANAGEMENT: 'Management',
};

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}
