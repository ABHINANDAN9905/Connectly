import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verifyLink = `${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Connectly Account",
    html: `
      <h2>Welcome to Connectly</h2>
      <p>Please verify your email by clicking the button below:</p>
      <a href="${verifyLink}">Verify Email</a>
    `,
  });
};