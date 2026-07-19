import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, getAllSlaughterhouses, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';

// ============================================
// SLAUGHTERHOUSE MANAGEMENT COMPONENT
// ============================================
function SlaughterhouseManagement({ account }) {
  const [slaughterhouses, setSlaughterhouses] = useState([]);
  const [livestockList, setLivestockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSlaughterModal, setShowSlaughterModal] = useState(false);
  const [selectedSlaughterhouse, setSelectedSlaughterhouse] = useState(null);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    name: '',
    location: '',
    licenseNumber: '',
    phone: '',
    email: '',
    capacity: '',
    notes: ''
  });
  const [slaughterForm, setSlaughterForm] = useState({
    livestockId: '',
    method: 'Humane',
    purpose: 'Meat Production',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const { userRole, isAdminUser } = useRole();
  const { showToast } = useToast();

  const canManage = userRole === 'admin' || userRole === 'regulator';
  const canSlaughter = userRole === 'admin' || userRole === 'slaughterhouse';

  // ============================================
  // LOAD DATA
  // ============================================
  const loadSlaughterhouses = async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get all slaughterhouses from contract and localStorage
      const shList = await getAllSlaughterhouses();
      console.log('🏭 Slaughterhouses loaded:', shList);
      
      setSlaughterhouses(shList);
      setStats({
        total: shList.length,
        active: shList.filter(s => s.status === 'active').length,
        inactive: shList.filter(s => s.status !== 'active').length
      });

      // Load livestock for slaughter dropdown
      await loadLivestock();

    } catch (err) {
      console.error('Error loading slaughterhouses:', err);
      setError(err.message);
      showToast('Failed to load slaughterhouses: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLivestock = async () => {
    try {
      const contracts = await getContracts();
      const totalLivestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
      const total = totalLivestock.success ? Number(totalLivestock.data) : 0;
      
      const livestock = [];
      for (let i = 0; i < total; i++) {
        const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
        if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
          // Only show alive livestock for slaughter
          if (info.data[3] === true) {
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
      console.log('🐄 Alive livestock for slaughter:', livestock.length);
    } catch (err) {
      console.error('Error loading livestock:', err);
    }
  };

  useEffect(() => {
    if (account) {
      loadSlaughterhouses();
    }
  }, [account]);

  // ============================================
  // REGISTER SLAUGHTERHOUSE
  // ============================================
  const handleRegisterSlaughterhouse = async (e) => {
    e.preventDefault();

    if (!formData.address || !formData.address.startsWith('0x') || formData.address.length !== 42) {
      showToast('Please enter a valid Ethereum address (0x followed by 40 characters)', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Please enter a slaughterhouse name.', 'error');
      return;
    }

    if (!formData.location.trim()) {
      showToast('Please enter a location.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();

      // Check if already registered in contract
      const isRegistered = await safeContractCall(
        contracts.traceabilityManager, 
        'isSlaughterhouseRegistered', 
        formData.address
      );
      
      if (isRegistered.success && isRegistered.data) {
        showToast('This address is already registered as a slaughterhouse.', 'error');
        setSubmitting(false);
        return;
      }

      // Register the slaughterhouse on blockchain
      const tx = await contracts.traceabilityManager.registerSlaughterhouse(formData.address);
      await tx.wait();

      // Save details to localStorage
      const shData = {
        name: formData.name,
        location: formData.location,
        licenseNumber: formData.licenseNumber || 'N/A',
        phone: formData.phone || 'N/A',
        email: formData.email || 'N/A',
        capacity: formData.capacity || 'N/A',
        status: 'active',
        livestockProcessed: 0,
        registeredDate: new Date().toLocaleDateString(),
        notes: formData.notes || ''
      };

      const savedData = localStorage.getItem('slaughterhouse_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      allData[formData.address.toLowerCase()] = shData;
      localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));

      // Add to list
      const newSlaughterhouse = {
        address: formData.address,
        ...shData
      };

      setSlaughterhouses(prev => [...prev, newSlaughterhouse]);
      setStats(prev => ({
        total: prev.total + 1,
        active: prev.active + 1,
        inactive: prev.inactive
      }));

      setShowRegisterModal(false);
      setFormData({
        address: '',
        name: '',
        location: '',
        licenseNumber: '',
        phone: '',
        email: '',
        capacity: '',
        notes: ''
      });

      showToast(`Slaughterhouse "${formData.name}" registered successfully!`, 'success', 5000);

    } catch (err) {
      console.error('Error registering slaughterhouse:', err);
      
      let errorMessage = 'Failed to register slaughterhouse.';
      if (err.message && err.message.includes('Already')) {
        errorMessage = 'This address is already registered as a slaughterhouse.';
      } else if (err.message && err.message.includes('Not authorized')) {
        errorMessage = 'You do not have permission to register slaughterhouses.';
      } else if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          errorMessage = match[1];
        }
      }
      showToast(errorMessage, 'error', 6000);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RECORD SLAUGHTER - UPDATED TO MARK LIVESTOCK AS DECEASED
  // ============================================
  const handleRecordSlaughter = async (e) => {
    e.preventDefault();

    if (!slaughterForm.livestockId) {
      showToast('Please select a livestock to slaughter', 'error');
      return;
    }

    if (!selectedSlaughterhouse) {
      showToast('Please select a slaughterhouse', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();

      // Step 1: Record the slaughter in the traceability manager
      console.log(`📝 Recording slaughter of livestock #${slaughterForm.livestockId}`);
      
      // Check if the contract has a method to record slaughter
      let tx;
      try {
        tx = await contracts.traceabilityManager.recordSlaughter(
          Number(slaughterForm.livestockId),
          selectedSlaughterhouse.address,
          slaughterForm.method || 'Humane',
          slaughterForm.purpose || 'Meat Production',
          slaughterForm.notes || ''
        );
        await tx.wait();
        console.log('✅ Slaughter recorded in traceability');
      } catch (err) {
        // Try alternative method signature
        console.warn('Trying alternative method signature...');
        tx = await contracts.traceabilityManager.recordSlaughter(
          Number(slaughterForm.livestockId),
          slaughterForm.method || 'Humane',
          slaughterForm.purpose || 'Meat Production'
        );
        await tx.wait();
        console.log('✅ Slaughter recorded in traceability');
      }

      // Step 2: Mark the livestock as deceased
      console.log(`💀 Marking livestock #${slaughterForm.livestockId} as deceased...`);
      
      try {
        const updateTx = await contracts.livestockRegistry.updateLivestockStatus(
          Number(slaughterForm.livestockId),
          false // Set alive to false
        );
        await updateTx.wait();
        console.log(`✅ Livestock #${slaughterForm.livestockId} marked as deceased`);
      } catch (err) {
        console.warn('Could not update livestock status automatically:', err);
        // Try alternative method if available
        try {
          const updateTx = await contracts.livestockRegistry.setLivestockAlive(
            Number(slaughterForm.livestockId),
            false
          );
          await updateTx.wait();
          console.log(`✅ Livestock #${slaughterForm.livestockId} marked as deceased via alternative method`);
        } catch (err2) {
          console.error('Failed to update livestock status:', err2);
          // Store the slaughter record and update status in localStorage
          const savedSlaughter = localStorage.getItem('slaughter_records');
          const allSlaughter = savedSlaughter ? JSON.parse(savedSlaughter) : [];
          allSlaughter.push({
            livestockId: Number(slaughterForm.livestockId),
            slaughterhouse: selectedSlaughterhouse.address,
            method: slaughterForm.method,
            purpose: slaughterForm.purpose,
            notes: slaughterForm.notes,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('slaughter_records', JSON.stringify(allSlaughter));
          
          // Also update livestock status in localStorage
          const savedLivestock = localStorage.getItem('livestock_data');
          if (savedLivestock) {
            const allLivestock = JSON.parse(savedLivestock);
            if (allLivestock[slaughterForm.livestockId]) {
              allLivestock[slaughterForm.livestockId].alive = false;
              localStorage.setItem('livestock_data', JSON.stringify(allLivestock));
            }
          }
          showToast('⚠️ Slaughter recorded but status update failed. Please check manually.', 'warning', 5000);
        }
      }

      // Step 3: Update the slaughterhouse processed count
      const savedData = localStorage.getItem('slaughterhouse_data');
      if (savedData) {
        const allData = JSON.parse(savedData);
        const shKey = selectedSlaughterhouse.address.toLowerCase();
        if (allData[shKey]) {
          allData[shKey].livestockProcessed = (allData[shKey].livestockProcessed || 0) + 1;
          localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));
        }
      }

      showToast(`✅ Livestock #${slaughterForm.livestockId} slaughtered and marked as deceased!`, 'success', 5000);
      
      // Refresh data
      await loadSlaughterhouses();
      await loadLivestock();
      
      setShowSlaughterModal(false);
      setSelectedLivestock(null);
      setSlaughterForm({
        livestockId: '',
        method: 'Humane',
        purpose: 'Meat Production',
        notes: ''
      });

    } catch (err) {
      console.error('Error recording slaughter:', err);
      showToast('❌ Failed to record slaughter: ' + err.message, 'error', 6000);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // UPDATE SLAUGHTERHOUSE
  // ============================================
  const handleUpdateSlaughterhouse = async () => {
    if (!selectedSlaughterhouse) return;

    try {
      setSubmitting(true);

      // Update in localStorage
      const savedData = localStorage.getItem('slaughterhouse_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      allData[selectedSlaughterhouse.address.toLowerCase()] = {
        name: selectedSlaughterhouse.name,
        location: selectedSlaughterhouse.location,
        licenseNumber: selectedSlaughterhouse.licenseNumber,
        phone: selectedSlaughterhouse.phone || 'N/A',
        email: selectedSlaughterhouse.email || 'N/A',
        capacity: selectedSlaughterhouse.capacity || 'N/A',
        status: selectedSlaughterhouse.status || 'active',
        livestockProcessed: selectedSlaughterhouse.livestockProcessed || 0,
        registeredDate: selectedSlaughterhouse.registeredDate || new Date().toLocaleDateString(),
        notes: selectedSlaughterhouse.notes || ''
      };
      
      localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));

      // Update the list
      setSlaughterhouses(prev => 
        prev.map(sh => 
          sh.address.toLowerCase() === selectedSlaughterhouse.address.toLowerCase() 
            ? { ...selectedSlaughterhouse }
            : sh
        )
      );

      // Update stats
      const activeCount = slaughterhouses.filter(s => 
        s.address.toLowerCase() === selectedSlaughterhouse.address.toLowerCase() 
          ? selectedSlaughterhouse.status === 'active'
          : s.status === 'active'
      ).length;
      
      setStats({
        total: slaughterhouses.length,
        active: activeCount,
        inactive: slaughterhouses.length - activeCount
      });

      setShowDetailsModal(false);
      setIsEditing(false);
      showToast('Slaughterhouse details updated successfully!', 'success', 4000);

    } catch (err) {
      console.error('Error updating slaughterhouse:', err);
      showToast('Failed to update slaughterhouse details.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // TOGGLE SLAUGHTERHOUSE STATUS
  // ============================================
  const handleToggleStatus = async (address, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'deactivate' : 'activate'} this slaughterhouse?`)) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Update in localStorage
      const savedData = localStorage.getItem('slaughterhouse_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      if (allData[address.toLowerCase()]) {
        allData[address.toLowerCase()].status = currentStatus === 'active' ? 'inactive' : 'active';
        localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));
      }

      // Update the list
      setSlaughterhouses(prev => 
        prev.map(sh => 
          sh.address.toLowerCase() === address.toLowerCase() 
            ? { ...sh, status: currentStatus === 'active' ? 'inactive' : 'active' }
            : sh
        )
      );

      // Update stats
      setStats(prev => ({
        total: prev.total,
        active: currentStatus === 'active' ? prev.active - 1 : prev.active + 1,
        inactive: currentStatus === 'active' ? prev.inactive + 1 : prev.inactive - 1
      }));

      showToast(`Slaughterhouse ${currentStatus === 'active' ? 'deactivated' : 'activated'} successfully!`, 'success', 4000);

    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Failed to update status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // VIEW FUNCTIONS
  // ============================================
  const viewDetails = (sh) => {
    setSelectedSlaughterhouse({ ...sh });
    setIsEditing(false);
    setShowDetailsModal(true);
  };

  const openSlaughterModal = (sh) => {
    setSelectedSlaughterhouse({ ...sh });
    setSlaughterForm({
      livestockId: '',
      method: 'Humane',
      purpose: 'Meat Production',
      notes: ''
    });
    setShowSlaughterModal(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canManage && !canSlaughter) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only admins, regulators, and slaughterhouses can access this page.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  // ============================================
  // RENDER - CENTERED SPINNER
  // ============================================
  if (loading) {
    return (
      <div className="loading-container-centered">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading slaughterhouses...</p>
      </div>
    );
  }

  const filteredSlaughterhouses = slaughterhouses.filter(sh =>
    sh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sh.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sh.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="slaughterhouse-management">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>🏭 Slaughterhouses</h1>
          <p className="page-subtitle">Manage slaughterhouse registrations and record animal processing</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Total: {slaughterhouses.length}</span>
            <span className="debug-badge">Active: {stats.active}</span>
            <span className="debug-badge">Alive Livestock: {livestockList.length}</span>
          </div>
        </div>
        <div className="header-right">
          {canManage && (
            <button 
              className="btn-primary"
              onClick={() => setShowRegisterModal(true)}
            >
              + Register Slaughterhouse
            </button>
          )}
          <button className="btn-secondary" onClick={loadSlaughterhouses}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total</h3>
          <p className="stat-number">{stats.total}</p>
          <span className="stat-label">Registered slaughterhouses</span>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p className="stat-number">{stats.active}</p>
          <span className="stat-label">Currently active</span>
        </div>
        <div className="stat-card">
          <h3>Inactive</h3>
          <p className="stat-number">{stats.inactive}</p>
          <span className="stat-label">Inactive/Expired</span>
        </div>
        <div className="stat-card">
          <h3>🐄 Available</h3>
          <p className="stat-number">{livestockList.length}</p>
          <span className="stat-label">Alive livestock for processing</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, address, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-large"
          />
        </div>
      </div>

      {/* Slaughterhouses Table */}
      <div className="table-container">
        <table className="slaughterhouse-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Address</th>
              <th>Location</th>
              <th>License</th>
              <th>Processed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSlaughterhouses.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <div className="empty-state-content">
                    <span className="empty-icon">🏭</span>
                    <p>No slaughterhouses registered yet</p>
                    {canManage && (
                      <button 
                        className="btn-primary"
                        onClick={() => setShowRegisterModal(true)}
                      >
                        + Register First Slaughterhouse
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredSlaughterhouses.map((sh, index) => (
                <tr key={sh.address}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="slaughterhouse-name-cell">
                      <span className="slaughterhouse-icon">🏭</span>
                      <span className="slaughterhouse-name">{sh.name}</span>
                    </div>
                  </td>
                  <td className="address-cell">
                    <span className="address-text">
                      {sh.address.slice(0, 6)}...{sh.address.slice(-4)}
                    </span>
                  </td>
                  <td>{sh.location}</td>
                  <td>{sh.licenseNumber}</td>
                  <td>{sh.livestockProcessed || 0}</td>
                  <td>
                    <span className={`status-badge ${sh.status === 'active' ? 'active' : 'inactive'}`}>
                      {sh.status === 'active' ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => viewDetails(sh)}
                      >
                        View
                      </button>
                      {sh.status === 'active' && (
                        <button 
                          className="action-btn slaughter"
                          onClick={() => openSlaughterModal(sh)}
                          title="Record Slaughter"
                        >
                          🥩 Slaughter
                        </button>
                      )}
                      {canManage && (
                        <>
                          <button 
                            className={`action-btn ${sh.status === 'active' ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(sh.address, sh.status)}
                            disabled={submitting}
                          >
                            {sh.status === 'active' ? '⏸️' : '▶️'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Register Slaughterhouse Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Register Slaughterhouse</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterSlaughterhouse}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Wallet Address *</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                    className="styled-input"
                  />
                  <small className="form-hint">Enter the Ethereum wallet address of the slaughterhouse</small>
                </div>
                <div className="form-group">
                  <label>Slaughterhouse Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Kigali Meat Processing"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="e.g., Kigali, Rwanda"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>License Number</label>
                    <input
                      type="text"
                      placeholder="e.g., LIC-2024-001"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity (daily)</label>
                    <input
                      type="number"
                      placeholder="e.g., 100"
                      value={formData.capacity}
                      onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      placeholder="e.g., +250 788 000 000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="e.g., info@slaughterhouse.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                </div>
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : '📝 Register Slaughterhouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Slaughter Modal */}
      {showSlaughterModal && selectedSlaughterhouse && (
        <div className="modal-overlay" onClick={() => setShowSlaughterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🥩 Record Slaughter</h2>
              <button className="modal-close" onClick={() => setShowSlaughterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordSlaughter}>
              <div className="modal-body">
                <div className="slaughterhouse-info-box">
                  <h4>🏭 {selectedSlaughterhouse.name}</h4>
                  <div className="info-row">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{selectedSlaughterhouse.location}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">License:</span>
                    <span className="info-value">{selectedSlaughterhouse.licenseNumber}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Livestock for Slaughter *</label>
                  <select
                    value={slaughterForm.livestockId}
                    onChange={(e) => setSlaughterForm({...slaughterForm, livestockId: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="">Select livestock...</option>
                    {livestockList.length === 0 ? (
                      <option value="" disabled>No alive livestock available</option>
                    ) : (
                      livestockList.map((livestock) => (
                        <option key={livestock.id} value={livestock.id}>
                          #{livestock.id} - {livestock.name} ({livestock.breed})
                        </option>
                      ))
                    )}
                  </select>
                  <small className="form-hint">
                    {livestockList.length === 0 
                      ? '⚠️ No alive livestock available for slaughter' 
                      : `✅ ${livestockList.length} livestock available for processing`}
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Slaughter Method</label>
                    <select
                      value={slaughterForm.method}
                      onChange={(e) => setSlaughterForm({...slaughterForm, method: e.target.value})}
                      className="styled-select"
                    >
                      <option value="Humane">Humane</option>
                      <option value="Stun">Stun</option>
                      <option value="Halal">Halal</option>
                      <option value="Kosher">Kosher</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <select
                      value={slaughterForm.purpose}
                      onChange={(e) => setSlaughterForm({...slaughterForm, purpose: e.target.value})}
                      className="styled-select"
                    >
                      <option value="Meat Production">Meat Production</option>
                      <option value="Disease Control">Disease Control</option>
                      <option value="Population Control">Population Control</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Additional notes about this slaughter..."
                    value={slaughterForm.notes}
                    onChange={(e) => setSlaughterForm({...slaughterForm, notes: e.target.value})}
                    rows="2"
                    className="styled-textarea"
                  />
                </div>

                <div className="verification-preview" style={{ marginTop: '12px' }}>
                  <p>⚠️ <strong>Confirmation:</strong> This will:</p>
                  <p>1. Record the slaughter in the blockchain</p>
                  <p>2. Mark the livestock as <strong style={{ color: '#F44336' }}>DECEASED</strong></p>
                  <p>3. Update the slaughterhouse processing count</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowSlaughterModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="carbon-btn-danger" 
                  disabled={submitting || livestockList.length === 0}
                  style={{ padding: '10px 24px', borderRadius: '8px', fontWeight: '600' }}
                >
                  {submitting ? 'Processing...' : '🥩 Confirm Slaughter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slaughterhouse Details Modal */}
      {showDetailsModal && selectedSlaughterhouse && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏭 Slaughterhouse Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {!isEditing ? (
                // View Mode
                <>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedSlaughterhouse.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value address-full">{selectedSlaughterhouse.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedSlaughterhouse.location}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">License Number:</span>
                    <span className="detail-value">{selectedSlaughterhouse.licenseNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`status-badge ${selectedSlaughterhouse.status === 'active' ? 'active' : 'inactive'}`}>
                      {selectedSlaughterhouse.status === 'active' ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Livestock Processed:</span>
                    <span className="detail-value">{selectedSlaughterhouse.livestockProcessed || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedSlaughterhouse.phone || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedSlaughterhouse.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Daily Capacity:</span>
                    <span className="detail-value">{selectedSlaughterhouse.capacity || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Registered Date:</span>
                    <span className="detail-value">{selectedSlaughterhouse.registeredDate}</span>
                  </div>
                  {selectedSlaughterhouse.notes && (
                    <div className="detail-row">
                      <span className="detail-label">Notes:</span>
                      <span className="detail-value">{selectedSlaughterhouse.notes}</span>
                    </div>
                  )}
                </>
              ) : (
                // Edit Mode
                <>
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={selectedSlaughterhouse.name}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, name: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={selectedSlaughterhouse.address}
                      disabled
                      className="styled-input"
                      style={{ opacity: 0.7 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location *</label>
                    <input
                      type="text"
                      value={selectedSlaughterhouse.location}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, location: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>License Number</label>
                    <input
                      type="text"
                      value={selectedSlaughterhouse.licenseNumber}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, licenseNumber: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={selectedSlaughterhouse.phone || ''}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, phone: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={selectedSlaughterhouse.email || ''}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, email: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Daily Capacity</label>
                    <input
                      type="number"
                      value={selectedSlaughterhouse.capacity || ''}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, capacity: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={selectedSlaughterhouse.status || 'active'}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, status: e.target.value})}
                      className="styled-select"
                    >
                      <option value="active">✅ Active</option>
                      <option value="inactive">❌ Inactive</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={selectedSlaughterhouse.notes || ''}
                      onChange={(e) => setSelectedSlaughterhouse({...selectedSlaughterhouse, notes: e.target.value})}
                      rows="3"
                      className="styled-textarea"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {!isEditing ? (
                <>
                  <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
                  {canManage && (
                    <>
                      <button className="btn-primary" onClick={handleEdit}>
                        ✏️ Edit Details
                      </button>
                      {selectedSlaughterhouse.status === 'active' && (
                        <button 
                          className="action-btn slaughter"
                          onClick={() => {
                            setShowDetailsModal(false);
                            openSlaughterModal(selectedSlaughterhouse);
                          }}
                          style={{ 
                            background: 'rgba(244, 67, 54, 0.1)',
                            color: '#F44336',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          🥩 Slaughter
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <button className="btn-secondary" onClick={() => {
                    setIsEditing(false);
                    setSelectedSlaughterhouse(null);
                    setShowDetailsModal(false);
                  }}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleUpdateSlaughterhouse} disabled={submitting}>
                    {submitting ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SlaughterhouseManagement;