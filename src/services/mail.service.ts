import { Injectable, Logger } from '@nestjs/common';

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendMail({ to, subject, text, html }: SendMailOptions) {
    const host = process.env.MAIL_HOST;
    const port = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASS;
    const from = process.env.MAIL_FROM || user;

    if (!host || !port || !user || !pass || !from) {
      // Keep backend functional even if SMTP isn't configured yet.
      // In production you should configure SMTP env vars so emails are actually delivered.
      this.logger.warn(`SMTP not configured; skipping email to ${to} (${subject})`);
      return { delivered: false };
    }

    // Lazy import so the project still boots even if nodemailer isn't installed yet.
    // (We will add it as a dependency in this change.)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer') as typeof import('nodemailer');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.MAIL_SECURE === 'true',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    return { delivered: true };
  }

  async sendPasswordResetEmail(toEmail: string, link: string) {
    const subject = 'Reset your password';
    const appName = process.env.APP_NAME || 'HRMS';

    const text =
      `You requested a password reset for ${appName}.\n\n` +
      `This link is valid for 1 hour.\n\n` +
      `If you did not request this, you can ignore this email.`;

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;background:#f6f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border-radius:12px;padding:24px;border:1px solid #eceef5;">
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:10px;">${appName}</div>
        <div style="font-size:20px;font-weight:700;color:#111827;margin:0 0 10px;">Reset your password</div>
        <div style="font-size:14px;line-height:20px;color:#374151;margin:0 0 18px;">
          We received a request to reset your password. Click the button below to set a new one.
        </div>
        <div style="margin:22px 0;">
          <a href="${link}"
             style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;font-size:14px;">
            Reset Password
          </a>
        </div>
        <div style="font-size:12px;line-height:18px;color:#6b7280;">
          This link is valid for <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.
        </div>
      </div>
      <div style="font-size:11px;line-height:16px;color:#9ca3af;margin-top:12px;text-align:center;">
        © ${new Date().getFullYear()} ${appName}
      </div>
    </div>
  </body>
</html>`;

    return this.sendMail({ to: toEmail, subject, text, html });
  }
}

