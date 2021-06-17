const WarningPoint = require('../classes/WarningPoint.js');

async function main (message, command) {
    if (!message.isGroup) return message.replyText(MIKI.TEXT[message.language].group_only).then(command.next);
    const { isSenderAdmin } = await message.getGroupData();
    if (!isSenderAdmin) return message.replyText(MIKI.TEXT[message.language].admin_only).then(command.next);
    
    if (/^[0-9]+$/.test(command.argument.trim())) {
        const maxPoint = parseInt(command.argument.trim());
        if (maxPoint < 2) return message.replyText(TEXT[message.language].failSetMaxWarningPoint).then(command.next);
        WarningPoint.setMaxPoint(message.remoteJid, maxPoint);
        return message.replyText(TEXT[message.language].successSetMaxWarningPoint(maxPoint)).then(command.next);
    }

    let text;
    async function startWarning (warnedNumbers) {
        function giveWarning (__warnedNumbers) {
            for (const i of __warnedNumbers) {
                const warning = new WarningPoint(message.remoteJid, i);
                warning.addPoint();
            }
        }
        function getNumbersExceededMaxWarning (__warnedNumbers) {
            const numbersExceededMaxWarning = [];
            for (const i of __warnedNumbers) {
                const warning = new WarningPoint(message.remoteJid, i);
                if (warning.point >= warning.maxPoint) {
                    numbersExceededMaxWarning.push(i);
                }
            }
            return numbersExceededMaxWarning;
        }    
        giveWarning(warnedNumbers);
        const listWarnedNumbers = warnedNumbers.map((v,i)=> `${i+1}. ${MIKI.jidToMention(v)}\n`).join('').trim();
        text = await message.replyText(TEXT[message.language].givenWarning(warnedNumbers.length, listWarnedNumbers));
        const numbersExceededMaxWarning = getNumbersExceededMaxWarning(warnedNumbers);
        if (numbersExceededMaxWarning[0]) {
            const listNumbersExceededMaxWarning = numbersExceededMaxWarning.map((v,i)=> `${i+1}. ${MIKI.jidToMention(v)}\n`).join('').trim();
            text = await message.replyText(TEXT[message.language].exceededMaxWarning(numbersExceededMaxWarning.length, listNumbersExceededMaxWarning));
            await MIKI.pause(5000);
            const { isBotAdmin } = await message.getGroupData();
            if (isBotAdmin) message.client.groupRemove(message.remoteJid, numbersExceededMaxWarning);
            else text = await message.replyText(TEXT[message.language].failToKick());
        }
    }

    if (message.mentions[0]) {
        await startWarning(message.mentions);
        return command.next(text);
    } else message.replyText(TEXT[message.language].help(command.prefix)).then(command.next);
    if (!message.quoted) return;
    if (/^-mentioned$/.test(command.argument)) {
        await startWarning();
    } else {

    }

    // TODO
    // do not warn admin
    // make class for kicking, prevent group owner from being kicked
}

main.command = {
    en: ['warn'],
    id: ['warn']
}

main.description = {
    format: {
        en: '%_warn { @user1 @user2 @user... / 1-... / -mentioned }'
    },
    usage: {
        en: 
`Gives someone a warning point.

*%_warn @user* — gives a warning point to someone.
*%_warn 5* — sets the maximum number of warnings to 5.
*%_warn -mentioned* — by default, if there is no user mentioned and the message is replying/quoting other message, bot will try to warn the sender of the quoted message. If in the case you want to only warn user(s) mentioned by the quoted message (not the sender of the quoted message), use *-mentioned*.`,
        id:
`Memberikan peringatan (poin warning) ke seseorang.

*%_warn @user* — untuk memberikan satu poin warning ke seseorang.
*%_warn 5* — untuk mengatur maksimal poin warning menjadi 5.
*%_warn -mentioned* — secara default, jika tidak ada orang yang disebut (tag) dan pesannya membalas pesan lain _(quoted)_, bot akan memberikan warning kepada pengirim pesan yang dibalas tersebut. Jika Anda hanya ingin memberikan warning kepada orang yang disebut (tag) pada pesan yang dibalas (bukan pengirim pesan yang dibalas), gunakan *-mentioned*.`
    },
    example: {
        en: '%_warn user1 @user2 @user3'
    },
    additional: {
        en: {
            a: 'Tip: use *-mentioned* in case, for instance, an admin has listed the problematic members and you want to give a warn for each members mentioned.',
            b: 'Bot must be an admin to be able to kick someone that has reached maximum warning points.'
        },
        id: {
            a: 'Tip: gunakan *-mentioned* ketika, misalnya, seorang admin telah membuat daftar anggota yang bermasalah dan Anda ingin memberikan poin warning kepada semua anggota yang disebutkan.',
            b: 'Bot harus menjadi admin agar bot dapat mengeluarkan seseorang yang telah mencapai poin warning maksimal.'
        }
    }
}; var TEXT = MIKI.formatHelpText(main.description);

TEXT.en.givenWarning = (length, listWarnedNumbers)=>
`Giving 1 warning point to ${length} ${length === 1 ? 'person' : 'people'}

${listWarnedNumbers}`;
TEXT.id.givenWarning = (length, listWarnedNumbers)=>
`Memberikan 1 poin warning kepada ${length} orang

${listWarnedNumbers}`;
TEXT.en.exceededMaxWarning = (length, listNumbersExceededMaxWarning)=>
`The following ${length === 1 ? 'person' : 'people'} has reached maximum warning point.

${listNumbersExceededMaxWarning}

Soon, bot will kick them if bot is an admin.`;
TEXT.id.exceededMaxWarning = (length, listNumbersExceededMaxWarning)=>
`${length} orang berikut ini telah mencapai poin warning maksimal.

${listNumbersExceededMaxWarning}

Bot akan segera mengeluarkan mereka dari grup jika bot adalah admin.`;
TEXT.en.failToKick = `{ Can not kick them because bot is not an admin. }`;
TEXT.id.failToKick = `{ Tidak bisa mengeluarkan mereka dari grup karena bot bukan admin. }`;
TEXT.en.successSetMaxWarningPoint = (max)=> `{ successfully sets the maximum warning point to ${max}. }`;
TEXT.id.successSetMaxWarningPoint = (max)=> `{ berhasil mengatur poin warning maksimal ke ${max}. }`;
TEXT.en.failSetMaxWarningPoint = `{ maximum warning point can not be less than 2. }`;
TEXT.id.failSetMaxWarningPoint = `{ maksimal poin warning tidak boleh kurang dari 2. }`;

module.exports = { main, giveWarning };