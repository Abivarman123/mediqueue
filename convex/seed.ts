import { mutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const DEPARTMENTS = [
  {
    code: "PEDS",
    name: "Pediatrics Department",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
  },
  {
    code: "CARD",
    name: "Cardiology Center",
    workingHoursStart: "09:00",
    workingHoursEnd: "16:00",
  },
  {
    code: "GOPD",
    name: "General Outpatient (OPD)",
    workingHoursStart: "08:00",
    workingHoursEnd: "18:00",
  },
  {
    code: "ORTH",
    name: "Orthopedics Clinic",
    workingHoursStart: "08:30",
    workingHoursEnd: "17:30",
  },
  {
    code: "DERM",
    name: "Dermatology Suite",
    workingHoursStart: "09:00",
    workingHoursEnd: "16:30",
  },
  {
    code: "ENT",
    name: "ENT & Audiology",
    workingHoursStart: "08:00",
    workingHoursEnd: "17:00",
  },
] as const;

const DOCTORS = [
  {
    departmentCode: "PEDS",
    name: "Dr. Sarah Jenkins",
    room: "Room 102",
    avgConsultMinutes: 12,
    status: "available" as const,
  },
  {
    departmentCode: "PEDS",
    name: "Dr. Michael Okafor",
    room: "Room 103",
    avgConsultMinutes: 10,
    status: "available" as const,
  },
  {
    departmentCode: "PEDS",
    name: "Dr. Priya Nair",
    room: "Room 104",
    avgConsultMinutes: 11,
    status: "on_break" as const,
  },
  {
    departmentCode: "CARD",
    name: "Dr. Robert Chen",
    room: "Room 204",
    avgConsultMinutes: 15,
    status: "busy" as const,
  },
  {
    departmentCode: "CARD",
    name: "Dr. Lisa Park",
    room: "Room 205",
    avgConsultMinutes: 14,
    status: "available" as const,
  },
  {
    departmentCode: "GOPD",
    name: "Dr. Ananya Sharma",
    room: "Room 105",
    avgConsultMinutes: 8,
    status: "available" as const,
  },
  {
    departmentCode: "GOPD",
    name: "Dr. James Okonkwo",
    room: "Room 106",
    avgConsultMinutes: 9,
    status: "available" as const,
  },
  {
    departmentCode: "GOPD",
    name: "Dr. Maria Santos",
    room: "Room 107",
    avgConsultMinutes: 10,
    status: "off" as const,
  },
  {
    departmentCode: "ORTH",
    name: "Dr. Elena Vasquez",
    room: "Room 301",
    avgConsultMinutes: 13,
    status: "available" as const,
  },
  {
    departmentCode: "ORTH",
    name: "Dr. Raj Patel",
    room: "Room 302",
    avgConsultMinutes: 12,
    status: "available" as const,
  },
  {
    departmentCode: "DERM",
    name: "Dr. Fiona Walsh",
    room: "Room 401",
    avgConsultMinutes: 11,
    status: "available" as const,
  },
  {
    departmentCode: "DERM",
    name: "Dr. Kevin Nguyen",
    room: "Room 402",
    avgConsultMinutes: 10,
    status: "busy" as const,
  },
  {
    departmentCode: "ENT",
    name: "Dr. Hannah Brooks",
    room: "Room 501",
    avgConsultMinutes: 12,
    status: "available" as const,
  },
  {
    departmentCode: "ENT",
    name: "Dr. Yusuf Al-Rashid",
    room: "Room 502",
    avgConsultMinutes: 11,
    status: "available" as const,
  },
] as const;

async function ensureDepartments(ctx: MutationCtx) {
  const existing = await ctx.db.query("departments").collect();
  const byCode = new Map(existing.map((d) => [d.code, d._id]));

  for (const dept of DEPARTMENTS) {
    if (!byCode.has(dept.code)) {
      const id = await ctx.db.insert("departments", {
        name: dept.name,
        code: dept.code,
        workingHoursStart: dept.workingHoursStart,
        workingHoursEnd: dept.workingHoursEnd,
      });
      byCode.set(dept.code, id);
    }
  }

  return byCode as Map<string, Id<"departments">>;
}

async function ensureDoctors(
  ctx: MutationCtx,
  deptByCode: Map<string, Id<"departments">>,
  options?: { onlyMissing?: boolean }
) {
  const existing = await ctx.db.query("doctors").collect();
  const existingNames = new Set(existing.map((d) => d.name));
  const todayStr = new Date().toISOString().split("T")[0];
  const insertedDoctorIds: Id<"doctors">[] = [];

  for (const doc of DOCTORS) {
    if (options?.onlyMissing && existingNames.has(doc.name)) {
      continue;
    }

    const departmentId = deptByCode.get(doc.departmentCode);
    if (!departmentId) {
      continue;
    }

    if (existingNames.has(doc.name)) {
      continue;
    }

    const doctorId = await ctx.db.insert("doctors", {
      departmentId,
      name: doc.name,
      room: doc.room,
      avgConsultMinutes: doc.avgConsultMinutes,
      status: doc.status,
    });
    existingNames.add(doc.name);
    insertedDoctorIds.push(doctorId);

    const existingQueue = await ctx.db
      .query("queues")
      .withIndex("by_doctor_date", (q) =>
        q.eq("doctorId", doctorId).eq("date", todayStr)
      )
      .first();

    if (!existingQueue) {
      await ctx.db.insert("queues", {
        doctorId,
        date: todayStr,
        isOpen: doc.status !== "off",
      });
    }
  }

  return insertedDoctorIds;
}

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    const depts = await ctx.db.query("departments").collect();
    if (depts.length > 0) {
      const deptByCode = await ensureDepartments(ctx);
      const added = await ensureDoctors(ctx, deptByCode, { onlyMissing: true });
      if (added.length === 0) {
        return { message: "All demo doctors are already in the database.", doctorsAdded: 0 };
      }
      return {
        message: `Added ${added.length} doctor(s).`,
        doctorsAdded: added.length,
      };
    }

    const deptByCode = await ensureDepartments(ctx);
    const doctorIds = await ensureDoctors(ctx, deptByCode);

    const todayStr = new Date().toISOString().split("T")[0];
    const sarahIdx = DOCTORS.findIndex((d) => d.name === "Dr. Sarah Jenkins");
    const doc1 = sarahIdx >= 0 ? doctorIds[sarahIdx] : undefined;
    const q1 = doc1
      ? await ctx.db
          .query("queues")
          .withIndex("by_doctor_date", (q) => q.eq("doctorId", doc1).eq("date", todayStr))
          .first()
      : null;

    if (q1) {
      const patientNames = ["David Miller", "Emma Watson", "James Smith", "Sophia Taylor"];
      const patientEmails = [
        "david@example.com",
        "emma@example.com",
        "james@example.com",
        "sophia@example.com",
      ];
      const tokenCodes = ["P2X8HY", "K4J9LM", "F7B3NQ", "M9R2PV"];

      for (let i = 0; i < patientNames.length; i++) {
        await ctx.db.insert("queue_entries", {
          queueId: q1._id,
          tokenCode: tokenCodes[i],
          patientName: patientNames[i],
          patientEmail: patientEmails[i],
          position: i + 1,
          status: i === 0 ? "in_consultation" : "waiting",
          checkInTime: Date.now() - (4 - i) * 600000,
          emailNotificationSent: false,
        });
      }

      await ctx.db.insert("queue_entries", {
        queueId: q1._id,
        tokenCode: "A1B2C3",
        patientName: "John Doe",
        patientEmail: "john@example.com",
        position: 0,
        status: "done",
        checkInTime: Date.now() - 3600000,
        calledTime: Date.now() - 3000000,
        doneTime: Date.now() - 2400000,
        emailNotificationSent: true,
      });
    }

    return {
      message: "Seeding complete!",
      doctorsAdded: doctorIds.length,
    };
  },
});

