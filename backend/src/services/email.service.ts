import sgMail from '@sendgrid/mail';
import { config } from '../config/config';

if (config.sendgridApiKey) {
  sgMail.setApiKey(config.sendgridApiKey);
}

export const sendVerificationEmail = async (
  email: string, 
  name: string, 
  token: string
) => {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📧 Verification Email:');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Verification URL: ${config.frontendUrl}/verify-email?token=${token}`);
    console.log('\n');
    return;
  }

  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  
  const msg = {
    to: email,
    from: config.emailFrom,
    subject: 'Verify your Serenity account',
    html: `
      <h1>Welcome to Serenity, ${name}!</h1>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  };
  
  try {
    await sgMail.send(msg);
    console.log('✅ Verification email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};

export const sendPasswordResetEmail = async (
  email: string, 
  name: string, 
  token: string
) => {
  // In development, just log the email
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📧 Password Reset Email:');
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Reset URL: ${config.frontendUrl}/reset-password?token=${token}`);
    console.log('\n');
    return;
  }

  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  
  const msg = {
    to: email,
    from: config.emailFrom,
    subject: 'Reset your Serenity password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
  
  try {
    await sgMail.send(msg);
    console.log('✅ Password reset email sent to:', email);
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }
};
