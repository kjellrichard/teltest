import Telnet from 'telnet-client';
import logUpdate from 'log-update';
import fs from 'fs';
import { promisify } from 'util';

const appendFile = promisify(fs.appendFile);

type TelnetOption = {
    host: string,
    port: number,
    timeout?: number,
    shellPrompt?: string | RegExp,    
}

type JobOptions = {
    interval: number,
    silent?: boolean,
    errorLog?: string
}

type TaskResult = {
    elapsed: number,
    error?: Error,
    host: string,
    port: number
}


class Job {
    connection: any;    
    connectOptions: TelnetOption;
    options: JobOptions;
    private _enabled: boolean;
    private _count: number;
    private _errorCount: number;    
    private _currentTimer: NodeJS.Timeout;
    

    constructor(connectOptions: TelnetOption, schedule?: JobOptions) {
        this.connection = new Telnet();
        this.connectOptions = { ...connectOptions };
        
        this.options = { silent: false, ...schedule };
        
    }

    async run() : Promise<TaskResult> {
        this._count++;
        const start: number = Date.now();
        let error: Error = undefined;
        try {
            await this.connection.connect({ negotiationMandatory: false, ...this.connectOptions });                        
            await this.connection.end();
        } catch (e) {
            error = e;
            this._errorCount++;
        }   
        const elapsed = Date.now() - start;        
        
        if (this._enabled)
            this._currentTimer = setTimeout(this.run.bind(this), this.options.interval * 1000);  
        
        if (!this.options.silent)
            logUpdate([
                `#${this._count} (${this._errorCount} errors)`,
                new Date(),
                `${this.connectOptions.host}:${this.connectOptions.port} in ${elapsed}ms.`,
                `${this._enabled ? `Running next in ${this.options.interval}s.` : ''}`,
                `${error ? `Error: ${error.message}` : '' }`
            ].filter(l=>!!l).join('\n'))        
        if (error && this.options.errorLog) {
            appendFile(this.options.errorLog, `${this._count},${new Date().toISOString()},"${error.message}"\n`)
        }
        return {error, elapsed, host: this.connectOptions.host, port: this.connectOptions.port }
    }

    async start(forceRestart: boolean = false) {
        if (this._enabled && !forceRestart)
            return;
        this._enabled = true;
        this._count = 0;
        this._errorCount = 0;
        await this.run();
    }

    stop() {
        if (this._currentTimer )
            clearTimeout(this._currentTimer);
        this._enabled = false;        
    }
}

export default Job;