function main (message, command) {
    if (MIKI.getOwnerJid() !== message.sender) return message.replyText(MIKI.TEXT[message.language].owner_only).then(command.next);
    if (!command.argument) return message.replyText(TEXT[message.language].help(command.prefix)).then(command.next);
    let evalReturn, evalReturnOriginal, startTime, endTime, $$ = command.previousResult?.evalReturn || TEMPDATA.system.evalReturnHistory;
    try {
        startTime = new Date().getTime();
        // is it eval()?
        evalReturn = eval(command.argument);
        // yeah, idc.
        evalReturnOriginal = evalReturn;
    } catch (e) {
        evalReturn = e.stack;
        console.log(e);
    } finally {
        endTime = new Date().getTime();
        if (String(evalReturn) === '[object Object]') evalReturn = JSON.stringify(evalReturn, null, '  ');
        const text = new String(TEXT[message.language].result(evalReturn, endTime - startTime));
        text.evalReturn = evalReturnOriginal;
        TEMPDATA.system.evalReturnHistory = evalReturnOriginal;
        message.replyText(text).then(command.next);
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
        en: {
            a: '⚠ Potentially destructive command!',
            b: '*Only the bot owner is able to run this command.*',
            c: 'Pro tip: Use $$ variable to access the result of the previous eval command.'
        },
        id: {
            a: '⚠ Perintah berpotensi merusak!',
            b: '*Hanya pemilik bot yang dapat menjalankan perintah ini.*',
            c: 'Pro tip: Gunakan variabel $$ untuk mengakses hasil dari perintah eval sebelumnya.'
        }
    }
}; var TEXT = MIKI.formatHelpText(main.description);

TEXT.id.result = (result, speed)=>
`*Hasil:* ${result}

*Kecepatan eksekusi:* ${speed} milidetik.`;

TEXT.en.result = (result, speed)=>
`*Result:* ${result}

*Execution speed:* ${speed} millisecond`;


module.exports = { main };