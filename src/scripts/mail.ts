import nodemailer, { SendMailOptions, Transporter, SentMessageInfo } from 'nodemailer';
import config from '../config';
import { info } from '../tools/debug';
import { scheduleJob } from 'node-schedule';
import { getAlterMail } from '../service/mail';
const debug = info.extend('mail: ');

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

scheduleJob('*/30 * * * *', fire => {
    scheduleSendMail(fire.toString());
});

async function scheduleSendMail(fire: string) {
    const data = await getAlterMail();

    if (!data) {
        return;
    }
    debug(data);
    const { electro, user, position } = data;

    await sendMail(user.account, {
        mail: {
            subject: '电量告急',
            html: `<div>${position.area} ${position.building} ${position.room} 目前电量 <span style="color: red;">${electro}</span>，请及时前往学府宝充值</div>`,
        },
    });
}
