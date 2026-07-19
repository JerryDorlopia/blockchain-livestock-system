import React from 'react';
import { Link } from 'react-router-dom';
function Navbar({ account }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand">🐄 Livestock Health</div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/register">Register</Link>
        <Link to="/health">Health</Link>
        <Link to="/traceability">Traceability</Link>
        <Link to="/carbon">Carbon</Link>
        <Link to="/iot">IoT</Link>
        {account && (
          <span className="wallet-address">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
