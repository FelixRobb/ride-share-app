import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
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
  return `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RideShare</title>
  <style>
    :root {
      --background: #080808;
      --foreground: #dadada;
      --muted: #f5f5f4;
      --muted-foreground: #78716c;
      --card: #0f0f0f;
      --card-foreground: #0c0a09;
      --border: #e7e5e4;
      --primary: #dd5d02;
      --primary-foreground: #fafaf9;
      --secondary: #f5f5f4;
      --secondary-foreground: #1c1917;
      --accent: #f5f5f4;
      --accent-foreground: #1c1917;
      --destructive: #ef4444;
      --destructive-foreground: #fafaf9;
      --ring: #f97316;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background-color: var(--background);
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      color: var(--primary);
      font-size: 1.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .feature {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .feature h2 {
      color: var(--primary);
      font-size: 1.25rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
    }
    .cta-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: var(--primary);
      color: var(--primary-foreground);
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 500;
      text-align: center;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #ea580c;
    }
    .footer {
      margin-top: 2rem;
      text-align: center;
      color: var(--muted-foreground);
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to RideShare, ${name}!</h1>
    <p>We're thrilled to have you join our community of ride-sharers. Get ready for a smoother, more connected way to travel!</p>
    
    <div class="feature">
      <h2>Discover Rides</h2>
      <p>Find or offer rides with ease. Our intuitive interface makes connecting with fellow travelers a breeze.</p>
    </div>
    
    <div class="feature">
      <h2>Build Your Network</h2>
      <p>Connect with friends and colleagues to create a trusted circle of ride-sharing partners.</p>
    </div>
    
    <div class="feature">
      <h2>Stay Updated</h2>
      <p>Receive real-time notifications about your rides, ensuring you're always in the loop.</p>
    </div>
    
    <div class="feature">
      <h2>Go Green</h2>
      <p>By sharing rides, you're reducing your carbon footprint. Every trip makes a difference!</p>
    </div>
    
    <div style="text-align: center; margin-top: 2rem;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">Start Sharing Rides</a>
    </div>
    
    <div class="footer">
      <p>Questions? Contact our support team at <a href="mailto:${process.env.GMAIL_USER}" style="color: var(--primary);">support@rideshare.com</a></p>
      <p>© ${new Date().getFullYear()} RideShare. All rights reserved.</p>
      <p>You're receiving this email because you signed up for RideShare.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getVerificationEmailContent(name: string, verificationUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email for RideShare</title>
  <style>
    :root {
      --background: #080808;
      --foreground: #dadada;
      --muted: #f5f5f4;
      --muted-foreground: #78716c;
      --card: #ffffff;
      --card-foreground: #0c0a09;
      --border: #e7e5e4;
      --primary: #dd5d02;
      --primary-foreground: #fafaf9;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background-color: var(--background);
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      color: var(--primary);
      font-size: 1.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .verify-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: var(--primary);
      color: var(--primary-foreground);
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 500;
      text-align: center;
      transition: background-color 0.2s;
    }
    .verify-button:hover {
      background-color: #ea580c;
    }
    .link-text {
      word-break: break-all;
      color: var(--primary);
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Verify Your Email</h1>
    <p>Hello ${name},</p>
    <p>Thank you for registering with RideShare. To complete your registration and start using our service, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center; margin: 2rem 0;">
      <a href="${verificationUrl}" class="verify-button">Verify Email</a>
    </div>
    
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p class="link-text">${verificationUrl}</p>
    
    <p style="color: var(--muted-foreground);">This link will expire in 24 hours for security reasons.</p>
    
    <div style="margin-top: 2rem; text-align: center; color: var(--muted-foreground); font-size: 0.875rem;">
      <p>If you didn't create an account with RideShare, please ignore this email.</p>
      <p>© ${new Date().getFullYear()} RideShare. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getResetPasswordEmailContent(resetUrl: string): string {
  return `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your RideShare Password</title>
  <style>
    :root {
      --background: #080808;
      --foreground: #dadada;
      --muted: #f5f5f4;
      --muted-foreground: #78716c;
      --card: #0f0f0f;
      --card-foreground: #0c0a09;
      --border: #e7e5e4;
      --primary: #dd5d02;
      --primary-foreground: #fafaf9;
      --destructive: #ef4444;
      --destructive-foreground: #6c6c6c;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: var(--foreground);
      background-color: var(--background);
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 {
      color: var(--primary);
      font-size: 1.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    .reset-button {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background-color: var(--primary);
      color: var(--primary-foreground);
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 500;
      text-align: center;
      transition: background-color 0.2s;
    }
    .reset-button:hover {
      background-color: #ea580c;
    }
    .warning {
      background-color: #000000;
      border: 1px solid var(--destructive);
      color: var(--destructive);
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
    .security-tips {
      background-color: var(--background);
      padding: 1rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
      box-shadow: #ef4444 0px 0px 10px inset;
    }
    .security-tips h2 {
      color: var(--primary);
      font-size: 1.25rem;
      margin-top: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Reset Your Password</h1>
    <p>We received a request to reset the password for your RideShare account. If you didn't make this request, you can safely ignore this email.</p>
    
    <div style="text-align: center; margin: 2rem 0;">
      <a href="${resetUrl}" class="reset-button">Reset My Password</a>
    </div>
    
    <p style="text-align: center; color: var(--muted-foreground);">This link will expire in 1 hour for security reasons.</p>
    
    <div class="warning">
      <strong>Important:</strong> If you didn't request a password reset, please contact our support team immediately at <a href="mailto:${process.env.GMAIL_USER}" style="color: var(--destructive);">${process.env.GMAIL_USER}</a>
    </div>
    
    <div class="security-tips">
      <h2>Keeping Your Account Secure</h2>
      <ul>
        <li>Never share your password with anyone</li>
        <li>Use a strong, unique password for your RideShare account</li>
        <li>Regularly update your password to maintain account safety</li>
      </ul>
    </div>
    
    <div style="margin-top: 2rem; text-align: center; color: var(--muted-foreground); font-size: 0.875rem;">
      <p>Need help? Our support team is always here to assist you.</p>
      <p>© ${new Date().getFullYear()} RideShare. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
  `;
}
