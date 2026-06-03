import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const doctors = await ctx.db.query("doctors").collect();

    // Batch-fetch unique departments to avoid N+1 round-trips
    const uniqueDeptIds = [...new Set(doctors.map((d) => d.departmentId))];
    const deptMap = new Map(
      await Promise.all(
        uniqueDeptIds.map(async (id) => {
          const dept = await ctx.db.get(id);
          return [id, dept] as const;
        })
      )
    );

    return doctors.map((doc) => {
      const dept = deptMap.get(doc.departmentId);
      return {
        ...doc,
        departmentName: dept ? dept.name : "Unknown",
        fixedTimeStart: dept ? dept.workingHoursStart : undefined,
        fixedTimeEnd: dept ? dept.workingHoursEnd : undefined,
      };
    });
  },
});

export const listByDepartment = query({
  args: { departmentId: v.id("departments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctors")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();
  },
});

export const get = query({
  args: { doctorId: v.id("doctors") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.doctorId);
    if (!doc) return null;
    const dept = await ctx.db.get(doc.departmentId);
    return {
      ...doc,
      departmentName: dept ? dept.name : "Unknown",
      fixedTimeStart: dept ? dept.workingHoursStart : undefined,
      fixedTimeEnd: dept ? dept.workingHoursEnd : undefined,
    };
  },
});

export const create = mutation({
  args: {
    departmentId: v.id("departments"),
    name: v.string(),
    room: v.string(),
    avgConsultMinutes: v.float64(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("doctors", {
      departmentId: args.departmentId,
      name: args.name,
      room: args.room,
      avgConsultMinutes: args.avgConsultMinutes,
      status: "available",
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    doctorId: v.id("doctors"),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("on_break"),
      v.literal("off")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.doctorId, { status: args.status });
  },
});

export const updateAvgConsult = mutation({
  args: {
    doctorId: v.id("doctors"),
    avgConsultMinutes: v.float64(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.doctorId, { avgConsultMinutes: args.avgConsultMinutes });
  },
});
