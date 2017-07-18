
import { ensureDir } from 'fs-extra';
import homeOrTmp from 'home-or-tmp';
import { name } from '../../package.json';
import { join } from 'path';
import { isObject } from 'lodash';

const { POT_WORKSPACE = 'defaults' } = process.env;

const root = join(homeOrTmp, '.config', name);

const workspace = {
	_getConfigDir() {
		return join(root, this._name || POT_WORKSPACE);
	},

	async _getDir(dirname) {
		await ensureDir(root);
		const configDir = this._getConfigDir();
		await ensureDir(configDir);
		const fullDir = join(configDir, dirname);
		await ensureDir(fullDir);
		return fullDir;
	},

	async getPidsDir() {
		return this._getDir('pids');
	},

	async getSocketsDir() {
		return this._getDir('sockets');
	},

	set(name) {
		this._name = isObject(name) ? name.workspace : (name || POT_WORKSPACE);
	},
};

export default workspace;
