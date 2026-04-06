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
      <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #64748b; line-height: 1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

export const sendNotificationEmail = async (to: string, subject: string, message: string, linkLabel: string, linkPath: string) => {
  const url = `${process.env.CLIENT_URL}${linkPath}`;

  try {
    await transporter.sendMail({
      from: `"PM App" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">New Notification</h2>
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6; color: #334155;">${message}</p>
          <div style="margin: 24px 0;">
            <a href="${url}" 
               style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              ${linkLabel}
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
            This is an automated notification from your Project Management Dashboard.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
