import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');
  const archivedProjects = projects.filter((p) => p.status === 'ARCHIVED');

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId],
  );

  async function loadProjects() {
    const response = await api.get('/projects');
    setProjects(response.projects);
    setSelectedProjectId((current) => current || response.projects[0]?.id || '');
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadProjects();
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Failed to load projects');
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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      if (form.id) {
        await api.patch(`/projects/${form.id}`, form);
      } else {
        await api.post('/projects', form);
      }

      setForm({ name: '', description: '' });
      await loadProjects();
    } catch (requestError) {
      setError(requestError.message || 'Unable to save project');
    }
  }

  async function handleArchive(projectId) {
    await api.patch(`/projects/${projectId}/archive`, {});
    await loadProjects();
  }

  async function handleClose(projectId) {
    try {
      setError('');
      await api.patch(`/projects/${projectId}/close`, {});
      setSuccessMessage('Project closed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setSelectedProjectId('');
      await loadProjects();
    } catch (requestError) {
      setError(requestError.message || 'Failed to close project');
    }
  }

  async function handleAddMember(projectId) {
    if (!memberEmail.trim()) {
      return;
    }

    await api.post(`/projects/${projectId}/members`, { email: memberEmail.trim() });
    setMemberEmail('');
    await loadProjects();
  }

  if (loading) {
    return <div className="page-card">Loading projects...</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Projects</p>
          <h2>Plan the work and bring the team together</h2>
          <p>Admins can create and archive projects, then add members to keep delivery organized.</p>
        </div>
        {user?.role === 'ADMIN' ? <div className="hero-badge">Admin controls enabled</div> : null}
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {successMessage ? <div className="empty-state" style={{ background: 'rgba(74, 143, 111, 0.15)', color: '#2d6d54', border: '1px solid rgba(74, 143, 111, 0.3)' }}>{successMessage}</div> : null}

      <section className="two-column-grid projects-layout">
        <article className="panel">
          <div className="panel-heading">
            <h3>{form.id ? 'Edit project' : 'Create project'}</h3>
            <span>{user?.role === 'ADMIN' ? 'Admin only' : 'Read only'}</span>
          </div>
          {user?.role !== 'ADMIN' ? (
            <div className="empty-state">Only admins can create projects in this workspace.</div>
          ) : (
            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Project name
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Product relaunch" required />
              </label>
              <label>
                Description
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A concise project summary" rows="4" />
              </label>
              <div className="button-row">
                {form.id ? (
                  <button type="button" className="button ghost" onClick={() => setForm({ name: '', description: '' })}>Cancel edit</button>
                ) : null}
                <button type="submit" className="button primary">{form.id ? 'Update project' : 'Create project'}</button>
              </div>
            </form>
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <h3>Active projects</h3>
            <span>{activeProjects.length} active</span>
          </div>
          <div className="stack-list">
            {activeProjects.length === 0 ? (
              <div className="empty-state">No active projects yet.</div>
            ) : (
              activeProjects.map((project) => (
                <button key={project.id} type="button" className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)}>
                  <div className="project-card-top">
                    <strong>{project.name}</strong>
                    <StatusBadge value={project.status} />
                  </div>
                  <p>{project.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span>{project.taskCount} tasks</span>
                    <span>{project.memberCount} members</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </article>

        {completedProjects.length > 0 ? (
          <article className="panel">
            <div className="panel-heading">
              <h3>Completed projects</h3>
              <span>{completedProjects.length} completed</span>
            </div>
            <div className="stack-list">
              {completedProjects.map((project) => (
                <button key={project.id} type="button" className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)}>
                  <div className="project-card-top">
                    <strong>{project.name}</strong>
                    <StatusBadge value={project.status} />
                  </div>
                  <p>{project.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span>{project.taskCount} tasks</span>
                    <span>{project.memberCount} members</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {archivedProjects.length > 0 ? (
          <article className="panel">
            <div className="panel-heading">
              <h3>Archived projects</h3>
              <span>{archivedProjects.length} archived</span>
            </div>
            <div className="stack-list">
              {archivedProjects.map((project) => (
                <button key={project.id} type="button" className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`} onClick={() => setSelectedProjectId(project.id)}>
                  <div className="project-card-top">
                    <strong>{project.name}</strong>
                    <StatusBadge value={project.status} />
                  </div>
                  <p>{project.description || 'No description provided.'}</p>
                  <div className="project-meta">
                    <span>{project.taskCount} tasks</span>
                    <span>{project.memberCount} members</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ) : null}
      </section>

      {selectedProject ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{selectedProject.name}</h3>
              <p>{selectedProject.description || 'No description provided.'}</p>
            </div>
            <div className="button-row">
              {user?.role === 'ADMIN' ? (
                <>
                  {selectedProject.status === 'ACTIVE' ? (
                    <>
                      <button type="button" className="button ghost" onClick={() => setForm(selectedProject)}>Edit</button>
                      <button type="button" className="button primary" onClick={() => handleClose(selectedProject.id)}>Close project</button>
                      <button type="button" className="button danger" onClick={() => handleArchive(selectedProject.id)}>Archive</button>
                    </>
                  ) : (
                    <div className="empty-state">This project is {selectedProject.status.toLowerCase()} and cannot be modified.</div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          <div className="two-column-grid detail-grid">
            <div>
              <h4>Members</h4>
              <div className="stack-list compact-list">
                {selectedProject.members.length === 0 ? (
                  <div className="empty-state">No members assigned.</div>
                ) : (
                  selectedProject.members.map((member) => (
                    <div key={member.id} className="stack-item">
                      <div>
                        <strong>{member.name}</strong>
                        <p>{member.email}</p>
                      </div>
                      <StatusBadge value={member.role} />
                    </div>
                  ))
                )}
              </div>

              {user?.role === 'ADMIN' && selectedProject.status === 'ACTIVE' ? (
                <div className="inline-form">
                  <input value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="member@company.com" />
                  <button type="button" className="button primary" onClick={() => handleAddMember(selectedProject.id)}>Add member</button>
                </div>
              ) : null}
            </div>

            <div>
              <h4>Work summary</h4>
              <div className="project-insights">
                <div>
                  <span>Tasks</span>
                  <strong>{selectedProject.taskCount}</strong>
                </div>
                <div>
                  <span>Members</span>
                  <strong>{selectedProject.memberCount}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <StatusBadge value={selectedProject.status} />
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}