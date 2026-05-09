const STATUS_STYLES = {
  TODO: 'status todo',
  IN_PROGRESS: 'status in-progress',
  DONE: 'status done',
  COMPLETED: 'status completed',
  BLOCKED: 'status blocked',
  ACTIVE: 'status active',
  ARCHIVED: 'status archived',
};

export default function StatusBadge({ value }) {
  return <span className={STATUS_STYLES[value] || 'status'}>{value?.replaceAll('_', ' ')}</span>;
}