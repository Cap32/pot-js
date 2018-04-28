import homeOrTmp from 'home-or-tmp';
import { isObject } from 'lodash';
import schema from '../schemas/config';
import { ensureDir } from 'fs-extra';
import { join } from 'path';
import { name as pkgName } from '../../package.json';

const base = join(homeOrTmp, '.config', pkgName);

const workspace = {
	default: process.env.POT_WORKSPACE || schema.properties.workspace.default,

	async _getDir(...paths) {
		const dir = join(
			base,
			this._name || this.default,
			...paths.filter(Boolean),
		);
		await ensureDir(dir);
		return dir;
	},

	async DEPRECATED_getPidsDir() {
		return this._getDir('pids');
	},

	async DEPRECATED_getSocketsDir() {
		return this._getDir('sockets');
	},

	async getRunDir() {
		return this._getDir('pot-run');
	},

	async getLogsDir(name) {
		return this._getDir('logs', name);
	},

	set(options) {
		this._name = isObject(options) ? options.workspace : options;
		if (!this._name) this._name = this.default;
	},
};

export default workspace;
