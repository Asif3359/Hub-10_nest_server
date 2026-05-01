import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT ?? '587'),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME ?? 'Hub-10'}" <${process.env.MAIL_FROM_ADDRESS ?? process.env.MAIL_USER}>`,
        to,
        subject: 'Your Email Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #111827; margin-bottom: 8px;">Verify your email</h2>
            <p style="color: #6b7280; margin-bottom: 24px;">Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; text-align: center; padding: 20px; background: #f5f3ff; border-radius: 8px; margin-bottom: 24px;">
              ${code}
            </div>
            <p style="color: #9ca3af; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new InternalServerErrorException('Failed to send verification email');
    }
  }
}
