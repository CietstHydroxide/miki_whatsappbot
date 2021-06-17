function main (m, next) {
    if (!m.command.argument) return m.replyText(TEXT[m.language].help(m.command.prefix)).then(next);
    MIKI.fetchCietstAPI('uppercase', m.command.argument).then(r=> m.replyText(r.data.result).then(next));
}

main.command = {
    id: ['hurufbesar', 'uppercase'],
    en: ['uppercase']
}

main.description = {
    format: {
        en: '%_uppercase { text }',
        id: '%_uppercase { teks }'
    },
    usage: {
        en: 'Transforms all letters in the text to uppercase.',
        id: 'Mengubah semua huruf pada teks menjadi huruf besar (kapital).'
    },
    example: {
        en: '%_uppercase somelowercasetext',
        id: '%_uppercase kapital'
    },
    synonym: {
        en: '',
        id: '%_hurufbesar'
    }
}; var TEXT = MIKI.formatHelpText(main.description);

module.exports = { main };