import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';

// ============================================
// FARMERS MANAGEMENT COMPONENT
// ============================================
function FarmersManagement({ account }) {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [newFarmer, setNewFarmer] = useState({
    address: '',
    name: '',
    location: '',
    phone: '',
    email: ''
  });
  const [registering, setRegistering] = useState(false);
  const [stats, setStats] = useState({
    totalFarmers: 0,
    activeFarmers: 0,
    totalLivestock: 0
  });

  const { userRole, isAdminUser } = useRole();
  const { showToast } = useToast();
  const canManageFarmers = userRole === 'admin' || userRole === 'regulator';

  useEffect(() => {
    if (account && canManageFarmers) {
      loadFarmers();
    }
  }, [account, userRole]);

  // ============================================
  // LOAD FARMERS
  // ============================================
  const loadFarmers = async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      console.log('🔍 Loading farmers from:', contracts.livestockRegistry.address);

      const farmerList = [];
      let activeCount = 0;
      let livestockTotal = 0;

      // Get farmers from localStorage for additional data
      const savedData = localStorage.getItem('farmers_data');
      const allData = savedData ? JSON.parse(savedData) : {};

      // Try to get farmers from the contract
      try {
        const allFarmers = await safeContractCall(contracts.livestockRegistry, 'getAllFarmers');
        if (allFarmers.success && allFarmers.data.length > 0) {
          console.log('📋 Found farmers via getAllFarmers:', allFarmers.data.length);
          
          for (const addr of allFarmers.data) {
            const farmerInfo = await safeContractCall(contracts.livestockRegistry, 'getFarmerInfo', addr);
            const livestock = await safeContractCall(contracts.livestockRegistry, 'getFarmerLivestock', addr);
            const extraData = allData[addr.toLowerCase()] || {};
            
            if (farmerInfo.success) {
              const farmerData = {
                address: addr,
                name: farmerInfo.data[0] || extraData.name || 'Unknown',
                location: farmerInfo.data[1] || extraData.location || 'Unknown',
                active: farmerInfo.data[2] || false,
                livestockCount: livestock.success ? livestock.data.length : 0,
                phone: extraData.phone || 'N/A',
                email: extraData.email || 'N/A',
                registeredDate: extraData.registeredDate || 'N/A',
                status: farmerInfo.data[2] ? 'Active' : 'Inactive'
              };
              farmerList.push(farmerData);
              if (farmerData.active) activeCount++;
              livestockTotal += farmerData.livestockCount;
            }
          }
        } else {
          // Fallback: Check known addresses
          console.log('📋 Fallback: Checking known addresses');
          const knownAddresses = [
            '0x41cde8618f73bc41629d8fabf424d209679fa5ff',
            '0x81184818da54D1c12cFfb049D7aDfB8cd6289B62',
            '0x125bdB082fe8B1fa9d07159e780f5eB09bd7D852',
            '0xbc89d1a74c74fd84e2d33b9430e58bd14cc28039'
          ];

          for (const addr of knownAddresses) {
            if (!addr || addr === '0x' || addr === '0x0000000000000000000000000000000000000000') continue;
            
            const isFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', addr);
            if (isFarmer.success && isFarmer.data) {
              const farmerInfo = await safeContractCall(contracts.livestockRegistry, 'getFarmerInfo', addr);
              const livestock = await safeContractCall(contracts.livestockRegistry, 'getFarmerLivestock', addr);
              const extraData = allData[addr.toLowerCase()] || {};
              
              if (farmerInfo.success) {
                const farmerData = {
                  address: addr,
                  name: farmerInfo.data[0] || extraData.name || 'Unknown',
                  location: farmerInfo.data[1] || extraData.location || 'Unknown',
                  active: farmerInfo.data[2] || false,
                  livestockCount: livestock.success ? livestock.data.length : 0,
                  phone: extraData.phone || 'N/A',
                  email: extraData.email || 'N/A',
                  registeredDate: extraData.registeredDate || 'N/A',
                  status: farmerInfo.data[2] ? 'Active' : 'Inactive'
                };
                farmerList.push(farmerData);
                if (farmerData.active) activeCount++;
                livestockTotal += farmerData.livestockCount;
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error getting farmers:', err);
        // Fallback to known addresses
        const knownAddresses = [
          '0x41cde8618f73bc41629d8fabf424d209679fa5ff',
          '0x81184818da54D1c12cFfb049D7aDfB8cd6289B62',
        ];
        for (const addr of knownAddresses) {
          const isFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', addr);
          if (isFarmer.success && isFarmer.data) {
            const farmerInfo = await safeContractCall(contracts.livestockRegistry, 'getFarmerInfo', addr);
            const extraData = allData[addr.toLowerCase()] || {};
            if (farmerInfo.success) {
              farmerList.push({
                address: addr,
                name: farmerInfo.data[0] || extraData.name || 'Unknown',
                location: farmerInfo.data[1] || extraData.location || 'Unknown',
                active: farmerInfo.data[2] || false,
                livestockCount: 0,
                phone: extraData.phone || 'N/A',
                email: extraData.email || 'N/A',
                registeredDate: extraData.registeredDate || 'N/A',
                status: farmerInfo.data[2] ? 'Active' : 'Inactive'
              });
              if (farmerInfo.data[2]) activeCount++;
            }
          }
        }
      }

      console.log('📋 Farmers loaded:', farmerList.length);
      setFarmers(farmerList);
      setStats({
        totalFarmers: farmerList.length,
        activeFarmers: activeCount,
        totalLivestock: livestockTotal
      });

    } catch (err) {
      console.error('Error loading farmers:', err);
      setError(err.message);
      showToast('Failed to load farmers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // REGISTER FARMER
  // ============================================
  const handleRegisterFarmer = async (e) => {
    e.preventDefault();
    
    // Validate address
    if (!newFarmer.address || !newFarmer.address.startsWith('0x') || newFarmer.address.length !== 42) {
      showToast('❌ Invalid wallet address format. Please enter a valid Ethereum address.', 'error');
      return;
    }

    if (!newFarmer.name.trim()) {
      showToast('❌ Please enter a farmer name.', 'error');
      return;
    }

    if (!newFarmer.location.trim()) {
      showToast('❌ Please enter a location.', 'error');
      return;
    }

    try {
      setRegistering(true);
      console.log('📝 Registering farmer:', newFarmer);
      
      const contracts = await getContracts();
      console.log('📡 Contract connected:', contracts.livestockRegistry.address);
      
      // Check if user has permission
      const isAdmin = await safeContractCall(contracts.livestockRegistry, 'isAdmin', account);
      console.log('🔑 Is Admin?', isAdmin.data);
      
      if (!isAdmin.data) {
        showToast('❌ You do not have permission to register farmers. Only Admin/Regulator can register.', 'error');
        setRegistering(false);
        return;
      }
      
      // Check if address is already a farmer
      const isAlreadyFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', newFarmer.address);
      if (isAlreadyFarmer.success && isAlreadyFarmer.data) {
        showToast('❌ This address is already registered as a farmer.', 'error');
        setRegistering(false);
        return;
      }
      
      // Register the farmer on blockchain
      const tx = await contracts.livestockRegistry.registerFarmer(
        newFarmer.address,
        newFarmer.name,
        newFarmer.location
      );
      
      console.log('📤 Transaction sent:', tx.hash);
      await tx.wait();
      console.log('✅ Transaction confirmed');
      
      // Save contact info to localStorage
      const savedData = localStorage.getItem('farmers_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      allData[newFarmer.address.toLowerCase()] = {
        name: newFarmer.name,
        location: newFarmer.location,
        phone: newFarmer.phone || 'N/A',
        email: newFarmer.email || 'N/A',
        registeredDate: new Date().toLocaleDateString()
      };
      localStorage.setItem('farmers_data', JSON.stringify(allData));
      
      setShowRegisterModal(false);
      setNewFarmer({ address: '', name: '', location: '', phone: '', email: '' });
      await loadFarmers();
      
      showToast(`✅ Farmer "${newFarmer.name}" registered successfully!`, 'success', 5000);
    } catch (err) {
      console.error('❌ Error registering farmer:', err);
      
      let errorMessage = 'Failed to register farmer.';
      if (err.message && err.message.includes('Already farmer')) {
        errorMessage = 'This address is already registered as a farmer.';
      } else if (err.message && err.message.includes('Not authorized')) {
        errorMessage = 'You do not have permission to register farmers.';
      } else if (err.message && err.message.includes('invalid address')) {
        errorMessage = 'Please enter a valid wallet address.';
      } else if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          errorMessage = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        } else {
          errorMessage = 'Transaction failed. Please check the address and try again.';
        }
      }
      showToast(`❌ ${errorMessage}`, 'error', 6000);
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // UPDATE FARMER CONTACT INFO
  // ============================================
  const handleUpdateFarmer = async (e) => {
    e.preventDefault();
    
    if (!selectedFarmer) return;

    try {
      setRegistering(true);
      
      const savedData = localStorage.getItem('farmers_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      allData[selectedFarmer.address.toLowerCase()] = {
        name: selectedFarmer.name,
        location: selectedFarmer.location,
        phone: selectedFarmer.phone || 'N/A',
        email: selectedFarmer.email || 'N/A',
        registeredDate: selectedFarmer.registeredDate || new Date().toLocaleDateString()
      };
      
      localStorage.setItem('farmers_data', JSON.stringify(allData));
      
      // Update the farmer in the list
      setFarmers(prev => 
        prev.map(f => 
          f.address.toLowerCase() === selectedFarmer.address.toLowerCase() 
            ? { ...selectedFarmer }
            : f
        )
      );
      
      setShowDetailsModal(false);
      setSelectedFarmer(null);
      showToast(`✅ Farmer "${selectedFarmer.name}" updated successfully!`, 'success', 4000);
      await loadFarmers();
      
    } catch (err) {
      console.error('Error updating farmer:', err);
      showToast('❌ Failed to update farmer: ' + err.message, 'error');
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // TOGGLE FARMER STATUS
  // ============================================
  const toggleFarmerStatus = async (address, currentStatus) => {
    try {
      setRegistering(true);
      const contracts = await getContracts();
      
      const isAdmin = await safeContractCall(contracts.livestockRegistry, 'isAdmin', account);
      const isRegulator = await safeContractCall(contracts.livestockRegistry, 'isRegulator', account);
      
      if (!isAdmin.data && !isRegulator.data) {
        showToast('❌ You do not have permission to toggle farmer status.', 'error');
        setRegistering(false);
        return;
      }

      const farmerName = farmers.find(f => f.address === address)?.name || 'Unknown';
      
      if (currentStatus) {
        const tx = await contracts.livestockRegistry.deactivateFarmer(address);
        await tx.wait();
        showToast(`✅ ${farmerName} has been deactivated.`, 'success', 4000);
      } else {
        const tx = await contracts.livestockRegistry.activateFarmer(address);
        await tx.wait();
        showToast(`✅ ${farmerName} has been activated.`, 'success', 4000);
      }
      
      await loadFarmers();
      
    } catch (err) {
      console.error('Error toggling farmer status:', err);
      showToast(`❌ Failed to toggle farmer status: ${err.message}`, 'error', 5000);
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // VIEW FARMER DETAILS
  // ============================================
  const viewFarmerDetails = (farmer) => {
    setSelectedFarmer({ ...farmer });
    setShowDetailsModal(true);
  };

  const closeFarmerDetails = () => {
    setShowDetailsModal(false);
    setSelectedFarmer(null);
  };

  // ============================================
  // COPY ADDRESS
  // ============================================
  const copyAddress = (address) => {
    navigator.clipboard.writeText(address);
    showToast('📋 Address copied to clipboard!', 'success', 2000);
  };

  // ============================================
  // FILTER FARMERS
  // ============================================
  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.phone.includes(searchTerm) ||
    farmer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canManageFarmers) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You don't have permission to view this page.</p>
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
        <p className="loading-text">Loading farmers...</p>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="farmers-management">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>👨‍🌾 Farmers Management</h1>
          <p className="page-subtitle">Manage all registered farmers in the system</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Admin: {isAdminUser ? 'Yes' : 'No'}</span>
            <span className="debug-badge">Farmers: {farmers.length}</span>
          </div>
        </div>
        <div className="header-right">
          {(userRole === 'admin' || isAdminUser) && (
            <button 
              className="btn-primary"
              onClick={() => setShowRegisterModal(true)}
            >
              ➕ Register Farmer
            </button>
          )}
          <button className="btn-secondary" onClick={loadFarmers}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👨‍🌾 Total Farmers</h3>
          <p className="stat-number">{stats.totalFarmers}</p>
          <span className="stat-label">Registered farmers</span>
        </div>
        <div className="stat-card">
          <h3>✅ Active Farmers</h3>
          <p className="stat-number">{stats.activeFarmers}</p>
          <span className="stat-label">Currently active</span>
        </div>
        <div className="stat-card">
          <h3>🐄 Total Livestock</h3>
          <p className="stat-number">{stats.totalLivestock}</p>
          <span className="stat-label">Across all farms</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, address, location, phone, or email..."
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

      {/* Farmers Table */}
      <div className="table-container">
        <table className="farmers-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Wallet Address</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Livestock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFarmers.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  <div className="empty-state-content">
                    <span className="empty-icon">👨‍🌾</span>
                    <p>No farmers registered yet</p>
                    {(userRole === 'admin' || isAdminUser) && (
                      <button 
                        className="btn-primary"
                        onClick={() => setShowRegisterModal(true)}
                      >
                        Register First Farmer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredFarmers.map((farmer, index) => (
                <tr key={farmer.address}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="farmer-name-cell">
                      <span className="farmer-avatar">👨‍🌾</span>
                      <span className="farmer-name">{farmer.name}</span>
                    </div>
                  </td>
                  <td className="address-cell">
                    <span className="address-text">
                      {farmer.address.slice(0, 6)}...{farmer.address.slice(-4)}
                    </span>
                    <button 
                      className="copy-btn"
                      onClick={() => copyAddress(farmer.address)}
                      title="Copy address"
                    >
                      📋
                    </button>
                  </td>
                  <td>{farmer.location}</td>
                  <td>{farmer.phone || 'N/A'}</td>
                  <td>
                    <span className="livestock-badge">
                      🐄 {farmer.livestockCount}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${farmer.active ? 'active' : 'inactive'}`}>
                      {farmer.active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => viewFarmerDetails(farmer)}
                      >
                        👁️ View
                      </button>
                      {(userRole === 'admin' || isAdminUser) && (
                        <button 
                          className={`action-btn ${farmer.active ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleFarmerStatus(farmer.address, farmer.active)}
                          title={farmer.active ? 'Deactivate' : 'Activate'}
                        >
                          {farmer.active ? '⏸️' : '▶️'}
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

      {/* Farmer Details Modal */}
      {showDetailsModal && selectedFarmer && (
        <div className="modal-overlay" onClick={closeFarmerDetails}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👨‍🌾 Farmer Details</h2>
              <button className="modal-close" onClick={closeFarmerDetails}>✕</button>
            </div>
            <form onSubmit={handleUpdateFarmer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={selectedFarmer.name}
                    onChange={(e) => setSelectedFarmer({...selectedFarmer, name: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    value={selectedFarmer.address}
                    disabled
                    className="styled-input"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={selectedFarmer.location}
                    onChange={(e) => setSelectedFarmer({...selectedFarmer, location: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+250 788 000 000"
                      value={selectedFarmer.phone || ''}
                      onChange={(e) => setSelectedFarmer({...selectedFarmer, phone: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="farmer@example.com"
                      value={selectedFarmer.email || ''}
                      onChange={(e) => setSelectedFarmer({...selectedFarmer, email: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${selectedFarmer.active ? 'active' : 'inactive'}`}>
                    {selectedFarmer.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Livestock Count:</span>
                  <span className="detail-value">🐄 {selectedFarmer.livestockCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Registered Date:</span>
                  <span className="detail-value">{selectedFarmer.registeredDate}</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeFarmerDetails}>
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

      {/* Register Farmer Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Register New Farmer</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterFarmer}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Wallet Address *</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={newFarmer.address}
                    onChange={(e) => setNewFarmer({...newFarmer, address: e.target.value})}
                    required
                    className="styled-input"
                  />
                  <small className="form-hint">Enter the Ethereum wallet address of the farmer</small>
                </div>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="John Farmer"
                    value={newFarmer.name}
                    onChange={(e) => setNewFarmer({...newFarmer, name: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    placeholder="Kigali, Rwanda"
                    value={newFarmer.location}
                    onChange={(e) => setNewFarmer({...newFarmer, location: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+250 788 000 000"
                      value={newFarmer.phone}
                      onChange={(e) => setNewFarmer({...newFarmer, phone: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="farmer@example.com"
                      value={newFarmer.email}
                      onChange={(e) => setNewFarmer({...newFarmer, email: e.target.value})}
                      className="styled-input"
                    />
                  </div>
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
                  {registering ? '⏳ Registering...' : '➕ Register Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmersManagement;