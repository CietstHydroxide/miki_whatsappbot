const Client = require('./_client.js');

module.exports = () => {
    const events = {
        message_new: () => console.log(process.argv[2])
    }
    Client.connectToWhatsapp(events);
}