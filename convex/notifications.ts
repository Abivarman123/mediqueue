import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const sendQueueAlertEmail = action({
  args: {
    entryId: v.id("queue_entries"),
    patientName: v.string(),
    patientEmail: v.string(),
    tokenCode: v.string(),
    doctorName: v.string(),
    room: v.string(),
    position: v.float64(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    const emailSubject = `⏰ You're up soon! MediQueue Alert: Position #${args.position}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 24px;">MediQueue Live Alert</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Smart Waiting, Real-time Queue Tracking</p>
        </div>
        
        <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">Dear <strong>${args.patientName}</strong>,</p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin: 0 0 5px 0; color: #0369a1; font-size: 16px;">Time to head back to the clinic!</h3>
          <p style="margin: 0; color: #0c4a6e; font-size: 15px;">
            You are currently <strong>#${args.position}</strong> in the queue. There are only ${args.position - 1} patient(s) ahead of you.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Doctor</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">${args.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Location</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">${args.room}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Your Queue Code</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0d9488; font-weight: bold; font-family: monospace; font-size: 18px; text-align: right;">${args.tokenCode}</td>
          </tr>
        </table>

        <p style="font-size: 14px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          To track your live status in real time, keep the following link open: <br/>
          <a href="https://mediqueue.vercel.app/q/${args.tokenCode}" style="color: #0d9488; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 5px;">
            View Real-time Position Card
          </a>
        </p>
        
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 10px;">
          This is an automated clinical notification. Please do not reply directly to this email.
        </p>
      </div>
    `;

    if (!apiKey) {
      console.log("----------------------------------------");
      console.log(`[MOCK EMAIL SENT TO: ${args.patientEmail}]`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body outline: Patients ahead = ${args.position - 1}, Doctor = ${args.doctorName}, Code = ${args.tokenCode}`);
      console.log("----------------------------------------");
      
      // Mark as notified in database!
      await ctx.runMutation(api.queues.markNotificationSent, { entryId: args.entryId });
      return { success: true, mocked: true };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "MediQueue Alerts <onboarding@resend.dev>", // default sender for free sandboxes
          to: args.patientEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      // Mark as notified in database
      await ctx.runMutation(api.queues.markNotificationSent, { entryId: args.entryId });
      return { success: true };
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      return { success: false, error: String(error) };
    }
  },
});
