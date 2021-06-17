const randomCase = require('random-case');
const fetch = require('node-fetch');
const fs = require('fs');
const FileType = require('file-type');
const _ = require('lodash');

class Utilities {
    static TEXT = {
        id: {
            owner_only: '{ Hanya pemilik bot yang dapat menjalankan perintah ini. }',
            group_only: '{ Perintah ini hanya dapat dijalankan di dalam grup. }',
            admin_only: '{ Hanya admin grup yang dapat menjalankan perintah ini. }',
            bot_admin_only: '{ Tidak dapat menjalankan perintah ini karena bot bukan admin. }'
        },
        en: {
            owner_only: '{ Only the bot owner is able to run this command. }',
            group_only: '{ The command is only possible inside a group. }',
            admin_only: '{ Only the group admin is able to run this command. }',
            bot_admin_only: '{ Can not execute the command since the bot is not an admin. }'
        }
    }

    static getOwnerJid () {
        return `${BOTSETTINGS.owner}@s.whatsapp.net`;
    }

    static isValidJid (jid) {
        return /^[0-9]{5,16}@s\.whatsapp\.net$/.test(jid);
    }

    static isValidGid (gid) {
        return /^[0-9]{5,16}-[0-9]{10}@g\.us$/.test(gid);
    }

    static jidToMention (jid) {
        if (!this.isValidJid(jid)) return;
        return '@' + jid.split('@')[0];
    }

    static pause (durationInMs) {
        return new Promise((resolve)=> setTimeout(()=> resolve(), durationInMs));
    }

    static getRandomString (length, repeat = true, string = '0987654321abcdefghijklmnopqrstuvwxyz') {
        if (repeat) return randomCase(_.times(length || 12, ()=> _.sample(string)).join(''));
        return randomCase(_.shuffle(_.uniq(string)).join('')).slice((length || 12) + 1);
    }

    static async saveFile (data, ext) {
        let file;
        if (Buffer.isBuffer(data)) file = data;
        else if (/^data:.*?\/.*?;base64,/i.test(data)) file = Buffer.from(data.split(',')[1], 'base64');
        else if (/^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)?$/i.test(data)) file = await(await fetch(/^https?:\/\//.test(data) ? data : 'http://'+data)).buffer();
        else if (fs.existsSync(data)) file = fs.readFileSync(data);
        else file = Buffer.alloc(1);
        let id;
        do {
            id = this.getRandomString(6);
        } while (fs.readdirSync('./tmp/').map(v=> v.replace(/\..+$/, '')).indexOf(id) !== -1);
        let type = ext;
        if (!ext) type = FileType(file);
        const filename = id + (ext ? '.' + ext : type?.ext ? '.' + type.ext : '');
        fs.writeFileSync('./tmp/' + filename, file);
        return './tmp/' + filename;
    }

    static formatHelpText (description) {
        const dict = {
            en: { head: ['Format', 'Function', 'Example', 'Synonyms'] },
            id: { head: ['Format', 'Fungsi', 'Contoh', 'Sinonim'] }
        };

        let languages = [], formatted = {};
        for (const i in description) {
            languages.push(Object.keys(description[i]));
        }
        for (const i of _.uniq(languages)) {
            formatted[i] = {};
            const format = (description.format[i] ? description.format[i] : description.format.en) || '';
            const usage = (description.usage[i] ? description.usage[i] : description.usage.en) || '';
            const example = (description.example[i] ? description.example[i] : description.example.en) || '';
            const synonym = description.synonym ? (description.synonym[i] ? description.synonym[i] : description.synonym.en) || '' : '';
            const _additional = description.additional ? (description.additional[i] ? description.additional[i] : description.additional.en) || '' : '';
            const additional = typeof _additional === 'object' ? Object.values(_additional).map((v)=> '• ' + v).join('\n') : _additional;
            formatted[i].help = (p)=> {
                const text = `*${dict[i].head[0]}:* ${format}\n\n*${dict[i].head[1]}:* ${usage}\n\n*${dict[i].head[2]}:* ${example}\n\n*${dict[i].head[3]}:* ${synonym || '-'}${additional ? '\n\n' + additional : ''}`
                    .replace(/%_/g, p);
                return text;
            }
        }
        return formatted; // { id: { help: (p)=> { ... } }, en: { help: (p)=> { ... } } }
    }

    static async fetchJSON (url, opts) {
        const result = await fetch(url, opts);
        const json = await result.json();
        return json;
    }

    static async fetchCietstAPI (API, data, method = 'GET') {
        if (method === 'GET') {
            const result = await this.fetchJSON(`http://localhost:3000/api/${API}?q=${data}`);
            return result;
        }
    }
}

module.exports = Utilities;