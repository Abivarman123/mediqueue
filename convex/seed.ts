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

