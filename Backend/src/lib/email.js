import axios from "axios";

export const sendVerificationEmail = async (email, token) => {
  const verifyLink = `${process.env.CLIENT_URL}/verify-email/${token}`;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "Connectly", email: "aeace9001@smtp-brevo.com" },
      to: [{ email }],
      subject: "Verify Your Connectly Account",
      htmlContent: `
        <h2>Welcome to Connectly 🚀</h2>
        <p>Please verify your email address.</p>
        <a href="${verifyLink}">Verify Email</a>
      `,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
};