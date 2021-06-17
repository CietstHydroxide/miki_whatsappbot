function main (message, command) {
    message.replyText('Pong!').then(command.next);
}

main.command = {
    id: ['ping'],
    en: ['ping']
};

main.description = {
    format: {
        en: '%_ping'
    },
    usage: {
        en: 'Check whether the bot is online or not.',
        id: 'Mengecek apakah bot sedang aktif atau tidak.'
    },
    example: {
        en: '-'
    }
}

module.exports = { main };