/*
  + Just type the message right away | Cukup ketik saja pesan yang mau dikirim
    Example | contoh:
        "!sticker"
        "Test"
        "!wikipedia earth"
  + To specify the type of the message | Untuk mengatur tipe pesan:
        << ...|... >>
    Available type of the message | Tipe pesan yang tersedia:
        text, image, video, sticker, document, audio, audio-ptt, location, vcard.
    Example | contoh:
        "<<image|cat.png>> !sticker"
        "<<sticker|tmp/987654.webp>> !unsticker"
        "<<location|6.123,108.123>>"
        "<<audio|res/dj.mp3>>"
        "<<vcard|62812345678/CietstHydroxide>>"
  + To specify the sender/where to send messages | Untuk mengatur pengirim/kemana pesannya mau dikirim:
        {{ ... }}
    List of keyword | Daftar kata kunci:
        owner - send message as owner | kirim pesan sebagai owner
        private - send direct message | kirim pesan pribadi
        group - send message to a group | kirim pesan ke grup
        admin - send message as group's admin | kirim pesan sebagai admin grup
        status - send message to status | kirim pesan ke status
    Example | contoh:
        "Hi everybody! {{group admin owner}}"
        "{{status}} Hmmm? :/"
        "{{admin}} !kick @@"
        "!afk wanna sleep {{group}}"
    *remember, it's offline! | ingat, ini offline!
  + Use @@ to mention a user | Gunakan @@ untuk mention user
  + To add a quoted message | Untuk menambahkan pesan yang dibalas (reply/quote):
        [[ ... ]]
    Example | contoh:
        "[[ {{group}} Anybody here?! ]] {{group}} I'm here!"
        "[[ {{group}} <<image dog.jpeg>> woof! ]] {{group}} !sticker :)"
        "[[ Hi! {{status}} ]] replying to status :) {{private}}"
*/

const readline = require('readline-sync');
const chalk = require('chalk');
const moment = require('moment');
const Baileys = require('@adiwajshing/baileys');
const fs = require('fs');
const watchFile = require('node-watch');
const EventEmitter = require('events');
const eventEmitter = new EventEmitter();
const _ = require('lodash');

class Client extends Baileys.WAConnection {
    constructor () {
        super();
        this.user = {
            jid: MIKI.getRandomString(13, '1234567890') + '@s.whatsapp.net',
            name: 'Miki',
            gid: MIKI.getRandomString(13, '1234567890').repeat(2) + '@g.us'
        };
        watchFile('./message.txt', (_,f)=> {
            eventEmitter.emit('chat-update', fs.readFileSync('./'+f).toString());
        });
        console.log('Connected to ./message.txt ...!');
    }

    prepareMessageMedia (media, mediaType, options = {}) {
        return {
            [mediaType]: {
                url: media.url,
                mediaKey: '',
                mimetype: options.mimetype,
                fileEncSha256: '',
                fileSha256: '',
                fileLength: fs.readFileSync(media.url).length,
                seconds: options.duration,
                fileName: options.filename || 'file',
                gifPlayback: options.mimetype === 'image/gif' || undefined,
                caption: options.caption,
                ptt: options.ptt
            }
        };
    }

    on_ (event, cb) {
        eventEmitter.on(event, cb);
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
        //this.sendMessage(jid, text, Baileys.MessageType.text, { quoted: quoted, contextInfo: { mentionedJid: mentions }});
        eventEmitter.emit('chat-update', '{{ bot }}' + text);
    }
}

class Message {
    constructor (incomingMessage, WA) {
        this.messageString = incomingMessage;
        this.client = WA;
        this.isMessage = true;
    }

