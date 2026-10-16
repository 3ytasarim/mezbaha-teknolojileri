import "server-only";
import nodemailer from "nodemailer";

/**
 * Form bildirim e-postaları (SMTP). Ayarlar eksikse (yerel geliştirme gibi) sessizce atlanır — form yine de
 * veritabanına kaydedilir ve yönetim panelinde görünür, e-posta yalnızca ek bir bildirimdir.
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null | undefined;

function getTransporter() {
  if (transporter !== undefined) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT ?? 465);

  if (!host || !user || !pass) {
    transporter = null;
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendNotificationEmail(input: { subject: string; html: string; replyTo?: string }): Promise<void> {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  const t = getTransporter();
  if (!t || !to) return;

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: input.subject,
    html: input.html,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

/** Basit, tek sütunlu bir "alan: değer" tablosu — e-posta istemcileri için sade HTML. */
export function fieldsToHtml(title: string, rows: { label: string; value: string | undefined | null }[]): string {
  const filled = rows.filter((r) => r.value && r.value.trim() !== "");
  const tr = filled
    .map(
      (r) =>
        `<tr><td style="padding:6px 12px;color:#64748b;font-weight:600;white-space:nowrap;vertical-align:top;">${escapeHtml(r.label)}</td><td style="padding:6px 12px;color:#0f172a;">${escapeHtml(r.value as string).replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:600px;"><h2 style="color:#16204a;">${escapeHtml(title)}</h2><table style="border-collapse:collapse;width:100%;">${tr}</table></div>`;
}
