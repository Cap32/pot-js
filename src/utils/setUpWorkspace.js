
import workspace from './workspace';

export default function setUpWorkspace(config = {}) {
	if (config.workspace) {
		workspace.set(config.workspace);
	}
	return config;
}
