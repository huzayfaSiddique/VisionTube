import nodemailer from "nodemailer";

/**
 * Creates an email transporter.
 * Uses SMTP variables if defined, otherwise falls back to Ethereal test account or stream transport.
 */
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal account for development if no SMTP credentials are provided
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.warn("Failed to create Ethereal test email account, using JSON/Console fallback.", error);
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
};

/**
 * Sends a registration confirmation email to a newly signed-up user.
 * @param {Object} options
 * @param {string} options.email - User's email address
 * @param {string} options.username - User's username
 * @param {string} options.confirmationUrl - Redirect link to verify email & homepage
 */
export const sendConfirmationEmail = async ({ email, username, confirmationUrl }) => {
  try {
    const transporter = await createTransporter();
    const fromAddress = process.env.SMTP_FROM || '"VisionTube" <no-reply@visiontube.com>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to VisionTube!</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f0f; color: #f1f1f1; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #1f1f1f; border-radius: 12px; padding: 32px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); border: 1px solid #333; }
          .logo { font-size: 24px; font-weight: bold; color: #ff0000; margin-bottom: 24px; text-decoration: none; display: inline-block; }
          .title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #ffffff; }
          .text { font-size: 15px; line-height: 1.6; color: #aaaaaa; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background-color: #ff0000; color: #ffffff !important; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 24px; display: inline-block; transition: background-color 0.2s; }
          .btn:hover { background-color: #cc0000; }
          .footer { margin-top: 32px; font-size: 12px; color: #666666; text-align: center; border-top: 1px solid #2a2a2a; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="#" class="logo">VisionTube</a>
          <h1 class="title">Confirm your email address, ${username}!</h1>
          <p class="text">Thank you for joining VisionTube. To complete your registration and explore the latest videos, please confirm your email address by clicking the button below.</p>
          <div class="btn-container">
            <a href="${confirmationUrl}" class="btn">Confirm Email & Go to Homepage</a>
          </div>
          <p class="text">If the button above does not work, copy and paste the following URL into your browser:</p>
          <p class="text" style="word-break: break-all; color: #3ea6ff;">${confirmationUrl}</p>
          <div class="footer">
            &copy; ${new Date().getFullYear()} VisionTube. All rights reserved.<br>
            If you did not sign up for a VisionTube account, please ignore this email.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject: "Confirm your VisionTube Account",
      text: `Welcome to VisionTube, ${username}! Please confirm your email address by visiting this link: ${confirmationUrl}`,
      html: htmlContent,
    });

    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview Confirmation Email URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    // Don't throw to prevent breaking registration if mail server fails
    return null;
  }
};
