import { ensureDir } from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import { name } from '../../package.json';
import { join } from 'path';
import { isObject } from 'lodash';

const { POT_WORKSPACE = 'defaults' } = process.env;

const root = join(homeOrTmp, '.config', name);

const workspace = {
	async _getDir(dirname) {
		const dir = join(root, this._name || POT_WORKSPACE, dirname);
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

	set(name) {
		this._name = isObject(name) ? name.workspace : name || POT_WORKSPACE;
	},
};

export default workspace;
