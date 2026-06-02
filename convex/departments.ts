import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("departments").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    workingHoursStart: v.string(),
    workingHoursEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
      workingHoursStart: args.workingHoursStart,
      workingHoursEnd: args.workingHoursEnd,
    });
    return id;
  },
});
