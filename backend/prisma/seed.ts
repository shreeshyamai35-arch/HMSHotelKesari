import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Production guard: disable seeding in production
if (process.env.NODE_ENV === 'production') {
  console.log('Seed disabled in production');
  process.exit(0);
}

const CHECKLIST_ITEMS = [
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

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function hash(pw: string) {
  return bcrypt.hash(pw, await bcrypt.genSalt(10));
}

async function main() {
  console.log('Seeding database...');

  // ─── Users ──────────────────────────────────────────────
  const adminPassword = crypto.randomBytes(16).toString('hex');
  const users = [
    { name: 'Admin User', email: 'admin@hotelkesari.com', password: adminPassword, role: 'ADMIN', department: 'Management' },
    { name: 'Front Office', email: 'frontoffice@hotelkesari.com', password: crypto.randomBytes(16).toString('hex'), role: 'FRONT_OFFICE', department: 'Front Office' },
    { name: 'Revenue Team', email: 'revenue@hotelkesari.com', password: crypto.randomBytes(16).toString('hex'), role: 'REVENUE', department: 'Revenue' },
    { name: 'Management', email: 'management@hotelkesari.com', password: crypto.randomBytes(16).toString('hex'), role: 'MANAGEMENT', department: 'Management' },
  ];

  const created: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        passwordHash: await hash(u.password),
        role: u.role,
        department: u.department,
      },
    });
    created[u.role] = user.id;
  }
  console.log(`  ✓ ${users.length} users`);
  console.log(`\n  🔑 ADMIN PASSWORD (save this): ${adminPassword}\n`);

  const frontOfficeId = created['FRONT_OFFICE'];

  // ─── Sample daily reports (last 3 days) ─────────────────
  const existingReports = await prisma.dailyReport.count();
  if (existingReports === 0) {
    for (let i = 0; i < 3; i++) {
      const reportDate = startOfDay(addDays(new Date(), -i));
      await prisma.dailyReport.create({
        data: {
          reportDate,
          slot: 'SLOT_1000',
          employeeId: frontOfficeId,
          employeeName: 'Front Office',
          department: 'Front Office',
          remarks: i === 0 ? 'All systems nominal.' : null,
          gensetChecks: {
            create: [
              { type: 'MORNING', status: 'WORKING', fuelLevel: 'FULL', employeeName: 'Front Office' },
              { type: 'EVENING', status: 'WORKING', fuelLevel: 'MEDIUM', employeeName: 'Front Office' },
            ],
          },
          waterTankChecks: {
            create: [
              { slot: 'SLOT_0700', status: 'FULL', employeeName: 'Front Office' },
              { slot: 'SLOT_1200', status: 'MEDIUM', employeeName: 'Front Office' },
              { slot: 'SLOT_1600', status: 'MEDIUM', employeeName: 'Front Office' },
              { slot: 'SLOT_2100', status: 'FULL', employeeName: 'Front Office' },
            ],
          },
          checklistItems: {
            create: CHECKLIST_ITEMS.map((c) => ({
              key: c.key,
              label: c.label,
              status: c.key === 'HOUSEKEEPING' || c.key === 'BOREWELL' ? 'OK' : 'OK',
            })),
          },
          complaints:
            i === 0
              ? { create: [{ details: 'AC not cooling in room 204', guestName: 'R. Sharma', status: 'OPEN' }] }
              : undefined,
          maintenance:
            i === 1
              ? { create: [{ details: 'Lift door sensor intermittent', priority: 'HIGH', status: 'OPEN' }] }
              : undefined,
          incidents:
            i === 0
              ? { create: [{ type: 'LOST_FOUND', details: 'Black umbrella found in lobby' }] }
              : undefined,
        },
      });
    }
    console.log('  ✓ 3 daily reports');
  }

  // ─── Reviews ────────────────────────────────────────────
  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    const reviews = [
      { source: 'GOOGLE', rating: 5, text: 'Excellent stay, great service.', author: 'Anita K.' },
      { source: 'GOOGLE', rating: 4, text: 'Clean rooms, friendly staff.', author: 'Rahul M.' },
      { source: 'OTA', rating: 3, text: 'Decent, but breakfast was limited.', author: 'Booking guest' },
      { source: 'OTA', rating: 5, text: 'Loved the location!', author: 'S. Verma' },
      { source: 'GOOGLE', rating: 2, text: 'Slow check-in process.', author: 'Verified guest' },
    ];
    for (let i = 0; i < reviews.length; i++) {
      await prisma.review.create({
        data: { ...reviews[i], reviewedAt: addDays(new Date(), -i * 2) },
      });
    }
    console.log(`  ✓ ${reviews.length} reviews`);
  }

  // ─── Revenue + bookings (last 30 days) ──────────────────
  const revCount = await prisma.revenueRecord.count();
  if (revCount === 0) {
    const roomsAvailable = 40;
    for (let i = 0; i < 30; i++) {
      const recordDate = startOfDay(addDays(new Date(), -i));
      const seed = recordDate.getDate() + recordDate.getMonth() * 31;
      const roomsSold = 18 + (seed % 20);
      const adr = 2800 + (seed % 12) * 80;
      const revenue = roomsSold * adr;
      await prisma.revenueRecord.create({
        data: {
          recordDate,
          revenue,
          roomsSold,
          roomsAvailable,
          adr: +(revenue / roomsSold).toFixed(2),
          revpar: +(revenue / roomsAvailable).toFixed(2),
          source: 'PMS',
        },
      });
      const sources = ['OTA', 'DIRECT', 'WALK_IN', 'CORPORATE'];
      // Lead time (days between booking and arrival) varies by source.
      const leadBySource: Record<string, number> = { OTA: 12, DIRECT: 5, WALK_IN: 0, CORPORATE: 20 };
      for (let j = 0; j < 4; j++) {
        const arrivalDate = recordDate; // stay/arrival = the record day
        const lead = (leadBySource[sources[j]] + (seed % 6)) % 40;
        const bookedOn = startOfDay(addDays(arrivalDate, -lead));
        await prisma.booking.create({
          data: {
            bookingDate: bookedOn,
            arrivalDate,
            nights: 1 + (seed % 3),
            source: sources[j],
            status: j === 3 && seed % 5 === 0 ? 'CANCELLED' : 'CONFIRMED',
            roomsBooked: Math.max(1, Math.round(roomsSold / 4)),
            amount: revenue / 4,
          },
        });
      }
    }
    console.log('  ✓ 30 days revenue + bookings');
  }

  // ─── Occupancy Manager config (room types, rooms, OTAs, Pujaris) ──
  const roomTypeCount = await prisma.roomType.count();
  if (roomTypeCount === 0) {
    for (const name of ['Standard', 'Deluxe', 'Family']) {
      await prisma.roomType.create({ data: { name } });
    }
    console.log('  ✓ 3 room types');
  }

  const roomCount = await prisma.room.count();
  if (roomCount === 0) {
    const standard = await prisma.roomType.findUnique({ where: { name: 'Standard' } });
    const deluxe = await prisma.roomType.findUnique({ where: { name: 'Deluxe' } });
    // Floor 1: 101-110 Standard, Floor 2: 201-210 Deluxe.
    const rooms: { number: string; roomTypeId: string | null }[] = [];
    for (let n = 101; n <= 110; n++) rooms.push({ number: String(n), roomTypeId: standard?.id ?? null });
    for (let n = 201; n <= 210; n++) rooms.push({ number: String(n), roomTypeId: deluxe?.id ?? null });
    for (const r of rooms) {
      await prisma.room.create({ data: r });
    }
    console.log(`  ✓ ${rooms.length} rooms`);
  }

  const otaCount = await prisma.onlineSource.count();
  if (otaCount === 0) {
    for (const name of ['MakeMyTrip', 'Booking.com', 'Agoda', 'Goibibo']) {
      await prisma.onlineSource.create({ data: { name } });
    }
    console.log('  ✓ 4 online sources');
  }

  await prisma.setting.upsert({
    where: { key: 'HOTEL_TOTAL_ROOMS' },
    update: {},
    create: { key: 'HOTEL_TOTAL_ROOMS', value: '20' },
  });
  console.log('  ✓ total rooms setting');

  // ─── Revenue target (current month) ─────────────────────
  const now = new Date();
  await prisma.revenueTarget.upsert({
    where: { year_month: { year: now.getFullYear(), month: now.getMonth() + 1 } },
    update: {},
    create: { year: now.getFullYear(), month: now.getMonth() + 1, targetRevenue: 2500000 },
  });
  console.log('  ✓ revenue target');

  console.log('Seed complete.\n');
  console.log('  🔑 Login with admin account:');
  console.log(`    Email: admin@hotelkesari.com`);
  console.log(`    Password: ${adminPassword}`);
  console.log(`\n  Other accounts have randomly generated passwords (check logs above if needed).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
