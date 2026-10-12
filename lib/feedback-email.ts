import { Resend } from "resend";

import { APP_NAME } from "@/lib/app-config";
import { getResendApiKey, getResendFromEmail } from "@/lib/resend-config";
import { getSupportEmail } from "@/lib/support-config";

type FeedbackEmailInput = {
  organizerName: string;
  organizerEmail: string;
  message: string;
  pagePath?: string;
  imageUrl?: string;
  feedbackId: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildFeedbackEmailHtml(input: FeedbackEmailInput) {
  const safeName = escapeHtml(input.organizerName);
  const safeEmail = escapeHtml(input.organizerEmail);
  const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");
  const safePath = escapeHtml(input.pagePath?.trim() || "(not provided)");
  const safeId = escapeHtml(input.feedbackId);
  const imageBlock = input.imageUrl?.trim()
    ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#334155;">
         Attachment:<br />
         <a href="${escapeHtml(input.imageUrl)}" style="color:#16a34a;word-break:break-all;">${escapeHtml(input.imageUrl)}</a>
       </p>
       <p style="margin:12px 0 0;">
         <img src="${escapeHtml(input.imageUrl)}" alt="Feedback attachment" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0;" />
       </p>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 16px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">${escapeHtml(APP_NAME)} · Help center</p>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">New organizer feedback</h1>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">
                  <strong>${safeName}</strong> (${safeEmail}) sent feedback from the Help center.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:15px;line-height:1.6;color:#0f172a;">
                  ${safeMessage}
                </div>
                ${imageBlock}
                <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#64748b;">
                  Page: ${safePath}<br />
                  Feedback ID: ${safeId}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendFeedbackNotificationEmail(
  input: FeedbackEmailInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiKey = getResendApiKey();
  const to = getSupportEmail();
  if (!apiKey) {
    return { ok: false, message: "Email service is not configured." };
  }
  if (!to) {
    return { ok: false, message: "Support inbox is not configured." };
  }

  const resend = new Resend(apiKey);
  const response = await resend.emails.send({
    from: getResendFromEmail(),
    to,
    replyTo: input.organizerEmail,
    subject: `[${APP_NAME}] Help center · ${input.organizerName}`,
    html: buildFeedbackEmailHtml(input),
  });

  if (response.error) {
    return { ok: false, message: response.error.message };
  }

  return { ok: true };
}

type FeedbackConfirmationInput = {
  organizerName: string;
  organizerEmail: string;
  message: string;
};

function buildFeedbackConfirmationHtml(input: FeedbackConfirmationInput) {
  const safeName = escapeHtml(input.organizerName);
  const safeMessage = escapeHtml(input.message).replaceAll("\n", "<br />");

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
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748b;">${escapeHtml(APP_NAME)} · Help center</p>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;">We received your feedback</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                  Hi ${safeName}, thanks for reaching out. We read every message and will get back to you if we need more details.
                </p>
                <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Here is a copy of what you sent:</p>
                <div style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:15px;line-height:1.6;color:#0f172a;">
                  ${safeMessage}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendFeedbackConfirmationEmail(
  input: FeedbackConfirmationInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { ok: false, message: "Email service is not configured." };
  }

  const supportEmail = getSupportEmail();
  const resend = new Resend(apiKey);
  const response = await resend.emails.send({
    from: getResendFromEmail(),
    to: input.organizerEmail,
    ...(supportEmail ? { replyTo: supportEmail } : {}),
    subject: `We received your feedback · ${APP_NAME}`,
    html: buildFeedbackConfirmationHtml(input),
  });

  if (response.error) {
    return { ok: false, message: response.error.message };
  }

  return { ok: true };
}
