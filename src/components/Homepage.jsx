import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Homepage.css';

// System-wide SVG Icons
const Icons = {
  Cpu: () => (
    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Database: () => (
    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  Radio: () => (
    <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
};

// ============================================
// COMPACT TOP NAVIGATION
// ============================================
function TopNav({ account, connectWallet, logout, isDark, toggleTheme }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`glass-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-badge">SEPOLIA</span>
          <span className="brand-text">SMART <span className="brand-accent">LIVESTOCK</span></span>
        </Link>

        <div className="nav-links-wrapper">
          <a href="#pipeline" className="nav-link">How It Works</a>
          <a href="#portal" className="nav-link">Portals</a>
          <a href="#protocol" className="nav-link">Technology</a>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle Theme">
            {isDark ? '☀️' : '🌙'}
          </button>

          {account ? (
            <div className="wallet-connected-badge">
              <span className="pulse-indicator"></span>
              <span className="wallet-address">{account.slice(0, 6)}...{account.slice(-4)}</span>
              <button onClick={logout} className="disconnect-btn" title="Disconnect">✕</button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-wallet-btn">
              🦊 Connect MetaMask
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
function Homepage({ account, connectWallet, logout, isDark, toggleTheme }) {
  const navigate = useNavigate();
  
  // Real-time IoT pipeline step loop logic
  const [liveTemp, setLiveTemp] = useState(38.8);
  const [liveSteps, setLiveSteps] = useState(104);
  const [pipelineStep, setPipelineStep] = useState(1); // 1: Sensor Collect, 2: Broker Transit, 3: On-Chain Mutate

  useEffect(() => {
    // Mimic physiological sensor readings changing
    const dataInterval = setInterval(() => {
      setLiveTemp((prev) => +(prev + (Math.random() * 0.2 - 0.1)).toFixed(1));
      setLiveSteps((prev) => prev + Math.floor(Math.random() * 2));
    }, 2500);

    // Sequence the active step of the pipeline simulation
    const stepInterval = setInterval(() => {
      setPipelineStep((prev) => (prev === 3 ? 1 : prev + 1));
    }, 4500);

    return () => {
      clearInterval(dataInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const handleRoleSelect = (rolePath) => {
    if (!account) {
      alert("Please connect your MetaMask wallet first to authorize Role-Based access.");
      return;
    }
    navigate(rolePath);
  };

  return (
    <div className={`app-layout ${isDark ? '' : 'light-mode'}`}>
      <TopNav 
        account={account} 
        connectWallet={connectWallet} 
        logout={logout}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="grain-overlay"></div>
        <div className="ambient-glow"></div>
        
        <div className="hero-grid-container">
          <div className="hero-hud-left">
            <div className="meta-tag">
              <span className="tag-line"></span>
              <span>IOT × DECENTRALIZED PROTOCOL</span>
            </div>
            
            <h1 className="hero-main-title">
              National Livestock<br />
              <span className="text-gradient">Traceability Protocol</span>
            </h1>
            
            <p className="hero-subtitle">
              Providing immutable digital identity, disease surveillance, and secure ownership transfers across Rwanda through physical edge hardware and the Sepolia network.
            </p>

            <div className="hero-btn-group">
              <button onClick={() => handleRoleSelect('/dashboard')} className="primary-action-btn">
                Access System Console
              </button>
              <a href="#portal" className="secondary-action-btn">
                View Portals
              </a>
            </div>

            <div className="live-telemetry-strip">
              <div className="telemetry-item">
                <span className="telemetry-val">ERC-721</span>
                <span className="telemetry-lbl">COW PASSPORTS</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-val">MQTT</span>
                <span className="telemetry-lbl">INGEST AGENT</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-val">IPFS</span>
                <span className="telemetry-lbl">DIAGNOSTICS</span>
              </div>
            </div>
          </div>

          {/* IoT Pipeline Live Simulation HUD */}
          <div className="hero-hud-right" id="pipeline">
            <div className="console-window">
              <div className="console-header">
                <div className="window-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="window-title">LIVE DATA TRANSMISSION PATHWAY</div>
                <div className="window-status">ACTIVE PIPELINE</div>
              </div>

              <div className="console-body">
                {/* Horizontal Flow Map */}
                <div className="pipeline-steps-container">
                  <div className={`step-badge ${pipelineStep === 1 ? 'active' : ''}`}>
                    <span className="step-num">1</span>
                    <span className="step-name">ESP32 Collect</span>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className={`step-badge ${pipelineStep === 2 ? 'active' : ''}`}>
                    <span className="step-num">2</span>
                    <span className="step-name">MQTT Broker</span>
                  </div>
                  <div className="step-arrow">→</div>
                  <div className={`step-badge ${pipelineStep === 3 ? 'active' : ''}`}>
                    <span className="step-num">3</span>
                    <span className="step-name">On-Chain Commit</span>
                  </div>
                </div>

                {/* Dynamic visual card explaining current step */}
                <div className="simulation-dynamic-panel">
                  {pipelineStep === 1 && (
                    <div className="sim-panel-content animate-fade">
                      <div className="sim-header-row">
                        <span className="sim-title">Step 1: Edge Sensing (Wearables)</span>
                        <span className="sim-indicator sensing">SENSING</span>
                      </div>
                      <p className="sim-desc">The animal's smart collar (ESP32 node) records raw body temperature and activity counts directly from hardware sensors.</p>
                      <div className="sim-readout-grid">
                        <div className="readout-box">
                          <label>Temp Probe</label>
                          <span className="readout-num">{liveTemp}°C</span>
                        </div>
                        <div className="readout-box">
                          <label>Accelerometer</label>
                          <span className="readout-num">{liveSteps} Steps</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {pipelineStep === 2 && (
                    <div className="sim-panel-content animate-fade">
                      <div className="sim-header-row">
                        <span className="sim-title">Step 2: MQTT Stream Gateway</span>
                        <span className="sim-indicator transmitting">TRANSMITTING</span>
                      </div>
                      <p className="sim-desc">Data packets bundle into dynamic payload arrays and push to local gateways over MQTT protocol under low-bandwidth parameters.</p>
                      <div className="sim-broker-output">
                        <code>TOPIC: rwanda/livestock/sensor/A9</code>
                        <code>PAYLOAD: {"{"} id: "RFID_4401", temp: {liveTemp}, motion: {liveSteps} {"}"}</code>
                      </div>
                    </div>
                  )}

                  {pipelineStep === 3 && (
                    <div className="sim-panel-content animate-fade">
                      <div className="sim-header-row">
                        <span className="sim-title">Step 3: Smart Contract Commit</span>
                        <span className="sim-indicator verified">MUTATED</span>
                      </div>
                      <p className="sim-desc">The validation script commits telemetry states on-chain to the cow's NFT metadata storage arrays if thresholds conform.</p>
                      <div className="sim-blockchain-tx">
                        <div className="tx-meta"><span>Contract Target:</span> <code className="c-green">TelemetryHub.sol</code></div>
                        <div className="tx-meta"><span>IPFS Storage Hash:</span> <code className="c-dim">QmXoyp84...G5v9</code></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visually Separating Horizontal Line Rule */}
      <hr className="section-separator" />

      {/* Role-Based Portals (RBAC) */}
      <section className="portal-section" id="portal">
        <div className="section-header-block">
          <span className="sub-header">ROLE ACCESS CONTROL</span>
          <h2>Cryptographic User Interfaces</h2>
          <p>Access your designated workflow module securely authorized via signature keys.</p>
        </div>

        <div className="portal-grid">
          <div className="portal-card" onClick={() => handleRoleSelect('/farmer-dashboard')}>
            <span className="portal-num">01</span>
            <h3>Farmer Dashboard</h3>
            <p>Manage registered herds, assign physical collar nodes, and verify disease alert states.</p>
            <span className="portal-arrow">Open Portal →</span>
          </div>

          <div className="portal-card" onClick={() => handleRoleSelect('/vet-dashboard')}>
            <span className="portal-num">02</span>
            <h3>Veterinarian Portal</h3>
            <p>Publish clinical reports, verify vaccinations, and commit digital diagnostics straight to IPFS hashes.</p>
            <span className="portal-arrow">Open Portal →</span>
          </div>

          <div className="portal-card" onClick={() => handleRoleSelect('/cooperative-dashboard')}>
            <span className="portal-num">03</span>
            <h3>Cooperative Hub</h3>
            <p>Observe regional trends, manage collective supply logistics, and audit verified data proofs.</p>
            <span className="portal-arrow">Open Portal →</span>
          </div>

          <div className="portal-card" onClick={() => handleRoleSelect('/regulator-dashboard')}>
            <span className="portal-num">04</span>
            <h3>Regulatory Console</h3>
            <p>Supervise active regional disease maps, verify imports, and manage standard platform access rules.</p>
            <span className="portal-arrow">Open Portal →</span>
          </div>
        </div>
      </section>

      <hr className="section-separator" />

      {/* Advanced Technology Features */}
      <section className="features-section" id="protocol">
        <div className="section-header-block">
          <span className="sub-header">TECHNOLOGY STACK</span>
          <h2>Integrated Platform Stack</h2>
          <p>Industrial components operating together to guarantee systemic security.</p>
        </div>

        <div className="bento-grid">
          <div className="bento-card double-width">
            <div className="bento-icon-box bg-purple">
              <Icons.ShieldCheck />
            </div>
            <h3>ERC-721 Passports</h3>
            <p>Each registered cow acts as a non-fungible cryptographic asset, carrying ownership lineages, health status histories, and physical RFID cross-references.</p>
          </div>

          <div className="bento-card">
            <div className="bento-icon-box bg-blue">
              <Icons.Cpu />
            </div>
            <h3>Low-Power Edge Hardware</h3>
            <p>Continuous readings using ESP32 chips accompanied by temperature sensors and movement accelerators for real-time tracking.</p>
          </div>

          <div className="bento-card">
            <div className="bento-icon-box bg-green">
              <Icons.Radio />
            </div>
            <h3>Chainlink Keepers</h3>
            <p>Triggers immediate on-chain notifications and veterinary medical alerts when threshold limits are broken.</p>
          </div>

          <div className="bento-card double-width">
            <div className="bento-icon-box bg-red">
              <Icons.Database />
            </div>
            <h3>Decentralized Ledger Syncing (IPFS)</h3>
            <p>Heavy clinical medical data and veterinarian certifications are stored securely on IPFS with corresponding content hashes committed to Solidity mappings.</p>
          </div>
        </div>
      </section>

      <hr className="section-separator" />

      {/* Consumer Verification Area */}
      <section className="verification-section">
        <div className="verification-wrapper">
          <div className="verification-content">
            <span className="sub-header">END-TO-END TRACEABILITY</span>
            <h2>Consumer Verification Gateway</h2>
            <p>
              Consumers, slaughterhouses, and retail distributors verify animal status history by parsing quick-access certificates linked to our smart contract.
            </p>
            <button className="primary-action-btn" onClick={() => navigate('/verify-qr')}>
              Scan Certificate QR
            </button>
          </div>
          <div className="verification-graphic">
            <div className="qr-box">
              <div className="qr-scanner-line"></div>
              <span className="qr-placeholder">GENERIC ADDR</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="footer-top-area">
          <div className="footer-identity">
            <h3>SMART LIVESTOCK</h3>
            <p>Constructing decentralized trust lines for safe, disease-free food production lines across Rwandan provinces.</p>
          </div>
          <div className="footer-links-grid">
            <div className="footer-col">
              <h5>Contracts</h5>
              <a href="#">LivestockNFT.sol</a>
              <a href="#">AccessControl.sol</a>
              <a href="#">TelemetryHub.sol</a>
            </div>
            <div className="footer-col">
              <h5>Specs</h5>
              <a href="#">Sepolia Network</a>
              <a href="#">IPFS Storage</a>
              <a href="#">MQTT Broker</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-area">
          <p>© 2026 Smart Livestock Health and Traceability System.</p>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;