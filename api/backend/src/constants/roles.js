"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTING_REVENUE_TIER_HIGH = exports.SETTING_REVENUE_TIER_LOW = exports.SETTING_TOTAL_ROOMS = exports.ROOM_SALE_SOURCES = exports.OCCUPANCY_SLOT_META = exports.OCCUPANCY_SLOTS = exports.GENSET_TYPES = exports.WATER_TANK_SLOTS = exports.CHECKLIST_ITEMS = exports.ALL_ROLES = exports.ROLES = void 0;
exports.ROLES = {
    ADMIN: 'ADMIN',
    FRONT_OFFICE: 'FRONT_OFFICE',
    REVENUE: 'REVENUE',
    MANAGEMENT: 'MANAGEMENT',
};
exports.ALL_ROLES = [
    exports.ROLES.ADMIN,
    exports.ROLES.FRONT_OFFICE,
    exports.ROLES.REVENUE,
    exports.ROLES.MANAGEMENT,
];
// Fixed utility checklist items (PRD 5.2 C)
exports.CHECKLIST_ITEMS = [
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
exports.WATER_TANK_SLOTS = ['SLOT_0700', 'SLOT_1200', 'SLOT_1600', 'SLOT_2100'];
exports.GENSET_TYPES = ['MORNING', 'EVENING'];
// Occupancy Manager — 3 daily reporting slots with submission windows.
exports.OCCUPANCY_SLOTS = ['SLOT_1000', 'SLOT_1600', 'SLOT_2200'];
exports.OCCUPANCY_SLOT_META = [
    { key: 'SLOT_1000', label: '10:00 AM', scheduledHour: 10, windowStart: 10, windowEnd: 12 },
    { key: 'SLOT_1600', label: '4:00 PM', scheduledHour: 16, windowStart: 16, windowEnd: 18 },
    { key: 'SLOT_2200', label: '10:00 PM', scheduledHour: 22, windowStart: 22, windowEnd: 24 },
];
exports.ROOM_SALE_SOURCES = ['ONLINE', 'WALK_IN', 'PUJARI'];
// Key used in the Setting table for the fixed hotel room count.
exports.SETTING_TOTAL_ROOMS = 'HOTEL_TOTAL_ROOMS';
// Revenue Calendar tier thresholds (admin override; blank = auto per-month).
exports.SETTING_REVENUE_TIER_LOW = 'REVENUE_TIER_LOW';
exports.SETTING_REVENUE_TIER_HIGH = 'REVENUE_TIER_HIGH';
