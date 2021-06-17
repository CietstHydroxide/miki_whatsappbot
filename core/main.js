const testMode = require('yargs/yargs')(require('yargs/helpers').hideBin(process.argv)).argv.test === true;

let fs, Baileys, Database, Client, Message,
Command = require('./_command.js'),
watchFile = require('node-watch');

if (testMode) {
    Command = require('./_command.js');
    Client = require('./_client-test.js').Client;
    Message = require('./_client-test.js').Message;
} else {
    fs = require('fs');
    Baileys = require('@adiwajshing/baileys');
    Database = require('./_database.js');
    Client = require('./_client.js').Client;
    Message = require('./_client.js').Message;
}

global.MIKI = require('../core/_utils.js');
global.TEMPDATA = { users: {}, groupChats: {}, chatRooms: {}, system: {} };
global.DATABASE = new Database(testMode ? './core/database/data-test.json' : './core/database/data.json');
global.BOTSETTINGS = require('../bot_settings.json');
global.COMMANDS = { main: {}, aresp: {} };
Command.loadAllFunc();

async function handleMessage (incomingMessage) {
    if (!testMode && !incomingMessage.hasNewMessage) return;
    try {
        const message = new Message(incomingMessage, WA);
        if (testMode) await message.parseMessage();
        await message.printMessage();
        Object.values(COMMANDS.aresp).forEach(v=> v(message));
        if (!message.isMessage) return;
        const cmd = new Command(message);
        cmd.start();
    } catch (e) {
        console.log(e);
    }
}

module.exports = async ()=> {
    const WA = new Client();
    if (testMode) WA.on_('chat-update', handleMessage);
    else {
        WA.loadAuthInfo('./core/client/session.json');
        WA.browserDescription = Baileys.Browsers.ubuntu('Chrome');
        WA.connect();
        WA.on('open', ()=> { fs.writeFileSync('./core/client/session.json', JSON.stringify(WA.base64EncodedAuthInfo(), null, '\t')); });
        WA.on('close', ()=> {});
        WA.on('chat-update', handleMessage);
    }
}


setInterval(()=> DATABASE.save(), 60000);
process.on('exit', ()=> DATABASE.save());
watchFile('./bot_settings.json', (event, file)=> {
    console.log(event, file);
    delete require.cache[require.resolve('../'+file)];
    if (event === 'update') BOTSETTINGS = require('../bot_settings.json');
});
watchFile('./commands/', (event,file)=> {
    if (!/\.js$/.test(file)) return;
    console.log(event, file);
    delete require.cache[require.resolve('../'+file.replace(/\\/g, '/'))];
    if (event === 'remove') delete COMMANDS.main[file];
    else Command.loadAllFunc();
});
const clientFile = testMode ? './core/_client-test.js' : './core/_client.js';
watchFile([clientFile, './core/_command.js', './core/_funs.js'], (event, file)=> {
    console.log(event, file);
    if (event === 'update') {
        const moduleName = file.replace('core\\', '');
        delete require.cache[require.resolve('../core/' + moduleName)];
        if (moduleName === clientFile.replace('./core/', '')) {
            Client = require('.' + clientFile).Client;
            Message = require('.' + clientFile).Message;
        }
        if (moduleName === '_command.js') Command = require('../core/_command.js');
        if (moduleName === '_funs.js') Fun = require('./_utils.js');
    }
});