export default function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <h3>{value}</h3>
      {hint ? <span>{hint}</span> : null}
    </article>
  );
}