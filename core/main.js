const Client = require('./_client.js');
const Command = require('./_commands.js');

module.exports = () => {
    const events = {
        message_new: async (messageData) => {
            const _messageData = Client.formatMessageData(messageData);
            if (Command.isCommand(_messageData)) {
                const action = new Command(_messageData);
                if (!action.commandData[0]) return;
                await action.run();
                action.execute();
            }
        }
    }
    Client.connect(events);
}