const Baileys = require('@adiwajshing/baileys');
const moment = require('moment');
const chalk = require('chalk');

class Client extends Baileys.WAConnection {
    constructor () {
        super();
    }

    parseMentions (text) {
        if (!/(^|[\s\n\t\r]+)@[0-9]{5,16}([\s\n\t\r]+|$)/g.test(text)) return [];
        const _mentions = [];
        Array.from(text.matchAll(/(?:^|[\s\n\t\r]+)@(?<number>[0-9]{5,16})(?:[\s\n\t\r]+|$)/g)).forEach(v=> {
            _mentions.push(v.groups.number + '@s.whatsapp.net');
        });
        return _mentions;
    }

    sendTextMessage (jid, text = '', quoted = {}, mentions = []) {
        if (!jid) throw 'missing jid';
        if (!mentions[0]) mentions = this.parseMentions(text);
        this.sendMessage(jid, text, Baileys.MessageType.text, { quoted: quoted, contextInfo: { mentionedJid: mentions }});
    }
}

class Message {
    constructor (chatUpdate, WA) {
        this.json = chatUpdate.messages.all()[0].toJSON();
        this.is_message = true;
        if (!this.json.message) return this.is_message = false;
        this.client = WA;

        if (this.json.message.ephemeralMessage) {
            const _message = this.json.message.ephemeralMessage;
            this.json.message = _message;
        }
        this.message_type = Object.keys(this.json.message || {})[0] || null;
        this.message_data = this.json.message[this.message_type] || {};
        this.message_sender = this.json.participant || this.json.key.remoteJid || null;
        this.message_remote_jid = this.json.key.remoteJid || null;
        this.message_text = typeof this.message_data === 'string' ? this.message_data : this.message_data.text !== undefined ? this.message_data.text : this.message_data.caption !== undefined ? this.message_data.caption : null;
        if (this.message_data?.contextInfo?.quotedMessage) {
            this.quoted = {};
            this.quoted.message_type = Object.keys(this.message_data.contextInfo.quotedMessage)[0] || null;
            this.quoted.message_data = this.message_data.contextInfo.quotedMessage[this.quoted.message_type] || {};
            this.quoted.message_sender = this.message_data.contextInfo.participant || null;
            this.quoted.message_remote_jid = this.message_data.contextInfo.remoteJid || this.message_remote_jid;
            this.quoted.message_text = typeof this.quoted.message_data === 'string' ? this.quoted.message_data : this.quoted.message_data.text !== undefined ? this.quoted.message_data.text : this.quoted.message_data.caption !== undefined ? this.quoted.message_data.caption : null;
        }
    }

    getLanguagePref () {
        const hasLanguagePref = DATABASE.data.chats[this.message_remote_jid]?.language;
        return hasLanguagePref ? hasLanguagePref : BOTSETTINGS.defaultLanguage;
    }

    async replyText (text, mentions = [], quoted = true) {
        this.client.sendTextMessage(this.message_remote_jid, text, quoted ? this.json : {}, mentions);
        return text;
    }

