function main (m, next) {
    if (!m.command.argument) return m.replyText(TEXT[m.language].help(m.command.prefix)).then(next);
    MIKI.fetchCietstAPI('cheems', m.command.argument).then(r=> m.replyText(r.data.result).then(next));
}

main.command = {
    id: ['cheems'],
    en: ['cheems']
}

main.description = {
    format: {
        en: '%_cheems { text }',
        id: '%_cheems { teks }'
    },
    usage: {
        en: 'Cheems text generator (cheems temxt gemnemramtomr.).',
        id: 'Generator teks "cheems" (gemnemramtomr temks domge meme).'
    },
    example: {
        en: '%_cheems transform this to cheems',
        id: '%_cheems teks'
    }
}; var TEXT = MIKI.formatHelpText(main.description);

module.exports = { main };