export type Role = 'ADMIN' | 'FRONT_OFFICE' | 'REVENUE' | 'MANAGEMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  active?: boolean;
  createdAt?: string;
}

export interface GensetCheck {
  id: string;
  type: 'MORNING' | 'EVENING';
  status: 'WORKING' | 'NOT_WORKING';
  fuelLevel: 'FULL' | 'MEDIUM' | 'LOW';
  remarks?: string | null;
  employeeName: string;
}

export interface WaterTankCheck {
  id: string;
  slot: 'SLOT_0700' | 'SLOT_1200' | 'SLOT_1600' | 'SLOT_2100';
  status: 'FULL' | 'MEDIUM' | 'LOW';
  remarks?: string | null;
  employeeName: string;
}

export interface ChecklistItem {
  id: string;
  key: string;
  label: string;
  status: string;
  remarks?: string | null;
}

export interface Complaint {
  id: string;
  details: string;
  guestName?: string | null;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

export interface MaintenanceIssue {
  id: string;
  details: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

export interface Incident {
  id: string;
  type: 'LOST_FOUND' | 'SPECIAL_INCIDENT';
  details: string;
}

export interface PdfReport {
  id: string;
  fileName: string;
  generatedAt: string;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  slot: string;
  employeeName: string;
  department?: string | null;
  submittedAt: string;
  remarks?: string | null;
  gensetChecks: GensetCheck[];
  waterTankChecks: WaterTankCheck[];
  checklistItems: ChecklistItem[];
  complaints: Complaint[];
  maintenance: MaintenanceIssue[];
  incidents: Incident[];
  pdfReports?: PdfReport[];
}

export interface DashboardData {
  date: string;
  checklist: {
    completed: number;
    pending: number;
    total: number;
    gensetDone: string[];
    waterDone: string[];
    checklistItemsDone: number;
  };
  reportsSubmittedToday: number;
  openComplaints: number;
  openMaintenance: number;
  recentReports: {
    id: string;
    reportDate: string;
    slot: string;
    employeeName: string;
    department?: string | null;
    submittedAt: string;
  }[];
}

export interface Review {
  id: string;
  source: 'GOOGLE' | 'OTA' | 'OTHER';
  rating: number;
  text?: string | null;
  author?: string | null;
  category?: string | null;
  reviewedAt: string;
}

export interface ReviewAnalytics {
  total: number;
  avgRating: number;
  bySource: Record<string, { count: number; avg: number }>;
  distribution: Record<string, number>;
  negativeCount: number;
  complaints: { open: number; closed: number };
}

export interface RevenueRecord {
  id: string;
  recordDate: string;
  revenue: number;
  roomsSold: number;
  roomsAvailable: number;
  adr: number;
  revpar: number;
  source: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  avgAdr: number;
  avgRevpar: number;
  occupancy: number;
  trend: { date: string; revenue: number; adr: number; revpar: number }[];
  monthly: { month: string; revenue: number; target: number }[];
}

export interface RevenueTarget {
  id: string;
  year: number;
  month: number;
  targetRevenue: number;
}

export interface Booking {
  id: string;
  bookingDate: string;
  source: string;
  status: string;
  roomsBooked: number;
  amount: number;
  guestName?: string | null;
}

export interface BookingAnalytics {
  totalBookings: number;
  totalRoomsBooked: number;
  cancellationRate: number;
  bySource: { source: string; rooms: number }[];
  byStatus: { status: string; count: number }[];
  trend: { date: string; rooms: number }[];
}

export interface PerformanceData {
  from: string;
  to: string;
  employees: {
    employeeId: string;
    employeeName: string;
    department: string | null;
    reports: number;
    gensetChecks: number;
    waterChecks: number;
    checklistItems: number;
    tasks: number;
  }[];
  departments: { department: string; reports: number; tasks: number }[];
  totals: { reports: number; tasks: number };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  read: boolean;
  createdAt: string;
}

export interface AiInsight {
  summary: string;
  highlights: string[];
  recommendations: string[];
  provider: string;
}

// ─── Occupancy Manager ────────────────────────────────────
export type OccupancySlotKey = 'SLOT_1000' | 'SLOT_1600' | 'SLOT_2200';
export type RoomSaleSource = 'ONLINE' | 'WALK_IN' | 'PUJARI';

export interface RoomType {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface OnlineSource {
  id: string;
  name: string;
  active: boolean;
  createdAt?: string;
}

export interface Pujari {
  id: string;
  name: string;
  phone?: string | null;
  commissionPct: number;
  active: boolean;
  createdAt?: string;
}

export interface Room {
  id: string;
  number: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
  active: boolean;
}

export interface OccupancyConfig {
  totalRooms: number;
  rooms: Room[];
  roomTypes: RoomType[];
  onlineSources: OnlineSource[];
  pujaris: Pujari[];
}

export interface SettingsData extends OccupancyConfig {
  revenueTiers?: { low: number | null; high: number | null };
}

export interface RoomSale {
  id: string;
  slotId: string;
  roomId?: string | null;
  roomType: string;
  roomNumber: string;
  source: RoomSaleSource;
  sourceDetail?: string | null;
  priceSold: number;
  pujariId?: string | null;
  commissionPct?: number | null;
  commissionAmount?: number | null;
}

export interface OccupancySlotData {
  id: string;
  reportDate: string;
  slot: OccupancySlotKey;
  totalRooms: number;
  workingRooms: number;
  outOfOrder: number;
  roomsSold: number;
  totalRevenue: number;
  occupancy: number;
  submittedByName: string;
  notes?: string | null;
  submittedAt: string;
  sales: RoomSale[];
}

export interface OccupancyDay {
  date: string;
  totalRooms: number;
  slots: { slot: OccupancySlotKey; submitted: boolean; data: OccupancySlotData | null }[];
}

export interface OccupancyAnalytics {
  totalRoomsSold: number;
  totalRevenue: number;
  avgAdr: number;
  avgOccupancy: number;
  sourceMix: Record<string, { rooms: number; revenue: number }>;
  byOta: Record<string, { rooms: number; revenue: number }>;
  byPujari: Record<string, { rooms: number; revenue: number; commission: number }>;
  byRoomType: Record<string, { rooms: number; revenue: number }>;
  byRoom: Record<string, { rooms: number; revenue: number }>;
  trend: { date: string; roomsSold: number; revenue: number; occupancy: number }[];
}

export interface OccupancyHistoryDay {
  date: string;
  submittedSlots: OccupancySlotKey[];
  roomsSold: number;
  workingRooms: number;
  revenue: number;
  occupancy: number;
}

export interface OccupancyHistory {
  month: string;
  days: OccupancyHistoryDay[];
  totals: { revenue: number; roomsSold: number; avgOccupancy: number; daysReported: number };
}

// ─── Pujari Commissions ───────────────────────────────────
export interface CommissionSettlement {
  id: string;
  rooms: number;
  revenue: number;
  commission: number;
  paidAt: string;
  paidByName: string;
}

export interface CommissionRow {
  pujariId: string | null;
  name: string;
  phone: string | null;
  commissionPct: number | null;
  active: boolean;
  rooms: number;
  revenue: number;
  commission: number;
  settlement: CommissionSettlement | null;
}

export interface CommissionMonth {
  year: number;
  month: number;
  rows: CommissionRow[];
  totals: { rooms: number; revenue: number; commission: number };
}

// ─── Dashboard Analytics ──────────────────────────────────
export interface TodaySnapshot {
  date: string;
  revenue: number;
  occupancy: number;
  adr: number;
  revpar: number;
  checkIns: number;
  checkOuts: number;
  roomsAvailable: number;
  roomsSold: number;
}

export interface PickupBucket {
  bookings: number;
  rooms: number;
  revenue: number;
}
export interface PickupReport {
  asOf: string;
  yesterday: PickupBucket;
  last7: PickupBucket;
  last30: PickupBucket;
  currentMonth: PickupBucket;
}

export interface BookingWindow {
  totalBookings: number;
  buckets: { key: string; label: string; bookings: number; rooms: number; pct: number }[];
}

export type RevenueTier = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export interface CalendarDay {
  date: string;
  revenue: number;
  occupancy: number;
  adr: number;
  revpar: number;
  roomsSold: number;
  otaContribution: number;
  tier: RevenueTier;
}
export interface RevenueCalendar {
  year: number;
  month: number;
  avgRevenue: number;
  thresholds: { low: number; high: number; auto: boolean };
  days: CalendarDay[];
}

export interface YoyYearStats {
  year: number;
  revenue: number;
  occupancy: number;
  adr: number;
  revpar: number;
  reviewScore: number;
  monthly: number[];
}
export interface YoyComparison {
  current: YoyYearStats;
  previous: YoyYearStats;
  deltas: {
    revenue: number | null;
    occupancy: number | null;
    adr: number | null;
    revpar: number | null;
    reviewScore: number | null;
  };
}
