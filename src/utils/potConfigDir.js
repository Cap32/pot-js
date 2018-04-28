import homeOrTmp from 'home-or-tmp';
import { join } from 'path';
import { name } from '../../package.json';

export default join(homeOrTmp, '.config', name);
