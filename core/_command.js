const fs = require('fs');
const regexEscape = require('regex-escape');
const watch = require('node-watch');

class Command {
    constructor (m) {
        this.m = m;
        this.prefix = DATABASE.data.chats[this.m.message_remote_jid]?.prefix === undefined ? BOTSETTINGS.defaultPrefix : DATABASE.data.chats[this.m.message_remote_jid]?.prefix;
        this.is_command = new RegExp(`^[\\s\n\\t\r]*${regexEscape(this.prefix)}[^]*`)
            .test(Array.from(
                (this.m.message_text || '').match(
                    new RegExp(`(?:(?:^|^[\\s\n\\t\r]+)${regexEscape(this.prefix)}(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])\.:(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])::(?:[\\s\n\\t\r]*))(?:[a-zA-Z0-9]+)(?:[\\s\n\\t\r]*)(?:[^]*?(?=(?<=[\\s\n\\t\r])\.:|(?<=[\\s\n\\t\r])::|$))`) 
                ) || []
            )[0] || '');
    }

    parse () {
        if (!this.is_command) return [];
        const _commands = [];
        Array.from(
            (this.m.message_text || '').matchAll(
                // https://regex101.com/r/w0tsJz/1
                new RegExp(`(?<prefix>(?:^|^[\\s\n\\t\r]+)${regexEscape(this.prefix)}(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])\.:(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])::(?:[\\s\n\\t\r]*))(?<command>[a-zA-Z0-9]+)(?:[\\s\n\\t\r]*)(?<arguments>[^]*?(?=(?<=[\\s\n\\t\r])\.:|(?<=[\\s\n\\t\r])::|$))`, 'g')
            )
        ).map(v=> ({
                prefix: this.prefix,
                type: v?.groups?.prefix ? v.groups.prefix.trim() : null,
                command: v?.groups?.command ? v.groups.command.trim().toLowerCase() : null,
                argument: v?.groups?.arguments ? v.groups.arguments : null
            })
        ).forEach(v=> _commands.push(v));
        if (!_commands[0]) return [];
        if (_commands[0].prefix !== this.prefix) return [];
        this.commands = _commands;
        return this.commands;
    }

    find (name) {
        const _ = name ? { command: name } : this.commands[this.count];
        for (const cmd of Object.values(COMMANDS.main)) {
            if (Array.isArray(cmd.command[this.m.getLanguagePref()]) && cmd.command[this.m.getLanguagePref()].includes(_.command)) return cmd;
        }
    }

    start () {
        if (!this.commands || !this.commands[0]) return;
        this.count = 0;
        this.m.command = this.commands[this.count];
        const cmd = this.find();
        if (typeof cmd === 'function') cmd(this.m, this.next.bind(this));
    }

    next (result) {
        this.count += 1;
        if (!this.commands || !this.commands[this.count]) return;
        this.m.command = this.commands[this.count];
        if (this.m.command.type === '.:' && result) this.m.command.before = result;
        const cmd = this.find();
        if (typeof cmd === 'function') cmd(this.m, this.next.bind(this));
    }

    static loadAll () {
        for (const cmd of fs.readdirSync('./commands/')) {
            if (!/\.js$/.test(cmd)) return;
            try {
                const command = require('../commands/'+cmd);
                if (typeof command.main === 'function') COMMANDS.main[cmd] = command.main;
                if (typeof command.aresp === 'function') COMMANDS.aresp[cmd] = command.aresp;
                continue;
            } catch (e) {
                console.log(e);
                continue;
            }
        }
    }
}

module.exports = Command;