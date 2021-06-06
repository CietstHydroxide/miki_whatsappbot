/* const TEXT = {}; TEXT.id = {}; TEXT.en = {};
TEXT.id.help = (p)=> Fun.formatHelpText('id',
`${p}add { nomor }`,
'Menambahkan/memasukkan seseorang ke dalam grup.',
`${p}add 62851582311xx`,
``)


function main (m, next) {
    const language = m.getLanguagePref();
    if (!m.isGroup()) return m.replyText(Fun.TEXT[language].group_only).then(next);
    m.getGroupData().then(({isBotAdmin, isSenderAdmin})=> {
        if (!isSenderAdmin) return m.replyText(Fun.TEXT[language].admin_only).then(next);
        if (!isBotAdmin) return m.replyText(Fun.TEXT[language].bot_admin_only).then(next);
        
        let num;
        const input = (m.command.before || m.command.argument || m.quoted?.message_text), regex = /[^]+waid=(\d+)[^]+/;
        if (input) num = [input.replace(/\D/g, '')];
        if (/contact(sArray)?Message/.test(m.quoted?.message_type)) {
            if (m.quoted.message_data.contacts) num = m.quoted.message_data.contacts.map(v=> v.vcard.replace(regex, '$1'));
            if (m.quoted.message_data.vcard) num = [m.quoted.message_data.vcard.replace(regex, '$1')];
        }
        if (!num) return m.replyText(Fun.TEXT[language].)
        const number = num.filter(v=> v).map(v=> /^0/.test(v) ? v.replace(/^0/, '62') : v);
    });
} */