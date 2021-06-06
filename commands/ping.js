function main (m, next) {
    m.replyText('Pong!');
    next('Pong!');
}

main.command = {
    id: ['ping'],
    en: ['ping']
};

module.exports = { main };