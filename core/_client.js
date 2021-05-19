class Client {
    static prepareData (_data) {
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