class Client {
    static connect (events) {
        if (events.message_new) events.message_new(process.argv[2]);
    }

    static formatMessageData (messageData) {
        return {
            text: messageData
        }
    }

    static sendText (text) {
        console.log(text);
    }
}

module.exports = Client;