    async printMessage () {
        function duration (seconds) { const _d = moment.duration(seconds || 0, 'seconds'); return `${Math.floor(_d.asMinutes())}:${_d.seconds()}`; }
        function size (byte) { const _b = parseInt(byte); return _b < 1000000 ? `${(_b/1000).toFixed(2)}KB` : `${(_b/1000000).toFixed(2)}MB`; }
        function color (hsv, text) { return chalk.hsv(...hsv)(text); }
        function replace (text) { return text.split('@')[0]; }

        const time = this.json.messageTimestamp ? moment(parseInt(this.json.messageTimestamp)*1000).format('hh:mm:ss') : moment().format('hh:mm:ss');
        const type = (q)=> this.is_message ? (()=> {
            const m = q ? this.quoted : this;
            const type = /conversation|extendedTextMessage/.test(m.message_type) ? 'text' : m.message_type === 'stickerMessage' ? 'sticker' + (m.message_data.isAnimated ? '-animated' : '') : m.message_type === 'imageMessage' ? 'image' : m.message_type === 'videoMessage' ? 'video' + (m.message_data.gifPlayback ? '-gif' : '') : m.message_type === 'audioMessage' ? 'audio' + (m.message_data.ptt ? '-ptt' : '') : m.message_type === 'documentMessage' ? 'document' : /contactMessage|contactsArrayMessage/.test(m.message_type) ? 'contact' + (m.message_type === 'contactsArrayMessage' ? 's' : '') : /locationMessage|liveLocationMessage/.test(m.message_type) ? 'location' + (m.message_type === 'liveLocationMessage' ? '-live' : '') : m.message_type === 'productMessage' ? 'product' : null;
            const _data = [];
            if (/^(image|video(-gif)?|audio(-ptt)?|sticker(-animated)?|document)$/.test(type)) _data.push(size(m.message_data.fileLength));
            if (/^(video(-gif)?|audio(-ptt)?)$/.test(type)) _data.push(duration(m.message_data.seconds));
            if (/^(image|video(-gif)?|sticker)$/.test(type)) _data.push(`${m.message_data.width || '?'}x${m.message_data.height || '?'}`);
            if (/^location(-live)?$/.test(type)) _data.push(`lat:${m.message_data.degreesLatitude}/lon:${m.message_data.degreesLongitude}`);
            if (type === 'text') _data.push(`${m.message_data.text !== undefined ? m.message_data.text.length : typeof m.message_data === 'string' ? m.message_data.length : 0}chars`)
            if (type === 'document') _data.push(`${m.message_data.pageCount ? `${m.message_data.pageCount}page${m.message_data.pageCount > 1 ? 's' : ''}` : ''}`, `"${m.message_data.fileName}"`);
            if (type === 'contact') _data.push(`${m.message_data?.displayName}/${Array.from((m.message_data?.vcard || '').matchAll(/[^]+;waid=(?<test>[0-9]+);[^]+/g))[0]?.groups?.test || '0'}`);
            if (type === 'contacts') _data.push(m.message_data.contacts.map(v=> `${v?.displayName}/${Array.from((v?.vcard || '').matchAll(/[^]+;waid=(?<test>[0-9]+);[^]+/g))[0]?.groups?.test || '0'}`).join(', '));
            if (type === 'product') _data.push(`${m.message_data.product?.productImage ? `${size(m.message_data.product.productImage.fileLength)} ${m.message_data.product.productImage.width}x${m.message_data.product.productImage.height} ` : ''}"${m.message_data.title}" ${m.message_data.currencyCode}${m.message_data.priceAmount1000}`);
            return `<${([type, _data.join(' ')].join(' ')).trim()}>`;
        })() : `<whatsapp ${this.json.messageStubType} [ ${this.json.messageStubParameters.map(v=> v.replace('@s.whatsapp.net', '')).join(', ')} ]>`;
        if (!TEMPDATA.system.print) TEMPDATA.system.print = { cache: {} };
        for (const v of [this.message_sender, this.message_remote_jid, this.quoted?.message_sender, this.quoted?.message_remote_jid]) {
            if (!v) continue;
            if (!TEMPDATA.system.print.cache[v]) {
                const name = await this.getName(v, false);
                TEMPDATA.system.print.cache[v] = {
                    name: name,
                    color: [Fun.getRandomNumber(0,360), Fun.getRandomNumber(0,75)]    
                }
            }
        }
        const _cache = TEMPDATA.system.print.cache;
        const __sender = (q)=> {
            const sender = q ? this.quoted.message_sender : this.message_sender;
            return `${color([...(_cache[sender]?.color || [30,100]), q?50:100], '~'+_cache[sender]?.name)}${q && (this.message_remote_jid !== this.quoted.message_remote_jid) ? ` ${color([...(_cache[this.quoted.message_remote_jid]?.color || [30,100]), 50], '@'+_cache[this.quoted.message_remote_jid]?.name)}` : ''}`;
        }
        console.log(`%s | %s %s\n%s\n`,
            `${chalk.hsv(100,100,100)(time)}`,
            `${color([...(_cache[this.message_remote_jid]?.color || [0,100]), 100], '@'+_cache[this.message_remote_jid]?.name)}`,
            `${chalk.hsv(100,100,50)(`(${[this.message_sender, this.message_remote_jid].filter(v=> v).map(v=> replace(v)).join('#')})`)}`,
            this.is_message ?
            (!this.quoted ?
                `${this.message_sender === this.message_remote_jid ? '' : __sender() + ': '}${chalk.hsv(100,100,75)(type())} ${this.message_text || ''}`
                : `  ${chalk.hsv(0,0,50)('Re.')} ${__sender('quoted')} ${chalk.hsv(0,0,50)(`${chalk.hsv(100,100,25)(type('quoted'))} ${((this.quoted.message_text || '').replace(/\n/g, '  ').slice(0,121) + ((this.quoted.message_text || '').length > 120 ? ' ...' : '') || '')}`)}\n${this.message_sender === this.message_remote_jid ? '' : __sender() + ': '}${chalk.hsv(100,100,75)(type())} ${this.message_text || ''}`
            ) : `${chalk.hsv(100,100,75)(type())}`
        );
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

    isGroup () {
        return /@g\.us$/.test(this.message_remote_jid);
    }

    async getGroupData () {
        if (!this.isGroup()) return;
        const data = await this.client.groupMetadata(this.message_remote_jid);
        data.participantsArray = data.participants;
        data.participants = {};
        data.participantsArray.forEach(v => {
            data.participants[v.jid] = v;
        });
        delete data.participantsArray;
        data.isBotAdmin = data.participants[this.client.user.jid].isAdmin;
        data.isSenderAdmin = data.participants[this.message_sender].isAdmin;
        return data;
    }
}

module.exports = { Client, Message };