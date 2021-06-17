class WarningPoint {
    static setMaxPoint (remoteJid, maxPoint) {
        if (!MIKI.isValidGid(remoteJid)) throw 'invalid remoteJid';
        if (!DATABASE.groupChats[remoteJid]) DATABASE.groupChats[remoteJid] = {};
        if (!DATABASE.groupChats[remoteJid].warn) DATABASE.groupChats[remoteJid].warn = { maxPoint: 3, people: {} };

        DATABASE.groupChats[remoteJid].warn.maxPoint = maxPoint;
    }

    constructor (_remoteJid, _participant) {
        if (!MIKI.isValidGid(_remoteJid) || !MIKI.isValidJid(_participant)) throw 'invalid remoteJid/participant';
        this.remoteJid = _remoteJid;
        this.participant = _participant;

        if (!DATABASE.groupChats[this.remoteJid]) DATABASE.groupChats[this.remoteJid] = {};
        if (!DATABASE.groupChats[this.remoteJid].warn) DATABASE.groupChats[this.remoteJid].warn = { maxPoint: 3, people: {} };
        if (!DATABASE.groupChats[this.remoteJid].warn.people[this.participant]) DATABASE.groupChats[this.remoteJid].warn.people[this.participant] = 0;
    }

    point = DATABASE.groupChats[this.remoteJid].warn.people[this.participant];

    maxPoint = DATABASE.groupChats[this.remoteJid].warn.maxPoint;

    addPoint () {
        DATABASE.groupChats[this.remoteJid].warn.people[this.participant] += 1;
    }

    subtractPoint () {
        DATABASE.groupChats[this.remoteJid].warn.people[this.participant] -= 1;
        if (DATABASE.groupChats[this.remoteJid].warn.people[this.participant] < 0) this.resetPoint();
    }

    resetPoint () {
        DATABASE.groupChats[this.remoteJid].warn.people[this.participant] = 0;
    }
}

module.exports = WarningPoint;