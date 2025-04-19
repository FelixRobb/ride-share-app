import fs from "fs";
import path from "path";

import { createTransport } from "nodemailer";

// Load email templates
const welcomeEmailTemplate = fs.readFileSync(
  path.join(__dirname, "../../email templates/welcome.html"),
  "utf-8"
);
const verificationEmailTemplate = fs.readFileSync(
  path.join(__dirname, "../../email templates/VERIFY.html"),
  "utf-8"
);
const resetPasswordEmailTemplate = fs.readFileSync(
  path.join(__dirname, "../../email templates/RESET PASSWORD.html"),
  "utf-8"
);
const emailChangeNotificationTemplate = fs.readFileSync(
  path.join(__dirname, "../../email templates/EMAIL CHANGED.html"),
  "utf-8"
);
const passwordChangeNotificationTemplate = fs.readFileSync(
  path.join(__dirname, "../../email templates/PASSWORD CHANGED.html"),
  "utf-8"
);

const transporter = createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    html,
  });
}

export function getWelcomeEmailContent(name: string): string {
  return welcomeEmailTemplate.replace("${name}", name);
}

export function getVerificationEmailContent(name: string, verificationUrl: string): string {
  return verificationEmailTemplate
    .replace("${name}", name)
    .replace("${verificationUrl}", verificationUrl);
}

export function getResetPasswordEmailContent(resetUrl: string): string {
  return resetPasswordEmailTemplate.replace("${resetUrl}", resetUrl);
}

export function getEmailChangeNotificationContent(name: string, newEmail: string): string {
  return emailChangeNotificationTemplate.replace("${name}", name).replace("${newEmail}", newEmail);
}

export function getPasswordChangeNotificationContent(name: string): string {
  return passwordChangeNotificationTemplate.replace("${name}", name);
}
