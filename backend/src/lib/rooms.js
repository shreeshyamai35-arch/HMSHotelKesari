"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalRooms = getTotalRooms;
exports.sortRoomsByNumber = sortRoomsByNumber;
exports.listRooms = listRooms;
const prisma_1 = __importDefault(require("./prisma"));
const roles_1 = require("../constants/roles");
/**
 * Total rooms in the hotel: derived from the active Room list when rooms
 * are configured, falling back to the legacy HOTEL_TOTAL_ROOMS setting.
 */
async function getTotalRooms() {
    const activeRooms = await prisma_1.default.room.count({ where: { active: true } });
    if (activeRooms > 0)
        return activeRooms;
    const s = await prisma_1.default.setting.findUnique({ where: { key: roles_1.SETTING_TOTAL_ROOMS } });
    return s ? parseInt(s.value, 10) || 0 : 0;
}
/** Sorts rooms naturally by number ("101" < "102" < "201", handles "A-1"). */
function sortRoomsByNumber(rooms) {
    return [...rooms].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' }));
}
/** Room list with the type name flattened, naturally sorted. */
async function listRooms(activeOnly) {
    const rooms = await prisma_1.default.room.findMany({
        where: activeOnly ? { active: true } : {},
        include: { roomType: true },
    });
    return sortRoomsByNumber(rooms).map((r) => ({
        id: r.id,
        number: r.number,
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomType?.name ?? null,
        active: r.active,
    }));
}
