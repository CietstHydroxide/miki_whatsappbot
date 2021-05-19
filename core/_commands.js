const fs = require('fs');
const Client = require('./_client.js');

class Command {
    constructor (messageData) {
        this.commandData = [{
            prefix: messageData.text.charAt(0),
            command: messageData.text.slice(1),
            arguments: messageData.text
        }];
    }

    static isCommand (messageData) {
        if (/^\//.test(messageData.text)) return true;
        return false;
    }

    async run () {
        const listCommands = fs.readdirSync('./commands/').filter(v => /\.js$/.test(v)).map(v => require('../commands/' + v));
        const returns = [];
        for (const v of this.commandData) {
            const selected = listCommands.filter(x => x.command === v.command.toLowerCase());
            for (const _v of selected) {
                returns.push(await _v.onCalled(this.commandData));
            }
        }
        this.returnedData = returns;
    }

    execute () {
        for (const v of this.returnedData) {
            const data = v.data;
            switch (v?.action) {
                case 'sendText':
                    Client.sendText(data.text);
                    break
            }
        }
    }
}

module.exports = Command;