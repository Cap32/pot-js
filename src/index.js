import { Pot, exec } from './core';
import * as Operators from './Operators';
import * as Commands from './cli/Commands';
import createCli from './cli/createCli';
import workspace from './utils/workspace';
import resolveConfig from './utils/resolveConfig';
import * as EnvVar from './utils/EnvVar';
import Schemas from './Schemas';

export default Object.assign(Pot, {
	exec,
	Operators,
	Commands,
	workspace,
	createCli,
	resolveConfig,
	EnvVar,
	Schemas,
});
