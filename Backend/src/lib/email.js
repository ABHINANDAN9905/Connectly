import nodemailer from "nodemailer";

const getTransporter = () => {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
};

export const sendAuthEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`Email not sent because SMTP is not configured. To: ${to}. ${text}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "PinWell <no-reply@pinwell.local>",
    to,
    subject,
    html,
    text,
  });
};
