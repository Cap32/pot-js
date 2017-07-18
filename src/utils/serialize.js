
import { runInNewContext } from 'vm';

export serialize from 'serialize-javascript';

export const deserialize = function deserialize(serializedJavascript) {
	return runInNewContext(`(${serializedJavascript})`);
};
