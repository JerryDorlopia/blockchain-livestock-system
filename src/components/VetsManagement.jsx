import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';

// ============================================
// VETERINARIANS MANAGEMENT COMPONENT
// ============================================
function VetsManagement({ account }) {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newVet, setNewVet] = useState({
    address: '',
    name: '',
    licenseNumber: '',
    specialization: '',
    serviceArea: ''
  });
  const [registering, setRegistering] = useState(false);
  const [selectedVet, setSelectedVet] = useState(null);
  const [stats, setStats] = useState({
    totalVets: 0,
    activeVets: 0
  });

  const { userRole, isAdminUser } = useRole();
  const { showToast } = useToast();
  const canManageVets = userRole === 'admin' || userRole === 'regulator';

  // ============================================
  // LOAD VETERINARIANS - FIXED
  // ============================================
  const loadVets = async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      // Load vet data from localStorage
      const savedData = localStorage.getItem('vets_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      console.log('📋 Loaded vet data from localStorage:', allData);

      // Get all registered vet addresses from the contract
      // Since we don't have a getAllVets function, we'll check known addresses
      // and also look for any addresses in localStorage
      const knownAddresses = [
        '0x11a00232b92521F762Edc2438FDf28946Ed1714A',
      ];

      // Add addresses from localStorage that aren't in knownAddresses
      for (const address of Object.keys(allData)) {
        if (!knownAddresses.includes(address) && address !== '0x0000000000000000000000000000000000000000') {
          knownAddresses.push(address);
        }
      }

      console.log('🔍 Checking addresses:', knownAddresses);

      const vetList = [];
      let activeCount = 0;

      for (const addr of knownAddresses) {
        if (!addr || addr === '0x' || addr === '0x0000000000000000000000000000000000000000') continue;
        
        try {
          const isVet = await safeContractCall(contracts.healthRecord, 'isVet', addr);
          if (isVet.success && isVet.data) {
            // Get vet details from localStorage (case insensitive)
            const lowerAddr = addr.toLowerCase();
            const vetDetails = allData[lowerAddr] || {};
            
            console.log(`✅ Vet found: ${addr}, Details:`, vetDetails);
            
            const vetData = {
              address: addr,
              name: vetDetails.name || 'Unknown',
              licenseNumber: vetDetails.licenseNumber || 'LIC-' + addr.slice(2, 8),
              specialization: vetDetails.specialization || 'General',
              serviceArea: vetDetails.serviceArea || 'Not specified',
              active: vetDetails.active !== undefined ? vetDetails.active : true,
              registeredDate: vetDetails.registeredDate || new Date().toLocaleDateString()
            };
            vetList.push(vetData);
            if (vetData.active) activeCount++;
          } else {
            console.log(`❌ Address ${addr} is not a registered vet`);
          }
        } catch (err) {
          console.warn(`Could not check vet for address ${addr}:`, err.message);
        }
      }

      console.log('📋 Final vet list:', vetList);
      
      setVets(vetList);
      setStats({
        totalVets: vetList.length,
        activeVets: activeCount
      });

    } catch (err) {
      console.error('Error loading vets:', err);
      setError(err.message);
      showToast('Failed to load vets: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && canManageVets) {
      loadVets();
    }
  }, [account, canManageVets]);

  // ============================================
  // REGISTER VETERINARIAN - FIXED
  // ============================================
  const handleRegisterVet = async (e) => {
    e.preventDefault();
    
    if (!newVet.address || !newVet.address.startsWith('0x') || newVet.address.length !== 42) {
      showToast('❌ Invalid wallet address format.', 'error');
      return;
    }

    if (!newVet.name.trim()) {
      showToast('❌ Please enter a veterinarian name.', 'error');
      return;
    }

    try {
      setRegistering(true);
      const contracts = await getContracts();
      
      // Check if address is already a vet
      const isAlreadyVet = await safeContractCall(contracts.healthRecord, 'isVet', newVet.address);
      if (isAlreadyVet.success && isAlreadyVet.data) {
        showToast('❌ This address is already registered as a veterinarian.', 'error');
        setRegistering(false);
        return;
      }

      // Register the vet on blockchain
      const tx = await contracts.healthRecord.registerVet(newVet.address);
      await tx.wait();
      
      // Save vet details to localStorage
      const savedData = localStorage.getItem('vets_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      // Use lowercase address for consistent lookup
      const lowerAddr = newVet.address.toLowerCase();
      
      allData[lowerAddr] = {
        name: newVet.name,
        licenseNumber: newVet.licenseNumber || 'LIC-' + newVet.address.slice(2, 8),
        specialization: newVet.specialization || 'General',
        serviceArea: newVet.serviceArea || 'Not specified',
        active: true,
        registeredDate: new Date().toLocaleDateString()
      };
      
      localStorage.setItem('vets_data', JSON.stringify(allData));
      console.log('✅ Vet data saved to localStorage:', allData[lowerAddr]);
      
      setShowRegisterModal(false);
      setNewVet({ address: '', name: '', licenseNumber: '', specialization: '', serviceArea: '' });
      await loadVets();
      
      showToast(`✅ Veterinarian "${newVet.name}" registered successfully!`, 'success', 5000);
    } catch (err) {
      console.error('❌ Error registering vet:', err);
      let errorMessage = 'Failed to register vet.';
      if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          errorMessage = `❌ ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`;
        }
      }
      showToast(errorMessage, 'error', 6000);
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // UPDATE VET DETAILS
  // ============================================
  const handleUpdateVet = async (e) => {
    e.preventDefault();
    
    if (!selectedVet) return;

    try {
      setRegistering(true);
      
      const savedData = localStorage.getItem('vets_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      const lowerAddr = selectedVet.address.toLowerCase();
      
      allData[lowerAddr] = {
        name: selectedVet.name,
        licenseNumber: selectedVet.licenseNumber,
        specialization: selectedVet.specialization,
        serviceArea: selectedVet.serviceArea,
        active: selectedVet.active,
        registeredDate: selectedVet.registeredDate || new Date().toLocaleDateString()
      };
      
      localStorage.setItem('vets_data', JSON.stringify(allData));
      
      // Update the vet in the list
      setVets(prev => 
        prev.map(v => 
          v.address.toLowerCase() === selectedVet.address.toLowerCase() 
            ? { ...selectedVet }
            : v
        )
      );
      
      // Update stats
      const activeCount = vets.filter(v => 
        v.address.toLowerCase() === selectedVet.address.toLowerCase() 
          ? selectedVet.active
          : v.active
      ).length;
      
      setStats({
        totalVets: vets.length,
        activeVets: activeCount
      });
      
      setSelectedVet(null);
      showToast(`✅ Vet "${selectedVet.name}" updated successfully!`, 'success', 4000);
      await loadVets();
      
    } catch (err) {
      console.error('Error updating vet:', err);
      showToast('❌ Failed to update vet details.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // TOGGLE VET STATUS
  // ============================================
  const toggleVetStatus = async (address, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this vet?`)) {
      return;
    }

    try {
      setRegistering(true);
      
      const savedData = localStorage.getItem('vets_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      const lowerAddr = address.toLowerCase();
      if (allData[lowerAddr]) {
        allData[lowerAddr].active = !currentStatus;
        localStorage.setItem('vets_data', JSON.stringify(allData));
      }

      // Update the list
      setVets(prev => 
        prev.map(v => 
          v.address.toLowerCase() === address.toLowerCase() 
            ? { ...v, active: !currentStatus }
            : v
        )
      );

      // Update stats
      setStats(prev => ({
        totalVets: prev.totalVets,
        activeVets: currentStatus ? prev.activeVets - 1 : prev.activeVets + 1
      }));

      showToast(`Vet ${currentStatus ? 'deactivated' : 'activated'} successfully!`, 'success', 4000);
      await loadVets();
      
    } catch (err) {
      console.error('Error toggling status:', err);
      showToast('Failed to update status.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // VIEW VET DETAILS
  // ============================================
  const viewVetDetails = (vet) => {
    setSelectedVet({ ...vet });
  };

  const closeVetDetails = () => {
    setSelectedVet(null);
  };

  // ============================================
  // COPY ADDRESS
  // ============================================
  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showToast('📋 Address copied to clipboard!', 'success', 2000);
  };

  const filteredVets = vets.filter(vet =>
    vet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vet.serviceArea.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canManageVets) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to view this page.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container-centered">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading veterinarians...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="vets-management">
      <div className="page-header">
        <div className="header-left">
          <h1>👨‍⚕️ Veterinarians Management</h1>
          <p className="page-subtitle">Manage all registered veterinarians in the system</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Admin: {isAdminUser ? 'Yes' : 'No'}</span>
            <span className="debug-badge">Vets: {vets.length}</span>
          </div>
        </div>
        <div className="header-right">
          {(userRole === 'admin' || isAdminUser) && (
            <button 
              className="btn-primary"
              onClick={() => setShowRegisterModal(true)}
            >
              ➕ Register Veterinarian
            </button>
          )}
          <button className="btn-secondary" onClick={loadVets}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>👨‍⚕️ Total Vets</h3>
          <p className="stat-number">{stats.totalVets}</p>
          <span className="stat-label">Registered veterinarians</span>
        </div>
        <div className="stat-card">
          <h3>✅ Active Vets</h3>
          <p className="stat-number">{stats.activeVets}</p>
          <span className="stat-label">Currently active</span>
        </div>
        <div className="stat-card">
          <h3>📋 Health Records</h3>
          <p className="stat-number">0</p>
          <span className="stat-label">Total records</span>
        </div>
      </div>

      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, address, or specialization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-large"
          />
        </div>
        <div className="filter-options">
          <select className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="vets-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Wallet Address</th>
              <th>License</th>
              <th>Specialization</th>
              <th>Service Area</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVets.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <div className="empty-state-content">
                    <span className="empty-icon">👨‍⚕️</span>
                    <p>No veterinarians registered yet</p>
                    {(userRole === 'admin' || isAdminUser) && (
                      <button 
                        className="btn-primary"
                        onClick={() => setShowRegisterModal(true)}
                      >
                        Register First Vet
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredVets.map((vet, index) => (
                <tr key={vet.address}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="vet-name-cell">
                      <span className="vet-avatar">👨‍⚕️</span>
                      <span className="vet-name">{vet.name}</span>
                    </div>
                  </td>
                  <td className="address-cell">
                    <span className="address-text">
                      {vet.address.slice(0, 6)}...{vet.address.slice(-4)}
                    </span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyAddress(vet.address)}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </td>
                  <td>{vet.licenseNumber}</td>
                  <td>{vet.specialization}</td>
                  <td>{vet.serviceArea}</td>
                  <td>
                    <span className={`status-badge ${vet.active ? 'active' : 'inactive'}`}>
                      {vet.active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => viewVetDetails(vet)}
                      >
                        👁️ View
                      </button>
                      {(userRole === 'admin' || isAdminUser) && (
                        <button 
                          className={`action-btn ${vet.active ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleVetStatus(vet.address, vet.active)}
                        >
                          {vet.active ? '⏸️' : '▶️'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vet Details Modal */}
      {selectedVet && (
        <div className="modal-overlay" onClick={closeVetDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👨‍⚕️ Veterinarian Details</h2>
              <button className="modal-close" onClick={closeVetDetails}>✕</button>
            </div>
            <form onSubmit={handleUpdateVet}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={selectedVet.name}
                    onChange={(e) => setSelectedVet({...selectedVet, name: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    value={selectedVet.address}
                    disabled
                    className="styled-input"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    value={selectedVet.licenseNumber}
                    onChange={(e) => setSelectedVet({...selectedVet, licenseNumber: e.target.value})}
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    value={selectedVet.specialization}
                    onChange={(e) => setSelectedVet({...selectedVet, specialization: e.target.value})}
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Service Area</label>
                  <input
                    type="text"
                    value={selectedVet.serviceArea}
                    onChange={(e) => setSelectedVet({...selectedVet, serviceArea: e.target.value})}
                    className="styled-input"
                  />
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${selectedVet.active ? 'active' : 'inactive'}`}>
                    {selectedVet.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Registered Date:</span>
                  <span className="detail-value">{selectedVet.registeredDate}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeVetDetails}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={registering}>
                  {registering ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Vet Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Register Veterinarian</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterVet}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Wallet Address *</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={newVet.address}
                    onChange={(e) => setNewVet({...newVet, address: e.target.value})}
                    required
                    className="styled-input"
                  />
                  <small className="form-hint">Enter the Ethereum wallet address of the veterinarian</small>
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Dr. John Doe"
                    value={newVet.name}
                    onChange={(e) => setNewVet({...newVet, name: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    placeholder="LIC-2024-001"
                    value={newVet.licenseNumber}
                    onChange={(e) => setNewVet({...newVet, licenseNumber: e.target.value})}
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g., Large Animals, Surgery"
                    value={newVet.specialization}
                    onChange={(e) => setNewVet({...newVet, specialization: e.target.value})}
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Service Area</label>
                  <input
                    type="text"
                    placeholder="e.g., Kigali, Musanze"
                    value={newVet.serviceArea}
                    onChange={(e) => setNewVet({...newVet, serviceArea: e.target.value})}
                    className="styled-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowRegisterModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={registering}
                >
                  {registering ? '⏳ Registering...' : '➕ Register Veterinarian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VetsManagement;