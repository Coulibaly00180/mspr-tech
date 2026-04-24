import React from 'react';
import { Activity, clock, CheckCircle } from 'lucide-react';

const AdminDashboard = ({ stats }) => {
  return (
    <section className="admin-dashboard">
      <h3><Activity size={18} /> Pilotage Performance (KPI)</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <label>Temps Moyen</label>
          <span>{stats.avgTime}ms</span>
        </div>
        <div className="stat-card">
          <label>Succès 2FA</label>
          <span>{stats.successRate}%</span>
        </div>
      </div>
      <div className="audit-logs">
        <label>Journal d'Audit</label>
        <ul>
          {stats.logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default AdminDashboard;
