import nodemailer, { SendMailOptions, Transporter, SentMessageInfo } from 'nodemailer';
import config from '../config';
import d from 'debug';
const debug = d('mail:');

type PICK_NAME = 'html' | 'text' | 'subject';
export interface MailOption {
    mail: Pick<SendMailOptions, PICK_NAME>;
}

let transporter: Transporter<SentMessageInfo> | undefined;

export async function sendMail(target: string, options: MailOption) {
    debug('send mail to %s', target);
    debug(`${options.mail.subject}: ${options.mail.text}`);

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'qq',
            tls: {
                rejectUnauthorized: false,
            },
            auth: {
                user: config.mail.user,
                pass: config.mail.pass,
            },
        });
    }

    const info = await transporter.sendMail({
        from: config.mail.from,
        to: target,
        ...options.mail,
    });
}
