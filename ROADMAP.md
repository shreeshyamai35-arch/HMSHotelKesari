# Hotel Kesari — Feature Gap Assessment & Roadmap

*Generated 2026-07-26 from a full codebase audit (53 existing features catalogued) plus gap analysis across housekeeping, guest experience, staff tasks, operational completeness, and technical health.*

**Confirmed product constraints:** internal tool for Hotel Kesari only (under 25 rooms, fewer than 15 staff, rooms-only revenue). eZee Absolute stays the system of record for reservations, billing, and GST — it feeds Kesari as a data source (see eZee integration notes). No payroll/attendance (tasks only), no POS, no multi-property.

---

## 1. Where the product stands

The foundation is better than most internal tools: the Occupancy Manager's per-slot upsert pattern is genuinely well-built (server-recomputed totals, snapshotted room counts, clean role gating), the Complaint/Maintenance lifecycle works end-to-end, and the analytics scaffolding (calendar, YoY, revenue trends) is ready to be fed real data — the codebase has clear, cloneable patterns (ListManager, issues routes, notification service) that make every proposal below cheaper. But the app currently doesn't model the physical hotel at all: there is no Room entity, no staff directory, and no task — which means priority #1 (housekeeping) and priority #3 (staff tasks) have literally zero coverage, "out of order" is a hand-typed number, and the Performance page measures four shared logins pretending to be fifteen people. The daily-report form actively defeats its own purpose (one 8 AM tap logs the 7 PM genset check as done, so the missed-check safety net never fires). And there are three live hazards under everything: all data sits on a free Postgres that Render deletes ~90 days after creation with no backup, the public login page ships working admin credentials, and the server runs 5.5 hours off IST so every "today", reminder, and date-bucket is wrong. Those get fixed before a single new feature.

---

## 2. Fix before building anything new

These risk losing data or block daily use. Everything else waits.

