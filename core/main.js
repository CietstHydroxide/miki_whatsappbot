const Client = require('./_client.js');

module.exports = (data) => {
    const _data = Client.prepareData(data);

    console.log(_data.type);
    console.log(_data.data);
}