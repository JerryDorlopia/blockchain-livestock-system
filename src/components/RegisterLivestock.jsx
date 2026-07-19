import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES, getSaleHistory } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  DollarSign, ShoppingCart, Eye, RefreshCw, X, Check, AlertTriangle, 
  PlusCircle, Info, User, Mail, Phone, FileText, Download, Printer,
  List, TrendingUp, Calendar, Hash, Award
} from 'react-feather';

// ============================================
// BREEDS AND GENDERS ARRAYS
// ============================================
const breeds = [
  'Friesian', 'Ayrshire', 'Jersey', 'Guernsey',
  'Holstein', 'Brown Swiss', 'Ankole', 'Zebu',
  'Crossbreed', 'Other'
];

const genders = ['Female', 'Male', 'Unknown'];

// ============================================
// CHART COLORS
// ============================================
const COLORS = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0'];
const STATUS_COLORS = ['#4CAF50', '#F44336'];

// ============================================
// TOOLTIP COMPONENT - CUSTOM
// ============================================
function Tooltip({ children, text, position = 'top', disabled = false }) {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className="tooltip-container" 
      onMouseEnter={() => setShow(true)} 
      onMouseLeave={() => setShow(false)}
      style={{ display: 'inline-block' }}
    >
      {children}
      {show && !disabled && (
        <div className={`tooltip-content tooltip-${position}`}>
          {text}
        </div>
      )}
    </div>
  );
}

