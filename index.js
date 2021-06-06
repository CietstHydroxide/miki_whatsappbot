const cietst = require(require('yargs/yargs')(require('yargs/helpers').hideBin(process.argv)).argv.test === true ? './core/main-test.js' : './core/main.js');

cietst();