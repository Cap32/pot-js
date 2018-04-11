/**
 * this module is inspired by [respawn](https://github.com/mafintosh/respawn)
 */

import spawn from 'cross-spawn';
import { EventEmitter } from 'events';
import { fork } from 'child_process';
import fkill from 'fkill';
import { noop } from 'lodash';
import isWin from './isWin';

const defaultSleep = function defaultSleep(sleep) {
	sleep = Array.isArray(sleep) ? sleep : [sleep || 1000];
	return function (restarts) {
		return sleep[restarts - 1] || sleep[sleep.length - 1];
	};
};

const kill = async function kill(pid) {
	return fkill(pid, { force: isWin }).catch(noop);
};

const EventTypes = {
	SPAWN: 'spawn',
	START: 'start',
	SLEEP: 'sleep',
	CRASH: 'crash',
	EXIT: 'exit',
	STOP: 'stop',
	STDOUT: 'stdout',
	STDERR: 'stderr',
	WARN: 'warn',
};

class Monitor extends EventEmitter {
	constructor(command, opts) {
		super();

		this.id = null; // for respawn-group

		this.status = 'stopped';
		this.command = command;
		this.name = opts.name;
		this.cwd = opts.cwd || '.';
		this.env = opts.env || {};
		this.data = opts.data || {};
		this.uid = opts.uid;
		this.gid = opts.gid;
		this.pid = 0;
		this.ppid = opts.ppid;
		this.crashes = 0;
		this.stdio = opts.stdio;
		this.stdout = opts.stdout;
		this.stderr = opts.stderr;
		this.silent = opts.silent;
		this.windowsVerbatimArguments = opts.windowsVerbatimArguments;
		this.spawnFn = opts.fork ? fork : spawn;

		this.crashed = false;
		this.sleep =
			typeof opts.sleep === 'function' ? opts.sleep : defaultSleep(opts.sleep);
		this.maxRestarts = opts.maxRestarts === 0 ? 0 : opts.maxRestarts || -1;
		this.kill = opts.kill === false ? false : opts.kill || 30000;
		this.child = null;
		this.started = null;
		this.timeout = null;
	}

	async stop() {
		if (this.status === 'stopped' || this.status === 'stopping') {
			return;
		}
		this.status = 'stopping';

		clearTimeout(this.timeout);

		if (!this.child) return this._stopped();

		let wait;
		const { child } = this;
		const sigkill = async () => {
			await kill(child.pid);
			this.emit('force-kill');
		};

		const onexit = () => {
			clearTimeout(wait);
		};

		if (this.kill !== false) {
			wait = setTimeout(sigkill, this.kill);
			this.child.on('exit', onexit);
		}

		await Promise.all([
			new Promise((resolve) => {
				if (this.child) this.child.once('exit', resolve);
				else resolve();
			}),
			kill(this.child.pid),
		]);
	}

	start() {
		if (this.status === 'running') return;

		let restarts = 0;
		let clock = 60000;

		const loop = () => {
			const cmd =
				typeof this.command === 'function' ? this.command() : this.command;
			const child = this.spawnFn(cmd[0], cmd.slice(1), {
				cwd: this.cwd,
				env: Object.assign(process.env, this.env),
				uid: this.uid,
				gid: this.gid,
				stdio: this.stdio,
				silent: this.silent,
				windowsVerbatimArguments: this.windowsVerbatimArguments,
			});

			this.started = new Date();
			this.status = 'running';
			this.child = child;
			this.pid = child.pid;
			this.emit(EventTypes.SPAWN, child);

			child.setMaxListeners(0);

			if (child.stdout) {
				child.stdout.on('data', (data) => {
					this.emit(EventTypes.STDOUT, data);
				});

				if (this.stdout) {
					child.stdout.pipe(this.stdout);
				}
			}

			if (child.stderr) {
				child.stderr.on('data', (data) => {
					this.emit(EventTypes.STDERR, data);
				});

				if (this.stderr) {
					child.stderr.pipe(this.stderr);
				}
			}

			child.on('message', (message) => {
				this.emit('message', message);
			});

			const clear = () => {
				if (this.child !== child) return false;
				this.child = null;
				this.pid = 0;
				return true;
			};

			child.on('error', (err) => {
				this.emit(EventTypes.WARN, err); // too opionated? maybe just forward err
				if (!clear()) return;
				if (this.status === 'stopping') return this._stopped();
				this.crashes++;
				this._crash();
			});

			child.on('exit', (code, signal) => {
				this.emit(EventTypes.EXIT, code, signal);
				if (!clear()) return;
				if (this.status === 'stopping') return this._stopped();

				clock -= Date.now() - (this.started ? this.started.getTime() : 0);

				if (clock <= 0) {
					clock = 60000;
					restarts = 0;
				}

				this.crashes++;

				if (++restarts > this.maxRestarts && this.maxRestarts !== -1) {
					return this._crash();
				}

				this.status = 'sleeping';
				this.emit(EventTypes.SLEEP);

				const restartTimeout = this.sleep(restarts);
				this.timeout = setTimeout(loop, restartTimeout);
			});
		};

		clearTimeout(this.timeout);
		loop();

		if (this.status === 'running') this.emit(EventTypes.START);
	}

	toJSON() {
		return {
			...this.data,
			pid: this.pid,
			ppid: this.ppid,
			monitor: {
				id: this.id,
				name: this.name,
				status: this.status,
				started: this.started,
				pid: this.ppid,
				crashes: this.crashes,
				command: this.command,
				cwd: this.cwd,
				env: this.env,
			},
		};
	}

	_crash() {
		if (this.status !== 'running') return;
		this.status = 'crashed';
		this.emit(EventTypes.CRASH);
		if (this.status === 'crashed') this._stopped();
	}

	_stopped() {
		if (this.status === 'stopped') return;
		if (this.status !== 'crashed') this.status = 'stopped';
		this.started = null;
		this.emit(EventTypes.STOP);
	}
}

export default function respawn(command, opts) {
	if (typeof command !== 'function' && !Array.isArray(command)) {
		return respawn(command.command, command);
	}
	return new Monitor(command, opts || {});
}

export { EventTypes };
