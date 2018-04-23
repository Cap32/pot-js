import { ensureDir } from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import { name } from '../../package.json';
import { join } from 'path';
import { isObject } from 'lodash';

const root = join(homeOrTmp, '.config', name);

const workspace = {
	default: process.env.POT_WORKSPACE || 'defaults',

	async _getDir(dirname) {
		const dir = join(root, this._name || this.default, dirname);
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

	set(options) {
		this._name = isObject(options) ? options.workspace : options;
		if (!this._name) this._name = this.default;
	},
};

export default workspace;
