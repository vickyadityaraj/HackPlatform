import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendOtpEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"HackPlatform Admin" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: email,
    subject: "Your HackPlatform Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center; margin-bottom: 20px;">HackPlatform</h2>
        <p style="font-size: 14px; color: #374151;">Hello,</p>
        <p style="font-size: 14px; color: #374151; line-height: 1.5;">
          Thank you for signing up on HackPlatform! To complete your registration, please verify your email address by using the One-Time Password (OTP) below:
        </p>
        <div style="font-size: 28px; font-weight: 800; text-align: center; padding: 18px; margin: 24px auto; background-color: #f3f4f6; border-radius: 8px; letter-spacing: 6px; color: #1e1b4b; width: fit-content; font-family: monospace;">
          ${otp}
        </div>
        <p style="font-size: 14px; color: #374151; line-height: 1.5;">
          This OTP is valid for <strong>10 minutes</strong>. For security reasons, please do not share this code with anyone.
        </p>
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; line-height: 1.4;">
          If you did not initiate this request, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendContactRequestEmail(
  toEmail: string,
  toName: string,
  fromName: string,
  fromEmail: string,
  eventTitle: string,
  message: string
) {
  const mailOptions = {
    from: `"HackPlatform Matchmaking" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `New Team Invitation Request for ${eventTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
        <h2 style="color: #6366f1; text-align: center; margin-bottom: 20px;">HackPlatform Team Invitation</h2>
        <p style="font-size: 15px;">Hello <strong>${toName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5;">
          <strong>${fromName}</strong> (${fromEmail}) has found your profile on the interested candidate list for the event <strong>${eventTitle}</strong> and would like to invite you to team up!
        </p>
        
        <div style="padding: 15px; background-color: #f9fafb; border-left: 4px solid #6366f1; border-radius: 4px; margin: 20px 0; font-style: italic; font-size: 14px; line-height: 1.6; color: #374151;">
          "${message}"
        </div>

        <p style="font-size: 14px; line-height: 1.5;">
          You can reply directly to this email or contact them at <a href="mailto:${fromEmail}">${fromEmail}</a> to discuss and coordinate team formation.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          This request was triggered via the HackPlatform Developer Matchmaking system.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
