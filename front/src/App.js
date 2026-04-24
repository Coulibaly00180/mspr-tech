import React, { useState } from 'react';
// Nettoyage : KeyRound supprimé car inutilisé
import { ShieldCheck, QrCode, AlertTriangle, RefreshCw, UserPlus } from 'lucide-react';
import { faasApi } from './services/faasApi';
import './App.css';

function App() {
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({ username: '', password: '', token: '' });
  
  // setCodes est maintenant correctement utilisé pour stocker les images reçues
  const [codes, setCodes] = useState({ pwdQr: '', mfaQr: '' });

  // Gérer l'authentification (Mission 6)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await faasApi.login(userData);
      if (res.status === 'expired') {
        setStep('expired');
      } else if (res.authenticated) {
        alert("Accès autorisé au Cloud COFRAP");
      } else {
        setError("Échec de l'authentification multifacteur.");
      }
    } catch (err) {
      setError("Le service OpenFaaS est injoignable.");
    } finally {
      setLoading(false);
    }
  };

  // Gérer la création de compte (Mission 6 & 7) - AJOUTÉ ICI
  const handleRegister = async () => {
    if (!userData.username) {
      setError("Veuillez saisir un identifiant.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Appel des fonctions OpenFaaS pour générer les secrets
      const pwdRes = await faasApi.generatePassword(userData.username);
      const mfaRes = await faasApi.generate2FA(userData.username);

      // Mise à jour de l'état avec les QR codes reçus (Base64)
      setCodes({ 
        pwdQr: pwdRes.qrCode, 
        mfaQr: mfaRes.qrCode 
      });

      setStep('display_qr');
    } catch (err) {
      setError("Erreur lors de la génération des accès via les fonctions Serverless.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" role="main">
      <header>
        <h1>COFRAP Cloud</h1>
        <p>Système d'authentification Serverless</p>
      </header>

      {error && <div className="alert-error" role="alert"><AlertTriangle size={16} /> {error}</div>}

      {/* LOGIN */}
      {step === 'login' && (
        <section aria-labelledby="login-title">
          <h2 id="login-title"><ShieldCheck color="#3b82f6" /> Connexion</h2>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="user">Identifiant</label>
              <input type="text" id="user" required
                     onChange={e => setUserData({...userData, username: e.target.value})} />
            </div>
            <div className="input-group">
              <label htmlFor="pass">Mot de passe</label>
              <input type="password" id="pass" required
                     onChange={e => setUserData({...userData, password: e.target.value})} />
            </div>
            <div className="input-group">
              <label htmlFor="mfa">Code 2FA (TOTP)</label>
              <input type="text" id="mfa" maxLength="6" placeholder="000000" required
                     onChange={e => setUserData({...userData, token: e.target.value})} />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? <RefreshCw className="spin" size={18} /> : "Accéder au Cloud"}
            </button>
          </form>
          <button className="btn-secondary" onClick={() => setStep('register')}>
            <UserPlus size={18} /> Créer un nouveau compte
          </button>
        </section>
      )}

      {/* CRÉATION DE COMPTE */}
      {step === 'register' && (
        <section>
          <h2><UserPlus color="#3b82f6" /> Initialisation</h2>
          <div className="input-group" style={{marginBottom: '1rem'}}>
            <label htmlFor="reg-user">Choisissez un identifiant</label>
            <input type="text" id="reg-user" 
                   onChange={e => setUserData({...userData, username: e.target.value})} />
          </div>
          <button onClick={handleRegister} disabled={loading} style={{width: '100%'}}>
            {loading ? <RefreshCw className="spin" size={18} /> : "Générer mes accès sécurisés"}
          </button>
          <button className="btn-secondary" onClick={() => setStep('login')}>Retour</button>
        </section>
      )}

      {/* AFFICHAGE QR */}
      {step === 'display_qr' && (
        <section className="qr-section">
          <h2><QrCode color="#10b981" /> Secrets de sécurité</h2>
          <p style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem'}}>
            Sauvegardez ces codes. Le mot de passe (24 chars) est à usage unique.
          </p>
          <div className="qr-grid">
            <div className="qr-card">
              <label>Mot de Passe</label>
              <img src={codes.pwdQr} alt="QR Code Mot de Passe" />
            </div>
            <div className="qr-card">
              <label>Secret 2FA</label>
              <img src={codes.mfaQr} alt="QR Code 2FA" />
            </div>
          </div>
          <button onClick={() => setStep('login')} style={{width: '100%'}}>
            J'ai configuré mes accès
          </button>
        </section>
      )}

      {/* EXPIRATION (Rotation 6 mois) */}
      {step === 'expired' && (
        <section className="alert-expired">
          <h2><RefreshCw color="#f59e0b" /> Rotation Requise</h2>
          <p>Vos identifiants ont plus de 6 mois. Pour la sécurité de la COFRAP, vous devez les renouveler.</p>
          <button onClick={() => setStep('register')} style={{width: '100%'}}>
            Réinitialiser mes accès
          </button>
        </section>
      )}
    </main>
  );
}

export default App;