/** Adds any doctors from the catalog that are not already in the database. */
export const seedAdditionalDoctors = mutation({
  args: {},
  handler: async (ctx) => {
    const deptByCode = await ensureDepartments(ctx);
    const added = await ensureDoctors(ctx, deptByCode, { onlyMissing: true });

    if (added.length === 0) {
      return { message: "All demo doctors are already in the database.", doctorsAdded: 0 };
    }

    return {
      message: `Added ${added.length} doctor(s).`,
      doctorsAdded: added.length,
    };
  },
});

// ─── Mock Queue Seeder ───────────────────────────────────────────────────────

const MOCK_FIRST_NAMES = [
  "Aiden", "Amara", "Benjamin", "Chloe", "Daniel", "Elena", "Farid", "Grace",
  "Haruto", "Isabella", "James", "Kavya", "Liam", "Mia", "Noah", "Olivia",
  "Patrick", "Quinn", "Rohan", "Sophia", "Thomas", "Uma", "Victor", "Wendy",
  "Xander", "Yasmin", "Zara", "Marcus", "Natalie", "Oscar",
];
const MOCK_LAST_NAMES = [
  "Anderson", "Patel", "Johnson", "Williams", "Brown", "Jones", "Garcia",
  "Miller", "Davis", "Martinez", "Chen", "Taylor", "Thomas", "Jackson",
  "White", "Harris", "Martin", "Thompson", "Moore", "Nguyen", "Lee", "Walker",
  "Hall", "Allen", "Young", "Hernandez", "King", "Wright", "Lopez", "Hill",
];

function makeMockToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makePatientName(): string {
  return `${pickRandom(MOCK_FIRST_NAMES)} ${pickRandom(MOCK_LAST_NAMES)}`;
}

/**
 * Fills today's queue for every doctor in the database with realistic mock
 * patient entries. Existing entries are left untouched — only new ones are
 * appended.  Each doctor gets between 3–4 active patients so the dashboard
 * shows a realistic but lean demo queue.
 *
 * If the database is empty it will first bootstrap departments and doctors
 * automatically, so no separate "Sync demo data" step is needed.
 */
