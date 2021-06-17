const _ = require('lodash');

async function main (message, command) {
    if (!message.isGroup) return message.replyText(MIKI.TEXT[message.language].group_only).then(command.next);
    const {isBotAdmin, isSenderAdmin} = await message.getGroupData();
    if (!isSenderAdmin) return message.replyText(MIKI.TEXT[message.language].admin_only).then(command.next);
    if (!isBotAdmin) return message.replyText(MIKI.TEXT[message.language].bot_admin_only).then(command.next);
    let number;
    const argument = command.argument, regExpVcardNumber = /[^]+waid=(\d+)[^]+/;
    if (argument) number = argument.split(',').map(v=> v.replace(/\D/g, '')).filter(v=> v);
    if (/contact(sArray)?Message/.test(message.quoted?.type)) {
        if (message.quoted.data.contacts) number = message.quoted.data.contacts.map(v=> v.vcard.replace(regExpVcardNumber, '$1'));
        if (message.quoted.data.vcard) number = [message.quoted.data.vcard.replace(regExpVcardNumber, '$1')];
    }
    if (!number || !number[0]) return message.replyText(TEXT[message.language].help(command.prefix)).then(command.next);
    const numbers = number.filter(v=> v);
    const _numbers = numbers;

    const numbersNotOnWhatsApp = [];
    const numbersLeaveRecently = [];
    for (const i of numbers) {
        const isOnWhatsApp = await message.client.isOnWhatsApp(i);
        if (!isOnWhatsApp) numbersNotOnWhatsApp.push(_numbers.splice(_numbers.indexOf(i), 1));
        const isLeaveRecently = (TEMPDATA.groupChats[message.remoteJid]?.recentlyLeave || []).includes(i);
        if (isLeaveRecently) numbersLeaveRecently.push(_numbers.splice(_numbers.indexOf(i), 1));
    }
    if (numbersNotOnWhatsApp[0]) message.replyText(TEXT[message.language].notOnWhatsApp(numbersNotOnWhatsApp));
    if (numbersLeaveRecently[0]) message.replyText(TEXT[message.language].leaveRecently(numbersLeaveRecently));

    if (_numbers[0]) {
        const { isBotAdmin } = await message.getGroupData();
        if (!isBotAdmin) return message.replyText(MIKI.TEXT[message.language].bot_admin_only).then(command.next);
        await this.client.groupAdd(message.remote_jid, _numbers);
    }
    command.next();
}

function aresp (message) {
    if (!message.JSON.messageStubType) return;
    const messageStubTypes = require('@adiwajshing/baileys').WA_MESSAGE_STUB_TYPES;
    if (message.JSON.messageStubType === messageStubTypes['32'] /* GROUP_PARTICIPANT_LEAVE */) {
        if (!TEMPDATA.groupChats[message.remoteJid]) TEMPDATA.groupChats[message.remoteJid] = {};
        if (!TEMPDATA.groupChats[message.remoteJid].recentlyLeave) TEMPDATA.groupChats[message.remoteJid].recentlyLeave = [];

        TEMPDATA.groupChats[message.remoteJid].recentlyLeave.push(...message.JSON.messageStubParameters);
    }
    if (message.JSON.messageStubType === messageStubTypes['27'] || message.JSON.messageStubType === messageStubTypes['31'] /* GROUP_PARTICIPANT_ADD/INVITE */) {
        if (!TEMPDATA.groupChats[message.remoteJid]) return TEMPDATA.groupChats[message.remoteJid] = {};
        if (!TEMPDATA.groupChats[message.remoteJid].recentlyLeave) return TEMPDATA.groupChats[message.remoteJid].recentlyLeave = [];

        if (TEMPDATA.groupChats[message.remoteJid].recentlyLeave[0]) {
            _.pull(TEMPDATA.groupChats[message.remoteJid].recentlyLeave, ...message.JSON.messageStubParameters);
        }
    }
}

main.command = {
    id: ['add'],
    en: ['add']
}

main.description = {
    format: {
        en: '%_add { number }',
        id: '%_add { nomor }'
    },
    usage: {
        en: 'Add someone to the group.',
        id: 'Menambahkan/memasukkan seseorang ke dalam grup.'
    },
    example: {
        en: '%_add 140225907xx, 120084826xx',
        id: '%_add 62851582311xx, 62877227138xx'
    },
    additional: {
        en: {
            a: '*Country code is required!* For multiple numbers, separate each number with a comma (,).',
            b: 'Due to the system limitations, there are cases when the bot can not add the number(s), but not giving any error. For example, when you try to add someone who just left the group or have set their privacy.',
            c: 'You can also reply to a contact(s) message by typing %_add (without number).'
        },
        id: {
            a: 'Kode negara dibutuhkan! (nomor tidak boleh diawali dengan 0). Untuk beberapa nomor, pisahkan dengan tanda koma (,).',
            b: 'Karena keterbatasan sistem, terkadang bot tidak dapat menambahkan nomor namun tidak memberikan pesan apapun. Misalnya, ketika Anda mencoba untuk menambahkan seseorang yang baru saja keluar dari grup, atau mereka mengubah pengaturan privasinya.',
            c: 'Anda juga bisa membalas langsung ke pesan kontak dengan mengetik %_add (tanpa nomor).'
        }
    }
}; var TEXT = MIKI.formatHelpText(main.description);

TEXT.en.notOnWhatsApp = (n)=> `Can not add the number${n.length === 1 ? 's' : ''} ${n.join(', ')} since the number${n.length === 1 ? 's' : ''} is not registered on WhatsApp.`;
TEXT.id.notOnWhatsApp = (n)=> `Tidak dapat menambahkan nomor ${n.join(', ')} karena nomor tersebut tidak terdaftar di WhatsApp.`;
TEXT.en.leaveRecently = (n)=> `Can not add the number${n.length === 1 ? 's' : ''} ${n.join(', ')} since they leave this group recently.`;
TEXT.id.leaveRecently = (n)=> `Tidak dapat menambahkan nomor ${n.join(', ')} karena nomor tersebut keluar dari grup baru-baru ini.`;

module.exports = { main, aresp };