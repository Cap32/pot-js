import getConfig from './getConfig';
import * as cliSchema from './cli';

export default { ...cliSchema, config: getConfig(), getConfig };
