import prisma from './prisma';
import { SETTING_TOTAL_ROOMS } from '../constants/roles';

/**
 * Total rooms in the hotel: derived from the active Room list when rooms
 * are configured, falling back to the legacy HOTEL_TOTAL_ROOMS setting.
 */
export async function getTotalRooms(): Promise<number> {
  const activeRooms = await prisma.room.count({ where: { active: true } });
  if (activeRooms > 0) return activeRooms;
  const s = await prisma.setting.findUnique({ where: { key: SETTING_TOTAL_ROOMS } });
  return s ? parseInt(s.value, 10) || 0 : 0;
}

/** Sorts rooms naturally by number ("101" < "102" < "201", handles "A-1"). */
export function sortRoomsByNumber<T extends { number: string }>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export interface RoomWithType {
  id: string;
  number: string;
  roomTypeId: string | null;
  roomTypeName: string | null;
  active: boolean;
}

/** Room list with the type name flattened, naturally sorted. */
export async function listRooms(activeOnly: boolean): Promise<RoomWithType[]> {
  const rooms = await prisma.room.findMany({
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
