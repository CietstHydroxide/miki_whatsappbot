const fs = require('fs');
const _ = require('lodash');

class Command {
	constructor (_message) {
		this.message = _message;
		this.prefix = DATABASE.chatRooms[this.message.remoteJid]?.prefix === undefined ? BOTSETTINGS.defaultPrefix : DATABASE.chatRooms[this.message.remoteJid]?.prefix;
		this.isCommand = new RegExp(`^[\\s\n\\t\r]*${_.escapeRegExp(this.prefix)}[^]*`).test(this.message.text || '');
		if (this.isCommand) {
			const _commands = [];
			Array.from(
				(this.message.text || '').matchAll(
					// https://regex101.com/r/w0tsJz/1
					new RegExp(`(?<prefix>(?:^|^[\\s\n\\t\r]+)${MIKI._.escapeRegExp(this.prefix)}(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])\.:(?:[\\s\n\\t\r]*)|(?<=[\\s\n\\t\r])::(?:[\\s\n\\t\r]*))(?<command>[a-zA-Z0-9]+)(?:[\\s\n\\t\r]*)(?<arguments>[^]*?(?=(?<=[\\s\n\\t\r])\.:|(?<=[\\s\n\\t\r])::|$))`, 'g')
				)
			).map(v=> ({
				prefix: this.prefix,
				type: v?.groups?.prefix ? v.groups.prefix.trim() : null,
				command: v?.groups?.command ? v.groups.command.trim().toLowerCase() : null,
				argument: v?.groups?.arguments ? v.groups.arguments : null
			})
			).forEach(v=> _commands.push(v));
			this.commands = _commands;
		}
	}

	find (name) {
		const given = name ? { command: name } : this.commands[this.count];
		for (const the of Object.values(COMMANDS.main)) {
			if (Array.isArray(the.command[this.message.language]) && the.command[this.message.language].includes(given.command)) return the;
		}
	}

	start (result) {
		if (!this.commands || !this.commands[0]) return;
		this.count = this.count || 0;
		if (!this.commands[this.count]) return;
		const commandFunc = this.find();
		if (typeof commandFunc !== 'function') return;
		const command = this.commands[this.count];
		command.previousResult = result;
		// if no argument and prefix is .:, check the quoted message first, then check the previous result
		// else, check the previous result first, then check the quoted message
		command.argument = command.type === '.:' ? (command.argument || this.message.quoted?.text || result || '') : (command.argument || result || this.message.quoted?.text || '');
		command.getAttachment = (messageType)=> {
			if (command.type === '.:') {
				if (this.message.type === messageType) return this.JSON;
				if (this.message.quoted?.type === messageType) return this.quoted.JSON;
				return command.previousResult;
			} else {
				if (this.message.type === messageType) return this.JSON;
				if (command.previousResult) return command.previousResult;
				return this.quoted?.JSON;
			}
		}
		command.next = this.next.bind(this);
		command.find = this.find.bind(this);
		commandFunc(this.message, command);
	}

	next (result) {
		this.count += 1;
		this.start(result);
	}

	static loadAllFunc () {
		for (const cmd of fs.readdirSync('./commands/')) {
			if (!/\.js$/.test(cmd)) return;
			try {
				const command = require('../commands/' + cmd);
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