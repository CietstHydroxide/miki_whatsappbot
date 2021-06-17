const fs = require('fs');

class Database {
    constructor (_filePath) {
        this.filePath = _filePath;
        this.data = fs.existsSync(this.filePath) ? JSON.parse(fs.readFileSync(this.filePath)) : {};
    }

    save () {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, '\t'));
    }


    get users () {
        if (!this.data.users) this.data.users = {};
        return this.data.users;
    }
    set users (value) {
        return this.data.users = value;
    }
    

    get groupChats () {
        if (!this.data.groupChats) this.data.groupChats = {};
        return this.data.groupChats;
    }
    set groupChats (value) {
        return this.data.groupChats = value;
    }


    get chatRooms () {
        if (!this.data.chatRooms) this.data.chatRooms = {};
        return this.data.chatRooms;
    }
    set chatRooms (value) {
        return this.data.chatRooms = value;
    }


    get system () {
        if (!this.data.system) this.data.system = {};
        return this.data.system;
    }
    set system (value) {
        return this.data.system = value;
    }
}
    
module.exports = Database;