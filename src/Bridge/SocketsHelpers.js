import { remove } from 'fs-extra';

export async function removeDomainSocketFile(file) {
	return remove(file);
}
