import React from 'react';
import { UserPlus, RefreshCw } from 'lucide-react';

const RegisterForm = ({ onRegister, onChange, loading, onBack }) => {
  return (
    <section>
      <h2><UserPlus color="#3b82f6" /> Initialisation</h2>
      <div className="input-group" style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="reg-user">Choisissez un identifiant</label>
        <input type="text" id="reg-user" placeholder="ex: j.dupont" 
               onChange={(e) => onChange('username', e.target.value)} />
      </div>
      <button onClick={onRegister} disabled={loading} style={{ width: '100%' }}>
        {loading ? <RefreshCw className="spin" size={18} /> : "Générer mes accès sécurisés"}
      </button>
      <button className="btn-secondary" onClick={onBack}>Retour</button>
    </section>
  );
};

export default RegisterForm;