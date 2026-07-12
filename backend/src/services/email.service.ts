import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    // SMTP not configured — log instead so the app still works.
    console.log(`[email:skipped] To: ${to} | Subject: ${subject}`);
    return false;
  }
  try {
    await t.sendMail({ from: env.smtp.from, to, subject, html });
    return true;
  } catch (err) {
    console.error('[email:error]', err);
    return false;
  }
}
