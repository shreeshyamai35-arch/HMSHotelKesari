export const ROLES = {
  ADMIN: 'ADMIN',
  FRONT_OFFICE: 'FRONT_OFFICE',
  REVENUE: 'REVENUE',
  MANAGEMENT: 'MANAGEMENT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES: Role[] = [
  ROLES.ADMIN,
  ROLES.FRONT_OFFICE,
  ROLES.REVENUE,
  ROLES.MANAGEMENT,
];

// Fixed utility checklist items (PRD 5.2 C)
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

export const WATER_TANK_SLOTS = ['SLOT_0700', 'SLOT_1200', 'SLOT_1600', 'SLOT_2100'] as const;
export const GENSET_TYPES = ['MORNING', 'EVENING'] as const;

// Occupancy Manager — 3 daily reporting slots with submission windows.
export const OCCUPANCY_SLOTS = ['SLOT_1000', 'SLOT_1600', 'SLOT_2200'] as const;
export type OccupancySlotKey = (typeof OCCUPANCY_SLOTS)[number];

export const OCCUPANCY_SLOT_META: {
  key: OccupancySlotKey;
  label: string;
  scheduledHour: number; // report time
  windowStart: number; // submission window start hour
  windowEnd: number; // submission window end hour
}[] = [
  { key: 'SLOT_1000', label: '10:00 AM', scheduledHour: 10, windowStart: 10, windowEnd: 12 },
  { key: 'SLOT_1600', label: '4:00 PM', scheduledHour: 16, windowStart: 16, windowEnd: 18 },
  { key: 'SLOT_2200', label: '10:00 PM', scheduledHour: 22, windowStart: 22, windowEnd: 24 },
];

export const ROOM_SALE_SOURCES = ['ONLINE', 'WALK_IN', 'PUJARI'] as const;

// Key used in the Setting table for the fixed hotel room count.
export const SETTING_TOTAL_ROOMS = 'HOTEL_TOTAL_ROOMS';
