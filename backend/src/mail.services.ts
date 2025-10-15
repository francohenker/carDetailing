import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  //format of date DD/MM/YYYY
  formateDate(fecha: Date | string | number | any): string {
    if (!fecha) throw new TypeError('Fecha inválida');

    // Si ya es Date, la usamos; si no, intentamos construir una Date
    let d: Date;
    if (fecha instanceof Date) {
      d = fecha;
    } else if (typeof fecha === 'number') {
      d = new Date(fecha);
    } else if (typeof fecha === 'string') {
      d = new Date(fecha); // acepta ISO, etc.
    } else if (typeof fecha === 'object' && 'seconds' in fecha) {
      // Caso Firestore / timestamp-like
      d = new Date(Number(fecha.seconds) * 1000);
    } else {
      // Intento genérico
      d = new Date(fecha);
    }

    if (isNaN(d.getTime())) {
      // fecha inválida
      throw new TypeError(
        'No se pudo parsear la fecha: ' + JSON.stringify(fecha),
      );
    }

    const día = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();

    return `${día}/${mes}/${año}`;
  }

  async sendMail(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  }
}
