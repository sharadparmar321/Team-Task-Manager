import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

function formatDate(value) {
  if (!value) {
    return 'No due date';
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await api.get('/dashboard/summary');
        if (mounted) {
          setData(response);
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Failed to load dashboard');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="page-card">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="page-card error-banner">{error}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Team performance at a glance</h2>
          <p>Watch projects, tasks, and overdue work without jumping between screens.</p>
        </div>
        <div className="hero-badge">{data.summary.overdue} overdue tasks</div>
      </section>

      <section className="stat-grid">
        <StatCard label="Projects" value={data.summary.projects} hint="Accessible to you" />
        <StatCard label="Tasks" value={data.summary.tasks} hint="Across all active work" />
        <StatCard label="In Progress" value={data.summary.inProgress} hint="Currently moving" />
        <StatCard label="Overdue" value={data.summary.overdue} hint="Needs attention" />
      </section>

      <section className="two-column-grid">
        <article className="panel">
          <div className="panel-heading">
            <h3>Recent tasks</h3>
            <span>{data.recentTasks.length} shown</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      <div className="muted">{task.assignee?.name || 'Unassigned'}</div>
                    </td>
                    <td>{task.project?.name}</td>
                    <td><StatusBadge value={task.status} /></td>
                    <td>{formatDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Overdue focus</h3>
            <span>{data.overdueTasks.length} items</span>
          </div>
          <div className="stack-list">
            {data.overdueTasks.length === 0 ? (
              <div className="empty-state">No overdue tasks right now.</div>
            ) : (
              data.overdueTasks.map((task) => (
                <div key={task.id} className="stack-item">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{task.project?.name}</p>
                  </div>
                  <div className="align-right">
                    <StatusBadge value={task.status} />
                    <p>{formatDate(task.dueDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Projects</h3>
          <span>{data.projects.length} active entries</span>
        </div>
        <div className="project-grid compact">
          {data.projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-top">
                <strong>{project.name}</strong>
                <StatusBadge value={project.status} />
              </div>
              <p>{project.description || 'No description provided.'}</p>
              <div className="project-meta">
                <span>{project.taskCount} tasks</span>
                <span>{project.memberCount} members</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}