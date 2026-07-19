import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';

// ============================================
// CARBON CREDITS COMPONENT
// ============================================
function CarbonCredits({ account }) {
  const [farmData, setFarmData] = useState(null);
  const [emissions, setEmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEmissionModal, setShowEmissionModal] = useState(false);
  const [showVerifyFarmModal, setShowVerifyFarmModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState('');
  const [farmersList, setFarmersList] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: 'DAIRY',
    livestockCount: 0,
    emissions: 0,
    source: 'ENTERIC',
    hash: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [stats, setStats] = useState({
    totalCredits: 0,
    totalEmissions: 0,
    livestockCount: 0,
    pendingCredits: 0,
    verifiedFarm: false
  });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allFarmers, setAllFarmers] = useState([]);
  const [selectedFarmerAddress, setSelectedFarmerAddress] = useState('');
  const [viewingFarmerData, setViewingFarmerData] = useState(null);
  const [adminMode, setAdminMode] = useState('view');

  const { userRole, isAdminUser } = useRole();
  const { showToast } = useToast();

  const isFarmer = userRole === 'farmer' || userRole === 'admin';
  const isVerifier = userRole === 'admin' || userRole === 'regulator';
  const isAdmin = userRole === 'admin';

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      if (isAdmin) {
        await loadAllFarmersData(contracts);
      }

      const isFarmerInRegistry = await safeContractCall(contracts.livestockRegistry, 'isFarmer', account);
      
      if (!isFarmerInRegistry.success || !isFarmerInRegistry.data) {
        setFarmData(null);
        setStats({
          totalCredits: 0,
          totalEmissions: 0,
          livestockCount: 0,
          pendingCredits: 0,
          verifiedFarm: false
        });
        setEmissions([]);
        setLoading(false);
        return;
      }

      await loadFarmerData(contracts, account);

    } catch (err) {
      console.error('Error loading carbon data:', err);
      setError(err.message);
      showToast('Failed to load carbon data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllFarmersData = async (contracts) => {
    try {
      const farmerCount = await safeContractCall(contracts.livestockRegistry, 'farmerCount');
      const count = farmerCount.success ? Number(farmerCount.data) : 0;
      
      const farmers = [];
      const knownFarmers = [
        '0x41cde8618f73bc41629d8fabf424d209679fa5ff'
      ];
      
      for (const addr of knownFarmers) {
        const isFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', addr);
        if (isFarmer.success && isFarmer.data) {
          const farmExists = await safeContractCall(contracts.carbonCreditTracker, 'fExists', addr);
          if (farmExists.success && farmExists.data) {
            const name = await safeContractCall(contracts.carbonCreditTracker, 'fName', addr);
            const credits = await safeContractCall(contracts.carbonCreditTracker, 'fCredits', addr);
            const verified = await safeContractCall(contracts.carbonCreditTracker, 'fVerified', addr);
            const emissions = await safeContractCall(contracts.carbonCreditTracker, 'fEmissions', addr);
            const pending = await safeContractCall(contracts.carbonCreditTracker, 'getPendingCredits', addr);
            
            farmers.push({
              address: addr,
              name: name.success ? name.data : 'Unknown',
              credits: credits.success ? Number(credits.data) : 0,
              verified: verified.success ? verified.data : false,
              emissions: emissions.success ? Number(emissions.data) : 0,
              pendingCredits: pending.success ? Number(pending.data) : 0
            });
          }
        }
      }
      
      setFarmersList(farmers);
    } catch (err) {
      console.error('Error loading farmers:', err);
    }
  };

  const loadFarmerData = async (contracts, address) => {
    const farmExists = await safeContractCall(contracts.carbonCreditTracker, 'fExists', address);
    
    if (farmExists.success && farmExists.data) {
      const name = await safeContractCall(contracts.carbonCreditTracker, 'fName', address);
      const location = await safeContractCall(contracts.carbonCreditTracker, 'fLocation', address);
      const type = await safeContractCall(contracts.carbonCreditTracker, 'fType', address);
      const livestock = await safeContractCall(contracts.carbonCreditTracker, 'fLivestock', address);
      const emissions = await safeContractCall(contracts.carbonCreditTracker, 'fEmissions', address);
      const credits = await safeContractCall(contracts.carbonCreditTracker, 'fCredits', address);
      const verified = await safeContractCall(contracts.carbonCreditTracker, 'fVerified', address);
      const pending = await safeContractCall(contracts.carbonCreditTracker, 'getPendingCredits', address);

      setFarmData({
        name: name.success ? name.data : 'Unknown',
        location: location.success ? location.data : 'Unknown',
        type: type.success ? type.data : 'Unknown',
        livestock: livestock.success ? Number(livestock.data) : 0,
        emissions: emissions.success ? Number(emissions.data) : 0,
        credits: credits.success ? Number(credits.data) : 0,
        verified: verified.success ? verified.data : false,
        pending: pending.success ? Number(pending.data) : 0,
        address: address
      });

      setIsVerified(verified.success ? verified.data : false);

      setStats({
        totalCredits: credits.success ? Number(credits.data) : 0,
        totalEmissions: emissions.success ? Number(emissions.data) : 0,
        livestockCount: livestock.success ? Number(livestock.data) : 0,
        pendingCredits: pending.success ? Number(pending.data) : 0,
        verifiedFarm: verified.success ? verified.data : false
      });

      const eCount = await safeContractCall(contracts.carbonCreditTracker, 'eCount');
      const count = eCount.success ? Number(eCount.data) : 0;
      
      const emissionList = [];
      for (let i = 0; i < count; i++) {
        try {
          const farmer = await safeContractCall(contracts.carbonCreditTracker, 'eFarmer', i);
          if (farmer.success && farmer.data.toLowerCase() === address.toLowerCase()) {
            const timestamp = await safeContractCall(contracts.carbonCreditTracker, 'eTimestamp', i);
            const emissions = await safeContractCall(contracts.carbonCreditTracker, 'eEmissions', i);
            const source = await safeContractCall(contracts.carbonCreditTracker, 'eSource', i);
            const verified = await safeContractCall(contracts.carbonCreditTracker, 'eVerified', i);
            const hash = await safeContractCall(contracts.carbonCreditTracker, 'eHash', i);
            const verifier = await safeContractCall(contracts.carbonCreditTracker, 'eVerifier', i);
            
            emissionList.push({
              id: i,
              timestamp: timestamp.success ? new Date(Number(timestamp.data) * 1000).toLocaleDateString() : 'N/A',
              emissions: emissions.success ? Number(emissions.data) : 0,
              source: source.success ? source.data : 'Unknown',
              verified: verified.success ? verified.data : false,
              hash: hash.success ? hash.data : 'N/A',
              verifier: verifier.success ? verifier.data : 'N/A'
            });
          }
        } catch (err) {
          console.warn(`Error loading emission ${i}:`, err.message);
        }
      }
      setEmissions(emissionList);
    } else {
      setFarmData(null);
      setStats({
        totalCredits: 0,
        totalEmissions: 0,
        livestockCount: 0,
        pendingCredits: 0,
        verifiedFarm: false
      });
      setEmissions([]);
    }
  };

  useEffect(() => {
    if (account) {
      loadData();
    }
  }, [account]);

  // ============================================
  // ADMIN ACTIONS
  // ============================================
  const handleViewFarmer = async (address) => {
    try {
      setLoading(true);
      const contracts = await getContracts();
      await loadFarmerData(contracts, address);
      setSelectedFarmerAddress(address);
      setAdminMode('view');
      showToast(`Viewing farmer: ${address.slice(0, 6)}...${address.slice(-4)}`, 'info', 3000);
    } catch (err) {
      console.error('Error loading farmer data:', err);
      showToast('Failed to load farmer data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFarm = async (address) => {
    try {
      setSubmitting(true);
      const contracts = await getContracts();
      const tx = await contracts.carbonCreditTracker.verifyFarm(address || account);
      await tx.wait();
      await loadData();
      showToast(`Farm verified successfully! Credits awarded!`, 'success', 4000);
      setShowVerifyFarmModal(false);
      setSelectedFarmer('');
    } catch (err) {
      console.error('Error verifying farm:', err);
      showToast('Failed to verify farm: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmissions = async (emissionId) => {
    try {
      setSubmitting(true);
      const contracts = await getContracts();
      const tx = await contracts.carbonCreditTracker.verifyEmissions(emissionId);
      await tx.wait();
      await loadData();
      showToast('Emissions verified! Credits awarded!', 'success', 5000);
    } catch (err) {
      console.error('Error verifying emissions:', err);
      showToast('Failed to verify emissions: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyAllEmissions = async () => {
    try {
      setSubmitting(true);
      const contracts = await getContracts();
      const unverified = emissions.filter(e => !e.verified);
      
      if (unverified.length === 0) {
        showToast('No unverified emissions to verify', 'info');
        setSubmitting(false);
        return;
      }

      for (const emission of unverified) {
        const tx = await contracts.carbonCreditTracker.verifyEmissions(emission.id);
        await tx.wait();
      }
      
      await loadData();
      showToast(`${unverified.length} emissions verified successfully!`, 'success', 5000);
    } catch (err) {
      console.error('Error verifying emissions:', err);
      showToast('Failed to verify emissions: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // FARMER ACTIONS
  // ============================================
  const handleRegisterFarm = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.livestockCount) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const tx = await contracts.carbonCreditTracker.registerFarm(
        formData.name,
        formData.location,
        formData.type,
        Number(formData.livestockCount)
      );
      
      await tx.wait();
      
      setShowRegisterModal(false);
      setFormData({
        name: '',
        location: '',
        type: 'DAIRY',
        livestockCount: 0,
        emissions: 0,
        source: 'ENTERIC',
        hash: ''
      });
      await loadData();
      
      showToast('Farm registered successfully!', 'success', 5000);
    } catch (err) {
      console.error('Error registering farm:', err);
      let errorMessage = 'Failed to register farm.';
      if (err.message && err.message.includes('Not farmer')) {
        errorMessage = 'You must be a registered farmer in the LivestockRegistry. Please contact admin.';
      } else if (err.message && err.message.includes('Already')) {
        errorMessage = 'This farm is already registered.';
      }
      showToast(errorMessage, 'error', 6000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogEmissions = async (e) => {
    e.preventDefault();
    
    if (!formData.emissions || !formData.source) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const tx = await contracts.carbonCreditTracker.logEmissions(
        Number(formData.emissions),
        formData.source,
        formData.hash || 'QmHash' + Date.now()
      );
      
      await tx.wait();
      
      setShowEmissionModal(false);
      setFormData({
        name: '',
        location: '',
        type: 'DAIRY',
        livestockCount: 0,
        emissions: 0,
        source: 'ENTERIC',
        hash: ''
      });
      await loadData();
      
      showToast('Emissions logged successfully!', 'success', 5000);
    } catch (err) {
      console.error('Error logging emissions:', err);
      showToast('Failed to log emissions: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // CHART DATA
  // ============================================
  const getMonthlyEmissionData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const totalEmissions = stats.totalEmissions || 0;
    const totalCredits = stats.totalCredits || 0;
    
    if (totalEmissions === 0 && totalCredits === 0) {
      return months.map(month => ({
        name: month,
        emissions: 0,
        credits: 0
      }));
    }
    
    return months.map((month, i) => ({
      name: month,
      emissions: Math.round((totalEmissions / 6) * (i + 1) * 100) / 100,
      credits: Math.round((totalCredits / 6) * (i + 1) * 100) / 100
    }));
  };

  const getSourceData = () => {
    const sourceCount = {};
    emissions.forEach(e => {
      sourceCount[e.source] = (sourceCount[e.source] || 0) + e.emissions;
    });
    
    if (Object.keys(sourceCount).length === 0) {
      return [{ name: 'No Data', value: 1 }];
    }
    
    return Object.keys(sourceCount).map(key => ({
      name: key,
      value: sourceCount[key]
    }));
  };

  const getVerificationData = () => {
    const verified = emissions.filter(e => e.verified).length;
    const unverified = emissions.filter(e => !e.verified).length;
    const total = verified + unverified;
    
    if (total === 0) {
      return [{ name: 'No Records', value: 1 }];
    }
    
    return [
      { name: 'Verified', value: verified || 0 },
      { name: 'Pending', value: unverified || 0 }
    ];
  };

  const getCreditData = () => {
    const earned = stats.totalCredits || 0;
    const pending = stats.pendingCredits || 0;
    
    if (earned === 0 && pending === 0) {
      return [{ name: 'No Credits', value: 1 }];
    }
    
    return [
      { name: 'Earned', value: earned },
      { name: 'Pending', value: pending }
    ];
  };

  const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336', '#00BCD4'];

  if (loading) {
    return (
      <div className="carbon-loading">
        <div className="loading-spinner"></div>
        <p>Loading carbon data...</p>
      </div>
    );
  }

  const hasFarm = farmData !== null;
  const isAdminViewing = isAdmin && selectedFarmerAddress;

  return (
    <div className="carbon-credits-page">
      {/* Header */}
      <div className="carbon-header">
        <div className="carbon-header-content">
          <div className="carbon-title-section">
            <h1 className="carbon-title">Carbon Credits</h1>
            <p className="carbon-subtitle">Track emissions and earn carbon credits</p>
          </div>
          <div className="carbon-actions">
            {isAdmin && (
              <>
                <select 
                  className="carbon-select"
                  value={selectedFarmerAddress}
                  onChange={(e) => handleViewFarmer(e.target.value)}
                >
                  <option value="">Select Farmer</option>
                  {farmersList.map((farmer) => (
                    <option key={farmer.address} value={farmer.address}>
                      {farmer.name} ({farmer.address.slice(0, 6)}...)
                    </option>
                  ))}
                </select>
                <button 
                  className="carbon-btn carbon-btn-success"
                  onClick={() => setShowVerifyFarmModal(true)}
                >
                  Verify Farm
                </button>
                {emissions.filter(e => !e.verified).length > 0 && (
                  <button 
                    className="carbon-btn carbon-btn-warning"
                    onClick={handleVerifyAllEmissions}
                    disabled={submitting}
                  >
                    Verify All ({emissions.filter(e => !e.verified).length})
                  </button>
                )}
              </>
            )}
            {isFarmer && !hasFarm && !isAdmin && (
              <button 
                className="carbon-btn carbon-btn-primary"
                onClick={() => setShowRegisterModal(true)}
              >
                Register Farm
              </button>
            )}
            {isFarmer && hasFarm && !isAdmin && (
              <button 
                className="carbon-btn carbon-btn-primary"
                onClick={() => setShowEmissionModal(true)}
              >
                Log Emissions
              </button>
            )}
            {isVerifier && hasFarm && !isVerified && !isAdmin && (
              <button 
                className="carbon-btn carbon-btn-success"
                onClick={() => handleVerifyFarm()}
              >
                Verify Farm
              </button>
            )}
            <button className="carbon-btn carbon-btn-secondary" onClick={loadData}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="carbon-stats-grid">
        <div className="carbon-stat-card">
          <div className="stat-icon">🌱</div>
          <div className="stat-content">
            <h3>Total Credits</h3>
            <p className="stat-value">{stats.totalCredits}</p>
            <span className="stat-label">Carbon credits earned</span>
          </div>
        </div>
        <div className="carbon-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Emissions</h3>
            <p className="stat-value">{stats.totalEmissions} kg</p>
            <span className="stat-label">CO₂ equivalent</span>
          </div>
        </div>
        <div className="carbon-stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Credits</h3>
            <p className="stat-value">{stats.pendingCredits}</p>
            <span className="stat-label">Awaiting verification</span>
          </div>
        </div>
        <div className="carbon-stat-card">
          <div className="stat-icon">🐄</div>
          <div className="stat-content">
            <h3>Livestock</h3>
            <p className="stat-value">{stats.livestockCount}</p>
            <span className="stat-label">Total livestock</span>
          </div>
        </div>
      </div>

      {/* Admin Farmers Table */}
      {isAdmin && farmersList.length > 0 && (
        <div className="carbon-section">
          <div className="section-header">
            <h2>Registered Farmers</h2>
            <span className="section-count">{farmersList.length} farmers</span>
          </div>
          <div className="carbon-table-container">
            <table className="carbon-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Address</th>
                  <th>Credits</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {farmersList.map((farmer) => (
                  <tr key={farmer.address}>
                    <td>
                      <strong>{farmer.name}</strong>
                    </td>
                    <td>
                      <code className="address-code">
                        {farmer.address.slice(0, 6)}...{farmer.address.slice(-4)}
                      </code>
                    </td>
                    <td>{farmer.credits}</td>
                    <td>{farmer.pendingCredits}</td>
                    <td>
                      <span className={`status-badge ${farmer.verified ? 'verified' : 'pending'}`}>
                        {farmer.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => handleViewFarmer(farmer.address)}
                        >
                          View
                        </button>
                        {!farmer.verified && (
                          <button 
                            className="action-btn verify"
                            onClick={() => handleVerifyFarm(farmer.address)}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Farm Details */}
      {hasFarm && (
        <div className="carbon-section">
          <div className="section-header">
            <h2>Farm Details</h2>
            {isAdminViewing && (
              <span className="viewing-badge">
                Viewing: {selectedFarmerAddress.slice(0, 6)}...{selectedFarmerAddress.slice(-4)}
              </span>
            )}
          </div>
          <div className="farm-details-grid">
            <div className="farm-detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{farmData.name}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Location</span>
              <span className="detail-value">{farmData.location}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Type</span>
              <span className="detail-value">{farmData.type}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Livestock</span>
              <span className="detail-value">{farmData.livestock}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Total Emissions</span>
              <span className="detail-value">{farmData.emissions} kg CO₂e</span>
            </div>
            <div className="farm-detail-item highlight">
              <span className="detail-label">Total Credits</span>
              <span className="detail-value credits">{farmData.credits}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Pending Credits</span>
              <span className="detail-value pending">{farmData.pending}</span>
            </div>
            <div className="farm-detail-item">
              <span className="detail-label">Status</span>
              <span className={`detail-value ${farmData.verified ? 'verified' : 'pending'}`}>
                {farmData.verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="carbon-section">
        <div className="section-header">
          <h2>Carbon Analytics</h2>
        </div>
        <div className="charts-grid">
          <div className="chart-card">
            <h4>Emissions & Credits Trend</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={getMonthlyEmissionData()}>
                <defs>
                  <linearGradient id="emissionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F44336" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F44336" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="creditsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="emissions" 
                  stroke="#F44336" 
                  fill="url(#emissionsGradient)" 
                  name="Emissions (kg)"
                />
                <Area 
                  type="monotone" 
                  dataKey="credits" 
                  stroke="#4CAF50" 
                  fill="url(#creditsGradient)" 
                  name="Credits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Emissions by Source</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getSourceData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getSourceData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Verification Status</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getVerificationData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {getVerificationData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={['#4CAF50', '#FF9800', '#9E9E9E'][index % 3]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Credits Overview</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={getCreditData()}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }} 
                />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Emissions Records */}
      {emissions.length > 0 && (
        <div className="carbon-section">
          <div className="section-header">
            <h2>Emission Records</h2>
            <span className="section-count">
              {emissions.filter(e => e.verified).length}/{emissions.length} verified
            </span>
          </div>
          <div className="carbon-table-container">
            <table className="carbon-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Emissions</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Verifier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emissions.map((record) => (
                  <tr key={record.id}>
                    <td>#{record.id}</td>
                    <td>{record.timestamp}</td>
                    <td>{record.emissions} kg</td>
                    <td>{record.source}</td>
                    <td>
                      <span className={`status-badge ${record.verified ? 'verified' : 'pending'}`}>
                        {record.verified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {record.verified ? (
                        <code className="address-code">
                          {record.verifier.slice(0, 6)}...{record.verifier.slice(-4)}
                        </code>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => setSelectedRecord(record)}
                        >
                          View
                        </button>
                        {isVerifier && !record.verified && (
                          <button 
                            className="action-btn verify"
                            onClick={() => handleVerifyEmissions(record.id)}
                            disabled={submitting}
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty States */}
      {!hasFarm && isFarmer && (
        <div className="carbon-empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No Farm Registered</h3>
          <p>Register your farm to start tracking carbon emissions and earning credits.</p>
          <button 
            className="carbon-btn carbon-btn-primary"
            onClick={() => setShowRegisterModal(true)}
          >
            Register Farm
          </button>
        </div>
      )}

      {hasFarm && emissions.length === 0 && (
        <div className="carbon-empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Emissions Logged</h3>
          <p>Start logging your farm's emissions to earn carbon credits.</p>
          {isFarmer && !isAdmin && (
            <button 
              className="carbon-btn carbon-btn-primary"
              onClick={() => setShowEmissionModal(true)}
            >
              Log Emissions
            </button>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Emission Details Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Emission Record #{selectedRecord.id}</h2>
              <button className="modal-close" onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">{selectedRecord.timestamp}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Emissions</span>
                <span className="detail-value">{selectedRecord.emissions} kg CO₂e</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Source</span>
                <span className="detail-value">{selectedRecord.source}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className={`detail-value ${selectedRecord.verified ? 'verified' : 'pending'}`}>
                  {selectedRecord.verified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              {selectedRecord.verified && (
                <div className="detail-row">
                  <span className="detail-label">Verified By</span>
                  <span className="detail-value code">
                    {selectedRecord.verifier}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Hash</span>
                <span className="detail-value code" style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>
                  {selectedRecord.hash}
                </span>
              </div>
            </div>
            <div className="modal-footer">
              {isVerifier && !selectedRecord.verified && (
                <button 
                  className="carbon-btn carbon-btn-success"
                  onClick={() => {
                    handleVerifyEmissions(selectedRecord.id);
                    setSelectedRecord(null);
                  }}
                >
                  Verify Emissions
                </button>
              )}
              <button className="carbon-btn carbon-btn-secondary" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Farm Modal */}
      {showRegisterModal && (
        <div className="modal-overlay" onClick={() => setShowRegisterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Register Farm</h2>
              <button className="modal-close" onClick={() => setShowRegisterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterFarm}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Farm Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Green Valley Farm"
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
                <div className="form-group">
                  <label>Farm Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="styled-select"
                  >
                    <option value="DAIRY">Dairy</option>
                    <option value="BEEF">Beef</option>
                    <option value="MIXED">Mixed</option>
                    <option value="CROPS">Crops</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Livestock Count *</label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.livestockCount}
                    onChange={(e) => setFormData({...formData, livestockCount: e.target.value})}
                    required
                    min="0"
                    className="styled-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="carbon-btn carbon-btn-secondary" onClick={() => setShowRegisterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="carbon-btn carbon-btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Emissions Modal */}
      {showEmissionModal && (
        <div className="modal-overlay" onClick={() => setShowEmissionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Emissions</h2>
              <button className="modal-close" onClick={() => setShowEmissionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLogEmissions}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Emissions (kg CO₂e) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.emissions}
                    onChange={(e) => setFormData({...formData, emissions: e.target.value})}
                    required
                    min="1"
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Source *</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    className="styled-select"
                  >
                    <option value="ENTERIC">Enteric Fermentation</option>
                    <option value="MANURE">Manure Management</option>
                    <option value="FEED">Feed Production</option>
                    <option value="ENERGY">Energy Use</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>IPFS Hash</label>
                  <input
                    type="text"
                    placeholder="QmHash..."
                    value={formData.hash}
                    onChange={(e) => setFormData({...formData, hash: e.target.value})}
                    className="styled-input"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="carbon-btn carbon-btn-secondary" onClick={() => setShowEmissionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="carbon-btn carbon-btn-primary" disabled={submitting}>
                  {submitting ? 'Logging...' : 'Log Emissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Farm Modal */}
      {showVerifyFarmModal && (
        <div className="modal-overlay" onClick={() => setShowVerifyFarmModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify Farm</h2>
              <button className="modal-close" onClick={() => setShowVerifyFarmModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Select a farmer to verify their farm for carbon credits:</p>
              <div className="form-group">
                <label>Select Farmer</label>
                <select
                  value={selectedFarmer}
                  onChange={(e) => setSelectedFarmer(e.target.value)}
                  className="styled-select"
                >
                  <option value="">Select a farmer...</option>
                  {farmersList
                    .filter(f => !f.verified)
                    .map((farmer) => (
                      <option key={farmer.address} value={farmer.address}>
                        {farmer.name} ({farmer.address.slice(0, 6)}...) - {farmer.emissions} kg emissions
                      </option>
                    ))}
                </select>
              </div>
              {selectedFarmer && (
                <div className="verification-preview">
                  <p><strong>Farm:</strong> {farmersList.find(f => f.address === selectedFarmer)?.name}</p>
                  <p><strong>Emissions:</strong> {farmersList.find(f => f.address === selectedFarmer)?.emissions} kg</p>
                  <p><strong>Pending Credits:</strong> {farmersList.find(f => f.address === selectedFarmer)?.pendingCredits}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="carbon-btn carbon-btn-secondary" onClick={() => setShowVerifyFarmModal(false)}>
                Cancel
              </button>
              <button 
                className="carbon-btn carbon-btn-success" 
                onClick={() => {
                  if (selectedFarmer) {
                    handleVerifyFarm(selectedFarmer);
                  } else {
                    showToast('Please select a farmer', 'error');
                  }
                }}
                disabled={submitting || !selectedFarmer}
              >
                {submitting ? 'Verifying...' : 'Verify Farm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarbonCredits;