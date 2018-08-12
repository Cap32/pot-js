import pidUsage from 'pidusage';
import { logger } from 'pot-logger';
import filesize from 'filesize';
import { totalmem } from 'os';

const { assign } = Object;

const parseMemoryUsage = (state) => {
	const { memoryUsage } = state;
	const { used, total } = memoryUsage;

	if (isNaN(used) || isNaN(total)) {
		assign(memoryUsage, {
			value: '-',
			percent: '-',
			styled: '-',
		});
	}
	else {
		const styledUsed = filesize(used);
		const value = used / total * 100;
		const percent = `${value.toFixed(2)}%`;
		assign(memoryUsage, {
			value,
			percent,
			styled: `${styledUsed} (${percent})`,
		});
	}
	return state;
};

const parseCpuUsage = (state) => {
	const { cpuUsage } = state;
	const { value } = cpuUsage;
	cpuUsage.percent = isNaN(value) ? '-' : `${value}%`;
	cpuUsage.styled = cpuUsage.percent;
	return state;
};

const startedLocal = (state) => {
	state.monitor.startedLocal = new Date(state.monitor.started).toLocaleString();
	return state;
};

export default async function getStateVerbose(state) {
	if (!state) return;

	const exportState = function exportState(usages = {}) {
		Object.assign(
			state,
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
