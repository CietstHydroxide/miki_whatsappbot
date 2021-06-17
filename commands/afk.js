function main (message, command) {
    if (!message.isGroup) return message.replyText(MIKI.TEXT[message.language].group_only).then(command.next);

    if (!TEMPDATA.groupChats[message.remoteJid]) TEMPDATA.groupChats[message.remoteJid] = {};
    if (!TEMPDATA.groupChats[message.remoteJid].afk) TEMPDATA.groupChats[message.remoteJid].afk = {};

    const AFKreason = command.argument || TEXT[message.language].noReason;
    TEMPDATA.groupChats[message.remoteJid].afk[message.sender] = { reason: AFKreason };

    message.replyText(TEXT[message.language].AFKnow(AFKreason)).then(command.next);
}

function aresp (message) {
    if (message.isGroup && TEMPDATA.groupChats[message.remoteJid]?.afk) {
        if (TEMPDATA.groupChats[message.remoteJid].afk[message.sender]) {
            //m.replyText('You are not AFK')
            delete TEMPDATA.groupChats[message.remoteJid]?.afk[message.sender];
        } else if (message.quoted || message.mentions[0]) [ message.quoted.sender, ...message.mentions ].forEach(v=> {
            if (TEMPDATA.groupChats[message.remoteJid].afk[v]) message.replyText(TEXT[message.language].inAFK(TEMPDATA.groupChats[message.remoteJid].afk[v].reason));
        });
    }
}

main.command = {
    en: ['afk'],
    id: ['afk']
}

main.description = {
    format: {
        en: '%_afk { reason }',
        id: '%_afk { alasan }'
    },
    usage: {
        en: 'Set the reason why you are AFK. Bot will notifies anyone who replying/mentioning you while you are AFK.',
        id: 'Atur pesan bahwa Anda sedang AFK. Bot akan memberitahukan kepada siapa saja yang membalas/menyebut Anda saat Anda sedang AFK.'
    },
    example: {
        en: '%_afk wanna take a nap',
        id: '%_afk mau pergi sebentar'
    },
    additional: {
        en: {
            a: 'When you are AFK and send a message, bot will remove you from AFK list and stop notifies anyone who replying/mentioning you.',
            b: 'The AFK data is lost when bot was offline.'
        },
        id: {
            a: 'Ketika Anda sedang AFK dan mengirimkan pesan, bot akan menghapus Anda dari daftar AFK dan berhenti memberitahu siapa saja yang membalas/menyebut Anda.',
            b: 'Data AFK akan hilang saat bot offline.'
        }
    }
}; var TEXT = MIKI.formatHelpText(main.description);

TEXT.en.noReason = 'No reason.';
TEXT.id.noReason = 'Tidak ada alasan.';
TEXT.en.AFKnow = (reason)=>
`You are AFK!

Reason: ${reason}`;
TEXT.id.AFKnow = (reason)=>
`Anda sekarang AFK!

Alasan: ${reason}`;
TEXT.en.inAFK = (reason)=> `The person you are replying/mentioning is AFK. The reason is: ${reason}`;
TEXT.id.inAFK = (reason)=> `Orang yang Anda balas/sebut sedang AFK. Alasannya: ${reason}`;

module.exports = { main, aresp };