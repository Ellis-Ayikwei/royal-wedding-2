import { createClient } from "@libsql/client";

const BASE = "http://localhost:3000";
const db = createClient({ url: "file:data/wedding.db" });

const login = await fetch(`${BASE}/api/admin/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@royalwedding.gh", password: "ChangeMe123!" }),
});
const cookie = login.headers.get("set-cookie").split(";")[0];
console.log("login:", login.status);

const created = await fetch(`${BASE}/api/admin/guests`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ name: "Status Test Guest", phone: "+233209999999", guestCount: 3 }),
});
const guest = (await created.json()).guest;
console.log(`created guest, status=${guest.rsvpStatus} party=${guest.guestCount}\n`);

async function setStatus(status) {
  const res = await fetch(`${BASE}/api/admin/guests/${guest.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ rsvpStatus: status }),
  });
  const data = await res.json();
  const row = (await db.execute({ sql: "SELECT rsvpStatus, guestCount, name FROM guests WHERE id = ?", args: [guest.id] })).rows[0];
  console.log(`PATCH -> ${status.padEnd(9)} http=${res.status} api=${data.guest?.rsvpStatus} db=${row.rsvpStatus} (party ${row.guestCount}, name "${row.name}" preserved)`);
}

await setStatus("accepted");
await setStatus("declined");
await setStatus("pending");

// An invalid value must be rejected.
const bad = await fetch(`${BASE}/api/admin/guests/${guest.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json", Cookie: cookie },
  body: JSON.stringify({ rsvpStatus: "maybe" }),
});
console.log(`\nPATCH -> "maybe"    http=${bad.status} (rejected)`);

// Unauthenticated must be rejected.
const noAuth = await fetch(`${BASE}/api/admin/guests/${guest.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rsvpStatus: "accepted" }),
});
console.log(`PATCH no cookie    http=${noAuth.status} (rejected)`);

// After an admin resets to pending, the guest's own link works again.
await setStatus("accepted");
const blocked = await fetch(`${BASE}/api/rsvp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: guest.invitationToken, phone: "+233209999999", attendance: "accepted" }),
});
console.log(`\nguest RSVP while accepted  -> ${blocked.status} (blocked)`);
await setStatus("pending");
const allowed = await fetch(`${BASE}/api/rsvp`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: guest.invitationToken, phone: "+233209999999", attendance: "accepted" }),
});
console.log(`guest RSVP after reset     -> ${allowed.status} (allowed again)`);

await fetch(`${BASE}/api/admin/guests/${guest.id}`, { method: "DELETE", headers: { Cookie: cookie } });
const left = await db.execute("SELECT COUNT(*) c FROM guests");
console.log(`\ncleaned up. guests remaining: ${left.rows[0].c}`);
