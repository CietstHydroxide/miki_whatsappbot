class PrepareData {
    constructor (_data) {
        this.type = typeof _data;
        this.data = _data;
    }
}

module.exports = PrepareData;