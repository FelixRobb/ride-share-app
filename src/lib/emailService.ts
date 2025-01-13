import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
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
    --background: 20 0% 0%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 29.18% 4.76%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 20.5 90.2% 48.2%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 20.5 90.2% 48.2%;
  }
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #f2f2f2;
    background-color: #000000;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 {
    color: #f97316;
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }
  .cta-button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #f97316;
    color: #ffffff;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: bold;
    margin-top: 20px;
    text-align: center;
  }
  .feature {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #0c0a09;
    border-radius: 0.5rem;
    border: 1px solid #27272a;
  }
  .feature h2 {
    color: #f97316;
    font-size: 18px;
    margin-top: 0;
  }
  .footer {
    margin-top: 30px;
    text-align: center;
    font-size: 12px;
    color: #a1a1aa;
  }
  .warning {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #fecaca;
    padding: 15px;
    border-radius: 0.5rem;
    margin-top: 20px;
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
        
        <p style="text-align: center;">Ready to hit the road? Click below to start your RideShare journey!</p>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">Start Sharing Rides</a>
        </div>
        
        <p style="text-align: center; margin-top: 20px;">Questions? Reach out to our support team at <a href="mailto:support@rideshare.com" style="color: #f97316;">support@rideshare.com</a>.</p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} RideShare. All rights reserved.</p>
          <p>You're receiving this email because you signed up for RideShare. If this wasn't you, please let us know.</p>
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
    --background: 20 0% 0%;
    --foreground: 60 9.1% 97.8%;
    --card: 20 29.18% 4.76%;
    --card-foreground: 60 9.1% 97.8%;
    --popover: 20 14.3% 4.1%;
    --popover-foreground: 60 9.1% 97.8%;
    --primary: 20.5 90.2% 48.2%;
    --primary-foreground: 60 9.1% 97.8%;
    --secondary: 12 6.5% 15.1%;
    --secondary-foreground: 60 9.1% 97.8%;
    --muted: 12 6.5% 15.1%;
    --muted-foreground: 24 5.4% 63.9%;
    --accent: 12 6.5% 15.1%;
    --accent-foreground: 60 9.1% 97.8%;
    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 60 9.1% 97.8%;
    --border: 12 6.5% 15.1%;
    --input: 12 6.5% 15.1%;
    --ring: 20.5 90.2% 48.2%;
  }
  body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #f2f2f2;
    background-color: #000000;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  h1 {
    color: #f97316;
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }
  .cta-button {
    display: inline-block;
    padding: 12px 24px;
    background-color: #f97316;
    color: #ffffff;
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: bold;
    margin-top: 20px;
    text-align: center;
  }
  .warning {
    background-color: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #fecaca;
    padding: 15px;
    border-radius: 0.5rem;
    margin-top: 20px;
  }
  .footer {
    margin-top: 30px;
    text-align: center;
    font-size: 12px;
    color: #a1a1aa;
  }
</style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your RideShare Password</h1>
        <p>We received a request to reset the password for your RideShare account. If you didn't make this request, you can safely ignore this email.</p>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="cta-button">Reset My Password</a>
        </div>
        
        <p style="text-align: center; margin-top: 20px;">This link will expire in 1 hour for security reasons.</p>
        
        <div class="warning">
          <p><strong>Important:</strong> If you didn't request a password reset, please contact our support team immediately at <a href="mailto:support@rideshare.com" style="color: #ef4444;">support@rideshare.com</a>.</p>
        </div>
        
        <h2 style="color: #f97316; font-size: 18px; margin-top: 30px;">Keeping Your Account Secure</h2>
        <ul>
          <li>Never share your password with anyone.</li>
          <li>Use a strong, unique password for your RideShare account.</li>
          <li>Enable two-factor authentication for extra security.</li>
          <li>Regularly update your password to maintain account safety.</li>
        </ul>
        
        <p style="text-align: center; margin-top: 20px;">Need help? Our support team is always here to assist you.</p>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} RideShare. All rights reserved.</p>
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

