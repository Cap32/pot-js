import pkg from '../../package.json';
import createCli from './createCli';
import * as Commands from './Commands';

createCli(pkg, Commands);
