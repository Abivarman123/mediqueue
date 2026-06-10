import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { queueTrackingUrl } from "./appUrl";

export const sendConfirmationEmail = action({
  args: {
    patientName: v.string(),
    patientEmail: v.string(),
    tokenCode: v.string(),
    appointmentNumber: v.string(),
    doctorName: v.string(),
    departmentName: v.string(),
    room: v.string(),
    visitDate: v.string(),
    checkInTime: v.float64(),
    position: v.float64(),
    avgConsultMinutes: v.float64(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    const trackingUrl = queueTrackingUrl(args.tokenCode);
    const checkInTimeStr = new Date(args.checkInTime).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const estimatedWaitMin = Math.max(0, (args.position - 1) * args.avgConsultMinutes);
    const estimatedWaitMax = Math.max(5, (args.position - 1) * args.avgConsultMinutes + 5);

    const emailSubject = `✓ Registration Confirmed - MedQ: ${args.tokenCode}`;
    const emailHtml = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>MedQ – Confirmed</title>
  <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet"/>
  <style>
    body {
      margin: 0;
      padding: 48px 16px;
      background: #f5f5f0;
      font-family: 'Inter', sans-serif;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }

    .wrap {
      max-width: 480px;
      margin: 0 auto;
    }

    /* Top wordmark */
    .wordmark {
      text-align: center;
      margin-bottom: 40px;
    }

    .wordmark span {
      font-family: 'Lora', serif;
      font-size: 15px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #1a1a1a;
    }

    /* Main card */
    .card {
      background: #ffffff;
      border-radius: 4px;
      overflow: hidden;
    }

    /* Token header */
    .card-top {
      background: #1a1a1a;
      padding: 40px 40px 36px;
      text-align: center;
    }

    .card-top .eyebrow {
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,.35);
      margin-bottom: 16px;
    }

    .token {
      font-family: 'Lora', serif;
      font-size: 48px;
      color: #ffffff;
      letter-spacing: 8px;
      line-height: 1;
    }

    .position-line {
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255,255,255,.4);
      letter-spacing: 1px;
    }

    .position-line strong {
      color: rgba(255,255,255,.75);
      font-weight: 500;
    }

    /* Body */
    .card-body {
      padding: 36px 40px;
    }

    .greeting {
      font-size: 22px;
      font-family: 'Lora', serif;
      font-weight: 400;
      color: #1a1a1a;
      line-height: 1.4;
      margin-bottom: 32px;
    }

    .greeting em {
      font-style: italic;
      color: #555;
    }

    /* Details */
    .details {
      border-top: 1px solid #ebebeb;
    }

    .row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 13px 0;
      border-bottom: 1px solid #ebebeb;
      gap: 16px;
    }

    .row .key {
      font-size: 12px;
      color: #999;
      letter-spacing: .3px;
      flex-shrink: 0;
    }

    .row .val {
      font-size: 13px;
      color: #1a1a1a;
      font-weight: 500;
      text-align: right;
    }

    /* Wait */
    .wait-row {
      margin-top: 28px;
      padding: 20px 24px;
      background: #f9f9f7;
      border-radius: 3px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .wait-row .wait-label {
      font-size: 11px;
      color: #999;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .wait-row .wait-time {
      font-family: 'Lora', serif;
      font-size: 26px;
      color: #1a1a1a;
    }

    .wait-row .wait-unit {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }

    /* Track */
    .track {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid #ebebeb;
      text-align: center;
    }

    .track p {
      font-size: 11px;
      color: #bbb;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .track a {
      font-size: 13px;
      color: #1a1a1a;
      text-decoration: none;
      border-bottom: 1px solid #1a1a1a;
      padding-bottom: 1px;
    }

    /* Footer */
    .footer {
      margin-top: 32px;
      text-align: center;
    }

    .footer p {
      font-size: 11px;
      color: #bbb;
      line-height: 1.8;
    }
  </style>
</head>
<body>
<div class="wrap">

  <div class="wordmark"><span>MedQ</span></div>

  <div class="card">
    <div class="card-top">
      <div class="eyebrow">Your queue code</div>
      <div class="token">${args.tokenCode}</div>
      <div class="position-line">Position <strong>#${args.position}</strong> in queue</div>
    </div>

    <div class="card-body">
      <p class="greeting">You're checked in,<br><em>${args.patientName}.</em></p>

      <div class="details">
        <div class="row">
          <span class="key">Confirmation - </span>
          <span class="val">${args.appointmentNumber}</span>
        </div>
        <div class="row">
          <span class="key">Date - </span>
          <span class="val">${args.visitDate}</span>
        </div>
        <div class="row">
          <span class="key">Check-in - </span>
          <span class="val">${checkInTimeStr}</span>
        </div>
        <div class="row">
          <span class="key">Doctor - </span>
          <span class="val">${args.doctorName}</span>
        </div>
        <div class="row">
          <span class="key">Department - </span>
          <span class="val">${args.departmentName}</span>
        </div>
        <div class="row">
          <span class="key">Room - </span>
          <span class="val">${args.room}</span>
        </div>
      </div>

      <div class="wait-row">
        <div>
          <div class="wait-label">Estimated wait</div>
          <div class="wait-time">${estimatedWaitMin}–${estimatedWaitMax}</div>
          <div class="wait-unit">minutes</div>
        </div>
      </div>

      <div class="track">
        <p>Track live queue</p>
        <a href="${trackingUrl}">${trackingUrl}</a>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Automated message · Do not reply<br>© 2026 MedQ</p>
  </div>

</div>
</body>
</html>
    `;

    if (!apiKey) {
      console.log("----------------------------------------");
      console.log(`[MOCK CONFIRMATION EMAIL SENT TO: ${args.patientEmail}]`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body outline: Token = ${args.tokenCode}, Confirmation # = ${args.appointmentNumber}, Doctor = ${args.doctorName}, Position = #${args.position}`);
      console.log(`Tracking URL: ${trackingUrl}`);
      console.log("----------------------------------------");
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
          from: "MedQ <onboarding@resend.dev>",
          to: args.patientEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send confirmation email via Resend:", error);
      return { success: false, error: String(error) };
    }
  },
});

