const Baileys = require('@adiwajshing/baileys');
const moment = require('moment');
const chalk = require('chalk');
const _ = require('lodash');

class Client extends Baileys.WAConnection {
    constructor () {
        super();
    }

    parseMentions (text) {
        if (!/@[0-9]{5,16}/g.test(text)) return [];
        const mentions = [];
        Array.from(text.matchAll(/@(?<number>[0-9]{5,16})/g)).forEach((v)=> {
            mentions.push(v.groups.number + '@s.whatsapp.net');
        });
        return _.uniq(mentions);
    }

    sendTextMessage (jid, text = '', quoted = {}, mentions = []) {
        if (!jid) throw 'missing jid';
        if (!mentions[0]) mentions = this.parseMentions(text);
        this.sendMessage(jid, String(text), Baileys.MessageType.text, { quoted: quoted, contextInfo: { mentionedJid: mentions }});
    }
}

class Message {
    constructor (incomingMessage, WA) {
        this.JSON = incomingMessage.messages.all()[0].toJSON();
        this.isMessage = true;
        if (!this.JSON.message) this.isMessage = false;
        this.client = WA;

        if (this.JSON.message?.ephemeralMessage) {
            const _message = this.JSON.message.ephemeralMessage;
            this.JSON.message = _message;
        }
        this.type = Object.keys(this.JSON.message || {})[0] || null;
        this.data = this.JSON.message ? this.JSON.message[this.type] || {} : {};
        this.sender = this.JSON.participant || this.JSON.key?.remoteJid || null;
        this.remoteJid = this.JSON.key?.remoteJid || null;
        this.text = typeof this.data === 'string' ? this.data : this.data.text !== undefined ? this.data.text : this.data.caption !== undefined ? this.data.caption : null;
        this.mentions = this.data.contextInfo?.mentionedJid || [];
        if (this.data?.contextInfo?.quotedMessage) {
            this.quoted = {};
            this.quoted.JSON = this.data.contextInfo;
            this.quoted.JSON.message = this.quoted.JSON.quotedMessage;
            delete this.quoted.JSON.quotedMessage;
            this.quoted.type = Object.keys(this.quoted.JSON.message)[0] || null;
            this.quoted.data = this.quoted.JSON.message[this.quoted.type] || {};
            this.quoted.sender = this.quoted.JSON.participant || null;
            this.quoted.remoteJid = this.quoted.JSON.remoteJid || this.remoteJid;
            this.quoted.text = typeof this.quoted.data === 'string' ? this.quoted.data : this.quoted.data.text !== undefined ? this.quoted.data.text : this.quoted.data.caption !== undefined ? this.quoted.data.caption : null;
        }
        this.isGroup = /@g\.us$/.test(this.remoteJid);
        this.language = DATABASE.chatRooms[this.remoteJid]?.language || BOTSETTINGS.defaultLanguage;
    }

    async replyText (text, options = {}) {
        if (options.quoted === undefined) options.quoted = true;
        if (options.mentions === undefined) options.mentions = [];
        this.client.sendTextMessage(this.remoteJid, text, options.quoted ? this.JSON : {}, options.mentions);
        return text;
    }

