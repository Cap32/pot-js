import pkg from '../package.json';
import createCli from './utils/createCli';
import * as Commands from './Commands';

createCli(pkg, Commands);