export const seedMockQueue = mutation({
  args: {},
  handler: async (ctx) => {
    const todayStr = new Date().toISOString().split("T")[0];
    let doctors = await ctx.db.query("doctors").collect();

    // Auto-bootstrap if the database has never been seeded
    if (doctors.length === 0) {
      const deptByCode = await ensureDepartments(ctx);
      await ensureDoctors(ctx, deptByCode);
      doctors = await ctx.db.query("doctors").collect();
    }

    let totalAdded = 0;

    for (const doctor of doctors) {
      // Skip doctors that are "off" — they wouldn't have an active queue
      if (doctor.status === "off") continue;

      // Get or create today's queue
      let queue = await ctx.db
        .query("queues")
        .withIndex("by_doctor_date", (q) =>
          q.eq("doctorId", doctor._id).eq("date", todayStr)
        )
        .first();

      if (!queue) {
        const queueId = await ctx.db.insert("queues", {
          doctorId: doctor._id,
          date: todayStr,
          isOpen: true,
        });
        queue = await ctx.db.get(queueId);
      }

      if (!queue) continue;

      // Count current active (non-done/skipped) entries so we don't dupe
      const existing = await ctx.db
        .query("queue_entries")
        .withIndex("by_queue", (q) => q.eq("queueId", queue!._id))
        .collect();

      const activeCount = existing.filter((e) =>
        ["waiting", "called", "arrived", "in_consultation"].includes(e.status)
      ).length;

      // We want 3–4 active patients total per doctor
      const targetActive = 3 + Math.floor(Math.random() * 2); // 3..4
      const toAdd = Math.max(0, targetActive - activeCount);

      if (toAdd === 0) continue;

      const now = Date.now();
      const avgMin = doctor.avgConsultMinutes || 10;

      // Build a token set from existing entries to avoid collisions
      const usedTokens = new Set(existing.map((e) => e.tokenCode));

      // Add 1–2 "done" patients to show a bit of history
      const doneCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < doneCount; i++) {
        let token = makeMockToken();
        while (usedTokens.has(token)) token = makeMockToken();
        usedTokens.add(token);

        const checkInTime = now - (doneCount - i + toAdd + 2) * avgMin * 60_000;
        const calledTime = checkInTime + avgMin * 30_000;
        const doneTime = calledTime + avgMin * 60_000;

        await ctx.db.insert("queue_entries", {
          queueId: queue._id,
          tokenCode: token,
          patientName: makePatientName(),
          position: 0,
          status: "done",
          checkInTime,
          calledTime,
          doneTime,
          emailNotificationSent: true,
        });
        totalAdded++;
      }

      // Determine statuses for the active wave
      // We'll place 1 in_consultation, then rest as waiting
      const statuses: Array<"in_consultation" | "waiting"> = [];
      if (!existing.some((e) => e.status === "in_consultation")) {
        statuses.push("in_consultation");
      }
      for (let i = statuses.length; i < toAdd; i++) {
        statuses.push("waiting");
      }

      let nextPosition =
        activeCount === 0 ? 1 : Math.max(...existing.map((e) => e.position)) + 1;

      for (let i = 0; i < statuses.length; i++) {
        let token = makeMockToken();
        while (usedTokens.has(token)) token = makeMockToken();
        usedTokens.add(token);

        const status = statuses[i];
        const checkInTime = now - (toAdd - i) * avgMin * 45_000;
        const isInConsult = status === "in_consultation";

        await ctx.db.insert("queue_entries", {
          queueId: queue._id,
          tokenCode: token,
          patientName: makePatientName(),
          position: isInConsult ? 0 : nextPosition++,
          status,
          checkInTime,
          ...(isInConsult ? { calledTime: checkInTime + avgMin * 30_000 } : {}),
          emailNotificationSent: false,
        });
        totalAdded++;
      }
    }

    return {
      message: `Mock queue generated! Added ${totalAdded} patient entries across ${doctors.filter((d) => d.status !== "off").length} active doctors.`,
      entriesAdded: totalAdded,
    };
  },
});

/**
 * Clears all queue entries (and queues) for today across all doctors.
 * Useful for resetting the demo state.
 */
export const clearTodayQueues = mutation({
  args: {},
  handler: async (ctx) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const doctors = await ctx.db.query("doctors").collect();

    let removedEntries = 0;
    let removedQueues = 0;

    for (const doctor of doctors) {
      const queue = await ctx.db
        .query("queues")
        .withIndex("by_doctor_date", (q) =>
          q.eq("doctorId", doctor._id).eq("date", todayStr)
        )
        .first();

      if (!queue) continue;

      // Delete all entries in this queue in batches
      let batch = await ctx.db
        .query("queue_entries")
        .withIndex("by_queue", (q) => q.eq("queueId", queue._id))
        .take(100);

      while (batch.length > 0) {
        for (const entry of batch) {
          await ctx.db.delete(entry._id);
          removedEntries++;
        }
        batch = await ctx.db
          .query("queue_entries")
          .withIndex("by_queue", (q) => q.eq("queueId", queue._id))
          .take(100);
      }

      await ctx.db.delete(queue._id);
      removedQueues++;
    }

    return {
      message: `Cleared ${removedEntries} entries across ${removedQueues} queues for today.`,
      removedEntries,
      removedQueues,
    };
  },
});

