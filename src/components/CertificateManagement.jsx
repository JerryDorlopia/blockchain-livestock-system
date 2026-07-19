import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

// ============================================
// SKELETON LOADER FOR CERTIFICATES
// ============================================
const CertificateSkeletonLoader = () => {
  return (
    <div className="certificate-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-actions">
          <div className="skeleton-btn"></div>
          <div className="skeleton-btn"></div>
        </div>
      </div>
      <div className="skeleton-stats-grid">
        <div className="skeleton-stat-card"></div>
        <div className="skeleton-stat-card"></div>
        <div className="skeleton-stat-card"></div>
      </div>
      <div className="skeleton-cards-grid">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-cert-card"></div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CERTIFICATE GENERATOR COMPONENT
// ============================================
function CertificateGenerator({ certificate, onClose, onVerify }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef(null);
  const isGeneratingRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (certificate && !isGeneratingRef.current) {
      generateQRCode();
    }
    return () => {
      isGeneratingRef.current = false;
    };
  }, [certificate]);

  const generateQRCode = async () => {
    if (isGeneratingRef.current || !certificate) return;
    isGeneratingRef.current = true;
    
    try {
      setIsGenerating(true);
      
      const verificationData = {
        id: certificate.id,
        livestockId: certificate.livestockId,
        purpose: certificate.purpose,
        issueDate: certificate.issueDate,
        expiryDate: certificate.expiryDate,
        hash: certificate.hash || `0x${Date.now().toString(16)}`,
        network: 'Sepolia',
        contract: CONTRACT_ADDRESSES.healthRecord
      };

      const qrData = JSON.stringify(verificationData);
      const qrImage = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#0F4C3A',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
      try {
        const fallbackData = `Certificate #${certificate.id} - Livestock #${certificate.livestockId}`;
        const qrImage = await QRCode.toDataURL(fallbackData, {
          width: 200,
          margin: 2
        });
        setQrCodeDataUrl(qrImage);
      } catch (fallbackError) {
        console.error('Fallback QR generation failed:', fallbackError);
      }
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `Certificate_${certificate.id}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading certificate:', error);
      window.print();
    }
  };

  const printCertificate = () => {
    window.print();
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setIsClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      setIsClosing(false);
    }, 300);
  };

  if (!certificate) return null;

  return (
    <div className="certificate-modal-overlay" onClick={handleClose}>
      <div className={`certificate-modal-content ${isClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="certificate-modal-header">
          <h2>Certificate</h2>
          <div className="certificate-modal-actions">
            <button className="btn-secondary" onClick={downloadCertificate}>
              Download
            </button>
            <button className="btn-secondary" onClick={printCertificate}>
              Print
            </button>
            {onVerify && (
              <button className="btn-primary" onClick={onVerify}>
                Verify
              </button>
            )}
            <button className="modal-close" onClick={handleClose}>✕</button>
          </div>
        </div>

        <div className="certificate-container" ref={certificateRef}>
          <div className="certificate-border">
            <div className="certificate-inner-border">
              <div className="certificate-header">
                <div className="certificate-logo">
                  <span className="cert-logo-icon">🐄</span>
                  <div className="cert-logo-text">
                    <h1>Livestock Health</h1>
                    <p>Certificate of Health &amp; Compliance</p>
                  </div>
                </div>
                <div className="certificate-badge">
                  <span className="badge-cert">CERTIFICATE</span>
                  <span className="badge-id"># {String(certificate.id).padStart(4, '0')}</span>
                </div>
              </div>

              <div className="certificate-title-section">
                <h2>HEALTH CERTIFICATE</h2>
                <div className="certificate-divider"></div>
                <p className="certificate-subtitle">
                  This certificate confirms the health status of the livestock
                </p>
              </div>

              <div className="certificate-body">
                <div className="certificate-details-grid">
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Certificate ID</span>
                    <span className="cert-detail-value"># {String(certificate.id).padStart(4, '0')}</span>
                  </div>
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Livestock ID</span>
                    <span className="cert-detail-value"># {certificate.livestockId}</span>
                  </div>
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Purpose</span>
                    <span className="cert-detail-value">{certificate.purpose || 'Health Check'}</span>
                  </div>
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Issue Date</span>
                    <span className="cert-detail-value">{certificate.issueDate || new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Expiry Date</span>
                    <span className="cert-detail-value">{certificate.expiryDate || 'N/A'}</span>
                  </div>
                  <div className="cert-detail-item">
                    <span className="cert-detail-label">Status</span>
                    <span className={`cert-detail-value ${certificate.valid ? 'status-valid' : 'status-expired'}`}>
                      {certificate.valid ? 'Valid' : 'Expired'}
                    </span>
                  </div>
                </div>

                <div className="certificate-hash-section">
                  <span className="hash-label">Blockchain Verification</span>
                  <div className="hash-value">
                    <code>{certificate.hash || '0x0000000000000000000000000000000000000000000000000000000000000000'}</code>
                  </div>
                  <p className="hash-note">
                    Verify this certificate on the blockchain using the hash above
                  </p>
                </div>

                <div className="certificate-qr-section">
                  <div className="qr-container">
                    {isGenerating ? (
                      <div className="qr-loading">Generating QR...</div>
                    ) : qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR Code" className="qr-code-image" />
                    ) : (
                      <div className="qr-placeholder">QR Code</div>
                    )}
                  </div>
                  <div className="qr-info">
                    <p className="qr-label">Scan to Verify</p>
                    <p className="qr-sub-label">Use any QR scanner to verify authenticity</p>
                  </div>
                </div>
              </div>

              <div className="certificate-footer">
                <div className="cert-footer-left">
                  <div className="cert-signature">
                    <div className="signature-line"></div>
                    <p>Authorized Signature</p>
                  </div>
                  <div className="cert-stamp">
                    <div className="stamp-circle">
                      <span>✓</span>
                    </div>
                    <p>Official Stamp</p>
                  </div>
                </div>
                <div className="cert-footer-right">
                  <p className="cert-issued-by">
                    Issued by: <strong>Livestock Health System</strong>
                  </p>
                  <p className="cert-network">
                    Network: <strong>Sepolia</strong>
                  </p>
                  <p className="cert-contract">
                    Contract: <code>{CONTRACT_ADDRESSES.healthRecord.slice(0, 10)}...{CONTRACT_ADDRESSES.healthRecord.slice(-8)}</code>
                  </p>
                </div>
              </div>

              <div className="certificate-watermark">
                <span>✓</span>
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-modal-footer">
          <p className="cert-footer-note">
            This certificate is digitally signed and verified on the Ethereum blockchain.
            Any alterations will invalidate this certificate.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CERTIFICATE LIST COMPONENT
// ============================================
function CertificateList({ certificates, onViewCertificate, onVerifyCertificate }) {
  return (
    <div className="certificate-list">
      {certificates.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <p>No certificates issued yet</p>
        </div>
      ) : (
        <div className="certificate-cards-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className={`certificate-card ${cert.valid ? 'valid' : 'expired'}`}>
              <div className="cert-card-header">
                <span className="cert-card-id"># {String(cert.id).padStart(4, '0')}</span>
                <span className={`cert-card-status ${cert.valid ? 'valid' : 'expired'}`}>
                  {cert.valid ? 'Valid' : 'Expired'}
                </span>
              </div>
              <div className="cert-card-body">
                <p><strong>Livestock:</strong> #{cert.livestockId}</p>
                <p><strong>Purpose:</strong> {cert.purpose || 'Health Check'}</p>
                <p><strong>Issued:</strong> {cert.issueDate}</p>
                <p><strong>Expires:</strong> {cert.expiryDate}</p>
                <div className="cert-card-hash">
                  <code>{cert.hash ? cert.hash.slice(0, 16) : 'N/A'}...</code>
                </div>
              </div>
              <div className="cert-card-actions">
                <button 
                  className="action-btn view"
                  onClick={() => onViewCertificate(cert)}
                >
                  View
                </button>
                {!cert.valid && onVerifyCertificate && (
                  <button 
                    className="action-btn verify"
                    onClick={() => onVerifyCertificate(cert.id)}
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN CERTIFICATE MANAGEMENT COMPONENT - FULLY FIXED
// ============================================
function CertificateManagement({ account }) {
  const location = useLocation();
  const [certificates, setCertificates] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [livestockList, setLivestockList] = useState([]);
  const [formData, setFormData] = useState({
    livestockId: '',
    purpose: 'HEALTH',
    validityDays: 365
  });
  const [submitting, setSubmitting] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasProcessedNav, setHasProcessedNav] = useState(false);

  const { userRole } = useRole();
  const { showToast } = useToast();

  const canIssueCertificates = userRole === 'vet' || userRole === 'admin';
  const canViewCertificates = userRole === 'farmer' || userRole === 'vet' || userRole === 'admin';

  // ============================================
  // CLOSE CERTIFICATE MODAL - COMPLETELY CLEARS STATE
  // ============================================
  const closeCertificateModal = useCallback(() => {
    setShowCertificateModal(false);
    setSelectedCertificate(null);
    // Reset the navigation flag when closing
    setHasProcessedNav(false);
  }, []);

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = useCallback(async () => {
    if (!account || !canViewCertificates) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contracts = await getContracts();

      let livestock = [];
      if (userRole === 'farmer') {
        const farmerLivestock = await safeContractCall(contracts.livestockRegistry, 'getFarmerLivestock', account);
        if (farmerLivestock.success && farmerLivestock.data.length > 0) {
          for (const id of farmerLivestock.data) {
            const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', id);
            if (info.success) {
              livestock.push({
                id: Number(id),
                name: info.data[0] || `Livestock_${id}`,
                breed: info.data[1] || 'Unknown',
                alive: info.data[3]
              });
            }
          }
        }
        setLivestockList(livestock);
      }

      const cCount = await safeContractCall(contracts.healthRecord, 'cCount');
      const count = cCount.success ? Number(cCount.data) : 0;
      
      const cList = [];
      const startIndex = Math.max(0, count - 50);
      
      for (let i = startIndex; i < count; i++) {
        try {
          const purpose = await safeContractCall(contracts.healthRecord, 'cPurpose', i);
          if (!purpose.success) continue;
          
          const issue = await safeContractCall(contracts.healthRecord, 'cIssue', i);
          const expiry = await safeContractCall(contracts.healthRecord, 'cExpiry', i);
          const livestockId = await safeContractCall(contracts.healthRecord, 'cLivestock', i);
          const valid = await safeContractCall(contracts.healthRecord, 'cValid', i);
          const hash = await safeContractCall(contracts.healthRecord, 'cHash', i);
          const issuer = await safeContractCall(contracts.healthRecord, 'cIssuer', i);

          const livestockNum = livestockId.success ? Number(livestockId.data) : 0;
          
          if (userRole === 'farmer') {
            const isTheirLivestock = livestock.some(l => l.id === livestockNum);
            if (!isTheirLivestock) continue;
          }
          
          let issuerName = 'Unknown Vet';
          if (issuer.success && issuer.data) {
            const savedData = localStorage.getItem('vets_data');
            if (savedData) {
              const allData = JSON.parse(savedData);
              const lowerAddr = issuer.data.toLowerCase();
              if (allData[lowerAddr]) {
                issuerName = allData[lowerAddr].name || 'Unknown Vet';
              }
            }
          }
          
          cList.push({
            id: i,
            purpose: purpose.data || 'N/A',
            issueDate: issue.success ? new Date(Number(issue.data) * 1000).toLocaleDateString() : 'N/A',
            expiryDate: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
            livestockId: livestockNum,
            valid: valid.success ? valid.data : false,
            hash: hash.success ? hash.data : '0x000...',
            issuer: issuer.success ? issuer.data : 'Unknown',
            issuerName: issuerName
          });
        } catch (err) {
          console.warn(`Error loading certificate ${i}:`, err.message);
        }
      }
      
      setCertificates(cList);
      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error loading data:', err);
      showToast('Failed to load certificates: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [account, userRole, canViewCertificates, showToast]);

  // ============================================
  // LOAD DATA ON MOUNT - ONLY ONCE
  // ============================================
  useEffect(() => {
    if (account && canViewCertificates && !isDataLoaded) {
      loadData();
    }
  }, [account, canViewCertificates, isDataLoaded, loadData]);

  // ============================================
  // CHECK FOR CERTIFICATE FROM NAVIGATION - FIXED
  // ============================================
  useEffect(() => {
    // Only process once
    if (hasProcessedNav) return;
    
    const certData = location.state?.viewCertificate;
    if (!certData) return;
    
    // Set flag to prevent re-processing
    setHasProcessedNav(true);
    
    const formattedCert = {
      id: certData.id || 0,
      livestockId: certData.livestockId || 0,
      purpose: certData.purpose || 'Health Check',
      issueDate: certData.issueDate || new Date().toLocaleDateString(),
      expiryDate: certData.expiryDate || 'N/A',
      valid: certData.valid !== undefined ? certData.valid : true,
      hash: certData.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      issuer: certData.issuer || account,
      issuerName: certData.issuerName || 'Unknown'
    };
    
    setSelectedCertificate(formattedCert);
    setShowCertificateModal(true);
    
    // Clear the location state to prevent re-opening
    window.history.replaceState({}, document.title);
    showToast('Certificate loaded successfully!', 'success', 3000);
    
  }, [location.state, account, showToast, hasProcessedNav]);

  // ============================================
  // ISSUE CERTIFICATE
  // ============================================
  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    
    if (!formData.livestockId || !formData.purpose) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const tx = await contracts.healthRecord.addCertificate(
        Number(formData.livestockId),
        formData.purpose,
        `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        Number(formData.validityDays)
      );
      
      await tx.wait();
      
      setShowIssueModal(false);
      setFormData({
        livestockId: '',
        purpose: 'HEALTH',
        validityDays: 365
      });
      
      setIsDataLoaded(false);
      await loadData();
      
      showToast('Certificate issued successfully!', 'success', 5000);
    } catch (err) {
      console.error('Error issuing certificate:', err);
      showToast('Failed to issue certificate: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // VIEW CERTIFICATE
  // ============================================
  const handleViewCertificate = (cert) => {
    // Reset navigation flag when viewing from list
    setHasProcessedNav(false);
    
    const certData = {
      id: cert.id,
      livestockId: cert.livestockId,
      purpose: cert.purpose || 'Health Check',
      issueDate: cert.issueDate || new Date().toLocaleDateString(),
      expiryDate: cert.expiryDate || 'N/A',
      valid: cert.valid !== undefined ? cert.valid : true,
      hash: cert.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
      issuer: cert.issuer || account,
      issuerName: cert.issuerName || 'Unknown'
    };
    
    setSelectedCertificate(certData);
    setShowCertificateModal(true);
  };

  // ============================================
  // VERIFY CERTIFICATE
  // ============================================
  const handleVerifyCertificate = async (certId) => {
    try {
      const contracts = await getContracts();
      const isValid = await safeContractCall(contracts.healthRecord, 'isValidCert', certId);
      if (isValid.success && isValid.data) {
        showToast('Certificate is valid on the blockchain!', 'success', 4000);
      } else {
        showToast('Certificate is invalid or expired.', 'error', 4000);
      }
      
      setIsDataLoaded(false);
      await loadData();
    } catch (err) {
      console.error('Error verifying certificate:', err);
      showToast('Failed to verify certificate: ' + err.message, 'error');
    }
  };

  if (!canViewCertificates) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only farmers and veterinarians can view certificates.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return <CertificateSkeletonLoader />;
  }

  return (
    <div className="certificate-management">
      <div className="page-header">
        <div className="header-left">
          <h1>Certificates</h1>
          <p className="page-subtitle">Manage and verify livestock health certificates</p>
        </div>
        <div className="header-right">
          {canIssueCertificates && (
            <button 
              className="btn-primary"
              onClick={() => setShowIssueModal(true)}
            >
              Issue Certificate
            </button>
          )}
          <button 
            className="btn-secondary" 
            onClick={() => {
              setIsDataLoaded(false);
              loadData();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
          <p className="stat-number">{certificates.length}</p>
          <span className="stat-label">Certificates issued</span>
        </div>
        <div className="stat-card">
          <h3>Valid</h3>
          <p className="stat-number" style={{ color: '#4CAF50' }}>
            {certificates.filter(c => c.valid).length}
          </p>
          <span className="stat-label">Active certificates</span>
        </div>
        <div className="stat-card">
          <h3>Expired</h3>
          <p className="stat-number" style={{ color: '#F44336' }}>
            {certificates.filter(c => !c.valid).length}
          </p>
          <span className="stat-label">Expired certificates</span>
        </div>
      </div>

      <CertificateList 
        certificates={certificates}
        onViewCertificate={handleViewCertificate}
        onVerifyCertificate={canIssueCertificates ? handleVerifyCertificate : null}
      />

      {showCertificateModal && selectedCertificate && (
        <CertificateGenerator
          certificate={selectedCertificate}
          onClose={closeCertificateModal}
          onVerify={canIssueCertificates ? () => handleVerifyCertificate(selectedCertificate.id) : null}
        />
      )}

      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Issue Certificate</h2>
              <button className="modal-close" onClick={() => setShowIssueModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueCertificate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Livestock *</label>
                  <select
                    value={formData.livestockId}
                    onChange={(e) => setFormData({...formData, livestockId: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="">Select an animal</option>
                    {livestockList.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.breed}) {l.alive ? '✅' : '💀'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Purpose *</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="HEALTH">Health Check</option>
                    <option value="EXPORT">Export</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="SLAUGHTER">Slaughter</option>
                    <option value="BREEDING">Breeding</option>
                    <option value="VACCINATION">Vaccination</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Validity (days)</label>
                  <input
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({...formData, validityDays: Number(e.target.value)})}
                    min="1"
                    max="730"
                    className="styled-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowIssueModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Issuing...' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CertificateManagement;