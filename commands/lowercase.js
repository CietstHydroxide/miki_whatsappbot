const TEXT = {}; TEXT.id = {}; TEXT.en = {};
TEXT.id.help = (p)=> Fun.formatHelpText('id',
`${p}lowercase { text }`,
`Mengubah semua huruf pada teks menjadi huruf kecil.`,
`${p}lowercase HURUF KECIL`
);
TEXT.en.help = (p)=> Fun.formatHelpText('en',
`${p}lowercase { text }`,
`Transforms all letters in the text to lowercase.`,
`${p}lowercase WILL BE LOWERCASED`
);

function main (m, next) {
    const language = m.getLanguagePref(), text = m.command.argument || m.command.before || m.quoted?.message_text;
    if (!text) return m.replyText(Fun.TEXT[language].help(m.command.prefix)).then(next);
    Fun.fetchCietstAPI('lowercase', text).then(r=> m.replyText(r.data.result).then(next));
}

main.command = {
    id: ['hurufkecil', 'lowercase'],
    en: ['lowercase']
}

module.exports = { main };