export const sendQueueAlertEmail = action({
  args: {
    entryId: v.id("queue_entries"),
    patientName: v.string(),
    patientEmail: v.string(),
    tokenCode: v.string(),
    doctorName: v.string(),
    room: v.string(),
    position: v.float64(),
    estimatedWaitMinutes: v.float64(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    const trackingUrl = queueTrackingUrl(args.tokenCode);
    const emailSubject = `⏰ You're up soon! MedQ Alert: Position #${args.position}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 24px;">MedQ Live Alert</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Smart Waiting, Real-time Queue Tracking</p>
        </div>
        
        <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">Dear <strong>${args.patientName}</strong>,</p>
        
        <div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin: 0 0 5px 0; color: #0369a1; font-size: 16px;">Time to head back to the clinic!</h3>
          <p style="margin: 0; color: #0c4a6e; font-size: 15px;">
            You are currently <strong>#${args.position}</strong> in the queue. There are only ${args.position - 1} patient(s) ahead of you.
          </p>
          <p style="margin: 8px 0 0 0; color: #0369a1; font-size: 14px; font-weight: bold;">
            Estimated wait time: ~${args.estimatedWaitMinutes} minutes.
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
          <a href="${trackingUrl}" style="color: #0d9488; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 5px;">
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
      console.log(`Body outline: Patients ahead = ${args.position - 1}, Estimated wait = ~${args.estimatedWaitMinutes} min, Doctor = ${args.doctorName}, Code = ${args.tokenCode}`);
      console.log(`Tracking URL: ${trackingUrl}`);
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
          from: "MedQ Alerts <onboarding@resend.dev>", // default sender for free sandboxes
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

export const sendCalledEmail = action({
  args: {
    patientName: v.string(),
    patientEmail: v.string(),
    tokenCode: v.string(),
    doctorName: v.string(),
    room: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    const trackingUrl = queueTrackingUrl(args.tokenCode);
    const emailSubject = `🔔 You're being called! MedQ: ${args.tokenCode}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
          <h1 style="color: #0d9488; margin: 0; font-size: 24px;">MedQ Call Notification</h1>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Smart Waiting, Real-time Queue Tracking</p>
        </div>
        
        <p style="font-size: 16px; color: #1e293b; line-height: 1.5;">Dear <strong>${args.patientName}</strong>,</p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <h3 style="margin: 0 0 5px 0; color: #b45309; font-size: 16px;">You're being called now!</h3>
          <p style="margin: 0; color: #92400e; font-size: 15px;">
            Please proceed to the consultation room immediately. The doctor is ready to see you.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Doctor</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">${args.doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Room</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold; text-align: right;">${args.room}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Your Queue Code</td>
            <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #0d9488; font-weight: bold; font-family: monospace; font-size: 18px; text-align: right;">${args.tokenCode}</td>
          </tr>
        </table>

        <p style="font-size: 14px; color: #64748b; line-height: 1.5; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Track your status: <br/>
          <a href="${trackingUrl}" style="color: #0d9488; text-decoration: underline; font-weight: bold; display: inline-block; margin-top: 5px;">
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
      console.log(`[MOCK CALLED EMAIL SENT TO: ${args.patientEmail}]`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body outline: Patient called to room, Doctor = ${args.doctorName}, Room = ${args.room}, Code = ${args.tokenCode}`);
      console.log(`Tracking URL: ${trackingUrl}`);
      console.log("----------------------------------------");
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
          from: "MedQ Alerts <onboarding@resend.dev>",
          to: args.patientEmail,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to send called email via Resend:", error);
      return { success: false, error: String(error) };
    }
  },
});