1. **Nightly off-site backup + paid-plan upgrade — this week.** Free Render Postgres is deleted ~90 days after creation with no backups, and the clock is already running; add a nightly pg_dump to R2/B2 with failure alerts, a documented restore, and upgrade both DB and API off free tier (the API also cold-sleeps 30–60s, which staff will read as "app is broken" every morning).
2. **Production lockdown.** Remove the four working demo credentials from the live login page, hard-fail on missing JWT_SECRET, re-check `active`/role per request (a fired employee currently keeps access for 7 days), rate-limit login, set CORS to the real origin, turn off seed-on-start, rotate seeded passwords.
3. **TZ=Asia/Kolkata end-to-end.** One env var plus a date-key audit; until then "today" flips at 5:30 AM IST, night staff see yesterday's date, and every reminder fires 5.5 hours late — the quietest daily-use killer in the codebase.
4. **RevenueRecord provenance guard + kill mock PMS sync in prod.** Three writers silently overwrite the same per-date revenue row, and one curl to the mock sync overwrites real history with fabricated 40-room data; add a source-priority rule, roll back derived revenue on slot delete, and refuse mock sync in production — otherwise the eZee import will corrupt real numbers the day it lands.
5. **Notification foundation.** Fan out role notifications to per-user rows (one person's "read" currently hides alerts from everyone), target the people who do the work instead of ADMIN-only, fix the count-in-title dedup spam, honor the read flag — nearly every Phase 1 feature calls this service and inherits its bugs otherwise.
6. **Draft + retry on the occupancy submission.** A dropped POST at the 10 PM slot throws away a fully-typed entry and that day's revenue record never exists; a localStorage draft with retry is small and the upsert-by-(date, slot) design already makes replays safe.

---

## 3. Feature roadmap

Effort: S = 1–2 days, M = 3–7 days, L = multi-week.

### Phase 1 — Build next

*Order within the phase matters: Room master and Staff directory unlock everything after them.*

- **Room master + Room Status Board (M)** — One screen of ~25 tap-to-change color tiles (clean / dirty / occupied / blocked / out-of-order) answers the hotel's most-asked question — "which rooms are ready right now?" — and replaces free-text room numbers that currently corrupt analytics. Include the "Rooms Ready" dashboard tile as a zero-cost rider on the same PR (it replaces the meaningless checklist progress bar).
- **Staff directory + Task board with cleaning queue (M)** — A lightweight StaffMember list (name, phone, department — *not* logins) plus a Task model so "Ramesh: fix geyser in 204 by 5 PM" finally exists somewhere other than WhatsApp; checkout cleaning tasks are a task type that flips rooms dirty→clean, and overdue tasks escalate with a one-tap wa.me nudge to the staffer's phone. (Real housekeeper logins only later, if adoption proves out.)
- **Per-slot check submission (S)** — Split the daily report so genset/water checks are submitted individually at their actual times (the pattern Occupancy already proves), killing the one-tap all-green pencil-whipping and making the missed-check reminders honest.
- **Complaints & maintenance made assignable and room-aware (S)** — Add room, assignee (StaffMember), resolved-by, editable priority, and the open/closed filter the backend already supports; a HIGH issue can block its room on the board, and resolving prompts a cleaning task.
- **Lost & Found register (S)** — Upgrade the existing write-only Incident capture into one searchable board with UNCLAIMED/RETURNED/DISPOSED status, room, guest name/phone, storage location, and a "we found your item" WhatsApp action.
- **WhatsApp template library + wa.me helper (S)** — One shared `buildWaLink` utility plus admin-editable bilingual message templates (directions, apology, thank-you + review link, item found, Pujari summary) rendered as one-tap buttons wherever a phone number exists — including the Pujari phones already captured and used nowhere.
- **Guest QR micro-site: feedback + info + problem report (M)** — One public, bilingual (Hindi/English), rate-limited page behind one printed QR: a 30-second star-rating form feeding the existing Reviews analytics (with a "share it on Google" funnel for happy guests), a static info page (WiFi, checkout time, temple timings, tap-to-call), and a "something wrong? tell us now" form that lands directly on the Issues board and pings the front desk. Build all three at once — you only print the QR once.
- **Low-rating instant alert + "responded" tracking (S)** — A ≤2-star review (typed or from the QR form) immediately notifies the owner *and* the front desk while the guest is still reachable; Reviews gains a "needs reply / mark responded" flow.
- **Pujari commission ledger (S)** — Stamp pujari ID, commission % and amount onto each room sale at submit time so renaming a Pujari or editing a rate can never rewrite history, with a month-locked settlement view, "mark paid", and a WhatsApp-able statement. (Today the math is rebuilt live from name strings — real money at risk.)
- **Cash & expense ledger + unified shift handover (M)** — Digitize the paper cash book (advances, Pujari payouts, petty spends, CASH/UPI) plus one 7 PM handover ritual: cash count with variance, keys, auto-listed open tasks/complaints, and notes, pinned to the Dashboard for the incoming shift.
- **Owner daily digest (S)** — A nightly summary to the owner's phone (notification + wa.me-composed message): occupancy, revenue, cash in/out/variance, open issues, any new low review — the first thing you'll actually open from home.

### Phase 2 — Soon after

- **Recurring task templates (M)** — "Check genset daily 7 AM & 7 PM", "deep clean each room every 15 days", "linen change every N days", with a per-clean tick checklist (default unticked — pre-filled lists get pencil-whipped).
- **"My Tasks" phone view (M)** — A card-based, mobile-first screen where a staffer picks their name and sees today's tasks with a big Done button.
- **Correction paths + audit trail (M)** — Safe undo where mistakes are currently permanent: slot delete with revenue rollback, an admin report-fix path, a small AuditLog of who changed what. Per the eZee constraint, *freeze* the manual Add Booking form rather than enhancing it — keep guestPhone/arrivalDate/status columns purely as landing zones for the import.
- **Single Postgres schema + real migrations (S)** — Stop hand-flipping the sqlite/postgres provider per deploy, then bank the constraints that compromise blocked: unique report-per-date, real enums, case-insensitive name uniqueness.
- **CA / accountant monthly export (S)** — Month-scoped CSV of the cash ledger, revenue records, and Pujari statements — the accountant needs data and the app currently exports nothing but PDFs.
- **Festival/season calendar (S)** — Admin-entered festival dates (lunar dates shift yearly) overlaid on the revenue calendar with T-7 prep reminders and festival-vs-festival YoY — the comparison a pilgrimage hotel actually makes.
- **Compliance calendar (M)** — Recurring statutory/AMC items (fire extinguishers, lift AMC, tank cleaning, pest control) and expiry-dated documents (fire NOC, lodging registration) with T-30/T-7/overdue alerts.
- **Guest-contact worklist (M — eZee-dependent)** — Once the import supplies guest phones and arrival dates: a morning checklist of today's arrivals (send directions) and yesterday's checkouts (send thank-you + review QR), each a one-tap WhatsApp send with a done/pending stamp.
- **C-Form / foreigner tracker (S — confirm first)** — A filed/not-filed register with a 24-hour nag for FRRO filings; build only if the hotel actually hosts foreign pilgrims.
- **Occupancy small wins (S)** — "Copy from previous slot" to end the 3×-daily retyping, zero-price warnings; and a decision to make now: once eZee data flows, slots should shrink to a physical-verification snapshot rather than remain full double-entry.

### Phase 3 — Later / optional

- **Housekeeper logins + HOUSEKEEPING role with Hindi-first UI (S)** — Only if the StaffMember-directory approach shows housekeepers will actually open the app.
- **Photo attachments via object storage (M)** — Presigned uploads to R2 (same bucket as backups) for maintenance/complaint/lost-found photos and task photo-proof.
- **Rebuild Team Performance on real task data (S)** — Per-person completion, on-time rate, overdue counts; worthless until weeks of task data exist, so deliberately last.
- **Google rating watch (M)** — Nightly Places-API snapshot with new-review alerts; needs a Google Cloud billing account nobody at the hotel owns — interim: a weekly recurring "check Google reviews" task costs nothing.
- **Installable PWA (S)** — Manifest + offline shell so the app lives on home screens (the load-bearing half — draft/retry on submissions — is in the fix-first list).
- **Visitor & vehicle log (S — confirm first)** — Digitize the visitor register with a printable police day-sheet, only if the hotel genuinely keeps this book on paper today.
- **Competitor rate log (S — confirm first)** — 30-second manual entry of 2–3 nearby lodges' quoted rates beside your ADR; only if someone would actually type it.

---

## 4. Guest-communication channel: WhatsApp click-to-send

Use **wa.me deep links from the front-desk phone's existing WhatsApp — not the WhatsApp Business API, not SMS, not email.** The Business API means a Meta partner contract, template pre-approval, and per-conversation fees to send a few dozen messages a day — pure overhead at this scale. SMS in India requires DLT header and template registration; email is effectively dead for pilgrim guests. Click-to-send is free, needs no approvals, requires nothing server-side that can break, and every guest and Pujari already has WhatsApp: the app composes the bilingual message, one tap opens it ready to send. Pair it with one printed QR code (reception card + in-room sticker) as the guest-facing entry point — that works today with zero guest data. Revisit the Business API only if volume ever makes manual taps a real burden.

---

## 5. Questions to confirm with the hotel

- Which reports appear in eZee's "Send Reports on Night Audit" checklist for this property? (Decides the eZee integration route — see eZee notes.)
- Does the hotel host foreign guests? (Decides the C-Form tracker.)
- Does the front desk keep a paper visitor/vehicle register today? (Decides digitizing it.)
- Would anyone actually log competitor rates? (Decides the rate log.)
- Staff directory without logins vs. individual logins for housekeepers — directory-first is recommended; confirm staff phone habits.