    async parseMessage () {
        const numberOptions = (text)=> (Array.from(text.matchAll(/\{\{\s*(?<test>.+)\s*\}\}/g))[0]?.groups?.test || '').toLowerCase();
        const messageOptions = (text)=> Array.from(text.matchAll(/<<\s*(?<test>.+)\s*>>/g))[0]?.groups?.test || '';
        const quotedOptions = (text)=> Array.from(text.matchAll(/\[\[\s*(?<test>.+)\s*\]\]/g))[0]?.groups?.test || '';
        const messageString = this.messageString;
        const quotedString = quotedOptions(messageString);
        let message = messageString.replace(/(<<.+>>|\{\{.+\}\}|\[\[.+\]\])/g, '');
        let quotedMessage = quotedOptions(messageString).replace(/(<<.+>>|\{\{.+\}\})/g, '');
        const messageType = (()=> { const t = (Array.from(messageOptions(messageString).matchAll(/^(?<test>[a-zA-Z]+)\s*\|\s*\S+$/g))[0]?.groups?.test || '').toLowerCase(); return t === 'image' ? 'imageMessage' : t === 'video' ? 'videoMessage' : t === 'sticker' ? 'stickerMessage' : t === 'document' ? 'documentMessage' : t === 'audio' || t === 'audio-ptt' ? 'audioMessage' : t === 'location' ? 'locationMessage' : t === 'vcard' ? 'contactMessage' : quotedString || /(?<=\s+|^)(@@)(?=\s+|$)/.test(messageString) ? 'extendedTextMessage' : 'conversation'; })();
        const quotedType = (()=> { const t = (Array.from(messageOptions(quotedString).matchAll(/^(?<test>[a-zA-Z]+)\s*\|\s*\S+$/g))[0]?.groups?.test || '').toLowerCase(); return t === 'image' ? 'imageMessage' : t === 'video' ? 'videoMessage' : t === 'sticker' ? 'stickerMessage' : t === 'document' ? 'documentMessage' : t === 'audio' || t === 'audio-ptt' ? 'audioMessage' : t === 'location' ? 'locationMessage' : t === 'vcard' ? 'contactMessage' : /(?<=\s+|^)(@@)(?=\s+|$)/.test(quotedString) ? 'extendedTextMessage' : 'conversation'; })();
        const messageTypeArgument = (Array.from(messageOptions(messageString).matchAll(/^[a-zA-Z]+\s*\|\s*(?<test>\S+)$/g))[0]?.groups?.test || '').toLowerCase();
        const quotedTypeArgument = (Array.from(messageOptions(quotedString).matchAll(/^[a-zA-Z]+\s*\|\s*(?<test>\S+)$/g))[0]?.groups?.test || '').toLowerCase();
        let remoteJid, quotedSender, quotedRemoteJid,
        sender = MIKI.getRandomString(13, '1234567890') + '@s.whatsapp.net';
        [[numberOptions(messageString), 0], [numberOptions(quotedString), 1]].filter(v=> v[0]).forEach(([v,i])=> {
            v.split(/\s+/g).forEach(w=> {
                if (w === 'bot') i === 0 ? sender = this.client.user.jid : quotedSender = this.client.user.jid;
                if (w === 'owner') i === 0 ? sender = BOTSETTINGS.owner+'@s.whatsapp.net' : quotedSender = BOTSETTINGS.owner+'@s.whatsapp.net';
                if (w === 'admin') i === 0 ? sender = '0000000000000@s.whatsapp.net' : quotedSender = '0000000000000@s.whatsapp.net';
                if (w === 'group') i === 0 ? remoteJid = this.client.user.gid : quotedRemoteJid = this.client.user.gid;
                if (w === 'private') i === 0 ? remoteJid = sender : quotedRemoteJid = quotedSender;
                if (w === 'status') i === 0 ? remoteJid = 'status@broadcast' : quotedRemoteJid = 'status@broadcast';
            });    
        });
        if (!remoteJid) remoteJid = sender;
        if (!quotedSender) quotedSender = sender;
        if (!quotedRemoteJid) quotedRemoteJid = remoteJid;
        const messageMentions = [];
        const quotedMentions = [];
        [[Array((message.match(/(?<=\s+|^)(@@)(?=\s+|$)/g) || []).length), 0], [Array((quotedMessage.match(/(?<=\s+|^)(@@)(?=\s+|$)/g) || []).length), 1]].filter(v=> v[0][0]).forEach(([v,i])=> {
            v.forEach(()=> {
                const num = MIKI.getRandomString(13, '1234567890');
                i === 0 ? message = message.replace(/(?<=\s+|^)(@@)(?=\s+|$)/, '@'+num) : quotedMessage = quotedMessage.replace(/(?<=\s+|^)(@@)(?=\s+|$)/, '@'+num);
                i === 0 ? messageMentions.push(num+'@s.whatsapp.net') : quotedMentions.push(num+'@s.whatsapp.net');
            });
        });
        let messageData = message;
        let quotedData = quotedMessage;
        for (const [v,i] of [[messageType,0], [quotedType,1]].filter(v=> v[0])) {
            if (/image|video|sticker|audio|document/.test(v)) {
                const filePath = await MIKI.saveFile(i === 0 ? messageTypeArgument : quotedTypeArgument);
                i === 0 ? messageData = { url: filePath } : quotedData = { url: filePath };
            }
        }
        const quotedOpts = { detectLinks: false };
        let quoted;
        if (quotedString) {
            if (/image|video/.test(quotedType)) quotedOpts.caption = quotedMessage;
            if (/audio-ptt/.test(messageOptions(quotedString))) quotedOpts.ptt = true;
            if (quotedMentions[0]) quotedOpts.contextInfo = { mentionedJid: quotedMentions };
            const Q = await this.client.prepareMessageContent(quotedData, quotedType, quotedOpts);
            const _Q = this.client.prepareMessageFromContent(quotedRemoteJid, Q, quotedOpts);
            quoted = _Q.toJSON();
            quoted.key.fromMe = false;
            if (/g\.us$|broadcast$/.test(quotedRemoteJid)) quoted.participant = sender;
        }
        const opts = { detectLinks: false };
        if (/image|video/.test(messageType)) opts.caption = message;
        if (/audio-ptt/.test(messageOptions(messageString))) opts.ptt = true;
        if (messageMentions[0]) opts.contextInfo = { mentionedJid: messageMentions };
        if (quoted) opts.quoted = quoted;
        const M = await this.client.prepareMessageContent(messageData, messageType, opts);
        const _M = this.client.prepareMessageFromContent(remoteJid, M, opts);
        const __message = _M.toJSON();
        __message.key.fromMe = sender === this.client.user.jid;
        if (/g\.us$|broadcast$/.test(remoteJid)) __message.participant = sender;

        this.JSON = __message;
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
            console.log(`${timestamp} | ${remoteJid} ${numbers}\n${message}\n`);
        }
        await printText();
    }

    async getName (jid = '', excludeContactName = true) {
        if (/\.net$/.test(jid)) {
            if (jid === this.client.user.jid) return this.client.user.name;
            if (jid === MIKI.getOwnerJid()) return 'owner';
            return 'user-' + MIKI.getRandomString(6);
        }
        if (/g\.us$/.test(jid)) {
            return 'group-' + MIKI.getRandomString(6);
        }
        if (/broadcast$/.test(jid)) {
            if (/status/.test(jid)) return 'status';
            return 'broadcast';
        }
    }

    async getGroupData () {
        if (!this.isGroup()) return;
        const data = {};
        data.isSenderAdmin = this.sender === '0000000000000@s.whatsapp.net';
        data.isBotAdmin = data.isSenderAdmin;
        return data;
    }
}

module.exports = { Client, Message };