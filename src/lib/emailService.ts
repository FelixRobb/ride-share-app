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
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f97316; }
          .cta-button { display: inline-block; padding: 10px 20px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Welcome to RideShare, ${name}!</h1>
          <p>We're thrilled to have you join our community of ride-sharers. With RideShare, you can easily connect with friends, share rides, and travel together safely.</p>
          <p>Here's what you can do with your new account:</p>
          <ul>
            <li>Create or join rides with just a few taps</li>
            <li>Build your network of trusted contacts</li>
            <li>Enjoy safe and secure travel with people you know</li>
            <li>Get real-time updates about your rides</li>
          </ul>
          <p>Ready to get started?</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">Explore RideShare Now</a>
          <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
          <p>Happy ride-sharing!</p>
          <p>The RideShare Team</p>
        </div>
      </body>
    </html>
  `;
}

export function getResetPasswordEmailContent(resetUrl: string): string {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #f97316; }
          .cta-button { display: inline-block; padding: 10px 20px; background-color: #f97316; color: #ffffff; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Your RideShare Password</h1>
          <p>We received a request to reset your password for your RideShare account. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <a href="${resetUrl}" class="cta-button">Reset Password</a>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If the button doesn't work, you can copy and paste the following URL into your browser:</p>
          <p>${resetUrl}</p>
          <p>If you have any issues or didn't request this password reset, please contact our support team immediately.</p>
          <p>Stay safe and happy ride-sharing!</p>
          <p>The RideShare Team</p>
        </div>
      </body>
    </html>
  `;
}

