import React, { useState } from 'react';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import QRCodeDisplay from './components/QRCodeDisplay';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { faasApi } from './services/faasApi';
import './App.css';

function App() {
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({ username: '', password: '', token: '' });
  const [codes, setCodes] = useState({ pwdQr: '', mfaQr: '' });

  const updateField = (field, value) => setUserData({ ...userData, [field]: value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await faasApi.login(userData);
      if (res.status === 'expired') setStep('expired');
      else if (res.authenticated) alert("Connexion réussie");
      else setError("Identifiants ou 2FA incorrects");
    } catch (err) { setError("Erreur Gateway OpenFaaS"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const pwdRes = await faasApi.generatePassword(userData.username);
      const mfaRes = await faasApi.generate2FA(userData.username);
      setCodes({ pwdQr: pwdRes.qrCode, mfaQr: mfaRes.qrCode });
      setStep('display_qr');
    } catch (err) { setError("Erreur de génération Serverless"); }
    finally { setLoading(false); }
  };

  return (
    <Layout>
      {error && <div className="alert-error"><AlertTriangle size={16} /> {error}</div>}

      {step === 'login' && (
        <AuthForm onLogin={handleLogin} onChange={updateField} loading={loading} onSwitch={() => setStep('register')} />
      )}
      
      {step === 'register' && (
        <RegisterForm onRegister={handleRegister} onChange={updateField} loading={loading} onBack={() => setStep('login')} />
      )}

      {step === 'display_qr' && (
        <QRCodeDisplay codes={codes} onFinish={() => setStep('login')} />
      )}

      {step === 'expired' && (
        <section className="alert-expired">
          <h2><RefreshCw color="#f59e0b" /> Accès Expirés</h2>
          <p>Politique COFRAP : vos accès ont plus de 6 mois.</p>
          <button onClick={() => setStep('register')} style={{width:'100%'}}>Renouveler</button>
        </section>
      )}
    </Layout>
  );
}

export default App;
