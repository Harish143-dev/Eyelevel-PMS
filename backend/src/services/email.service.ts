import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendResetPasswordEmail = async (to: string, resetToken: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;

  await transporter.sendMail({
    from: `"PM App" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b;">Reset Your Password</h2>
        <p style="color: #64748b;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 14px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};
