import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify().then(() => {
  console.log('SMTP server is ready to send emails');
}).catch((err: Error) => {
  console.error('SMTP server connection error:', err);
});

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

// Send email function
export const sendEmail = async (options: EmailOptions) => {
  try {
    // Validate that either html or text is provided
    if (!options.html && !options.text) {
      throw new Error('Either html or text must be provided in email options');
    }
    
    const info = await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email template functions
export const sendWelcomeEmail = async (merchantEmail: string, merchantName: string) => {
  const subject = 'Welcome to KYC Platform';
  const html = `
    <h1>Welcome ${merchantName}!</h1>
    <p>Thank you for registering with our KYC platform. Your account has been successfully created.</p>
    <p>You can now log in to your dashboard and start generating KYC links for your customers.</p>
    <p>Best regards,<br>The KYC Team</p>
  `;
  
  await sendEmail({
    to: merchantEmail,
    subject,
    html,
  });
};

export const sendKYCSubmittedNotification = async (
  merchantEmail: string, 
  merchantName: string,
  userName: string,
  userEmail: string
) => {
  const subject = 'New KYC Submission Received';
  const html = `
    <h1>New KYC Submission</h1>
    <p>Hello ${merchantName},</p>
    <p>A new KYC submission has been received from:</p>
    <ul>
      <li><strong>Name:</strong> ${userName}</li>
      <li><strong>Email:</strong> ${userEmail}</li>
    </ul>
    <p>Please log in to your dashboard to review and process this submission.</p>
    <p>Best regards,<br>The KYC Team</p>
  `;
  
  await sendEmail({
    to: merchantEmail,
    subject,
    html,
  });
};

export const sendKYCApprovedNotification = async (
  userEmail: string,
  userName: string,
  merchantName: string
) => {
  const subject = 'Your KYC Has Been Approved';
  const html = `
    <h1>KYC Approved</h1>
    <p>Hello ${userName},</p>
    <p>Your KYC submission for ${merchantName} has been approved.</p>
    <p>Thank you for completing the verification process.</p>
    <p>Best regards,<br>The KYC Team</p>
  `;
  
  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

export const sendKYCRejectedNotification = async (
  userEmail: string,
  userName: string,
  merchantName: string,
  reason: string
) => {
  const subject = 'Your KYC Submission Requires Attention';
  const html = `
    <h1>KYC Submission Update</h1>
    <p>Hello ${userName},</p>
    <p>Your KYC submission for ${merchantName} has been reviewed and requires additional information.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please log in to update your submission with the requested information.</p>
    <p>Best regards,<br>The KYC Team</p>
  `;
  
  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

// Send KYC verification email to user
export const sendKYCVerificationEmail = async (
  userEmail: string,
  userName: string,
  merchantName: string,
  kycData: any,
  verificationToken: string
) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-kyc/${verificationToken}`;
  
  const html = `
    <h1>Please Verify Your KYC Submission</h1>
    <p>Hello ${userName},</p>
    <p>Thank you for submitting your KYC for ${merchantName}. To prevent spam, please verify your submission:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2>Your Submitted Information:</h2>
      <p><strong>Name:</strong> ${kycData?.name || 'Not provided'}</p>
      <p><strong>Email:</strong> ${kycData?.email || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${kycData?.phone || 'Not provided'}</p>
      <p><strong>Address:</strong> ${kycData?.street || ''}, ${kycData?.city || ''}, ${kycData?.state || ''} ${kycData?.postalCode || ''}</p>
      <p><strong>ID Type:</strong> ${kycData?.idType || 'Not provided'}</p>
      <p><strong>ID Number:</strong> ${kycData?.idNumber || 'Not provided'}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" 
         style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
        Confirm Submission
      </a>
    </div>
    
    <p style="font-size: 0.9em; color: #666;">
      This verification step ensures only legitimate submissions reach the merchant dashboard.
      Link expires in 24 hours.
    </p>
    <p>If you didn't submit this request, please ignore this email.</p>
    <p>Best regards,<br>The KYC Team</p>
  `;
  
  await sendEmail({
    to: userEmail,
    subject: `Please verify your KYC submission for ${merchantName}`,
    html,
  });
};
