function main (m, next) {

}

function aresp (m) {

}

main.command = {
    en: ['badwordfilter'],
    id: ['badwordfilter', 'filterkatakasar']
}

main.description = {
    format: {
        en: '%_badwordfilter { 0 / 1 / -nowarn / word1, word2, etc. }',
        id: '%_badwordfilter { 0 / 1 / -nowarn / kata1, kata2, dst. }'
    },
    usage: {
        en: 
`Set up a badword filter in a group.

*%_badwordfilter 0* — to deactivate badword filter.
*%_badwordfilter 1* — to activate badword filter.
*%_badwordfilter -nowarn* — to immediately kick without warning!
*%_badwordfilter word1, word2, etc.* — to add a word/words to the badword list. Separate each with a comma. Prefix a word with *!* to delete them from the list (for example _%_badwordfilter !b**ch, !a**_).`,
        id: 
`Mengonfigurasikan filter kata kasar di dalam grup.

*%_badwordfilter 0* — untuk menonaktifkan filter.
*%_badwordfilter 1* — untuk mengaktifkan filter.
*%_badwordfilter -nowarn* — untuk langsung mengeluarkan dari grup tanpa warning.
*%_badwordfilter kata1, kata2, dst.* — untuk menambahkan kata ke dalam daftar kata kasar. Pisahkan dengan tanda koma. Imbuhkan kata dengan *!* untuk menghapusnya dari daftar (contohnya _%_badwordfilter !a****g, !a**_).`
    },
    example: {
        en: '%_badwordfilter ****, *******, ***',
    },
    synonym: {
        id: '%_filterkatakasar'
    },
    additional: {
        en: 'Bot must be an admin to be able to kick someone that has reached maximum warning points.',
        id: 'Bot harus menjadi admin agar bot dapat mengeluarkan seseorang yang telah mencapai poin warning maksimal.'
    }
}; var TEXT = MIKI.formatHelpText(main.description);

module.exports = { main, aresp }