import nodemailer from "nodemailer";
import { getSmtpConfig } from "@/shared/hooks/servenEnv";

let transporter: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter {
  if (transporter) return transporter;

  const smtp = getSmtpConfig();

  console.log(
    `[Mailer] Creating transporter — host: ${smtp.host}:${smtp.port}, user: ${smtp.user}`
  );

  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth:
      smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  return transporter;
}

export async function verifyMailer(): Promise<void> {
  try {
    const mailer = getMailer();
    await mailer.verify();
    console.log("[Mailer] ✓ SMTP connection verified successfully");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Mailer] ✗ SMTP connection failed:", message);
  }
}
