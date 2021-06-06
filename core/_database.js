const fs = require('fs');

class AccessDatabase {
    constructor (filepath) {
        this.file = filepath;
        this.load();
    }

    load () {
        this.database = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file)) : {};
        return this.database;
    }

    save () {
        fs.writeFileSync(this.file, JSON.stringify(this.database, null, '\t'));
        return this.database;
    }

    get data () {
        return this.database;
    }

    set data (value) {
        this.database = value;
        return this.database;
    }
}

module.exports = AccessDatabase;