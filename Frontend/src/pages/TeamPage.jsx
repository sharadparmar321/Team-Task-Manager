import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadMembers() {
    if (user?.role !== 'ADMIN') {
      return;
    }

    const response = await api.get('/users');
    setMembers(response.users);
  }

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await loadMembers();
      } catch (requestError) {
        if (mounted) {
          setError(requestError.message || 'Failed to load team members');
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

  async function promote(userId) {
    await api.patch(`/users/${userId}/promote`, {});
    await loadMembers();
  }

  if (loading) {
    return <div className="page-card">Loading team...</div>;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page-stack">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Team</p>
            <h2>Team management is reserved for admins</h2>
            <p>You can still work inside the projects and tasks you have access to.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Team</p>
          <h2>Manage access across the workspace</h2>
          <p>Review all users, their roles, and promote members when the team structure changes.</p>
        </div>
        <div className="hero-badge">{members.length} users</div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="panel">
        <div className="panel-heading">
          <h3>Workspace users</h3>
          <span>Admin only</span>
        </div>
        <div className="stack-list">
          {members.map((member) => (
            <div key={member.id} className="stack-item">
              <div>
                <strong>{member.name}</strong>
                <p>{member.email}</p>
              </div>
              <div className="button-row wrap">
                <StatusBadge value={member.role} />
                {member.role !== 'ADMIN' ? (
                  <button type="button" className="button ghost" onClick={() => promote(member.id)}>Promote</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}