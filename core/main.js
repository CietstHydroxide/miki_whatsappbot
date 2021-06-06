async function main () {

    const fs = require('fs');
    const watch = require('node-watch');
    const Baileys = require('@adiwajshing/baileys');
    const Database = require('./_database.js');
    let Command = require('./_command.js');
    let { Client, Message } = require('./_client.js');

    global.Fun = require('../core/_funs.js');
    global.TEMPDATA = { users: {}, chats: {}, system: {} };
    global.DATABASE = new Database('./core/database/data.json');
    global.BOTSETTINGS = require('../bot_settings.json');
    global.COMMANDS = { main: {}, aresp: {} };
    Command.loadAll();

    const WA = new Client();
    WA.loadAuthInfo('./core/client/session.json');
    WA.browserDescription = Baileys.Browsers.ubuntu('Chrome');
    WA.connect();
    WA.on('open', ()=> { fs.writeFileSync('./core/client/session.json', JSON.stringify(WA.base64EncodedAuthInfo(), null, '\t')); });
    WA.on('close', ()=> {});
    WA.on('chat-update', async (chatUpdate)=> {
        if (!chatUpdate.hasNewMessage) return;
        try {
            const m = new Message(chatUpdate, WA);
            await m.printMessage();
            if (!m.is_message) return;
            const cmd = new Command(m);
            if (!cmd.is_command) return;
            cmd.parse();
            cmd.start();
        } catch (e) {
            console.log(e);
        }
    });

    setInterval(()=> DATABASE.save(), 60000);
    process.on('exit', ()=> DATABASE.save());    

    watch('./bot_settings.json', (event, file)=> {
        delete require.cache[require.resolve('../'+file)];
        if (event === 'update') BOTSETTINGS = require('../bot_settings.json');
    });
    watch('./commands/', (event,file)=> {
        if (!/\.js$/.test(file)) return;
        delete require.cache[require.resolve('../'+file.replace(/\\/g, '/'))];
        if (event === 'remove') delete COMMANDS.main[file];
        else Command.loadAll();
    });
    watch(['./core/_client.js', './core/_command.js', './core/_funs.js'], (event, file)=> {
        console.log(event, file);
        if (event === 'update') {
            const _mod = file.replace('core\\', '');
            delete require.cache[require.resolve('../core/'+_mod)];
            if (_mod === '_client.js') {
                Client = require('../core/_client.js').Client;
                Message = require('../core/_client.js').Message;
            }
            if (_mod === '_command.js') Command = require('../core/_command.js');
            if (_mod === '_funs.js') Fun = require('../core/_funs.js');
        }
    });
}

module.exports = main;