const randomCase = require('random-case');
const fetch = require('node-fetch');
const moment = require('moment');
const lodash = require('lodash');
const fs = require('fs');
const FileType = require('file-type')

class Fun {
    static _ = lodash;

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

    static ownerNumber () {
        return `${BOTSETTINGS.owner}@s.whatsapp.net`;
    }

    static generateRandomString (length = 12, string = '0987654321abcdefghijklmnopqrstuvwxyz', repeat = true) {
        if (repeat) return randomCase([...Array(length)].map(_=> this.selectRandom(string)).join(''));
        return randomCase(this.shuffleArray(Array.from(new Set(string)).join('')).slice(0,length));
    }

    static selectRandom (array) {
        return array[Math.floor(Math.random()*array.length)];
    }

    static shuffleArray (array) {
        let temp, currentIndex, last = array.length, arr = typeof array === 'string' ? array.split('') : Array.isArray(array) ? array : null;
        if (!last) return arr;
        while (--last) {
            currentIndex = Math.floor(Math.random()*last+1);
            temp = arr[currentIndex];
            arr[currentIndex] = arr[last];
            arr[last] = temp;
        }
        return typeof array === 'string' ? arr.join('') : arr;
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
            id = this.generateRandomString(6);
        } while (fs.readdirSync('./tmp/').map(v=> v.replace(/\..+$/, '')).indexOf(id) !== -1);
        let type = ext;
        if (!ext) type = FileType(file);
        const filename = id + (ext ? '.' + type: type?.ext ? '.' + type.ext : '');
        fs.writeFileSync('./tmp/'+filename, file);
        return filename;
    }

    static getRandomNumber (min, max) {
        return Math.floor(Math.random()*(max-min))+min;
    }

    static formatHelpText (description) {
        const dict = {
            en: {
                head: ['Format', 'Function', 'Example']
            },
            id: {
                head: ['Format', 'Fungsi', 'Contoh']
            }
        };

        let languages = [], formatted = {};
        for (const i in description) {
            languages = [...languages, ...Object.keys(description[i])];
        }
        for (const i of Array.from(new Set(languages))) {
            formatted[i] = {};
            const format = (description.format[i] ? description.format[i] : description.format.en) || '';
            const usage = (description.usage[i] ? description.usage[i] : description.usage.en) || '';
            const example = (description.example[i] ? description.example[i] : description.example.en) || '';
            const additional = (description.additional[i] ? description.additional[i] : description.additional.en) || '';
            formatted[i].help = (p)=> {
                const text = `*${dict[i].head[0]}:* ${format}\n\n*${dict[i].head[1]}:* ${usage}\n\n*${dict[i].head[2]}:* ${example}\n\n${additional}`
                    .replace(/%_/g, p);
                return text;
            }
        }
        return formatted;
    }

    static async fetchJSON (url, opts) {
        const result = await fetch(url, opts);
        const json = await result.json();
        return json;
    }

    static async fetchCietstAPI (api, data, method = 'GET') {
        if (method === 'GET') {
            const result = await this.fetchJSON(`http://localhost:3000/api/${api}?q=${data}`);
            return result;
        }
    }
}

module.exports = Fun;