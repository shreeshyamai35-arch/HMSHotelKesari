"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDate = parseDate;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
exports.localDateKey = localDateKey;
exports.nowIST = nowIST;
exports.istDateKey = istDateKey;
exports.isSlotWindowOpen = isSlotWindowOpen;
exports.isSlotLocked = isSlotLocked;
exports.addDays = addDays;
function parseDate(input) {
    if (!input)
        return new Date();
    var d = new Date("".concat(input, "T00:00:00"));
    if (isNaN(d.getTime()))
        throw new Error('Invalid date format');
    return d;
}
function startOfDay(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function endOfDay(date) {
    var d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
/** Return YYYY-MM-DD string for a Date, preserving its local-parts (never shifts across timezones). */
function localDateKey(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return "".concat(date.getFullYear(), "-").concat(m, "-").concat(d);
}
// ─── IST timezone utilities ───────────────────────────────
// Server timezone is set to Asia/Kolkata in env.ts, so `new Date()` is now in IST.
/** Current time in IST (uses server timezone). */
function nowIST() {
    return new Date();
}
/** Return YYYY-MM-DD string for an IST Date. */
function istDateKey(istDate) {
    return localDateKey(istDate);
}
var WINDOWS = {
    '10am': { startHour: 10, startMinute: 0, endHour: 11, endMinute: 59 },
    '4pm': { startHour: 16, startMinute: 0, endHour: 18, endMinute: 0 },
    '10pm': { startHour: 22, startMinute: 0, endHour: 23, endMinute: 59 },
};
/** Check if the given slot's time window is currently open (IST). */
function isSlotWindowOpen(slot) {
    var now = nowIST();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var window = WINDOWS[slot];
    var currentMinutes = hour * 60 + minute;
    var startMinutes = window.startHour * 60 + window.startMinute;
    var endMinutes = window.endHour * 60 + window.endMinute;
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}
/** Check if a slot is locked (time window has passed for the given date). */
function isSlotLocked(slot, dateKey) {
    var todayIST = istDateKey(nowIST());
    // Future dates: not locked
    if (dateKey > todayIST)
        return false;
    // Past dates: always locked
    if (dateKey < todayIST)
        return true;
    // Today: locked if the window has passed
    return !isSlotWindowOpen(slot);
}
// ─── Date arithmetic ───────────────────────────────────────
/** Add days to a date (returns a new Date). */
function addDays(date, days) {
    var d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
