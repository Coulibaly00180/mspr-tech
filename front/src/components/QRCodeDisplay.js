import React from 'react';
import { QrCode } from 'lucide-react';

const QRCodeDisplay = ({ codes, onFinish }) => {
  return (
    <section className="qr-section">
      <h2><QrCode color="#10b981" /> Accès Générés</h2>
      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
        Scannez ces codes. Attention : le mot de passe est à usage unique.
      </p>
      <div className="qr-grid">
        <div className="qr-card">
          <label>MOT DE PASSE</label>
          <img src={codes.pwdQr} alt="QR Password" />
        </div>
        <div className="qr-card">
          <label>SECRET 2FA</label>
          <img src={codes.mfaQr} alt="QR 2FA" />
        </div>
      </div>
      <button onClick={onFinish} style={{ width: '100%' }}>J'ai sauvegardé mes accès</button>
    </section>
  );
};

export default QRCodeDisplay;