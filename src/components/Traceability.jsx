import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, getSlaughterhouses, getAnimalHealthRecords, getAnimalInfo, CONTRACT_ADDRESSES, getSaleHistory } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  MapPin, Truck, Calendar, CheckCircle, Clock, AlertCircle,
  Search, RefreshCw, PlusCircle, Eye, Check, XCircle,
  Target, TrendingUp, PieChart as PieChartIcon, BarChart2,
  Activity, FileText, Heart, Droplet, Clipboard, ShoppingBag,
  DollarSign, Users, List
} from 'react-feather';

// ============================================
// TRACEABILITY COMPONENT
// ============================================
function Traceability({ account }) {
  const [movements, setMovements] = useState([]);
  const [slaughterRecords, setSlaughterRecords] = useState([]);
  const [livestockList, setLivestockList] = useState([]);
  const [myLivestock, setMyLivestock] = useState([]);
  const [deceasedLivestock, setDeceasedLivestock] = useState([]);
  const [selectedLivestock, setSelectedLivestock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showSlaughterModal, setShowSlaughterModal] = useState(false);
  const [showHealthRecordsModal, setShowHealthRecordsModal] = useState(false);
  const [showSaleHistoryModal, setShowSaleHistoryModal] = useState(false);
  const [selectedAnimalHealth, setSelectedAnimalHealth] = useState(null);
  const [slaughterhouseInfo, setSlaughterhouseInfo] = useState(null);
  const [slaughterhouses, setSlaughterhouses] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [saleHistory, setSaleHistory] = useState({ sales: [], purchases: [] });
  const [saleHistoryLoading, setSaleHistoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    livestockId: '',
    fromLocation: '',
    toLocation: '',
    toSlaughterhouse: '',
    fromDistrict: '',
    toDistrict: '',
    transportType: 'Truck',
    permitNumber: '',
    purpose: 'SALE',
    notes: '',
    location: '',
    slaughterhouseName: '',
    licenseNumber: '',
    weight: '',
    meatGrade: 'A',
    inspectionResult: 'PASS'
  });
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalMovements: 0,
    totalSlaughter: 0,
    completedMovements: 0,
    pendingMovements: 0,
    aliveCount: 0,
    deceasedCount: 0,
    totalSales: 0,
    totalPurchases: 0
  });
  const [isRegisteredInTraceability, setIsRegisteredInTraceability] = useState(false);
  const [registeringInTraceability, setRegisteringInTraceability] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [healthRecordsLoading, setHealthRecordsLoading] = useState(false);
  const [fixingStatus, setFixingStatus] = useState(false);

  const { userRole, isAdminUser } = useRole();
  const { showToast } = useToast();

  const isFarmer = userRole === 'farmer' || userRole === 'admin';
  const isRegulator = userRole === 'regulator' || userRole === 'admin';
  const isSlaughterhouse = userRole === 'slaughterhouse';
  const canViewTraceability = isFarmer || isRegulator || isSlaughterhouse;
  const canRecordSlaughter = isRegulator || isSlaughterhouse;
  const canMarkDeceased = isAdminUser || isRegulator;

  // ============================================
  // REGISTER FARMER IN TRACEABILITY MANAGER
  // ============================================
  const registerFarmerInTraceability = async () => {
    try {
      setRegisteringInTraceability(true);
      const contracts = await getContracts();
      
      const isRegistered = await safeContractCall(contracts.traceabilityManager, 'isFarmerRegistered', account);
      
      if (isRegistered.success && isRegistered.data) {
        setIsRegisteredInTraceability(true);
        return true;
      }
      
      const tx = await contracts.traceabilityManager.registerFarmer(account);
      await tx.wait();
      
      setIsRegisteredInTraceability(true);
      showToast('Auto-registered as farmer in Traceability system', 'success', 3000);
      return true;
    } catch (err) {
      console.error('Error registering in TraceabilityManager:', err);
      showToast('Could not register in Traceability. Please contact admin.', 'warning', 4000);
      return false;
    } finally {
      setRegisteringInTraceability(false);
    }
  };

  // ============================================
  // GET SLAUGHTERHOUSE INFO
  // ============================================
  const getSlaughterhouseInfo = async () => {
    try {
      const savedData = localStorage.getItem('slaughterhouse_data');
      if (savedData) {
        const allData = JSON.parse(savedData);
        const myData = allData[account.toLowerCase()];
        if (myData) {
          setSlaughterhouseInfo(myData);
          setFormData(prev => ({
            ...prev,
            slaughterhouseName: myData.name || '',
            location: myData.location || '',
            licenseNumber: myData.licenseNumber || ''
          }));
          return;
        }
      }
      
      setSlaughterhouseInfo({
        name: `Slaughterhouse ${account.slice(0, 6)}...${account.slice(-4)}`,
        location: 'Not specified',
        licenseNumber: 'N/A'
      });
    } catch (err) {
      console.error('Error getting slaughterhouse info:', err);
    }
  };

  // ============================================
  // VIEW HEALTH RECORDS
  // ============================================
  const viewHealthRecords = async (livestockId) => {
    try {
      setHealthRecordsLoading(true);
      const records = await getAnimalHealthRecords(livestockId);
      const animal = livestockList.find(l => l.id === Number(livestockId));
      setSelectedAnimalHealth({
        animal: animal,
        records: records
      });
      setShowHealthRecordsModal(true);
    } catch (err) {
      console.error('Error viewing health records:', err);
      showToast('Failed to load health records: ' + err.message, 'error');
    } finally {
      setHealthRecordsLoading(false);
    }
  };

  // ============================================
  // VIEW SALE HISTORY
  // ============================================
  const viewSaleHistory = async () => {
    try {
      setSaleHistoryLoading(true);
      const history = await getSaleHistory(account);
      setSaleHistory(history);
      setShowSaleHistoryModal(true);
    } catch (err) {
      console.error('Error loading sale history:', err);
      showToast('Failed to load sale history: ' + err.message, 'error');
    } finally {
      setSaleHistoryLoading(false);
    }
  };

  // ============================================
  // LOAD DATA
  // ============================================
  const loadData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      const isFarmerInRegistry = await safeContractCall(contracts.livestockRegistry, 'isFarmer', account);
      
      if (isFarmerInRegistry.success && isFarmerInRegistry.data) {
        await registerFarmerInTraceability();
      }

      if (isSlaughterhouse) {
        await getSlaughterhouseInfo();
      }

      // Load slaughterhouses for dropdown - only for farmers
      if (isFarmer) {
        const shList = await getSlaughterhouses();
        setSlaughterhouses(shList);
      }

      // Load livestock list - INCLUDING DECEASED
      const totalLivestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
      const total = totalLivestock.success ? Number(totalLivestock.data) : 0;
      
      const livestock = [];
      const myLivestockList = [];
      const deceasedList = [];
      let aliveCount = 0;
      let deceasedCount = 0;
      
      for (let i = 0; i < total; i++) {
        const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
        if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
          const animal = {
            id: i,
            name: info.data[0] || `Livestock_${i}`,
            breed: info.data[1] || 'Unknown',
            owner: info.data[2],
            alive: info.data[3]
          };
          livestock.push(animal);
          
          if (info.data[3]) {
            aliveCount++;
          } else {
            deceasedCount++;
            deceasedList.push(animal);
          }
          
          if (info.data[2].toLowerCase() === account.toLowerCase()) {
            myLivestockList.push(animal);
          }
        }
      }
      setLivestockList(livestock);
      setMyLivestock(myLivestockList);
      setDeceasedLivestock(deceasedList);

      // Load movements
      const mCount = await safeContractCall(contracts.traceabilityManager, 'getMovementCount');
      const count = mCount.success ? Number(mCount.data) : 0;
      
      const movementList = [];
      let completed = 0, pending = 0;
      
      for (let i = 0; i < count; i++) {
        try {
          const [from, to, livestockId, arrived, fromDistrict, toDistrict, transport, permit, purpose, date] = await Promise.all([
            safeContractCall(contracts.traceabilityManager, 'mFrom', i),
            safeContractCall(contracts.traceabilityManager, 'mTo', i),
            safeContractCall(contracts.traceabilityManager, 'mLivestock', i),
            safeContractCall(contracts.traceabilityManager, 'mArrived', i),
            safeContractCall(contracts.traceabilityManager, 'mFromDistrict', i),
            safeContractCall(contracts.traceabilityManager, 'mToDistrict', i),
            safeContractCall(contracts.traceabilityManager, 'mTransport', i),
            safeContractCall(contracts.traceabilityManager, 'mPermit', i),
            safeContractCall(contracts.traceabilityManager, 'mPurpose', i),
            safeContractCall(contracts.traceabilityManager, 'mDate', i)
          ]);
          
          if (from.success) {
            const animal = livestock.find(l => l.id === Number(livestockId.data));
            const movement = {
              id: i,
              from: from.data || 'Unknown',
              to: to.success ? to.data : 'Unknown',
              livestockId: livestockId.success ? Number(livestockId.data) : 0,
              livestockName: animal ? animal.name : `#${livestockId.data}`,
              isDeceased: animal ? !animal.alive : false,
              arrived: arrived.success ? arrived.data : false,
              fromDistrict: fromDistrict.success ? fromDistrict.data : 'N/A',
              toDistrict: toDistrict.success ? toDistrict.data : 'N/A',
              transport: transport.success ? transport.data : 'N/A',
              permit: permit.success ? permit.data : 'N/A',
              purpose: purpose.success ? purpose.data : 'N/A',
              date: date.success ? new Date(Number(date.data) * 1000).toLocaleDateString() : 'N/A',
              status: arrived.success && arrived.data ? 'Completed' : 'In Transit'
            };
            movementList.push(movement);
            if (arrived.success && arrived.data) completed++;
            else pending++;
          }
        } catch (err) {
          console.warn(`Error loading movement ${i}:`, err.message);
        }
      }
      setMovements(movementList);
      setStats({
        totalMovements: movementList.length,
        totalSlaughter: 0,
        completedMovements: completed,
        pendingMovements: pending,
        aliveCount: aliveCount,
        deceasedCount: deceasedCount,
        totalSales: 0,
        totalPurchases: 0
      });

      // Load slaughter records
      const sCount = await safeContractCall(contracts.traceabilityManager, 'getSlaughterCount');
      const sTotal = sCount.success ? Number(sCount.data) : 0;
      
      const slaughterList = [];
      for (let i = 0; i < sTotal; i++) {
        try {
          const [location, house, livestockId, weight, grade, inspection, cert, date, valid] = await Promise.all([
            safeContractCall(contracts.traceabilityManager, 'sLocation', i),
            safeContractCall(contracts.traceabilityManager, 'sHouse', i),
            safeContractCall(contracts.traceabilityManager, 'sLivestock', i),
            safeContractCall(contracts.traceabilityManager, 'sWeight', i),
            safeContractCall(contracts.traceabilityManager, 'sGrade', i),
            safeContractCall(contracts.traceabilityManager, 'sInspection', i),
            safeContractCall(contracts.traceabilityManager, 'sCert', i),
            safeContractCall(contracts.traceabilityManager, 'sDate', i),
            safeContractCall(contracts.traceabilityManager, 'sValid', i)
          ]);
          
          if (location.success) {
            const animal = livestock.find(l => l.id === Number(livestockId.data));
            slaughterList.push({
              id: i,
              location: location.data || 'Unknown',
              house: house.success ? house.data : 'Unknown',
              livestockId: livestockId.success ? Number(livestockId.data) : 0,
              livestockName: animal ? animal.name : `#${livestockId.data}`,
              isDeceased: true,
              weight: weight.success ? Number(weight.data) : 0,
              grade: grade.success ? grade.data : 'N/A',
              inspection: inspection.success ? inspection.data : 'N/A',
              cert: cert.success ? cert.data : 'N/A',
              date: date.success ? new Date(Number(date.data) * 1000).toLocaleDateString() : 'N/A',
              valid: valid.success && valid.data ? 'Valid' : 'Invalid',
              status: valid.success && valid.data ? 'Valid' : 'Invalid'
            });
          }
        } catch (err) {
          console.warn(`Error loading slaughter ${i}:`, err.message);
        }
      }
      setSlaughterRecords(slaughterList);
      setStats(prev => ({ ...prev, totalSlaughter: slaughterList.length }));

      // Load sale history
      const history = await getSaleHistory(account);
      setSaleHistory(history);
      setStats(prev => ({ 
        ...prev, 
        totalSales: history.sales.length,
        totalPurchases: history.purchases.length
      }));

      setInitialLoadDone(true);

    } catch (err) {
      console.error('Error loading traceability data:', err);
      setError(err.message);
      showToast('Failed to load traceability data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && !initialLoadDone) {
      loadData();
    }
  }, [account, initialLoadDone]);

  // ============================================
  // RECORD MOVEMENT
  // ============================================
  const handleRecordMovement = async (e) => {
    e.preventDefault();
    
    if (!formData.livestockId || !formData.fromLocation || !formData.toLocation) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const livestockInfo = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', Number(formData.livestockId));
      if (!livestockInfo.success || livestockInfo.data[2].toLowerCase() !== account.toLowerCase()) {
        showToast('You can only record movements for livestock you own.', 'error');
        setSubmitting(false);
        return;
      }

      const isRegistered = await safeContractCall(contracts.traceabilityManager, 'isFarmerRegistered', account);
      if (!isRegistered.success || !isRegistered.data) {
        await registerFarmerInTraceability();
      }

      // Determine destination: if slaughterhouse selected, use its location
      let toLocation = formData.toLocation;
      let toDistrict = formData.toDistrict || 'N/A';
      
      if (formData.toSlaughterhouse) {
        const selectedSH = slaughterhouses.find(sh => sh.address === formData.toSlaughterhouse);
        if (selectedSH) {
          toLocation = selectedSH.location || selectedSH.name;
          toDistrict = selectedSH.location || 'N/A';
        }
      }

      const tx = await contracts.traceabilityManager.recordMovement(
        Number(formData.livestockId),
        formData.fromLocation,
        toLocation,
        formData.fromDistrict || 'N/A',
        toDistrict,
        formData.transportType,
        formData.permitNumber || 'N/A',
        formData.purpose,
        'QmHash' + Date.now()
      );
      
      await tx.wait();
      
      setShowMovementModal(false);
      setFormData({
        livestockId: '',
        fromLocation: '',
        toLocation: '',
        toSlaughterhouse: '',
        fromDistrict: '',
        toDistrict: '',
        transportType: 'Truck',
        permitNumber: '',
        purpose: 'SALE',
        notes: '',
        location: '',
        slaughterhouseName: '',
        licenseNumber: '',
        weight: '',
        meatGrade: 'A',
        inspectionResult: 'PASS'
      });
      setInitialLoadDone(false);
      await loadData();
      
      showToast('Movement recorded successfully', 'success', 5000);
    } catch (err) {
      console.error('Error recording movement:', err);
      showToast('Failed to record movement: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // CONFIRM ARRIVAL
  // ============================================
  const handleConfirmArrival = async (movementId) => {
    try {
      const contracts = await getContracts();
      const tx = await contracts.traceabilityManager.confirmArrival(movementId);
      await tx.wait();
      showToast('Arrival confirmed', 'success', 4000);
      setInitialLoadDone(false);
      await loadData();
    } catch (err) {
      console.error('Error confirming arrival:', err);
      showToast('Failed to confirm arrival: ' + err.message, 'error');
    }
  };

  // ============================================
  // RECORD SLAUGHTER - AUTO MARK AS DECEASED
  // ============================================
  const handleRecordSlaughter = async (e) => {
    e.preventDefault();
    
    if (!formData.livestockId) {
      showToast('Please select livestock.', 'error');
      return;
    }

    const slaughterhouse = slaughterhouseInfo || {
      name: formData.slaughterhouseName || 'Unknown Slaughterhouse',
      location: formData.location || 'Unknown Location',
      licenseNumber: formData.licenseNumber || 'N/A'
    };

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      console.log(`📝 Recording slaughter for livestock #${formData.livestockId}`);
      const tx = await contracts.traceabilityManager.recordSlaughter(
        Number(formData.livestockId),
        slaughterhouse.location,
        slaughterhouse.name,
        slaughterhouse.licenseNumber,
        Number(formData.weight) || 0,
        formData.meatGrade || 'A',
        formData.inspectionResult || 'PASS',
        'QmHash' + Date.now()
      );
      await tx.wait();
      console.log('✅ Slaughter recorded in TraceabilityManager');
      
      console.log(`💀 Auto-marking livestock #${formData.livestockId} as deceased...`);
      
      try {
        const updateTx = await contracts.livestockRegistry.markDeceased(
          Number(formData.livestockId)
        );
        await updateTx.wait();
        console.log(`✅ Livestock #${formData.livestockId} auto-marked as deceased via markDeceased`);
        showToast(`✅ Livestock #${formData.livestockId} slaughtered and marked as deceased!`, 'success', 5000);
      } catch (err) {
        console.error('❌ markDeceased failed:', err.message);
        
        if (err.message.includes('Not authorized')) {
          showToast('⚠️ Slaughter recorded but could not mark as deceased. Please ask admin to mark it.', 'warning', 6000);
        } else if (err.message.includes('Does not exist')) {
          showToast('❌ Livestock does not exist.', 'error');
        } else {
          showToast('⚠️ Slaughter recorded but auto-mark failed: ' + err.message, 'warning', 6000);
        }
        setSubmitting(false);
        return;
      }
      
      const savedData = localStorage.getItem('slaughterhouse_data');
      if (savedData) {
        const allData = JSON.parse(savedData);
        const shKey = account.toLowerCase();
        if (allData[shKey]) {
          allData[shKey].livestockProcessed = (allData[shKey].livestockProcessed || 0) + 1;
          localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));
        }
      }
      
      setShowSlaughterModal(false);
      setFormData({
        livestockId: '',
        fromLocation: '',
        toLocation: '',
        toSlaughterhouse: '',
        fromDistrict: '',
        toDistrict: '',
        transportType: 'Truck',
        permitNumber: '',
        purpose: 'SALE',
        notes: '',
        location: '',
        slaughterhouseName: '',
        licenseNumber: '',
        weight: '',
        meatGrade: 'A',
        inspectionResult: 'PASS'
      });
      
      setInitialLoadDone(false);
      await loadData();
      
    } catch (err) {
      console.error('Error recording slaughter:', err);
      if (err.message && err.message.includes('Not slaughterhouse')) {
        showToast('You are not registered as a slaughterhouse.', 'error');
      } else {
        showToast('Failed to record slaughter: ' + err.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // MANUALLY MARK LIVESTOCK AS DECEASED (Admin/Regulator Only)
  // ============================================
  const handleMarkDeceased = async (livestockId) => {
    if (!window.confirm(`⚠️ Are you sure you want to mark livestock #${livestockId} as DECEASED? This cannot be undone.`)) {
      return;
    }
    
    try {
      setFixingStatus(true);
      const contracts = await getContracts();
      const tx = await contracts.livestockRegistry.markDeceased(Number(livestockId));
      await tx.wait();
      
      showToast(`✅ Livestock #${livestockId} marked as deceased!`, 'success', 5000);
      setInitialLoadDone(false);
      await loadData();
    } catch (err) {
      console.error('Error marking as deceased:', err);
      showToast('❌ Failed to mark as deceased: ' + err.message, 'error');
    } finally {
      setFixingStatus(false);
    }
  };

  // ============================================
  // REFRESH
  // ============================================
  const handleRefresh = () => {
    setInitialLoadDone(false);
    loadData();
  };

  // ============================================
  // VIEW LIVESTOCK TRACEABILITY
  // ============================================
  const viewTraceability = (livestockId) => {
    const livestock = livestockList.find(l => l.id === Number(livestockId));
    const movementHistory = movements.filter(m => m.livestockId === Number(livestockId));
    const slaughterHistory = slaughterRecords.filter(s => s.livestockId === Number(livestockId));
    const livestockSales = saleHistory.sales.filter(s => s.livestockId === Number(livestockId));
    const livestockPurchases = saleHistory.purchases.filter(p => p.livestockId === Number(livestockId));
    
    setSelectedLivestock({
      ...livestock,
      movements: movementHistory,
      slaughter: slaughterHistory,
      sales: livestockSales,
      purchases: livestockPurchases,
      isDeceased: livestock ? !livestock.alive : false
    });
  };

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canViewTraceability) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only farmers, regulators, and slaughterhouses can view traceability.</p>
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
        <p className="loading-text">Loading traceability data...</p>
      </div>
    );
  }

  // Filter movements - show deceased status
  const filteredMovements = movements.filter(m =>
    m.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.livestockName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const transportTypes = ['Truck', 'Train', 'Ship', 'Air', 'Foot', 'Other'];
  const purposes = ['SALE', 'BREEDING', 'SLAUGHTER', 'EXHIBITION', 'TRANSFER', 'OTHER'];
  const meatGrades = ['A', 'B', 'C', 'D', 'E'];

  const getMovementChartData = () => {
    const statusCount = { Completed: 0, 'In Transit': 0 };
    movements.forEach(m => {
      if (m.arrived) statusCount.Completed++;
      else statusCount['In Transit']++;
    });
    return Object.keys(statusCount).map(key => ({
      name: key,
      value: statusCount[key]
    }));
  };

  const getMonthlyMovementData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      name: month,
      movements: Math.max(0, Math.floor((movements.length / 6) * (i + 1))),
      completed: Math.max(0, Math.floor((stats.completedMovements / 6) * (i + 1)))
    }));
  };

  // Count available animals for slaughter (only alive)
  const availableAnimals = livestockList.filter(l => 
    l.alive === true && !slaughterRecords.some(s => s.livestockId === l.id && s.valid === 'Valid')
  );

  return (
    <div className="traceability">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>📍 Traceability</h1>
          <p className="page-subtitle">Track livestock movement from farm to market</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>
              ✅ Alive: {stats.aliveCount}
            </span>
            <span className="debug-badge" style={{ background: '#ffebee', color: '#c62828' }}>
              💀 Deceased: {stats.deceasedCount}
            </span>
            <span className="debug-badge">Movements: {movements.length}</span>
            <span className="debug-badge" style={{ background: '#4CAF50', color: 'white' }}>
              📊 Sales: {stats.totalSales}
            </span>
            <span className="debug-badge" style={{ background: '#2196F3', color: 'white' }}>
              🛒 Purchases: {stats.totalPurchases}
            </span>
            {isRegisteredInTraceability && (
              <span className="debug-badge registered-badge">Registered in Traceability</span>
            )}
            {isSlaughterhouse && slaughterhouseInfo && (
              <span className="debug-badge registered-badge" style={{ background: '#FF9800' }}>
                🏭 {slaughterhouseInfo.name}
              </span>
            )}
          </div>
        </div>
        <div className="header-right">
          {isFarmer && myLivestock.filter(l => l.alive).length > 0 && (
            <button 
              className="btn-primary"
              onClick={() => setShowMovementModal(true)}
            >
              <PlusCircle size={16} /> Record Movement
            </button>
          )}
          {canRecordSlaughter && availableAnimals.length > 0 && (
            <button 
              className="btn-primary"
              onClick={() => setShowSlaughterModal(true)}
              style={{ background: '#FF9800' }}
            >
              <Target size={16} /> Record Slaughter ({availableAnimals.length})
            </button>
          )}
          {canRecordSlaughter && availableAnimals.length === 0 && stats.aliveCount > 0 && (
            <button 
              className="btn-primary"
              style={{ background: '#9E9E9E', cursor: 'not-allowed', opacity: 0.6 }}
              disabled
            >
              <Target size={16} /> No Animals Available
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={viewSaleHistory}
            style={{ background: '#9C27B0' }}
          >
            <List size={16} /> Sale History ({stats.totalSales + stats.totalPurchases})
          </button>
          <button className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid-compact">
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><MapPin size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Total Movements</h3>
            <p className="stat-number-compact">{stats.totalMovements}</p>
            <span className="stat-label-compact">All movements</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><CheckCircle size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Completed</h3>
            <p className="stat-number-compact">{stats.completedMovements}</p>
            <span className="stat-label-compact">Arrived</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Clock size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>In Transit</h3>
            <p className="stat-number-compact">{stats.pendingMovements}</p>
            <span className="stat-label-compact">Pending arrival</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Target size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>🥩 Slaughter</h3>
            <p className="stat-number-compact">{stats.totalSlaughter}</p>
            <span className="stat-label-compact">Total records</span>
          </div>
        </div>
        <div className="stat-card-compact" style={{ borderColor: '#4CAF50' }}>
          <div className="stat-card-compact-icon" style={{ color: '#4CAF50' }}>✅</div>
          <div className="stat-card-compact-content">
            <h3>Alive</h3>
            <p className="stat-number-compact" style={{ color: '#4CAF50' }}>{stats.aliveCount}</p>
            <span className="stat-label-compact">Living animals</span>
          </div>
        </div>
        <div className="stat-card-compact" style={{ borderColor: '#F44336' }}>
          <div className="stat-card-compact-icon" style={{ color: '#F44336' }}>💀</div>
          <div className="stat-card-compact-content">
            <h3>Deceased</h3>
            <p className="stat-number-compact" style={{ color: '#F44336' }}>{stats.deceasedCount}</p>
            <span className="stat-label-compact">Slaughtered animals</span>
          </div>
        </div>
      </div>

      {/* Sale History Stats Cards */}
      <div className="stats-grid-compact" style={{ marginTop: '12px' }}>
        <div className="stat-card-compact" style={{ borderColor: '#4CAF50' }}>
          <div className="stat-card-compact-icon"><DollarSign size={20} color="#4CAF50" /></div>
          <div className="stat-card-compact-content">
            <h3>💰 Sales</h3>
            <p className="stat-number-compact" style={{ color: '#4CAF50' }}>{stats.totalSales}</p>
            <span className="stat-label-compact">Animals sold</span>
          </div>
        </div>
        <div className="stat-card-compact" style={{ borderColor: '#2196F3' }}>
          <div className="stat-card-compact-icon"><ShoppingBag size={20} color="#2196F3" /></div>
          <div className="stat-card-compact-content">
            <h3>🛒 Purchases</h3>
            <p className="stat-number-compact" style={{ color: '#2196F3' }}>{stats.totalPurchases}</p>
            <span className="stat-label-compact">Animals bought</span>
          </div>
        </div>
        <div className="stat-card-compact" style={{ borderColor: '#FF9800' }}>
          <div className="stat-card-compact-icon"><Users size={20} color="#FF9800" /></div>
          <div className="stat-card-compact-content">
            <h3>Total Transactions</h3>
            <p className="stat-number-compact" style={{ color: '#FF9800' }}>{stats.totalSales + stats.totalPurchases}</p>
            <span className="stat-label-compact">All sales & purchases</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h2><TrendingUp size={20} /> Traceability Analytics</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h4><PieChartIcon size={16} /> Movement Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getMovementChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {getMovementChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#4CAF50', '#FF9800'][index % 2]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><Activity size={16} /> Monthly Movement Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={getMonthlyMovementData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="movements" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="completed" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><BarChart2 size={16} /> Movement Purpose</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={purposes.map(p => ({ name: p, value: movements.filter(m => m.purpose === p).length }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><Truck size={16} /> Transport Methods</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={transportTypes.map(t => ({ name: t, value: movements.filter(m => m.transport === t).length }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  label
                >
                  {transportTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0', '#00BCD4'][index % 6]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="search-container">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search movements by location, purpose, or livestock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-large"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="table-container">
        <table className="traceability-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>From</th>
              <th>To</th>
              <th>Livestock</th>
              <th>Transport</th>
              <th>Purpose</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <div className="empty-state-content">
                    <MapPin size={48} className="empty-icon" />
                    <p>No movements recorded yet</p>
                    {isFarmer && myLivestock.filter(l => l.alive).length > 0 && (
                      <button 
                        className="btn-primary"
                        onClick={() => setShowMovementModal(true)}
                      >
                        <PlusCircle size={16} /> Record First Movement
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovements.map((movement) => {
                const isDeceased = movement.isDeceased || false;
                return (
                  <tr key={movement.id} style={isDeceased ? { opacity: 0.6, background: '#fff5f5' } : {}}>
                    <td>#{movement.id}</td>
                    <td>{movement.from}</td>
                    <td>{movement.to}</td>
                    <td>
                      <button 
                        className="livestock-link"
                        onClick={() => viewTraceability(movement.livestockId)}
                        style={isDeceased ? { color: '#F44336' } : {}}
                      >
                        {movement.livestockName || `#${movement.livestockId}`}
                        {isDeceased && ' 💀'}
                      </button>
                    </td>
                    <td>{movement.transport}</td>
                    <td>{movement.purpose}</td>
                    <td>{movement.date}</td>
                    <td>
                      <span className={`status-badge ${movement.arrived ? 'active' : 'inactive'}`}>
                        {movement.arrived ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {movement.status}
                        {isDeceased && ' 💀'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => viewTraceability(movement.livestockId)}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn health"
                          onClick={() => viewHealthRecords(movement.livestockId)}
                          title="View Health Records"
                        >
                          <FileText size={14} /> Health
                        </button>
                        {isFarmer && !movement.arrived && !isDeceased && (
                          <button 
                            className="action-btn activate"
                            onClick={() => handleConfirmArrival(movement.id)}
                          >
                            <Check size={14} /> Arrive
                          </button>
                        )}
                        {canMarkDeceased && !isDeceased && (
                          <button 
                            className="action-btn deactivate"
                            onClick={() => handleMarkDeceased(movement.livestockId)}
                            title="Mark as Deceased"
                            style={{ background: '#ffebee', color: '#c62828' }}
                          >
                            💀
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slaughter Records */}
      {slaughterRecords.length > 0 && (
        <div className="slaughter-section">
          <h2><Target size={20} /> 🥩 Slaughter Records</h2>
          <div className="table-container">
            <table className="traceability-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Location</th>
                  <th>House</th>
                  <th>Livestock</th>
                  <th>Weight</th>
                  <th>Grade</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slaughterRecords.map((record) => (
                  <tr key={record.id} style={{ background: '#fff5f5' }}>
                    <td>#{record.id}</td>
                    <td>{record.location}</td>
                    <td>{record.house}</td>
                    <td>
                      <button 
                        className="livestock-link"
                        onClick={() => viewTraceability(record.livestockId)}
                        style={{ color: '#F44336' }}
                      >
                        {record.livestockName || `#${record.livestockId}`} 💀
                      </button>
                    </td>
                    <td>{record.weight} kg</td>
                    <td>{record.grade}</td>
                    <td>{record.date}</td>
                    <td>
                      <span className="status-badge inactive">
                        💀 Slaughtered
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => viewTraceability(record.livestockId)}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="action-btn health"
                          onClick={() => viewHealthRecords(record.livestockId)}
                          title="View Health Records"
                        >
                          <FileText size={14} /> Health
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deceased Livestock Section */}
      {deceasedLivestock.length > 0 && (
        <div className="slaughter-section" style={{ marginTop: '16px' }}>
          <h2>💀 Deceased / Slaughtered Livestock</h2>
          <div className="table-container">
            <table className="traceability-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Breed</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deceasedLivestock.map((animal) => (
                  <tr key={animal.id} style={{ background: '#fff5f5', opacity: 0.7 }}>
                    <td>#{animal.id}</td>
                    <td>{animal.name} 💀</td>
                    <td>{animal.breed}</td>
                    <td>
                      <span className="address-text">
                        {animal.owner.slice(0, 6)}...{animal.owner.slice(-4)}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge inactive">💀 Deceased</span>
                    </td>
                    <td>
                      <button 
                        className="action-btn view"
                        onClick={() => viewTraceability(animal.id)}
                      >
                        <Eye size={14} /> View Trace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traceability Modal */}
      {selectedLivestock && (
        <div className="modal-overlay" onClick={() => setSelectedLivestock(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><MapPin size={20} /> Traceability: {selectedLivestock.name} (#{selectedLivestock.id})</h2>
              {selectedLivestock.isDeceased && (
                <span className="status-badge inactive" style={{ marginLeft: '12px' }}>💀 Deceased</span>
              )}
              <button className="modal-close" onClick={() => setSelectedLivestock(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Status Alert */}
              {selectedLivestock.isDeceased && (
                <div className="verification-preview" style={{ 
                  background: '#ffebee', 
                  border: '1px solid #F44336',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <p style={{ color: '#c62828', fontWeight: '600' }}>
                    ⚠️ This animal has been slaughtered and is no longer alive.
                  </p>
                </div>
              )}

              {/* Mark Deceased Button for Admin/Regulator */}
              {canMarkDeceased && !selectedLivestock.isDeceased && (
                <div style={{ marginBottom: '16px' }}>
                  <button 
                    className="btn-danger"
                    onClick={() => handleMarkDeceased(selectedLivestock.id)}
                    disabled={fixingStatus}
                    style={{
                      background: '#F44336',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {fixingStatus ? 'Processing...' : '💀 Mark as Deceased'}
                  </button>
                </div>
              )}

              <div className="traceability-timeline">
                <h4><Activity size={16} /> Movement History</h4>
                {selectedLivestock.movements.length === 0 ? (
                  <p>No movements recorded for this animal.</p>
                ) : (
                  selectedLivestock.movements.map((m, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className="timeline-date"><Calendar size={12} /> {m.date}</span>
                          <span className={`status-badge ${m.arrived ? 'active' : 'inactive'}`}>
                            {m.arrived ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {m.status}
                          </span>
                        </div>
                        <div className="timeline-body">
                          <p><strong>From:</strong> {m.from} <strong>To:</strong> {m.to}</p>
                          <p><strong>Transport:</strong> {m.transport} | <strong>Purpose:</strong> {m.purpose}</p>
                          <p><strong>Permit:</strong> {m.permit}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="traceability-slaughter">
                <h4><Target size={16} /> 🥩 Slaughter History</h4>
                {selectedLivestock.slaughter.length === 0 ? (
                  <p>No slaughter records for this animal.</p>
                ) : (
                  selectedLivestock.slaughter.map((s, idx) => (
                    <div key={idx} className="slaughter-item" style={{ background: '#fff5f5', border: '1px solid #F44336' }}>
                      <div className="slaughter-header">
                        <span className="slaughter-date"><Calendar size={12} /> {s.date}</span>
                        <span className="status-badge inactive">💀 Slaughtered</span>
                      </div>
                      <div className="slaughter-body">
                        <p><strong>Location:</strong> {s.location}</p>
                        <p><strong>House:</strong> {s.house}</p>
                        <p><strong>Weight:</strong> {s.weight} kg | <strong>Grade:</strong> {s.grade}</p>
                        <p><strong>Certificate:</strong> {s.cert}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Sale History Section */}
              <div className="traceability-sales" style={{ marginTop: '16px' }}>
                <h4><DollarSign size={16} /> Sale History</h4>
                {selectedLivestock.sales && selectedLivestock.sales.length > 0 ? (
                  selectedLivestock.sales.map((sale, idx) => (
                    <div key={idx} className="sale-item" style={{ background: '#e8f5e9', border: '1px solid #4CAF50', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                      <div className="sale-header">
                        <span className="sale-date"><Calendar size={12} /> {new Date(sale.timestamp).toLocaleDateString()}</span>
                        <span className="status-badge active">✅ Sold</span>
                      </div>
                      <div className="sale-body">
                        <p><strong>Seller:</strong> {sale.seller.slice(0, 6)}...{sale.seller.slice(-4)}</p>
                        <p><strong>Buyer:</strong> {sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}</p>
                        <p><strong>Price:</strong> {sale.price} ETH</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No sale records for this animal.</p>
                )}
              </div>

              <div className="modal-footer" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setSelectedLivestock(null);
                    viewHealthRecords(selectedLivestock.id);
                  }}
                  style={{ background: '#2196F3' }}
                >
                  <FileText size={16} /> View Full Health Records
                </button>
                <button className="btn-secondary" onClick={() => setSelectedLivestock(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale History Modal */}
      {showSaleHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowSaleHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><List size={20} /> Sale & Purchase History</h2>
              <div className="modal-subtitle">
                {saleHistoryLoading ? 'Loading...' : `${saleHistory.sales.length} sales, ${saleHistory.purchases.length} purchases`}
              </div>
              <button className="modal-close" onClick={() => setShowSaleHistoryModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {saleHistoryLoading ? (
                <div className="loading-container-centered" style={{ minHeight: '200px' }}>
                  <div className="loading-spinner-centered"></div>
                  <p className="loading-text">Loading sale history...</p>
                </div>
              ) : (
                <>
                  {/* Sales Section */}
                  <h3 style={{ color: '#4CAF50' }}>💰 Sales Made</h3>
                  {saleHistory.sales.length === 0 ? (
                    <p style={{ color: '#666', padding: '12px' }}>No sales recorded.</p>
                  ) : (
                    <div className="table-container">
                      <table className="traceability-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Animal</th>
                            <th>Buyer</th>
                            <th>Price</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleHistory.sales.map((sale) => (
                            <tr key={sale.id}>
                              <td>#{sale.id}</td>
                              <td>{sale.animalName} (#{sale.livestockId})</td>
                              <td>{sale.buyer.slice(0, 6)}...{sale.buyer.slice(-4)}</td>
                              <td><strong>{sale.price} ETH</strong></td>
                              <td>{new Date(sale.timestamp).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Purchases Section */}
                  <h3 style={{ color: '#2196F3', marginTop: '20px' }}>🛒 Purchases Made</h3>
                  {saleHistory.purchases.length === 0 ? (
                    <p style={{ color: '#666', padding: '12px' }}>No purchases recorded.</p>
                  ) : (
                    <div className="table-container">
                      <table className="traceability-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Animal</th>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {saleHistory.purchases.map((purchase) => (
                            <tr key={purchase.id}>
                              <td>#{purchase.id}</td>
                              <td>{purchase.animalName} (#{purchase.livestockId})</td>
                              <td>{purchase.seller.slice(0, 6)}...{purchase.seller.slice(-4)}</td>
                              <td><strong>{purchase.price} ETH</strong></td>
                              <td>{new Date(purchase.timestamp).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowSaleHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Movement Modal */}
      {showMovementModal && (
        <div className="modal-overlay" onClick={() => setShowMovementModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><PlusCircle size={20} /> Record Movement</h2>
              <button className="modal-close" onClick={() => setShowMovementModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordMovement}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Your Livestock *</label>
                  <select
                    value={formData.livestockId}
                    onChange={(e) => setFormData({...formData, livestockId: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="">Select an animal you own</option>
                    {myLivestock.filter(l => l.alive).map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.breed})
                      </option>
                    ))}
                  </select>
                  {myLivestock.filter(l => l.alive).length === 0 && (
                    <small className="form-hint" style={{ color: '#FF9800' }}>
                      You don't own any alive livestock. Register livestock first.
                    </small>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From Location *</label>
                    <input
                      type="text"
                      placeholder="e.g., Kigali"
                      value={formData.fromLocation}
                      onChange={(e) => setFormData({...formData, fromLocation: e.target.value})}
                      required
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>To Location *</label>
                    <input
                      type="text"
                      placeholder="e.g., Musanze"
                      value={formData.toLocation}
                      onChange={(e) => setFormData({...formData, toLocation: e.target.value})}
                      required
                      className="styled-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>From District</label>
                    <input
                      type="text"
                      placeholder="e.g., Kigali District"
                      value={formData.fromDistrict}
                      onChange={(e) => setFormData({...formData, fromDistrict: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>To District</label>
                    <input
                      type="text"
                      placeholder="e.g., Musanze District"
                      value={formData.toDistrict}
                      onChange={(e) => setFormData({...formData, toDistrict: e.target.value})}
                      className="styled-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Select Slaughterhouse (Optional)</label>
                  <select
                    value={formData.toSlaughterhouse}
                    onChange={(e) => {
                      const selectedSH = slaughterhouses.find(sh => sh.address === e.target.value);
                      setFormData({
                        ...formData,
                        toSlaughterhouse: e.target.value,
                        toLocation: selectedSH ? selectedSH.location || selectedSH.name : formData.toLocation,
                        toDistrict: selectedSH ? selectedSH.location || 'N/A' : formData.toDistrict
                      });
                    }}
                    className="styled-select"
                  >
                    <option value="">Select a slaughterhouse (optional)</option>
                    {slaughterhouses.map((sh) => (
                      <option key={sh.address} value={sh.address}>
                        🏭 {sh.name} - {sh.location}
                      </option>
                    ))}
                  </select>
                  {slaughterhouses.length === 0 && (
                    <small className="form-hint" style={{ color: '#FF9800' }}>
                      No slaughterhouses registered yet. Please enter destination manually.
                    </small>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Transport Type</label>
                    <select
                      value={formData.transportType}
                      onChange={(e) => setFormData({...formData, transportType: e.target.value})}
                      className="styled-select"
                    >
                      {transportTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                      className="styled-select"
                    >
                      {purposes.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Permit Number</label>
                  <input
                    type="text"
                    placeholder="e.g., PERMIT-2024-001"
                    value={formData.permitNumber}
                    onChange={(e) => setFormData({...formData, permitNumber: e.target.value})}
                    className="styled-input"
                  />
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
                <button type="button" className="btn-secondary" onClick={() => setShowMovementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Recording...' : <><PlusCircle size={16} /> Record Movement</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Slaughter Modal */}
      {showSlaughterModal && (
        <div className="modal-overlay" onClick={() => setShowSlaughterModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Target size={20} /> 🥩 Record Slaughter</h2>
              <button className="modal-close" onClick={() => setShowSlaughterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordSlaughter}>
              <div className="modal-body">
                {slaughterhouseInfo && (
                  <div className="slaughterhouse-info-box">
                    <h4>🏭 Slaughterhouse Information</h4>
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{slaughterhouseInfo.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Location:</span>
                      <span className="info-value">{slaughterhouseInfo.location}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">License:</span>
                      <span className="info-value">{slaughterhouseInfo.licenseNumber}</span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label>Select Livestock for Slaughter *</label>
                  <select
                    value={formData.livestockId}
                    onChange={(e) => setFormData({...formData, livestockId: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="">Select an animal</option>
                    {availableAnimals.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.breed}) - Owner: {l.owner.slice(0, 6)}...{l.owner.slice(-4)}
                      </option>
                    ))}
                  </select>
                  {availableAnimals.length === 0 && (
                    <small className="form-hint" style={{ color: '#FF9800' }}>
                      No animals available for slaughter. All animals have been processed or are not alive.
                    </small>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g., 350"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      min="0"
                      className="styled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Meat Grade</label>
                    <select
                      value={formData.meatGrade}
                      onChange={(e) => setFormData({...formData, meatGrade: e.target.value})}
                      className="styled-select"
                    >
                      {meatGrades.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Inspection Result</label>
                  <select
                    value={formData.inspectionResult}
                    onChange={(e) => setFormData({...formData, inspectionResult: e.target.value})}
                    className="styled-select"
                  >
                    <option value="PASS">Pass ✅</option>
                    <option value="FAIL">Fail ❌</option>
                    <option value="PENDING">Pending ⏳</option>
                  </select>
                </div>

                <div className="verification-preview" style={{ marginTop: '12px' }}>
                  <p>⚠️ <strong>Confirmation:</strong> This will:</p>
                  <p>1. Record the slaughter in the blockchain</p>
                  <p>2. <strong style={{ color: '#F44336' }}>AUTO-MARK</strong> the livestock as <strong style={{ color: '#F44336' }}>DECEASED</strong></p>
                  <p>3. The animal will no longer appear as "alive" in the system</p>
                  <p style={{ color: '#4CAF50', marginTop: '8px' }}>✅ No manual action needed - this happens automatically!</p>
                </div>

                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    placeholder="Additional notes about the slaughter..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows="3"
                    className="styled-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowSlaughterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ background: '#FF9800' }}>
                  {submitting ? 'Recording...' : '🥩 Record Slaughter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Records Modal */}
      {showHealthRecordsModal && selectedAnimalHealth && (
        <div className="modal-overlay" onClick={() => setShowHealthRecordsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FileText size={20} /> Health Records</h2>
              <div className="modal-subtitle">
                {selectedAnimalHealth.animal?.name} (#{selectedAnimalHealth.animal?.id}) - {selectedAnimalHealth.animal?.breed}
                {selectedAnimalHealth.animal && !selectedAnimalHealth.animal.alive && ' 💀 Deceased'}
              </div>
              <button className="modal-close" onClick={() => setShowHealthRecordsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {healthRecordsLoading ? (
                <div className="loading-container-centered" style={{ minHeight: '200px' }}>
                  <div className="loading-spinner-centered"></div>
                  <p className="loading-text">Loading health records...</p>
                </div>
              ) : selectedAnimalHealth.records.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏥</span>
                  <p>No health records found for this animal.</p>
                </div>
              ) : (
                <div className="health-records-list">
                  {selectedAnimalHealth.records.map((record, index) => (
                    <div key={index} className="health-record-item">
                      <div className="health-record-icon">{record.icon}</div>
                      <div className="health-record-content">
                        <div className="health-record-header">
                          <span className="health-record-type">{record.type}</span>
                          <span className="health-record-date">{record.date}</span>
                        </div>
                        {record.type === 'Vaccination' && (
                          <>
                            <p><strong>Vaccine:</strong> {record.name}</p>
                            <p><strong>Batch:</strong> {record.batch}</p>
                            <p><strong>Expiry:</strong> {record.expiry}</p>
                          </>
                        )}
                        {record.type === 'Treatment' && (
                          <>
                            <p><strong>Diagnosis:</strong> {record.diagnosis}</p>
                            <p><strong>Medication:</strong> {record.medication}</p>
                            <p><strong>Status:</strong> {record.status}</p>
                          </>
                        )}
                        {record.type === 'Certificate' && (
                          <>
                            <p><strong>Purpose:</strong> {record.purpose}</p>
                            <p><strong>Issue Date:</strong> {record.issueDate}</p>
                            <p><strong>Expiry Date:</strong> {record.expiryDate}</p>
                            <p><strong>Status:</strong> {record.status}</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowHealthRecordsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Traceability;