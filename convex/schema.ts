import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  departments: defineTable({
    name: v.string(),
    code: v.string(), // e.g. "PEDS", "CARD", "OPD"
    workingHoursStart: v.string(), // "08:00"
    workingHoursEnd: v.string(), // "17:00"
  }),

  doctors: defineTable({
    departmentId: v.id("departments"),
    name: v.string(),
    room: v.string(),
    avgConsultMinutes: v.float64(), // e.g. 10.0
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("on_break"),
      v.literal("off")
    ),
  }).index("by_department", ["departmentId"]),

  queues: defineTable({
    doctorId: v.id("doctors"),
    date: v.string(), // "YYYY-MM-DD"
    isOpen: v.boolean(),
  }).index("by_doctor_date", ["doctorId", "date"]),

  queue_entries: defineTable({
    queueId: v.id("queues"),
    tokenCode: v.string(), // e.g. "A7F2K9"
    patientName: v.string(),
    patientEmail: v.optional(v.string()), // for notification emails
    patientPhone: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()), // YYYY-MM-DD
    appointmentNumber: v.optional(v.string()), // clinic-generated confirmation
    position: v.float64(), // position value to support re-ordering if needed (standard 1-indexed integers by default)
    status: v.union(
      v.literal("waiting"),
      v.literal("called"), // called to room (notified)
      v.literal("arrived"), // patient arrived at room / checked-in physically
      v.literal("in_consultation"), // currently seeing doctor
      v.literal("done"),
      v.literal("skipped")
    ),
    checkInTime: v.float64(), // timestamp
    calledTime: v.optional(v.float64()), // timestamp when called
    doneTime: v.optional(v.float64()), // timestamp when done
    emailNotificationSent: v.boolean(),
  })
    .index("by_token", ["tokenCode"])
    .index("by_queue", ["queueId"])
    .index("by_queue_status_position", ["queueId", "status", "position"]),
});

