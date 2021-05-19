const _ = {};

_.onCalled = (messageData) => {
    return {
        action: 'sendText',
        data: {
            text: JSON.stringify(messageData, null, '\t')
        }
    };
}

_.command = 'test'

module.exports = _;