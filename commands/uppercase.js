const TEXT = {}; TEXT.id = {}; TEXT.en = {};
TEXT.id.help = (p)=> Fun.formatHelpText('id',
`${p}uppercase { text }`,
`Mengubah semua huruf pada teks menjadi huruf besar (kapital).`,
`${p}uppercase HURUF KECIL`
);
TEXT.en.help = (p)=> Fun.formatHelpText('en',
`${p}uppercase { text }`,
`Transforms all letters in the text to uppercase.`,
`${p}uppercase will be uppercased`
);

function main (m, next) {
    const language = m.getLanguagePref(), text = m.command.argument || m.command.before || m.quoted?.message_text;
    if (!text) return m.replyText(Fun.TEXT[language].help(m.command.prefix)).then(next);
    Fun.fetchCietstAPI('uppercase', text).then(r=> m.replyText(r.data.result).then(next));
}

main.command = {
    id: ['hurufbesar', 'uppercase'],
    en: ['uppercase']
}

module.exports = { main };