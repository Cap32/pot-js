
import { ensureDir } from 'fs-promise';
import homeOrTmp from 'home-or-tmp';
import { name } from '../../package.json';
import { join } from 'path';

const root = join(homeOrTmp, '.config', name);

const workspace = {
	_getConfigDir() {
		return join(root, this._name || 'defaults');
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
		return await this._getDir('pids');
	},

	async getSocketsDir() {
		return await this._getDir('sockets');
	},

	set(name) {
		this._name = name;
	},
};

export default workspace;
