function main (m, next) {
    const language = m.getLanguagePref();
    if (Fun.ownerNumber() !== m.message_sender) return m.replyText(Fun.TEXT[language].owner_only).then(next);
    const _code = m.command.argument || m.quoted?.message_text;
    if (!_code) return m.replyText(TEXT[language].help(m.command.prefix)).then(next);
    let result, start, end;
    try {
        start = new Date().getTime();
        result = eval(_code);
    } catch (e) {
        result = e.stack;
        console.log(e);
    } finally {
        end = new Date().getTime();
        if (String(result) === '[object Object]') result = JSON.stringify(result, null, '  ');
        m.replyText(TEXT[language].result(result, end-start)).then(next);
    }
}

main.command = {
    id: ['eval'],
    en: ['eval']
};

main.description = {
    format: {
        en: '%_eval { JavaScript code }'
    },
    usage: {
        en: 'Execute a JavaScript code on server.',
        id: 'Mengeksekusi kode JavaScript pada server.'
    },
    example: {
        en: '%_eval console.log(\'Hi!\');',
        id: '%_eval console.log(\'Hai!\');'
    },
    additional: {
        en: '⚠ Potentially destructive command!\nOnly the bot owner is able to run this command.',
        id: '⚠ Perintah berpotensi merusak!\nHanya pemilik bot yang dapat menjalankan perintah ini.'
    }
}; var TEXT = Fun.formatHelpText(main.description);

TEXT.id.result = (result, speed)=>
`*Hasil:* ${result}

*Kecepatan eksekusi:* ${speed} milidetik.`;

TEXT.en.result = (result, speed)=>
`*Result:* ${result}

*Execution speed:* ${speed} millisecond`;


module.exports = { main };