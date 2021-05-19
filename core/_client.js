class Client {
    static connectToWhatsapp (events) {
        if (events.message_new) events.message_new();
    }

    static formatMessageData (_data = {}) {
        return {
            type: typeof _data,
            data: _data
        }
    }

    static sendText () {
        //woff
    }
}

module.exports = Client;