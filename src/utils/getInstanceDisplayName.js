export default function getInstanceDisplayName(name, instanceNumber) {
	return name + (instanceNumber ? `#${instanceNumber}` : '');
}
