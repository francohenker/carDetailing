import * as sgMail from '@sendgrid/mail';

export class MailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async sendEmail(to: string, subject: string, text: string, html: string) {
    const msg = {
      to: to,
      from: process.env.SENDGRID_SENDER_KEY,
      subject: subject,
      text: text,
      html: html,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log('Email sent');
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
