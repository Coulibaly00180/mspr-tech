import React, { useState } from 'react';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import AdminDashboard from './components/AdminDashboard';
import { AlertTriangle, LogOut, CheckCircle } from 'lucide-react';
import { faasApi } from './services/faasApi';
import './App.css';

function App() {
  const [step, setStep] = useState('login'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({ username: '', password: '', token: '' });
  const [codes, setCodes] = useState({ pwdQr: '', mfaQr: '' });
  const [userRole, setUserRole] = useState(null); // 'admin' ou 'user'

  // États pour le pilotage (KPI & Logs)
  const [stats, setStats] = useState({
    avgTime: 142,
    successRate: 98,
    logs: ["Système prêt - Cluster K3S opérationnel"]
  });

  // Mise à jour des champs de saisie
  const updateField = (field, value) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  // Màj du journal d'audit pour la traçabilité 
  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setStats(prev => ({ 
      ...prev, 
      logs: [`${time} - ${msg}`, ...prev.logs.slice(0, 4)] 
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    addLog(`Tentative de connexion : ${userData.username}`);
    
    try {
      const res = await faasApi.login(userData);
      
      if (res.status === 'expired') {
        addLog(`Accès expirés (rotation 6 mois) pour : ${userData.username}`);
        setStep('expired');
      } else if (res.authenticated) {
        addLog(`Authentification réussie : ${userData.username}`);
        if (userData.username.toLowerCase() === 'admin') {
          setUserRole('admin');
          setStep('dashboard');
        } else {
          setUserRole('user');
          setStep('welcome');
        }
      } else {
        setError("Identifiants ou code 2FA incorrects.");
        addLog(`Échec de connexion : ${userData.username}`);
      }
    } catch (err) {
      setError("Erreur technique : Gateway OpenFaaS injoignable.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!userData.username) {
      setError("Veuillez saisir un identifiant.");
      return;
    }

    setLoading(true);
    setError('');
    addLog(`Requête de création de compte : ${userData.username}`);

    try {
      // Appel des fonctions Serverless 
      const pwdRes = await faasApi.generatePassword(userData.username);
      const mfaRes = await faasApi.generate2FA(userData.username);

      setCodes({ 
        pwdQr: pwdRes.qrCode, 
        mfaQr: mfaRes.qrCode 
      });

      setStep('display_qr');
      addLog("Secrets QR Codes générés et chiffrés en base.");
    } catch (err) {
      setError("Erreur lors de la génération des accès Serverless.");
      addLog("Échec génération secrets.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setStep('login');
    setUserData({ username: '', password: '', token: '' });
    addLog("Déconnexion utilisateur.");
  };

  return (
    <Layout>
      {/* Affichage des messages d'erreur */}
      {error && (
        <div className="alert-error">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Formulaire de connexion */}
      {step === 'login' && (
        <AuthForm 
          onLogin={handleLogin} 
          onChange={updateField} 
          loading={loading} 
          onSwitch={() => setStep('register')} 
        />
      )}
      
      {/* Formulaire de création  */}
      {step === 'register' && (
        <RegisterForm 
          onRegister={handleRegister} 
          onChange={updateField} 
          loading={loading} 
          onBack={() => setStep('login')} 
        />
      )}

      {/* Affichage des QR Codes  */}
      {step === 'display_qr' && (
        <QRCodeDisplay 
          codes={codes} 
          onFinish={() => setStep('login')} 
        />
      )}

      {/* Cas des accès expirés (Rotation 6 mois) */}
      {step === 'expired' && (
        <section className="alert-expired">
          <h2>Accès Expirés</h2>
          <p>La politique de sécurité COFRAP exige une rotation tous les 6 mois. Veuillez régénérer vos accès.</p>
          <button onClick={() => setStep('register')} style={{width:'100%'}}>Renouveler mes accès</button>
        </section>
      )}

      {/* Vue après connexion : Utilisateur Standard */}
      {step === 'welcome' && (
        <div className="welcome-area">
          <div className="success-icon"><CheckCircle size={48} color="#10b981" /></div>
          <h2>Bienvenue, {userData.username}</h2>
          <p>Vos services Cloud sont désormais accessibles.</p>
          <button onClick={handleLogout} className="btn-secondary">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}

      {/* Vue après connexion : Espace pilotage Admin */}
      {step === 'dashboard' && userRole === 'admin' && (
        <div className="admin-area">
          <div className="admin-header">
            <h2>Espace Superviseur</h2>
            <button onClick={handleLogout} className="btn-logout" title="Déconnexion">
              <LogOut size={18} />
            </button>
          </div>
          <AdminDashboard stats={stats} />
        </div>
      )}
    </Layout>
  );
}

export default App;