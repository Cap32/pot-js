import CliTable from 'cli-table';

export default function createTable(options = {}) {
	const { padding = 0, ...other } = options;
	return new CliTable({
		chars: {
			top: '',
			'top-mid': '',
			'top-left': '',
			'top-right': '',
			bottom: '',
			'bottom-mid': '',
			'bottom-left': '',
			'bottom-right': '',
			left: '',
			'left-mid': '',
			mid: '',
			'mid-mid': '',
			right: '',
			'right-mid': '',
			middle: ' ',
		},
		style: {
			head: [],
			border: [],
			compact: true,
			'padding-left': padding,
			'padding-right': padding,
		},
		...other,
	});
}
