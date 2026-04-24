import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="page-wrapper">
      <main className="container" role="main">
        <header>
          <h1>COFRAP Cloud</h1>
          <p>Authentification Haute Sécurité</p>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;