    async printMessage () {
        function getMediaDuration (seconds) { const _d = moment.duration(seconds || 0, 'seconds'); return `${Math.floor(_d.asMinutes())}:${_d.seconds()}`; }
        function getMediaSize (byte) { const _b = parseInt(byte); return _b < 1000000 ? `${(_b/1000).toFixed(2)}KB` : `${(_b/1000000).toFixed(2)}MB`; }
        function replaceJid (text) { return text.split('@')[0]; }

        const time = this.JSON.messageTimestamp ? moment(parseInt(this.JSON.messageTimestamp)*1000).format('hh:mm:ss') : moment().format('hh:mm:ss');
        const type = (isQuoted)=> this.isMessage ? (()=> {
            const message = isQuoted ? this.quoted : this;
            const type = /conversation|extendedTextMessage/.test(message.type) ? 'text' : message.type === 'stickerMessage' ? 'sticker' + (message.data.isAnimated ? '-animated' : '') : message.type === 'imageMessage' ? 'image' : message.type === 'videoMessage' ? 'video' + (message.data.gifPlayback ? '-gif' : '') : message.type === 'audioMessage' ? 'audio' + (message.data.ptt ? '-ptt' : '') : message.type === 'documentMessage' ? 'document' : /contactMessage|contactsArrayMessage/.test(message.type) ? 'contact' + (message.type === 'contactsArrayMessage' ? 's' : '') : /locationMessage|liveLocationMessage/.test(message.type) ? 'location' + (message.type === 'liveLocationMessage' ? '-live' : '') : message.type === 'productMessage' ? 'product' : null;
            const _data = [];
            if (/^(image|video(-gif)?|audio(-ptt)?|sticker(-animated)?|document)$/.test(type)) _data.push(getMediaSize(message.data.fileLength));
            if (/^(video(-gif)?|audio(-ptt)?)$/.test(type)) _data.push(getMediaDuration(message.data.seconds));
            if (/^(image|video(-gif)?|sticker)$/.test(type)) _data.push(`${message.data.width || '?'}x${message.data.height || '?'}`);
            if (/^location(-live)?$/.test(type)) _data.push(`lat:${message.data.degreesLatitude}/lon:${message.data.degreesLongitude}`);
            if (type === 'text') _data.push(`${message.data.text !== undefined ? message.data.text.length : typeof message.data === 'string' ? message.data.length : 0}chars`)
            if (type === 'document') _data.push(`${message.data.pageCount ? `${message.data.pageCount}page${message.data.pageCount > 1 ? 's' : ''}` : ''}`, `"${message.data.fileName}"`);
            if (type === 'contact') _data.push(`${message.data?.displayName}/${Array.from((message.data?.vcard || '').matchAll(/[^]+;waid=(?<test>[0-9]+);[^]+/g))[0]?.groups?.test || '0'}`);
            if (type === 'contacts') _data.push(message.data.contacts.map(v=> `${v?.displayName}/${Array.from((v?.vcard || '').matchAll(/[^]+;waid=(?<test>[0-9]+);[^]+/g))[0]?.groups?.test || '0'}`).join(', '));
            if (type === 'product') _data.push(`${message.data.product?.productImage ? `${getMediaSize(message.data.product.productImage.fileLength)} ${message.data.product.productImage.width}x${message.data.product.productImage.height} ` : ''}"${message.data.title}" ${message.data.currencyCode}${message.data.priceAmount1000}`);
            return `<${([type, _data.join(' ')].join(' ')).trim()}>`;
        })() : `<whatsapp ${this.JSON.messageStubType} [ ${this.JSON.messageStubParameters.map(v=> v.replace('@s.whatsapp.net', '')).join(', ')} ]>`;
        if (!TEMPDATA.system.print) TEMPDATA.system.print = { cache: {} };
        for (const v of [this.sender, this.remoteJid, this.quoted?.sender, this.quoted?.remoteJid]) {
            if (!v) continue;
            if (!TEMPDATA.system.print.cache[v]) {
                // const name = await this.getName(v, false);
                TEMPDATA.system.print.cache[v] = {
                    color: [MIKI.getRandomNumber(0,360), MIKI.getRandomNumber(0,75)]    
                }
            }
        }
        const cache = TEMPDATA.system.print.cache;
        const sender = async (isQuoted)=> {
            const sender = isQuoted ? this.quoted.sender : this.sender;
            const color = [...(cache[sender]?.color || [30,100]), isQuoted ? 50 : 100];
            const name = await this.getName(sender, false);
            let quotedSenderDifferentRemoteJid;
            if (isQuoted && (this.remoteJid !== this.quoted.remoteJid)) {
                quotedSenderDifferentRemoteJid = ' ' + chalk.hsv(...(cache[this.quoted.remoteJid]?.color || [30,100]), 50)('@' + await this.getName(this.quoted.remoteJid, false));
            }
            return `${chalk.hsv(...color)(name)}${quotedSenderDifferentRemoteJid ? quotedSenderDifferentRemoteJid : ''}`;
        }
        const printText = async ()=> {
            const timestamp = chalk.hsv(100,100,100)(time);
            const remoteJid = chalk.hsv(...(cache[this.remoteJid]?.color || [0,100]), 50)('@' + await this.getName(this.remoteJid, false));
            const numbers = chalk.hsv(100,100,50)(`(${[this.sender, this.remoteJid].filter(v=> v).map(v=> replaceJid(v)).join('#')})`);
            const message = this.isMessage ?
            (this.quoted ? `  ${chalk.hsv(0,0,50)('Re.')} ${sender('quoted')} ${chalk.hsv(0,0,50)(`${chalk.hsv(100,100,25)(type('quoted'))} ${((this.quoted.text || '').replace(/\n/g, '  ').slice(0,121) + ((this.quoted.text || '').length > 120 ? ' ...' : '') || '')}`)}\n${this.sender === this.remoteJid ? '' : sender() + ': '}${chalk.hsv(100,100,75)(type())} ${this.text || ''}`
                : `${this.sender === this.remoteJid ? '' : sender() + ': '}${chalk.hsv(100,100,75)(type())} ${this.text || ''}`
            ) : `${chalk.hsv(100,100,75)(type())}`;
            return `${timestamp} | ${remoteJid} ${numbers}\n${message}\n`;
        }
        console.log(await printText());
    }

    async getName (jid = '', excludeContactName = true) {
        if (/\.net$/.test(jid)) {
            let us;
            if (jid === this.client.user.jid) us = this.client.user.name;
            else if (excludeContactName) us = this.client.contacts[jid].notify || this.client.contacts[jid].vname || jid.replace(/\D/g, '');
            else us = this.client.contacts[jid].name || this.client.contacts[jid].notify || this.client.contacts[jid].vname || jid.replace(/\D/g, '');
            return us;
        }
        if (/g\.us$/.test(jid)) {
            return (await this.client.groupMetadata(jid)).subject;
        }
        if (/broadcast$/.test(jid)) {
            if (/status/.test(jid)) return 'status';
            return 'broadcast';
        }
    }

    async getGroupData () {
        if (!this.isGroup()) return;
        const data = await this.client.groupMetadata(this.remoteJid);
        data.participantsArray = data.participants;
        data.participants = {};
        data.participantsArray.forEach(v => {
            data.participants[v.jid] = v;
        });
        delete data.participantsArray;
        data.isBotAdmin = data.participants[this.client.user.jid].isAdmin;
        data.isSenderAdmin = data.participants[this.sender].isAdmin;
        return data;
    }
}

module.exports = { Client, Message };