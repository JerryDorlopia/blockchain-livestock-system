import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';

// ============================================
// HEALTH RECORDS COMPONENT
// ============================================
function HealthRecords({ account }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('vaccinations');
  const [vaccinations, setVaccinations] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [livestockList, setLivestockList] = useState([]);
  const [vetsList, setVetsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVetDetailsModal, setShowVetDetailsModal] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [formData, setFormData] = useState({
    livestockId: '',
    vaccineName: '',
    batchNumber: '',
    manufacturer: '',
    expiryDate: '',
    dosage: '',
    route: 'INJECTION',
    diagnosis: '',
    medication: '',
    duration: '',
    purpose: '',
    validityDays: 365,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalTab, setModalTab] = useState('vaccinations'); // Track which tab the modal is in

  const { userRole, userData, isAdminUser } = useRole();
  const { showToast } = useToast();

  const isVet = userRole === 'vet' || userRole === 'admin';
  const isFarmer = userRole === 'farmer' || userRole === 'admin';
  const canViewRecords = isVet || isFarmer;
  const canAddRecords = isVet;

  // ============================================
  // LOAD VET NAMES FROM LOCALSTORAGE
  // ============================================
  const getVetName = (address) => {
    if (!address) return 'Unknown Vet';
    
    if (address.toLowerCase() === account?.toLowerCase()) {
      return 'You';
    }
    
    const savedData = localStorage.getItem('vets_data');
    if (savedData) {
      const allData = JSON.parse(savedData);
      const lowerAddr = address.toLowerCase();
      if (allData[lowerAddr]) {
        return allData[lowerAddr].name || 'Unknown Vet';
      }
    }
    
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      let livestock = [];
      if (canViewRecords) {
        const totalLivestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
        const total = totalLivestock.success ? Number(totalLivestock.data) : 0;
        
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
                  owner: info.data[2],
                  alive: info.data[3]
                });
              }
            }
          }
        } else {
          for (let i = 0; i < total; i++) {
            const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
            if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
              livestock.push({
                id: i,
                name: info.data[0] || `Livestock_${i}`,
                breed: info.data[1] || 'Unknown',
                owner: info.data[2],
                alive: info.data[3]
              });
            }
          }
        }
        
        setLivestockList(livestock);
      }

      const [vCount, tCount, cCount] = await Promise.all([
        safeContractCall(contracts.healthRecord, 'vCount'),
        safeContractCall(contracts.healthRecord, 'tCount'),
        safeContractCall(contracts.healthRecord, 'cCount')
      ]);

      const vCountNum = vCount.success ? Number(vCount.data) : 0;
      const tCountNum = tCount.success ? Number(tCount.data) : 0;
      const cCountNum = cCount.success ? Number(cCount.data) : 0;

      // Load vaccinations
      const vList = [];
      for (let i = 0; i < vCountNum; i++) {
        try {
          const [name, batch, date, expiry, livestockId, admin] = await Promise.all([
            safeContractCall(contracts.healthRecord, 'vName', i),
            safeContractCall(contracts.healthRecord, 'vBatch', i),
            safeContractCall(contracts.healthRecord, 'vDate', i),
            safeContractCall(contracts.healthRecord, 'vExpiry', i),
            safeContractCall(contracts.healthRecord, 'vLivestock', i),
            safeContractCall(contracts.healthRecord, 'vAdmin', i)
          ]);
          
          if (name.success) {
            const livId = livestockId.success ? Number(livestockId.data) : 0;
            if (userRole === 'farmer') {
              const isTheirLivestock = livestock.some(l => l.id === livId);
              if (!isTheirLivestock) continue;
            }
            vList.push({
              id: i,
              name: name.data || 'N/A',
              batch: batch.success ? batch.data : 'N/A',
              date: date.success ? new Date(Number(date.data) * 1000).toLocaleDateString() : 'N/A',
              expiry: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
              livestockId: livId,
              admin: admin.success ? admin.data : 'Unknown',
              adminName: getVetName(admin.success ? admin.data : null)
            });
          }
        } catch (err) {
          console.warn(`Error loading vaccination ${i}:`, err.message);
        }
      }
      setVaccinations(vList);

      // Load treatments
      const tList = [];
      for (let i = 0; i < tCountNum; i++) {
        try {
          const [diagnosis, medication, start, livestockId, prescriber, done] = await Promise.all([
            safeContractCall(contracts.healthRecord, 'tDiagnosis', i),
            safeContractCall(contracts.healthRecord, 'tMedication', i),
            safeContractCall(contracts.healthRecord, 'tStart', i),
            safeContractCall(contracts.healthRecord, 'tLivestock', i),
            safeContractCall(contracts.healthRecord, 'tPrescriber', i),
            safeContractCall(contracts.healthRecord, 'tDone', i)
          ]);
          
          if (diagnosis.success) {
            const livId = livestockId.success ? Number(livestockId.data) : 0;
            if (userRole === 'farmer') {
              const isTheirLivestock = livestock.some(l => l.id === livId);
              if (!isTheirLivestock) continue;
            }
            tList.push({
              id: i,
              diagnosis: diagnosis.data || 'N/A',
              medication: medication.success ? medication.data : 'N/A',
              startDate: start.success ? new Date(Number(start.data) * 1000).toLocaleDateString() : 'N/A',
              livestockId: livId,
              prescriber: prescriber.success ? prescriber.data : 'Unknown',
              prescriberName: getVetName(prescriber.success ? prescriber.data : null),
              completed: done.success ? done.data : false
            });
          }
        } catch (err) {
          console.warn(`Error loading treatment ${i}:`, err.message);
        }
      }
      setTreatments(tList);

      // Load certificates
      const cList = [];
      for (let i = 0; i < cCountNum; i++) {
        try {
          const [purpose, issue, expiry, livestockId, valid, hash, issuer] = await Promise.all([
            safeContractCall(contracts.healthRecord, 'cPurpose', i),
            safeContractCall(contracts.healthRecord, 'cIssue', i),
            safeContractCall(contracts.healthRecord, 'cExpiry', i),
            safeContractCall(contracts.healthRecord, 'cLivestock', i),
            safeContractCall(contracts.healthRecord, 'cValid', i),
            safeContractCall(contracts.healthRecord, 'cHash', i),
            safeContractCall(contracts.healthRecord, 'cIssuer', i)
          ]);
          
          if (purpose.success) {
            const livId = livestockId.success ? Number(livestockId.data) : 0;
            if (userRole === 'farmer') {
              const isTheirLivestock = livestock.some(l => l.id === livId);
              if (!isTheirLivestock) continue;
            }
            cList.push({
              id: i,
              purpose: purpose.data || 'N/A',
              issueDate: issue.success ? new Date(Number(issue.data) * 1000).toLocaleDateString() : 'N/A',
              expiryDate: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
              livestockId: livId,
              valid: valid.success ? valid.data : false,
              hash: hash.success ? hash.data : null,
              issuer: issuer.success ? issuer.data : 'Unknown',
              issuerName: getVetName(issuer.success ? issuer.data : null)
            });
          }
        } catch (err) {
          console.warn(`Error loading certificate ${i}:`, err.message);
        }
      }
      setCertificates(cList);

      const savedData = localStorage.getItem('vets_data');
      if (savedData) {
        const allData = JSON.parse(savedData);
        const vetList = [];
        for (const [address, data] of Object.entries(allData)) {
          vetList.push({
            address: address,
            name: data.name || 'Unknown',
            licenseNumber: data.licenseNumber || 'N/A',
            specialization: data.specialization || 'General',
            serviceArea: data.serviceArea || 'Not specified'
          });
        }
        setVetsList(vetList);
      }

    } catch (err) {
      console.error('Error loading health data:', err);
      setError(err.message);
      showToast('Failed to load health records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && canViewRecords) {
      loadData();
    }
  }, [account, canViewRecords]);

  // ============================================
  // VIEW VET DETAILS
  // ============================================
  const viewVetDetails = (address) => {
    const vet = vetsList.find(v => v.address.toLowerCase() === address?.toLowerCase());
    if (vet) {
      setSelectedVet(vet);
      setShowVetDetailsModal(true);
    } else {
      setSelectedVet({
        address: address,
        name: getVetName(address),
        licenseNumber: 'N/A',
        specialization: 'Unknown',
        serviceArea: 'Unknown'
      });
      setShowVetDetailsModal(true);
    }
  };

  // ============================================
  // OPEN ADD MODAL WITH SPECIFIC TAB
  // ============================================
  const openAddModal = (tab) => {
    setModalTab(tab || activeTab);
    setShowAddModal(true);
  };

  // ============================================
  // ADD VACCINATION
  // ============================================
  const handleAddVaccination = async (e) => {
    e.preventDefault();
    
    if (!formData.livestockId || !formData.vaccineName || !formData.batchNumber) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const expiryTimestamp = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
      
      const tx = await contracts.healthRecord.addVaccination(
        Number(formData.livestockId),
        formData.vaccineName,
        formData.batchNumber,
        expiryTimestamp
      );
      
      await tx.wait();
      
      setShowAddModal(false);
      setFormData({
        livestockId: '',
        vaccineName: '',
        batchNumber: '',
        manufacturer: '',
        expiryDate: '',
        dosage: '',
        route: 'INJECTION',
        diagnosis: '',
        medication: '',
        duration: '',
        purpose: '',
        validityDays: 365,
        notes: ''
      });
      await loadData();
      
      showToast('Vaccination recorded successfully!', 'success', 5000);
    } catch (err) {
      console.error('Error adding vaccination:', err);
      showToast('Failed to record vaccination: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // ADD TREATMENT
  // ============================================
  const handleAddTreatment = async (e) => {
    e.preventDefault();
    
    if (!formData.livestockId || !formData.diagnosis || !formData.medication) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const tx = await contracts.healthRecord.addTreatment(
        Number(formData.livestockId),
        formData.diagnosis,
        formData.medication
      );
      
      await tx.wait();
      
      setShowAddModal(false);
      setFormData({
        livestockId: '',
        vaccineName: '',
        batchNumber: '',
        manufacturer: '',
        expiryDate: '',
        dosage: '',
        route: 'INJECTION',
        diagnosis: '',
        medication: '',
        duration: '',
        purpose: '',
        validityDays: 365,
        notes: ''
      });
      await loadData();
      
      showToast('Treatment recorded successfully!', 'success', 5000);
    } catch (err) {
      console.error('Error adding treatment:', err);
      showToast('Failed to record treatment: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
      
      setShowAddModal(false);
      setFormData({
        livestockId: '',
        vaccineName: '',
        batchNumber: '',
        manufacturer: '',
        expiryDate: '',
        dosage: '',
        route: 'INJECTION',
        diagnosis: '',
        medication: '',
        duration: '',
        purpose: '',
        validityDays: 365,
        notes: ''
      });
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
  const handleViewCertificate = (certificate) => {
    navigate('/certificates', { 
      state: { 
        viewCertificate: certificate,
        from: 'health-records'
      } 
    });
  };

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canViewRecords) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only farmers and veterinarians can view health records.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container-centered">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading health records...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="health-records">
      <div className="page-header">
        <div className="header-left">
          <h1>Health Records</h1>
          <p className="page-subtitle">Manage animal health records, vaccinations, and treatments</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Livestock: {livestockList.length}</span>
            <span className="debug-badge">Vaccinations: {vaccinations.length}</span>
            <span className="debug-badge">Treatments: {treatments.length}</span>
            <span className="debug-badge">Certificates: {certificates.length}</span>
          </div>
        </div>
        <div className="header-right">
          {canAddRecords && (
            <>
              <button 
                className="btn-primary"
                onClick={() => openAddModal('vaccinations')}
                style={{ background: '#4CAF50' }}
              >
                💉 Add Vaccination
              </button>
              <button 
                className="btn-primary"
                onClick={() => openAddModal('treatments')}
                style={{ background: '#FF9800' }}
              >
                💊 Add Treatment
              </button>
              <button 
                className="btn-primary"
                onClick={() => openAddModal('certificates')}
                style={{ background: '#2196F3' }}
              >
                📋 Issue Certificate
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={loadData}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>💉 Vaccinations</h3>
          <p className="stat-number">{vaccinations.length}</p>
          <span className="stat-label">Total vaccines given</span>
        </div>
        <div className="stat-card">
          <h3>💊 Treatments</h3>
          <p className="stat-number">{treatments.length}</p>
          <span className="stat-label">Total treatments</span>
        </div>
        <div className="stat-card">
          <h3>📋 Certificates</h3>
          <p className="stat-number">{certificates.length}</p>
          <span className="stat-label">Issued certificates</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'vaccinations' ? 'active' : ''}`}
          onClick={() => setActiveTab('vaccinations')}
        >
          💉 Vaccinations ({vaccinations.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'treatments' ? 'active' : ''}`}
          onClick={() => setActiveTab('treatments')}
        >
          💊 Treatments ({treatments.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`}
          onClick={() => setActiveTab('certificates')}
        >
          📋 Certificates ({certificates.length})
        </button>
      </div>

      {/* Vaccinations Tab */}
      {activeTab === 'vaccinations' && (
        <div className="tab-content">
          <div className="table-container">
            <table className="health-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vaccine</th>
                  <th>Batch</th>
                  <th>Livestock</th>
                  <th>Date</th>
                  <th>Expiry</th>
                  <th>Veterinarian</th>
                </tr>
              </thead>
              <tbody>
                {vaccinations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <div className="empty-state-content">
                        <span className="empty-icon">💉</span>
                        <p>No vaccinations recorded yet</p>
                        {canAddRecords && (
                          <button 
                            className="btn-primary"
                            onClick={() => openAddModal('vaccinations')}
                          >
                            Record First Vaccination
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  vaccinations.map((v) => (
                    <tr key={v.id}>
                      <td>{v.id}</td>
                      <td>{v.name}</td>
                      <td>{v.batch}</td>
                      <td>#{v.livestockId}</td>
                      <td>{v.date}</td>
                      <td>{v.expiry}</td>
                      <td>
                        <button 
                          className="vet-link"
                          onClick={() => viewVetDetails(v.admin)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          👨‍⚕️ {v.adminName}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Treatments Tab */}
      {activeTab === 'treatments' && (
        <div className="tab-content">
          <div className="table-container">
            <table className="health-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Diagnosis</th>
                  <th>Medication</th>
                  <th>Livestock</th>
                  <th>Date</th>
                  <th>Veterinarian</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {treatments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      <div className="empty-state-content">
                        <span className="empty-icon">💊</span>
                        <p>No treatments recorded yet</p>
                        {canAddRecords && (
                          <button 
                            className="btn-primary"
                            onClick={() => openAddModal('treatments')}
                          >
                            Record First Treatment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  treatments.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.diagnosis}</td>
                      <td>{t.medication}</td>
                      <td>#{t.livestockId}</td>
                      <td>{t.startDate}</td>
                      <td>
                        <button 
                          className="vet-link"
                          onClick={() => viewVetDetails(t.prescriber)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          👨‍⚕️ {t.prescriberName}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${t.completed ? 'active' : 'inactive'}`}>
                          {t.completed ? '✅ Completed' : '⏳ In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="tab-content">
          <div className="table-container">
            <table className="health-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Purpose</th>
                  <th>Livestock</th>
                  <th>Issue Date</th>
                  <th>Expiry</th>
                  <th>Issued By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <div className="empty-state-content">
                        <span className="empty-icon">📋</span>
                        <p>No certificates issued yet</p>
                        {canAddRecords && (
                          <button 
                            className="btn-primary"
                            onClick={() => openAddModal('certificates')}
                          >
                            Issue First Certificate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  certificates.map((c) => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td>{c.purpose}</td>
                      <td>#{c.livestockId}</td>
                      <td>{c.issueDate}</td>
                      <td>{c.expiryDate}</td>
                      <td>
                        <button 
                          className="vet-link"
                          onClick={() => viewVetDetails(c.issuer)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          👨‍⚕️ {c.issuerName}
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${c.valid ? 'active' : 'inactive'}`}>
                          {c.valid ? '✅ Valid' : '❌ Expired'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewCertificate(c)}
                        >
                          👁️ View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && canAddRecords && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalTab === 'vaccinations' && '💉 Add Vaccination'}
                {modalTab === 'treatments' && '💊 Add Treatment'}
                {modalTab === 'certificates' && '📋 Issue Certificate'}
              </h2>
              <div className="modal-subtitle">
                {modalTab === 'vaccinations' && 'Record a new vaccination for a livestock'}
                {modalTab === 'treatments' && 'Record a new treatment for a livestock'}
                {modalTab === 'certificates' && 'Issue a new health certificate for a livestock'}
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={
              modalTab === 'vaccinations' ? handleAddVaccination :
              modalTab === 'treatments' ? handleAddTreatment :
              handleIssueCertificate
            }>
              <div className="modal-body">
                {/* Livestock Selection */}
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

                {/* Vaccination Form */}
                {modalTab === 'vaccinations' && (
                  <>
                    <div className="form-group">
                      <label>Vaccine Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Foot-and-Mouth Vaccine"
                        value={formData.vaccineName}
                        onChange={(e) => setFormData({...formData, vaccineName: e.target.value})}
                        required
                        className="styled-input"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Batch Number *</label>
                        <input
                          type="text"
                          placeholder="BATCH-2024-001"
                          value={formData.batchNumber}
                          onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                          required
                          className="styled-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Manufacturer</label>
                        <input
                          type="text"
                          placeholder="Manufacturer name"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                          className="styled-input"
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Expiry Date *</label>
                        <input
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                          required
                          className="styled-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Dosage</label>
                        <input
                          type="text"
                          placeholder="e.g., 5ml"
                          value={formData.dosage}
                          onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                          className="styled-input"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Route</label>
                      <select
                        value={formData.route}
                        onChange={(e) => setFormData({...formData, route: e.target.value})}
                        className="styled-select"
                      >
                        <option value="INJECTION">Injection</option>
                        <option value="ORAL">Oral</option>
                        <option value="TOPICAL">Topical</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Treatment Form */}
                {modalTab === 'treatments' && (
                  <>
                    <div className="form-group">
                      <label>Diagnosis *</label>
                      <input
                        type="text"
                        placeholder="e.g., Fever, Infection"
                        value={formData.diagnosis}
                        onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                        required
                        className="styled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Medication *</label>
                      <input
                        type="text"
                        placeholder="e.g., Antibiotics 10ml"
                        value={formData.medication}
                        onChange={(e) => setFormData({...formData, medication: e.target.value})}
                        required
                        className="styled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g., 10ml daily"
                        value={formData.dosage}
                        onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                        className="styled-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g., 7 days"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        className="styled-input"
                      />
                    </div>
                  </>
                )}

                {/* Certificate Form */}
                {modalTab === 'certificates' && (
                  <>
                    <div className="form-group">
                      <label>Purpose *</label>
                      <select
                        value={formData.purpose}
                        onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                        required
                        className="styled-select"
                      >
                        <option value="">Select purpose</option>
                        <option value="EXPORT">Export</option>
                        <option value="TRANSPORT">Transport</option>
                        <option value="SLAUGHTER">Slaughter</option>
                        <option value="BREEDING">Breeding</option>
                        <option value="HEALTH">Health Check</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Validity (days)</label>
                      <input
                        type="number"
                        value={formData.validityDays}
                        onChange={(e) => setFormData({...formData, validityDays: Number(e.target.value)})}
                        min="1"
                        max="365"
                        className="styled-input"
                      />
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Additional notes..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="styled-textarea"
                  />
                </div>

                <div className="verification-preview" style={{ marginTop: '12px' }}>
                  <p>👨‍⚕️ <strong>You are recording this as:</strong> {getVetName(account)}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    Your wallet address will be stored with this record
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 
                    modalTab === 'vaccinations' ? '💉 Record Vaccination' :
                    modalTab === 'treatments' ? '💊 Record Treatment' :
                    '📋 Issue Certificate'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vet Details Modal */}
      {showVetDetailsModal && selectedVet && (
        <div className="modal-overlay" onClick={() => setShowVetDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👨‍⚕️ Veterinarian Details</h2>
              <button className="modal-close" onClick={() => setShowVetDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedVet.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value address-full">{selectedVet.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">License Number:</span>
                <span className="detail-value">{selectedVet.licenseNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Specialization:</span>
                <span className="detail-value">{selectedVet.specialization}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Service Area:</span>
                <span className="detail-value">{selectedVet.serviceArea}</span>
              </div>
              {selectedVet.address?.toLowerCase() === account?.toLowerCase() && (
                <div className="detail-row" style={{ background: '#e8f5e9', padding: '12px', borderRadius: '8px' }}>
                  <span className="detail-label" style={{ color: '#2e7d32' }}>👤 This is you!</span>
                  <span className="detail-value" style={{ color: '#2e7d32' }}>Currently logged in</span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowVetDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthRecords;