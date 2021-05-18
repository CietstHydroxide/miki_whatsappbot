const PrepareData = require('./_main.js');

module.exports = (data) => {
    const _data = new PrepareData(data);

    console.log(_data.type);
    console.log(_data.data);
}