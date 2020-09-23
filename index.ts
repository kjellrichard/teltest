import Job from './src/Job';

(async () => {
    const task = new Job({ host: 'github.com', port: 443 }, {interval: 2, errorLog: 'c://temp//teltest.log'});

    task.start();   
    
})();