// ============================================
// SALE RECEIPT COMPONENT
// ============================================
function SaleReceipt({ sale, onClose }) {
  const receiptRef = useRef(null);

  const downloadReceipt = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `Receipt_${sale.id || Date.now()}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      window.print();
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (!sale) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h2>🧾 Sale Receipt</h2>
          <div className="certificate-modal-actions">
            <button className="btn-secondary" onClick={downloadReceipt}>
              <Download size={14} /> Download
            </button>
            <button className="btn-secondary" onClick={printReceipt}>
              <Printer size={14} /> Print
            </button>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="modal-body" ref={receiptRef} style={{ padding: '24px', background: '#ffffff' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0F4C3A', paddingBottom: '16px', marginBottom: '16px' }}>
            <span style={{ fontSize: '2em', display: 'block' }}>🐄</span>
            <h2 style={{ margin: '4px 0', color: '#0F4C3A' }}>Livestock Health System</h2>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>Sale Receipt</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>Receipt #</p>
              <p style={{ margin: '0', fontWeight: '600', fontSize: '16px' }}>#{String(sale.id || 0).padStart(6, '0')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>Date</p>
              <p style={{ margin: '0', fontWeight: '600' }}>{new Date(sale.timestamp || Date.now()).toLocaleString()}</p>
            </div>
          </div>

          <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0F4C3A' }}>Animal Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span style={{ color: '#666' }}>Name:</span>
              <span style={{ fontWeight: '500' }}>{sale.animalName || 'Unknown'}</span>
              <span style={{ color: '#666' }}>ID:</span>
              <span style={{ fontWeight: '500' }}>#{sale.livestockId}</span>
              <span style={{ color: '#666' }}>Breed:</span>
              <span style={{ fontWeight: '500' }}>{sale.breed || 'Unknown'}</span>
            </div>
          </div>

          <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Transaction Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span style={{ color: '#666' }}>Seller:</span>
              <span style={{ fontWeight: '500', fontSize: '13px' }}>
                {sale.seller ? `${sale.seller.slice(0, 8)}...${sale.seller.slice(-6)}` : 'Unknown'}
              </span>
              <span style={{ color: '#666' }}>Buyer:</span>
              <span style={{ fontWeight: '500', fontSize: '13px' }}>
                {sale.buyer ? `${sale.buyer.slice(0, 8)}...${sale.buyer.slice(-6)}` : 'Unknown'}
              </span>
              <span style={{ color: '#666' }}>Price:</span>
              <span style={{ fontWeight: '700', color: '#2e7d32' }}>{sale.price} ETH</span>
              <span style={{ color: '#666' }}>Status:</span>
              <span style={{ fontWeight: '500', color: '#2e7d32' }}>✅ Completed</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '2px solid #0F4C3A', paddingTop: '12px', marginTop: '12px' }}>
            <p style={{ margin: '0', fontSize: '11px', color: '#999' }}>
              This receipt is digitally signed and verified on the Ethereum blockchain.
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#ccc' }}>
              Transaction Hash: {sale.transactionHash || '0x0000...0000'}
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SALE HISTORY COMPONENT
// ============================================
function SaleHistory({ history, onViewReceipt }) {
  if (!history || history.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📊</span>
        <p>No sale history found</p>
      </div>
    );
  }

  return (
    <div className="sale-history">
      <div className="table-container">
        <table className="health-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Animal</th>
              <th>Seller</th>
              <th>Buyer</th>
              <th>Price</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={index}>
                <td>#{String(record.id || index).padStart(4, '0')}</td>
                <td>{record.animalName || `#${record.livestockId}`}</td>
                <td>
                  <span className="address-text">
                    {record.seller?.slice(0, 6)}...{record.seller?.slice(-4)}
                  </span>
                </td>
                <td>
                  <span className="address-text">
                    {record.buyer?.slice(0, 6)}...{record.buyer?.slice(-4)}
                  </span>
                </td>
                <td><strong>{record.price} ETH</strong></td>
                <td>{record.timestamp ? new Date(record.timestamp).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <span className="status-badge active">✅ Completed</span>
                </td>
                <td>
                  <button 
                    className="action-btn view"
                    onClick={() => onViewReceipt(record)}
                  >
                    <FileText size={14} /> Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// TRANSFER MODAL COMPONENT - WITH VALIDATION
// ============================================
function TransferModal({ show, onClose, onTransfer, animal, transferring }) {
  const [newOwner, setNewOwner] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateAddress = async (address) => {
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      setError('Please enter a valid Ethereum address (0x followed by 40 characters)');
      return false;
    }
    
    try {
      setIsValidating(true);
      const contracts = await getContracts();
      
      const isFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', address);
      
      if (!isFarmer.success || !isFarmer.data) {
        setError('❌ This address is not a registered farmer. Please register them first.');
        return false;
      }
      
      if (address.toLowerCase() === animal?.owner.toLowerCase()) {
        setError('❌ This is already the current owner.');
        return false;
      }
      
      setError('');
      return true;
    } catch (err) {
      setError('Error validating address. Please try again.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddressChange = async (e) => {
    const value = e.target.value;
    setNewOwner(value);
    if (error) setError('');
    if (value.length === 42 && value.startsWith('0x')) {
      await validateAddress(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await validateAddress(newOwner);
    if (!isValid) return;
    await onTransfer(animal.id, newOwner);
    if (!transferring) {
      setNewOwner('');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Transfer Livestock</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="transfer-info">
              <div className="transfer-animal-info">
                <span className="transfer-emoji">🐄</span>
                <div className="transfer-details">
                  <strong>{animal?.name}</strong>
                  <span className="transfer-id">ID: #{animal?.id}</span>
                  <span className="transfer-breed">{animal?.breed}</span>
                </div>
              </div>
              <div className="transfer-arrow">
                <span>→</span>
              </div>
              <div className="transfer-owner-info">
                <span className="transfer-label">Current Owner</span>
                <span className="transfer-address">{animal?.owner.slice(0, 10)}...{animal?.owner.slice(-6)}</span>
              </div>
            </div>

            <div className="form-group">
              <label>New Owner Address *</label>
              <input
                type="text"
                placeholder="0x..."
                value={newOwner}
                onChange={handleAddressChange}
                required
                className="styled-input"
                disabled={isValidating}
              />
              {isValidating && <small className="form-hint" style={{ color: '#2196F3' }}>⏳ Validating address...</small>}
              {error && <small className="form-error">{error}</small>}
              <small className="form-hint">Enter the Ethereum wallet address of the new owner (must be a registered farmer)</small>
            </div>

            <div className="verification-preview" style={{ marginTop: '12px' }}>
              <p>⚠️ <strong>Transfer confirmation:</strong></p>
              <p>This will transfer ownership of <strong>{animal?.name}</strong> (ID: #{animal?.id}) to the new owner.</p>
              <p>The animal will remain in the system with the new owner.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={transferring}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={transferring || isValidating || !!error} style={{ background: '#2196F3' }}>
              {transferring ? '⏳ Transferring...' : '📤 Transfer Livestock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MARKETPLACE COMPONENT
// ============================================
function Marketplace({ forSaleLivestock, account, onPurchase, onCancelSale, onViewAnimal }) {
  return (
    <div className="marketplace-section">
      <div className="marketplace-header">
        <div className="marketplace-title">
          <ShoppingCart size={24} />
          <h2>🏪 Marketplace</h2>
          <span className="marketplace-badge">{forSaleLivestock.length} animals for sale</span>
        </div>
        <div className="marketplace-filters">
          <select className="marketplace-filter">
            <option value="all">All Animals</option>
            <option value="cattle">Cattle</option>
            <option value="sheep">Sheep</option>
            <option value="goats">Goats</option>
          </select>
          <select className="marketplace-filter">
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>
      
      {forSaleLivestock.length > 0 ? (
        <div className="marketplace-grid">
          {forSaleLivestock.map((sale) => {
            const isOwner = sale.owner.toLowerCase() === account?.toLowerCase();
            return (
              <div key={sale.id} className="marketplace-card">
                <div className="marketplace-card-header">
                  <div className="marketplace-card-emoji">🐄</div>
                  <div className="marketplace-card-info">
                    <h3>{sale.name}</h3>
                    <span className="marketplace-card-id">#{sale.id}</span>
                  </div>
                  {sale.hasValidHealthRecord ? (
                    <span className="marketplace-health-badge verified">✅ Health Verified</span>
                  ) : (
                    <span className="marketplace-health-badge warning">⚠️ No Health Record</span>
                  )}
                </div>
                
                <div className="marketplace-card-body">
                  <div className="marketplace-card-details">
                    <div className="marketplace-detail">
                      <span className="detail-label">Breed</span>
                      <span className="detail-value">{sale.breed}</span>
                    </div>
                    <div className="marketplace-detail">
                      <span className="detail-label">Seller</span>
                      <span className="detail-value address-text">
                        {sale.owner.slice(0, 6)}...{sale.owner.slice(-4)}
                      </span>
                    </div>
                    <div className="marketplace-detail">
                      <span className="detail-label">Status</span>
                      <span className={`status-badge ${sale.alive ? 'active' : 'inactive'}`}>
                        {sale.alive ? '✅ Alive' : '❌ Deceased'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="marketplace-card-price">
                    <span className="price-amount">{sale.price} ETH</span>
                    <span className="price-label">Current Price</span>
                  </div>
                </div>
                
                <div className="marketplace-card-actions">
                  {!isOwner ? (
                    <button className="btn-primary marketplace-buy-btn" onClick={() => onPurchase(sale.id, sale.price)}>
                      <ShoppingCart size={16} /> Buy Now
                    </button>
                  ) : (
                    <button className="btn-secondary marketplace-cancel-btn" onClick={() => onCancelSale(sale.id)}>
                      Cancel Listing
                    </button>
                  )}
                  <button className="marketplace-view-btn" onClick={() => onViewAnimal(sale)}>
                    <Eye size={16} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="marketplace-empty">
          <div className="empty-state-content">
            <span className="empty-icon">🛒</span>
            <h3>No Animals Listed for Sale</h3>
            <p>There are currently no animals available in the marketplace.</p>
            <p className="empty-hint">Check back later or list your own animals for sale!</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// REGISTER LIVESTOCK MODAL
// ============================================
function RegisterLivestockModal({ show, onClose, onRegister, registering }) {
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    color: '',
    dateOfBirth: '',
    gender: 'Female',
    rfidTag: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onRegister(formData);
    if (!registering) {
      setFormData({
        name: '',
        breed: '',
        color: '',
        dateOfBirth: '',
        gender: 'Female',
        rfidTag: '',
        notes: ''
      });
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><PlusCircle size={20} /> Register New Livestock</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Animal Name *</label>
                <input type="text" placeholder="e.g., Cow_001" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="styled-input" />
              </div>
              <div className="form-group">
                <label>Breed *</label>
                <select value={formData.breed} onChange={(e) => setFormData({...formData, breed: e.target.value})} required className="styled-select">
                  <option value="">Select Breed</option>
                  {breeds.map(b => (<option key={b} value={b}>{b}</option>))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Color</label>
                <input type="text" placeholder="e.g., Black and White" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="styled-input" />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="styled-select">
                  {genders.map(g => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} className="styled-input" />
              </div>
              <div className="form-group">
                <label>RFID Tag</label>
                <input type="text" placeholder="RFID-12345" value={formData.rfidTag} onChange={(e) => setFormData({...formData, rfidTag: e.target.value})} className="styled-input" />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Additional notes about this animal..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows="3" className="styled-textarea" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={registering}>
              {registering ? '⏳ Registering...' : '🐄 Register Livestock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
function RegisterLivestock({ account }) {
  const [livestockList, setLivestockList] = useState([]);
  const [allLivestock, setAllLivestock] = useState([]);
  const [forSaleLivestock, setForSaleLivestock] = useState([]);
  const [saleHistory, setSaleHistory] = useState([]);
  const [purchasesHistory, setPurchasesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showAllAnimals, setShowAllAnimals] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [transferAnimal, setTransferAnimal] = useState(null);
  const [saleAnimal, setSaleAnimal] = useState(null);
  const [salePrice, setSalePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [currentSaleHistory, setCurrentSaleHistory] = useState([]);
  const [saleHistoryLoading, setSaleHistoryLoading] = useState(false);

  const { userRole, userData, isAdminUser } = useRole();
  const { showToast } = useToast();
  const isFarmer = userRole === 'farmer';
  const isAdmin = userRole === 'admin';
  const canRegister = isFarmer;

  // ============================================
  // GET ANIMAL HEALTH RECORDS
  // ============================================
  const getAnimalHealthRecords = async (livestockId) => {
    try {
      const contracts = await getContracts();
      const records = [];
      
      const vCount = await safeContractCall(contracts.healthRecord, 'vCount');
      const vTotal = vCount.success ? Number(vCount.data) : 0;
      
      for (let i = 0; i < vTotal; i++) {
        const livestock = await safeContractCall(contracts.healthRecord, 'vLivestock', i);
        if (livestock.success && Number(livestock.data) === Number(livestockId)) {
          const name = await safeContractCall(contracts.healthRecord, 'vName', i);
          const date = await safeContractCall(contracts.healthRecord, 'vDate', i);
          const expiry = await safeContractCall(contracts.healthRecord, 'vExpiry', i);
          records.push({
            type: 'Vaccination',
            name: name.success ? name.data : 'N/A',
            date: date.success ? new Date(Number(date.data) * 1000).toLocaleDateString() : 'N/A',
            expiry: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
            icon: '💉'
          });
        }
      }
      
      const cCount = await safeContractCall(contracts.healthRecord, 'cCount');
      const cTotal = cCount.success ? Number(cCount.data) : 0;
      
      for (let i = 0; i < cTotal; i++) {
        const livestock = await safeContractCall(contracts.healthRecord, 'cLivestock', i);
        if (livestock.success && Number(livestock.data) === Number(livestockId)) {
          const purpose = await safeContractCall(contracts.healthRecord, 'cPurpose', i);
          const issue = await safeContractCall(contracts.healthRecord, 'cIssue', i);
          const expiry = await safeContractCall(contracts.healthRecord, 'cExpiry', i);
          const valid = await safeContractCall(contracts.healthRecord, 'cValid', i);
          records.push({
            type: 'Certificate',
            purpose: purpose.success ? purpose.data : 'N/A',
            issueDate: issue.success ? new Date(Number(issue.data) * 1000).toLocaleDateString() : 'N/A',
            expiryDate: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
            status: valid.success && valid.data ? 'Valid' : 'Expired',
            icon: '📋'
          });
        }
      }
      
      return records;
    } catch (err) {
      return [];
    }
  };

  // ============================================
  // LOAD SALE HISTORY FROM TRACEABILITY MANAGER
  // ============================================
  const loadSaleHistory = async (contracts) => {
    try {
      if (!contracts) {
        contracts = await getContracts();
      }

      const history = await getSaleHistory(account);
      
      setSaleHistory(history.sales || []);
      setPurchasesHistory(history.purchases || []);
      
      console.log(`📊 Sales found: ${history.sales.length}`);
      console.log(`📊 Purchases found: ${history.purchases.length}`);
      
    } catch (err) {
      console.error('Error loading sale history:', err);
      setSaleHistory([]);
      setPurchasesHistory([]);
    }
  };

  // ============================================
  // LOAD LIVESTOCK & SALE HISTORY
  // ============================================
  const loadLivestock = async () => {
    try {
      setLoading(true);
      setError(null);
      const contracts = await getContracts();

      let livestockData = [];
      let allData = [];
      let forSale = [];

      const totalLivestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
      const total = totalLivestock.success ? Number(totalLivestock.data) : 0;
      
      for (let i = 0; i < total; i++) {
        const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', i);
        if (info.success && info.data[2] !== '0x0000000000000000000000000000000000000000') {
          const animal = {
            id: Number(i),
            name: info.data[0] || `Cow_${i}`,
            breed: info.data[1] || 'Unknown',
            owner: info.data[2],
            alive: info.data[3],
            status: info.data[3] ? '✅ Alive' : '❌ Deceased',
            hasValidHealthRecord: false
          };

          try {
            const records = await getAnimalHealthRecords(i);
            const hasValidCert = records.some(r => r.type === 'Certificate' && r.status === 'Valid');
            const hasVaccination = records.some(r => r.type === 'Vaccination');
            animal.hasValidHealthRecord = hasValidCert && hasVaccination;
          } catch (e) {
            animal.hasValidHealthRecord = false;
          }

          allData.push(animal);

          const saleInfo = await safeContractCall(contracts.livestockRegistry, 'getSaleInfo', i);
          if (saleInfo.success && saleInfo.data[0] === true && saleInfo.data[3] === false) {
            forSale.push({
              ...animal,
              price: saleInfo.data[1] ? ethers.utils.formatEther(saleInfo.data[1]) : '0',
              seller: saleInfo.data[2],
              isSold: saleInfo.data[3]
            });
          }

          if (isAdmin || info.data[2].toLowerCase() === account.toLowerCase()) {
            livestockData.push(animal);
          }
        }
      }

      setAllLivestock(allData);
      setForSaleLivestock(forSale);
      
      if (isAdmin) {
        setLivestockList(allData);
      } else {
        setLivestockList(livestockData);
      }

      await loadSaleHistory(contracts);

    } catch (err) {
      console.error('Error loading livestock:', err);
      setError(err.message);
      showToast('Failed to load livestock: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && (isFarmer || isAdmin)) {
      loadLivestock();
    }
  }, [account, isFarmer, isAdmin]);

  // ============================================
  // REGISTER LIVESTOCK
  // ============================================
  const handleRegisterLivestock = async (formData) => {
    if (!formData.name.trim()) {
      showToast('❌ Please enter a livestock name.', 'error');
      return;
    }

    if (!formData.breed.trim()) {
      showToast('❌ Please enter a breed.', 'error');
      return;
    }

    try {
      setRegistering(true);
      const contracts = await getContracts();

      const tx = await contracts.livestockRegistry.registerLivestock(
        formData.name,
        formData.breed
      );

      await tx.wait();

      await loadLivestock();
      showToast(`✅ Livestock "${formData.name}" registered successfully!`, 'success', 5000);
      setShowRegisterModal(false);

    } catch (err) {
      console.error('❌ Error registering livestock:', err);
      let errorMessage = 'Failed to register livestock.';
      if (err.message && err.message.includes('Not a farmer')) {
        errorMessage = 'You must be a registered farmer to register livestock.';
      } else if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) errorMessage = match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
      showToast(`❌ ${errorMessage}`, 'error', 6000);
    } finally {
      setRegistering(false);
    }
  };

  // ============================================
  // OPEN SALE MODAL
  // ============================================
  const openSaleModal = (animal) => {
    setSaleAnimal(animal);
    setSalePrice('');
    setShowSaleModal(true);
  };

  // ============================================
  // LIST FOR SALE
  // ============================================
  const handleListForSale = async (e) => {
    e.preventDefault();
    
    if (!saleAnimal) {
      showToast('❌ No animal selected for sale.', 'error');
      return;
    }

    if (!salePrice || parseFloat(salePrice) <= 0) {
      showToast('❌ Please enter a valid price greater than 0.', 'error');
      return;
    }

    if (!saleAnimal.hasValidHealthRecord) {
      showToast('❌ This animal does not have a valid health record. Please add health records before selling.', 'error', 6000);
      return;
    }

    if (!saleAnimal.alive) {
      showToast('❌ Cannot list a deceased animal for sale.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const priceInWei = ethers.utils.parseEther(salePrice);
      
      const saleInfo = await safeContractCall(contracts.livestockRegistry, 'getSaleInfo', Number(saleAnimal.id));
      if (saleInfo.success && saleInfo.data[0] === true) {
        showToast('⚠️ This animal is already listed for sale.', 'warning');
        setSubmitting(false);
        return;
      }
      
      const tx = await contracts.livestockRegistry.listForSale(
        Number(saleAnimal.id),
        priceInWei
      );
      
      await tx.wait();
      
      showToast(`✅ ${saleAnimal.name} (#${saleAnimal.id}) listed for ${salePrice} ETH!`, 'success', 5000);
      setShowSaleModal(false);
      setSaleAnimal(null);
      setSalePrice('');
      await loadLivestock();
      
    } catch (err) {
      console.error('❌ Error listing for sale:', err);
      
      let errorMessage = 'Failed to list for sale.';
      
      if (err.message && err.message.includes('Already listed')) {
        errorMessage = '⚠️ This animal is already listed for sale.';
      } else if (err.message && err.message.includes('Not owner')) {
        errorMessage = '❌ You do not own this animal.';
      } else if (err.message && err.message.includes('Not alive')) {
        errorMessage = '❌ Cannot list a deceased animal for sale.';
      } else if (err.message && err.message.includes('Price must be > 0')) {
        errorMessage = '❌ Price must be greater than 0.';
      } else if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          const revertMsg = match[1];
          if (revertMsg.includes('Already listed')) {
            errorMessage = '⚠️ This animal is already listed for sale.';
          } else if (revertMsg.includes('Not owner')) {
            errorMessage = '❌ You do not own this animal.';
          } else if (revertMsg.includes('Not alive')) {
            errorMessage = '❌ Cannot list a deceased animal for sale.';
          } else {
            errorMessage = `❌ ${revertMsg.charAt(0).toUpperCase() + revertMsg.slice(1)}`;
          }
        }
      }
      
      showToast(errorMessage, 'error', 6000);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // PURCHASE LIVESTOCK - WITH RECEIPT
  // ============================================
  const handlePurchase = async (livestockId, price) => {
    if (!window.confirm(`Purchase livestock #${livestockId} for ${price} ETH?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const priceInWei = ethers.utils.parseEther(price);
      
      const tx = await contracts.livestockRegistry.purchaseLivestock(
        Number(livestockId),
        { value: priceInWei }
      );
      const receipt = await tx.wait();
      
      const animal = allLivestock.find(a => a.id === Number(livestockId));
      
      const saleRecord = {
        id: Date.now(),
        livestockId: Number(livestockId),
        animalName: animal?.name || `#${livestockId}`,
        breed: animal?.breed || 'Unknown',
        seller: animal?.owner || account,
        buyer: account,
        price: price,
        timestamp: Date.now(),
        transactionHash: receipt.transactionHash || tx.hash
      };
      
      showToast(`✅ Livestock #${livestockId} purchased successfully!`, 'success', 5000);
      await loadLivestock();
      
      setSelectedReceipt(saleRecord);
      setShowReceiptModal(true);
      
    } catch (err) {
      console.error('Error purchasing:', err);
      showToast('Failed to purchase: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // VIEW SALE HISTORY FOR ANIMAL
  // ============================================
  const viewSaleHistory = async (animal) => {
    try {
      setSaleHistoryLoading(true);
      const contracts = await getContracts();
      
      // Get sale history from TraceabilityManager
      const saleIds = await safeContractCall(contracts.traceabilityManager, 'getLivestockSaleHistory', animal.id);
      
      const formattedHistory = [];
      if (saleIds.success && saleIds.data.length > 0) {
        for (const saleId of saleIds.data) {
          try {
            const sale = await safeContractCall(contracts.traceabilityManager, 'getSale', Number(saleId));
            if (sale.success) {
              const [livestockId, seller, buyer, price, timestamp, location, status] = sale.data;
              formattedHistory.push({
                id: Number(saleId),
                livestockId: Number(livestockId),
                animalName: animal.name,
                seller: seller,
                buyer: buyer,
                price: ethers.utils.formatEther(price),
                timestamp: Number(timestamp) * 1000,
                status: status
              });
            }
          } catch (e) {
            console.warn('Error loading sale:', e);
          }
        }
      }
      
      setCurrentSaleHistory(formattedHistory);
      setSelectedAnimal(animal);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Error viewing sale history:', err);
      showToast('Failed to load sale history: ' + err.message, 'error');
    } finally {
      setSaleHistoryLoading(false);
    }
  };

  // ============================================
  // VIEW RECEIPT
  // ============================================
  const viewReceipt = (record) => {
    setSelectedReceipt(record);
    setShowReceiptModal(true);
  };

  // ============================================
  // OPEN HISTORY MODAL
  // ============================================
  const openHistoryModal = () => {
    setShowHistoryModal(true);
  };

  // ============================================
  // CANCEL SALE
  // ============================================
  const handleCancelSale = async (livestockId) => {
    if (!window.confirm(`Cancel sale listing for livestock #${livestockId}?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const tx = await contracts.livestockRegistry.cancelSale(Number(livestockId));
      await tx.wait();
      
      showToast(`✅ Sale listing cancelled for livestock #${livestockId}`, 'success', 4000);
      await loadLivestock();
      
    } catch (err) {
      console.error('Error cancelling sale:', err);
      showToast('Failed to cancel sale: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // TRANSFER LIVESTOCK
  // ============================================
  const handleTransferLivestock = async (tokenId, newOwner) => {
    try {
      setTransferring(true);
      const contracts = await getContracts();
      
      const livestockInfo = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', tokenId);
      if (!livestockInfo.success || livestockInfo.data[2].toLowerCase() !== account.toLowerCase()) {
        showToast('❌ You do not own this livestock.', 'error', 4000);
        setTransferring(false);
        return;
      }
      
      const isFarmer = await safeContractCall(contracts.livestockRegistry, 'isFarmer', newOwner);
      if (!isFarmer.success || !isFarmer.data) {
        showToast('❌ The recipient address is not a registered farmer. Please register them first.', 'error', 6000);
        setTransferring(false);
        return;
      }
      
      if (!livestockInfo.data[3]) {
        showToast('❌ Cannot transfer a deceased animal.', 'error', 4000);
        setTransferring(false);
        return;
      }
      
      const saleInfo = await safeContractCall(contracts.livestockRegistry, 'getSaleInfo', tokenId);
      if (saleInfo.success && saleInfo.data[0] === true) {
        showToast('❌ Cannot transfer an animal that is listed for sale. Cancel the sale first.', 'error', 4000);
        setTransferring(false);
        return;
      }
      
      const tx = await contracts.livestockRegistry.transferLivestock(tokenId, newOwner);
      await tx.wait();
      
      showToast(`✅ Livestock transferred successfully to ${newOwner.slice(0, 6)}...${newOwner.slice(-4)}!`, 'success', 4000);
      await loadLivestock();
      setShowTransferModal(false);
      setTransferAnimal(null);
      
    } catch (err) {
      console.error('Error transferring livestock:', err);
      
      let errorMessage = 'Failed to transfer livestock.';
      
      if (err.message && err.message.includes('Not a farmer')) {
        errorMessage = '❌ The recipient address is not a registered farmer. Please register them first.';
      } else if (err.message && err.message.includes('Not owner')) {
        errorMessage = '❌ You do not own this livestock.';
      } else if (err.message && err.message.includes('Not alive')) {
        errorMessage = '❌ Cannot transfer a deceased animal.';
      } else if (err.message && err.message.includes('Already listed')) {
        errorMessage = '❌ Cannot transfer an animal that is listed for sale.';
      } else if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          const revertMessage = match[1];
          if (revertMessage.includes('Not a farmer')) {
            errorMessage = '❌ The recipient address is not a registered farmer.';
          } else if (revertMessage.includes('Does not exist')) {
            errorMessage = '❌ This livestock does not exist.';
          } else if (revertMessage.includes('Not owner')) {
            errorMessage = '❌ You do not own this livestock.';
          } else {
            errorMessage = `❌ ${revertMessage.charAt(0).toUpperCase() + revertMessage.slice(1)}`;
          }
        } else {
          errorMessage = '❌ Transaction failed. Please check the address and try again.';
        }
      }
      
      showToast(errorMessage, 'error', 6000);
    } finally {
      setTransferring(false);
    }
  };

  // ============================================
  // MARK DECEASED
  // ============================================
  const handleMarkDeceased = async (tokenId) => {
    if (!window.confirm('Are you sure you want to mark this livestock as deceased?')) return;

    try {
      const contracts = await getContracts();
      const tx = await contracts.livestockRegistry.markDeceased(tokenId);
      await tx.wait();
      showToast(`✅ Livestock marked as deceased.`, 'info', 4000);
      await loadLivestock();
    } catch (err) {
      console.error('Error marking deceased:', err);
      
      let errorMessage = 'Failed to mark as deceased.';
      if (err.message && err.message.includes('execution reverted')) {
        const match = err.message.match(/execution reverted: (.+?)(?:"|$)/);
        if (match) {
          errorMessage = `❌ ${match[1].charAt(0).toUpperCase() + match[1].slice(1)}`;
        }
      }
      showToast(errorMessage, 'error', 6000);
    }
  };

  // ============================================
  // CHECK IF ANIMAL CAN BE SOLD
  // ============================================
  const canBeSold = (animal) => {
    return animal.alive && animal.hasValidHealthRecord;
  };

  // ============================================
  // GET HEALTH STATUS DISPLAY
  // ============================================
  const getHealthStatusDisplay = (animal) => {
    if (!animal.hasValidHealthRecord) {
      return <span className="status-badge warning">⚠️ No Health Record</span>;
    }
    return <span className="status-badge verified">✅ Health Valid</span>;
  };

  // ============================================
  // OPEN TRANSFER MODAL
  // ============================================
  const openTransferModal = (animal) => {
    setTransferAnimal(animal);
    setShowTransferModal(true);
  };

  // ============================================
  // CHART DATA
  // ============================================
  const getBreedData = () => {
    const breedCount = {};
    const displayData = showAllAnimals ? allLivestock : livestockList;
    displayData.forEach(a => {
      breedCount[a.breed] = (breedCount[a.breed] || 0) + 1;
    });
    return Object.keys(breedCount).map(key => ({
      name: key,
      value: breedCount[key]
    }));
  };

  const getStatusData = () => {
    const displayData = showAllAnimals ? allLivestock : livestockList;
    const alive = displayData.filter(a => a.alive).length;
    const deceased = displayData.filter(a => !a.alive).length;
    return [
      { name: 'Alive', value: alive },
      { name: 'Deceased', value: deceased }
    ];
  };

  const getMonthlyData = () => {
    const displayData = showAllAnimals ? allLivestock : livestockList;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, i) => ({
      name: month,
      livestock: Math.max(0, Math.floor((displayData.length / 6) * (i + 1))),
      registered: Math.max(0, Math.floor((displayData.length / 6)))
    }));
  };

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!isFarmer && !isAdmin) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only farmers and admins can view livestock.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  const displayList = showAllAnimals ? allLivestock : livestockList;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="register-livestock">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>📊 Livestock Management</h1>
          <p className="page-subtitle">
            {isAdmin ? 'View all livestock statistics and analytics' : 'Register new animals and manage your herd'}
          </p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Livestock: {displayList.length}</span>
            <span className="debug-badge" style={{ background: '#4CAF50', color: 'white' }}>
              🏷️ For Sale: {forSaleLivestock.length}
            </span>
            <span className="debug-badge" style={{ background: '#2196F3', color: 'white' }}>
              📊 Sales: {saleHistory.length}
            </span>
            <span className="debug-badge" style={{ background: '#9C27B0', color: 'white' }}>
              🛒 Purchases: {purchasesHistory.length}
            </span>
            {isAdmin && (
              <button 
                className="debug-badge" 
                style={{ cursor: 'pointer', background: '#2196F3', color: 'white' }}
                onClick={() => setShowAllAnimals(!showAllAnimals)}
              >
                {showAllAnimals ? 'Show All' : 'Show My Herd'}
              </button>
            )}
          </div>
        </div>
        <div className="header-right">
          {canRegister && (
            <button 
              className="btn-primary"
              onClick={() => setShowRegisterModal(true)}
            >
              <PlusCircle size={16} /> Register Livestock
            </button>
          )}
          <button 
            className="btn-primary"
            onClick={openHistoryModal}
            style={{ background: '#9C27B0' }}
          >
            <List size={16} /> History ({saleHistory.length + purchasesHistory.length})
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => setShowMarketplace(!showMarketplace)}
            style={{ background: showMarketplace ? '#FF9800' : 'var(--bg-secondary)', color: showMarketplace ? 'white' : 'var(--text-primary)' }}
          >
            <ShoppingCart size={16} /> {showMarketplace ? 'Hide Marketplace' : 'Marketplace'}
          </button>
          <button className="btn-secondary" onClick={loadLivestock}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>🐄 Total Livestock</h3>
          <p className="stat-number">{displayList.length}</p>
          <span className="stat-label">{isAdmin ? 'All animals in system' : 'Your animals'}</span>
        </div>
        <div className="stat-card">
          <h3>✅ Alive</h3>
          <p className="stat-number">{displayList.filter(l => l.alive).length}</p>
          <span className="stat-label">Living animals</span>
        </div>
        <div className="stat-card alert-card">
          <h3>💀 Deceased</h3>
          <p className="stat-number">{displayList.filter(l => !l.alive).length}</p>
          <span className="stat-label">Passed away</span>
        </div>
        <div className="stat-card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
          <h3 style={{ color: 'white' }}>📊 Breeds</h3>
          <p className="stat-number" style={{ color: 'white' }}>{new Set(displayList.map(l => l.breed)).size}</p>
          <span className="stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Unique breeds</span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h2>📊 Livestock Analytics</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h4>Breed Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getBreedData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Health Status</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getStatusData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {getStatusData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4>Herd Growth</h4>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={getMonthlyData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="livestock" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="registered" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Marketplace Component */}
      {showMarketplace && (
        <Marketplace 
          forSaleLivestock={forSaleLivestock}
          account={account}
          onPurchase={handlePurchase}
          onCancelSale={handleCancelSale}
          onViewAnimal={setSelectedAnimal}
        />
      )}

      {/* Livestock List */}
      <div className="livestock-list-container">
        <h2>{isAdmin ? '📋 All Livestock in System' : 'Your Herd'} ({displayList.length})</h2>
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : displayList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <span className="empty-icon">🐄</span>
              <p>No livestock registered in the system.</p>
              {canRegister && (
                <button className="btn-primary" onClick={() => setShowRegisterModal(true)}>
                  <PlusCircle size={16} /> Register Your First Animal
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="livestock-grid">
            {displayList.map((animal) => {
              const isForSale = forSaleLivestock.some(s => s.id === animal.id);
              const isOwner = animal.owner.toLowerCase() === account?.toLowerCase();
              const canSell = canBeSold(animal);
              
              return (
                <div key={animal.id} className={`livestock-card ${!animal.alive ? 'deceased' : ''}`}>
                  <div className="livestock-card-header">
                    <span className="livestock-emoji">🐄</span>
                    <span className="livestock-name">{animal.name}</span>
                    <span className="livestock-badge-id">ID: {animal.id}</span>
                    {isForSale && (
                      <span className="status-badge" style={{ background: '#4CAF50', color: 'white' }}>
                        For Sale
                      </span>
                    )}
                    <button 
                      className="action-btn view"
                      onClick={() => viewSaleHistory(animal)}
                      style={{ background: '#2196F3', color: 'white', padding: '2px 8px', fontSize: '10px' }}
                      title="View Sale History"
                    >
                      📊 History
                    </button>
                  </div>
                  <div className="livestock-card-body">
                    <div className="livestock-detail">
                      <span className="detail-label">Breed:</span>
                      <span className="detail-value">{animal.breed}</span>
                    </div>
                    <div className="livestock-detail">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${animal.alive ? 'active' : 'inactive'}`}>
                        {animal.status}
                      </span>
                    </div>
                    <div className="livestock-detail">
                      <span className="detail-label">Health:</span>
                      {getHealthStatusDisplay(animal)}
                    </div>
                    {isForSale && (
                      <div className="livestock-detail" style={{ color: '#4CAF50' }}>
                        <span className="detail-label">Price:</span>
                        <span className="detail-value" style={{ fontWeight: 'bold' }}>
                          {forSaleLivestock.find(s => s.id === animal.id)?.price} ETH
                        </span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="livestock-detail">
                        <span className="detail-label">Owner:</span>
                        <span className="detail-value" style={{ fontSize: '0.75em' }}>
                          {animal.owner.slice(0, 6)}...{animal.owner.slice(-4)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="livestock-card-actions">
                    {animal.alive && isOwner && (
                      <>
                        {!isForSale ? (
                          <button 
                            className={`action-btn ${canSell ? 'sale' : 'disabled'}`}
                            onClick={() => openSaleModal(animal)}
                            style={canSell ? { background: '#4CAF50', color: 'white' } : { background: '#ccc', color: '#666', cursor: 'not-allowed' }}
                            disabled={!canSell}
                          >
                            <DollarSign size={14} /> Sell
                          </button>
                        ) : (
                          <button 
                            className="action-btn deactivate"
                            onClick={() => handleCancelSale(animal.id)}
                            style={{ background: '#FF9800', color: 'white' }}
                          >
                            Cancel Sale
                          </button>
                        )}
                        <button 
                          className="action-btn transfer"
                          onClick={() => openTransferModal(animal)}
                        >
                          📤 Transfer
                        </button>
                        <button 
                          className="action-btn deceased"
                          onClick={() => handleMarkDeceased(animal.id)}
                        >
                          💀 Deceased
                        </button>
                      </>
                    )}
                    {animal.alive && !isOwner && isForSale && (
                      <button 
                        className="btn-primary"
                        onClick={() => handlePurchase(animal.id, forSaleLivestock.find(s => s.id === animal.id)?.price)}
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        <ShoppingCart size={14} /> Buy
                      </button>
                    )}
                    <button 
                      className="action-btn view"
                      onClick={() => setSelectedAnimal(animal)}
                    >
                      👁️ View
                    </button>
                    <button 
                      className="action-btn view"
                      onClick={() => viewSaleHistory(animal)}
                      style={{ background: '#2196F3', color: 'white' }}
                    >
                      📊 History
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register Livestock Modal */}
      <RegisterLivestockModal 
        show={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegister={handleRegisterLivestock}
        registering={registering}
      />

      {/* Transfer Modal */}
      <TransferModal 
        show={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferAnimal(null);
        }}
        onTransfer={handleTransferLivestock}
        animal={transferAnimal}
        transferring={transferring}
      />

      {/* List for Sale Modal */}
      {showSaleModal && saleAnimal && (
        <div className="modal-overlay" onClick={() => {
          setShowSaleModal(false);
          setSaleAnimal(null);
          setSalePrice('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><DollarSign size={20} /> List Livestock for Sale</h2>
              <button className="modal-close" onClick={() => {
                setShowSaleModal(false);
                setSaleAnimal(null);
                setSalePrice('');
              }}>✕</button>
            </div>
            <form onSubmit={handleListForSale}>
              <div className="modal-body">
                <div className="selected-animal-display" style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '2em' }}>🐄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>
                        {saleAnimal.name}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span>ID: #{saleAnimal.id}</span>
                        <span>Breed: {saleAnimal.breed}</span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {saleAnimal.hasValidHealthRecord ? (
                          <span className="status-badge verified" style={{ fontSize: '11px' }}>✅ Health Verified</span>
                        ) : (
                          <span className="status-badge warning" style={{ fontSize: '11px' }}>⚠️ No Health Record</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Livestock ID</label>
                  <input 
                    type="text" 
                    value={`#${saleAnimal.id}`} 
                    disabled 
                    className="styled-input" 
                    style={{ fontWeight: '600', fontSize: '16px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Price (ETH) *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.5"
                    value={salePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setSalePrice(value);
                      }
                    }}
                    required
                    className="styled-input"
                  />
                  <small className="form-hint">Set the price in ETH for this livestock (minimum 0.001 ETH)</small>
                </div>

                {!saleAnimal.hasValidHealthRecord && (
                  <div className="verification-preview" style={{ 
                    marginTop: '12px',
                    background: '#ffebee',
                    borderColor: '#ef9a9a'
                  }}>
                    <p style={{ color: '#c62828', fontWeight: '600' }}>
                      ⚠️ This animal does not have a valid health record. Please add health records before selling.
                    </p>
                  </div>
                )}

                <div className="verification-preview" style={{ marginTop: '12px' }}>
                  <p>⚠️ <strong>Listing this animal for sale will:</strong></p>
                  <p>1. Make it visible to all farmers</p>
                  <p>2. Allow any farmer to purchase it</p>
                  <p>3. Prevent movement while listed</p>
                  <p>4. Transfer ownership automatically upon purchase</p>
                  <p>5. A sale receipt will be generated for both parties</p>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowSaleModal(false);
                    setSaleAnimal(null);
                    setSalePrice('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={submitting || !saleAnimal.hasValidHealthRecord}
                >
                  {submitting ? '⏳ Processing...' : '💰 List for Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sales & Purchase History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><List size={20} /> Sales & Purchase History</h2>
              <div className="modal-subtitle">
                {saleHistoryLoading ? 'Loading...' : `${saleHistory.length} sales, ${purchasesHistory.length} purchases`}
              </div>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}>✕</button>
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
                  {saleHistory.length === 0 ? (
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
                          {saleHistory.map((sale) => (
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
                  {purchasesHistory.length === 0 ? (
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
                          {purchasesHistory.map((purchase) => (
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
              <button className="btn-secondary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <SaleReceipt 
          sale={selectedReceipt} 
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
        />
      )}

      {/* Animal Details Modal */}
      {selectedAnimal && !showHistoryModal && (
        <div className="modal-overlay" onClick={() => setSelectedAnimal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🐄 {selectedAnimal.name}</h2>
              {forSaleLivestock.some(s => s.id === selectedAnimal.id) && (
                <span className="status-badge" style={{ background: '#4CAF50', color: 'white' }}>
                  🏷️ For Sale - {forSaleLivestock.find(s => s.id === selectedAnimal.id)?.price} ETH
                </span>
              )}
              <button className="modal-close" onClick={() => setSelectedAnimal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{selectedAnimal.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Breed:</span>
                <span className="detail-value">{selectedAnimal.breed}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedAnimal.alive ? 'active' : 'inactive'}`}>
                  {selectedAnimal.alive ? '✅ Alive' : '❌ Deceased'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Health:</span>
                {getHealthStatusDisplay(selectedAnimal)}
              </div>
              <div className="detail-row">
                <span className="detail-label">Owner:</span>
                <span className="detail-value address-full">{selectedAnimal.owner}</span>
              </div>
              {forSaleLivestock.some(s => s.id === selectedAnimal.id) && (
                <div className="detail-row" style={{ background: '#e8f5e9', padding: '12px', borderRadius: '8px' }}>
                  <span className="detail-label" style={{ color: '#2e7d32' }}>🏷️ For Sale:</span>
                  <span className="detail-value" style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                    {forSaleLivestock.find(s => s.id === selectedAnimal.id)?.price} ETH
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Sale History:</span>
                <span className="detail-value">
                  <button 
                    className="action-btn view"
                    onClick={() => {
                      setSelectedAnimal(selectedAnimal);
                      viewSaleHistory(selectedAnimal);
                    }}
                  >
                    📊 View History
                  </button>
                </span>
              </div>
            </div>
            <div className="modal-footer">
              {selectedAnimal.alive && forSaleLivestock.some(s => s.id === selectedAnimal.id) && selectedAnimal.owner.toLowerCase() !== account?.toLowerCase() && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    handlePurchase(selectedAnimal.id, forSaleLivestock.find(s => s.id === selectedAnimal.id)?.price);
                    setSelectedAnimal(null);
                  }}
                >
                  <ShoppingCart size={16} /> Buy for {forSaleLivestock.find(s => s.id === selectedAnimal.id)?.price} ETH
                </button>
              )}
              <button className="btn-secondary" onClick={() => setSelectedAnimal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegisterLivestock;