import { Resend } from "resend";

import { APP_NAME } from "@/lib/app-config";
import { getResendApiKey, getResendFromEmail } from "@/lib/resend-config";
import { getSupportEmail } from "@/lib/support-config";

type EmailResult = { ok: true } | { ok: false; message: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function wrapEmailHtml(eyebrow: string, heading: string, body: string) {
  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">${escapeHtml(APP_NAME)} · ${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">${escapeHtml(heading)}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const paragraphStyle = "margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;";

async function sendEmail(input: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { ok: false, message: "Email service is not configured." };
  }

  const resend = new Resend(apiKey);
  const response = await resend.emails.send({
    from: getResendFromEmail(),
    to: input.to,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    subject: input.subject,
    html: input.html,
  });

  if (response.error) {
    return { ok: false, message: response.error.message };
  }
  return { ok: true };
}

export async function sendPremiumRequestAdminEmail(input: {
  userName: string;
  userEmail: string;
  paymentMethodLabel: string;
  amountPhp: number;
  payerNote: string;
  proofUrl: string;
  requestId: string;
}): Promise<EmailResult> {
  const to = getSupportEmail();
  if (!to) {
    return { ok: false, message: "Support inbox is not configured." };
  }

  const safeProof = escapeHtml(input.proofUrl);
  const note = input.payerNote.trim()
    ? `<div style="margin:0 0 16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:15px;line-height:1.6;color:#0f172a;">${escapeHtml(input.payerNote).replaceAll("\n", "<br />")}</div>`
    : "";

  const html = wrapEmailHtml(
    "Premium",
    "New Premium payment submission",
    `<p style="${paragraphStyle}">
       <strong>${escapeHtml(input.userName)}</strong> (${escapeHtml(input.userEmail)}) submitted proof of payment:
       ${escapeHtml(input.paymentMethodLabel)}, ₱${input.amountPhp.toLocaleString("en-PH")}.
     </p>
     ${note}
     <p style="${paragraphStyle}">
       <a href="${safeProof}" style="color:#16a34a;word-break:break-all;">View payment proof</a>
     </p>
     <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">Request ID: ${escapeHtml(input.requestId)}</p>`,
  );

  return sendEmail({
    to,
    replyTo: input.userEmail,
    subject: `[${APP_NAME}] Premium request · ${input.userName}`,
    html,
  });
}

export async function sendPremiumDecisionEmail(input: {
  userName: string;
  userEmail: string;
  decision: "approved" | "rejected";
}): Promise<EmailResult> {
  const supportEmail = getSupportEmail();
  const safeName = escapeHtml(input.userName);

  const approved = input.decision === "approved";
  const heading = approved ? "Your Premium access is active" : "We couldn't approve your payment";
  const body = approved
    ? `<p style="${paragraphStyle}">Hi ${safeName}, your payment has been verified and Premium is now active on your account. Thank you for supporting ${escapeHtml(APP_NAME)}!</p>`
    : `<p style="${paragraphStyle}">Hi ${safeName}, we weren't able to verify your Premium payment submission. You can submit a new proof of payment from the Premium page, or reply to this email if you need help.</p>`;

  return sendEmail({
    to: input.userEmail,
    replyTo: supportEmail || undefined,
    subject: approved
      ? `Your Premium access is active · ${APP_NAME}`
      : `Update on your Premium payment · ${APP_NAME}`,
    html: wrapEmailHtml("Premium", heading, body),
  });
}
