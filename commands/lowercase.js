function main (m, next) {
    if (!m.command.argument) return m.replyText(TEXT[m.language].help(m.command.prefix)).then(next);
    MIKI.fetchCietstAPI('lowercase', m.command.argument).then(r=> m.replyText(r.data.result).then(next));
}

main.command = {
    id: ['hurufkecil', 'lowercase'],
    en: ['lowercase']
}

main.description = {
    format: {
        en: '%_lowercase { text }',
        id: '%_lowercase { teks }'
    },
    usage: {
        en: 'Transforms all letters in the text to lowercase.',
        id: 'Mengubah semua huruf pada teks menjadi huruf kecil.'
    },
    example: {
        en: '%_lowercase LOWERCASE',
        id: '%_lowercase HURUF KECIL'
    },
    synonym: {
        en: '',
        id: '%_hurufkecil'
    }
}; var TEXT = MIKI.formatHelpText(main.description);

module.exports = { main };