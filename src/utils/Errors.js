export default class Errors {
	constructor() {
		this._errors = [];
	}

	push(error) {
		this._errors.push(error);
	}

	get length() {
		return this._errors.length;
	}

	toJSON() {
		return this._errors.map(({ message, stack }) => ({
			message,
			stack,
		}));
	}
}
