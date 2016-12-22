
export serialize from 'serialize-javascript';

export const deserialize = function deserialize(serializedJavascript) {
	return eval(`(${serializedJavascript})`); // eslint-disable-line
};
