import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const DEFAULT_FORM = {
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  dueDate: '',
  status: 'TODO',
};

const FINAL_STATUSES = ['DONE', 'COMPLETED'];

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

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingTaskId, setEditingTaskId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const editable = user?.role === 'ADMIN';

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) || null,
    [editingTaskId, tasks],
  );

  async function loadData() {
    const [taskResponse, projectResponse] = await Promise.all([
      api.get('/tasks'),
      api.get('/projects'),
    ]);

    setTasks(taskResponse.tasks);
    setProjects(projectResponse.projects);

    if (user?.role === 'ADMIN') {
      const userResponse = await api.get('/users');
      setUsers(userResponse.users);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadData();
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Failed to load tasks');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setForm({
        title: selectedTask.title,
        description: selectedTask.description || '',
        projectId: selectedTask.projectId,
        assigneeId: selectedTask.assigneeId || '',
        dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().slice(0, 16) : '',
        status: selectedTask.status,
      });
    }
  }, [selectedTask]);

  async function refresh() {
    await loadData();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : '',
      };

      if (editingTaskId) {
        await api.patch(`/tasks/${editingTaskId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }

      setForm(DEFAULT_FORM);
      setEditingTaskId('');
      await refresh();
    } catch (requestError) {
      setError(requestError.message || 'Unable to save task');
    }
  }

  async function handleStatusChange(taskId, status) {
    await api.patch(`/tasks/${taskId}/status`, { status });
    await refresh();
  }

  async function handleDelete(taskId) {
    await api.delete(`/tasks/${taskId}`);
    await refresh();
  }

  if (loading) {
    return <div className="page-card">Loading tasks...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Tasks</p>
          <h2>Track delivery status with clarity</h2>
          <p>Admins can create and assign work. Members can update the status of tasks assigned to them.</p>
        </div>
        <div className="hero-badge">{tasks.filter((task) => !FINAL_STATUSES.includes(task.status)).length} open tasks</div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="two-column-grid projects-layout">
        <article className="panel">
          <div className="panel-heading">
            <h3>{editingTaskId ? 'Edit task' : 'Create task'}</h3>
            <span>{editable ? 'Admin access' : 'Status only'}</span>
          </div>

          {editable ? (
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Build acceptance checklist" required />
              </label>

              <label>
                Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows="4" placeholder="Describe the work and the outcome" />
              </label>

              <div className="split-grid">
                <label>
                  Project
                  <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })} required>
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Assignee
                  <select value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
                    <option value="">Unassigned</option>
                    {users.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="split-grid">
                <label>
                  Due date
                  <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
                </label>

                <label>
                  Status
                  <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    <option value="TODO">Todo</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Done</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>
              </div>

              <div className="button-row">
                {editingTaskId ? (
                  <button type="button" className="button ghost" onClick={() => { setEditingTaskId(''); setForm(DEFAULT_FORM); }}>Cancel edit</button>
                ) : null}
                <button type="submit" className="button primary">{editingTaskId ? 'Update task' : 'Create task'}</button>
              </div>
            </form>
          ) : (
            <div className="empty-state">Task creation is restricted to admins. You can still update the status of assigned tasks below.</div>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Task board</h3>
            <span>{tasks.length} tasks</span>
          </div>
          <div className="stack-list">
            {tasks.map((task) => {
              const editableTask = user?.role === 'ADMIN' || task.assigneeId === user?.id;

              return (
                <div key={task.id} className="task-card">
                  <div className="task-card-top">
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.project?.name}</p>
                    </div>
                    <StatusBadge value={task.status} />
                  </div>
                  <p>{task.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span>Assignee: {task.assignee?.name || 'Unassigned'}</span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                  </div>
                  <div className="button-row wrap">
                    {editableTask ? (
                      <select value={task.status} onChange={(event) => handleStatusChange(task.id, event.target.value)}>
                        <option value="TODO">Todo</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="DONE">Done</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    ) : null}
                    {user?.role === 'ADMIN' && task.status === 'DONE' ? (
                      <button type="button" className="button primary" onClick={() => handleStatusChange(task.id, 'COMPLETED')}>
                        Close task
                      </button>
                    ) : null}
                    {user?.role === 'ADMIN' ? (
                      <>
                        <button type="button" className="button ghost" onClick={() => setEditingTaskId(task.id)}>Edit</button>
                        <button type="button" className="button danger" onClick={() => handleDelete(task.id)}>Delete</button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}