
import Job from './src/Job';
import yargs = require('yargs');

yargs
    .command('* <host> <port>', 'run test', {}, (args: any) => {
        let { host, port, interval, errorLog, silent } = args;        
        const runner = new Job({ host, port }, { interval, errorLog, silent })
        runner.start();
    })
    .option('i',{
        description: 'interval in seconds',
        type: 'number',
        alias: 'interval',
        default: 10
    })
    .option('l',{
        description: 'log file to log errors',
        alias: 'error-log'
    })
    .option('s',{
        type: 'boolean',
        description: 'silent?',
        alias: 'silent'
    })    
    .argv;