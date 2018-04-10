import pidUsage from 'pidusage';
import { logger } from 'pot-logger';
import formatBytes from '../utils/formatBytes';
import chalk from 'chalk';
import { totalmem } from 'os';

const { assign } = Object;

const parseMemoryUsage = (state) => {
	const { memoryUsage } = state.data;
	const { used, total } = memoryUsage;

	if (isNaN(used) || isNaN(total)) {
		assign(memoryUsage, {
			percent: '-',
			formattedTotal: '-',
			formattedUsed: '-',
			formattedString: '-',
		});
	}
	else {
		const formattedUsed = formatBytes(used);
		const formattedTotal = formatBytes(total);
		const percent = `${(used / total * 100).toFixed(2)}%`;
		assign(memoryUsage, {
			percent,
			formattedTotal,
			formattedUsed,
			formattedString: `${formattedUsed} (${percent})`,
		});
	}
	return state;
};

const parseCpuUsage = (state) => {
	const { cpuUsage } = state.data;
	const { value } = cpuUsage;
	cpuUsage.percent = isNaN(value) ? '-' : `${value}%`;
	cpuUsage.formattedString = cpuUsage.percent;
	return state;
};

const styleStatus = (state) => {
	const { status } = state;
	state.styledStatus = (function () {
		switch (status) {
			case 'running':
				return chalk.green(status);
			case 'stopped':
			case 'crashed':
				return chalk.red(status);
			case 'sleeping':
				return chalk.magenta(status);
			default:
				return status;
		}
	})();
	return state;
};

const startedLocal = (state) => {
	state.startedLocal = new Date(state.started).toLocaleString();
	return state;
};

export default async function handleInfoVerbose(state) {
	if (!state) {
		return;
	}

	const exportState = function exportState(usages = {}) {
		Object.assign(
			state.data,
			{
				memoryUsage: {
					used: NaN,
					total: NaN,
				},
				cpuUsage: {
					value: NaN,
				},
			},
			usages,
		);
		parseMemoryUsage(state);
		parseCpuUsage(state);
		styleStatus(state);
		startedLocal(state);
		return state;
	};

	const { pid } = state;
	if (!pid) {
		return exportState();
	}

	try {
		const pidState = await pidUsage(pid);
		const { memory, cpu } = pidState;
		const total = totalmem();
		return exportState({
			memoryUsage: {
				used: memory,
				total,
			},
			cpuUsage: { value: cpu },
		});
	}
	catch (err) {
		logger.error(err.message);
		logger.debug(err);
		return exportState();
	}
}
