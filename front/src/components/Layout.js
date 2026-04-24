import React from 'react';

const Layout = ({ children, username, step }) => {
  const getSubTitle = () => {
    if (step === 'welcome' || step === 'dashboard') {
      return `Bonjour, ${username}`;
    }
    return "Authentification";
  };

  return (
    <div className="page-wrapper">
      <main className="container" role="main">
        <header>
          <h1>COFRAP Cloud</h1>
          <p>{getSubTitle()}</p>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
