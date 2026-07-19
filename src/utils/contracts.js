import { ethers } from 'ethers';

// ============================================
// CONTRACT ADDRESSES (SEPOLIA) - UPDATED
// ============================================
export const CONTRACT_ADDRESSES = {
  livestockRegistry: '0x224378097061ca4d01caF4Aa65140eFeA1cdD47c',
  healthRecord: '0x9180e5c50E1fc04295F50Fd5709e51629926D3e9',
  traceabilityManager: '0xBe13e026AA517ff510815f0260b7bf094CdFC1Af',
  carbonCreditTracker: '0xD5731c1320fF9925f225a91E15e0DB4C4213A4F9',
  iotHealthMonitor: '0x95c83EBaF7481dC76f2c08fA3Ee5b1260AE26242'
};

// ============================================
// LIVESTOCK REGISTRY ABI - WITH SALE HISTORY
// ============================================
const LIVESTOCK_ABI = [
  // Admin
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
  "function addAdmin(address)",
  "function removeAdmin(address)",
  "function transferAdmin(address)",
  "function isAdminAddress(address) view returns (bool)",
  "function setTraceabilityManager(address)",
  "function traceabilityManager() view returns (address)",
  
  // Roles
  "function isFarmer(address) view returns (bool)",
  "function isVet(address) view returns (bool)",
  "function isRegulator(address) view returns (bool)",
  "function registerFarmer(address,string,string)",
  "function registerVet(address)",
  "function registerRegulator(address)",
  "function removeRegulator(address)",
  "function deactivateFarmer(address)",
  "function activateFarmer(address)",
  "function toggleFarmerStatus(address)",
  "function getFarmerStatus(address) view returns (bool)",
  "function isRegisteredFarmer(address) view returns (bool)",
  
  // Farmer Data
  "function farmerName(address) view returns (string)",
  "function farmerLocation(address) view returns (string)",
  "function farmerActive(address) view returns (bool)",
  "function getFarmerInfo(address) view returns (string,string,bool)",
  "function farmerCount() view returns (uint256)",
  "function getFarmerCount() view returns (uint256)",
  
  // Livestock Data
  "function livestockName(uint256) view returns (string)",
  "function livestockBreed(uint256) view returns (string)",
  "function livestockOwner(uint256) view returns (address)",
  "function livestockExists(uint256) view returns (bool)",
  "function livestockAlive(uint256) view returns (bool)",
  "function nextTokenId() view returns (uint256)",
  "function getLivestockInfo(uint256) view returns (string,string,address,bool)",
  "function getFarmerLivestock(address) view returns (uint256[])",
  "function getTotalLivestock() view returns (uint256)",
  "function getOwnershipHistory(uint256) view returns (address[])",
  
  // Livestock Actions
  "function registerLivestock(string,string) returns (uint256)",
  "function transferLivestock(uint256,address)",
  "function markDeceased(uint256)",
  
  // Sale Functions
  "function listForSale(uint256,uint256)",
  "function purchaseLivestock(uint256) payable",
  "function cancelSale(uint256)",
  "function getSaleInfo(uint256) view returns (bool,uint256,address,bool,address)",
  "function getSellerListings(address) view returns (uint256[])",
  "function getBuyerPurchases(address) view returns (uint256[])"
];

// ============================================
// HEALTH RECORD ABI - WITH DELETE FUNCTIONS
// ============================================
const HEALTH_ABI = [
  // Admin
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
  "function addAdmin(address)",
  "function removeAdmin(address)",
  "function transferAdmin(address)",
  
  // Roles
  "function isVet(address) view returns (bool)",
  "function isRegulator(address) view returns (bool)",
  "function registerVet(address)",
  "function removeVet(address)",
  "function registerRegulator(address)",
  "function isVetRegistered(address) view returns (bool)",
  
  // Vaccinations - View
  "function vName(uint256) view returns (string)",
  "function vBatch(uint256) view returns (string)",
  "function vDate(uint256) view returns (uint256)",
  "function vExpiry(uint256) view returns (uint256)",
  "function vAdmin(uint256) view returns (address)",
  "function vLivestock(uint256) view returns (uint256)",
  "function vExists(uint256) view returns (bool)",
  "function vCount() view returns (uint256)",
  "function getVName(uint256) view returns (string)",
  "function getVBatch(uint256) view returns (string)",
  "function getVDate(uint256) view returns (uint256)",
  "function getVExpiry(uint256) view returns (uint256)",
  "function getVAdmin(uint256) view returns (address)",
  "function getVLivestock(uint256) view returns (uint256)",
  
  // Vaccinations - Actions
  "function addVaccination(uint256,string,string,uint256) returns (uint256)",
  "function removeVaccination(uint256)",
  
  // Treatments - View
  "function tDiagnosis(uint256) view returns (string)",
  "function tMedication(uint256) view returns (string)",
  "function tStart(uint256) view returns (uint256)",
  "function tPrescriber(uint256) view returns (address)",
  "function tLivestock(uint256) view returns (uint256)",
  "function tExists(uint256) view returns (bool)",
  "function tDone(uint256) view returns (bool)",
  "function tCount() view returns (uint256)",
  "function getTDiagnosis(uint256) view returns (string)",
  "function getTMedication(uint256) view returns (string)",
  "function getTStart(uint256) view returns (uint256)",
  "function getTLivestock(uint256) view returns (uint256)",
  "function isTDone(uint256) view returns (bool)",
  
  // Treatments - Actions
  "function addTreatment(uint256,string,string) returns (uint256)",
  "function completeTreatment(uint256)",
  "function removeTreatment(uint256)",
  
  // Certificates - View
  "function cPurpose(uint256) view returns (string)",
  "function cHash(uint256) view returns (string)",
  "function cIssue(uint256) view returns (uint256)",
  "function cExpiry(uint256) view returns (uint256)",
  "function cIssuer(uint256) view returns (address)",
  "function cLivestock(uint256) view returns (uint256)",
  "function cExists(uint256) view returns (bool)",
  "function cValid(uint256) view returns (bool)",
  "function cCount() view returns (uint256)",
  "function getCPurpose(uint256) view returns (string)",
  "function getCHash(uint256) view returns (string)",
  "function getCIssue(uint256) view returns (uint256)",
  "function getCExpiry(uint256) view returns (uint256)",
  "function getCLivestock(uint256) view returns (uint256)",
  "function isValidCert(uint256) view returns (bool)",
  
  // Certificates - Actions
  "function addCertificate(uint256,string,string,uint256) returns (uint256)",
  "function revokeCertificate(uint256)",
  "function removeCertificate(uint256)"
];

// ============================================
// TRACEABILITY MANAGER ABI - WITH SALE HISTORY
// ============================================
const TRACEABILITY_ABI = [
  // Admin
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
  "function addAdmin(address)",
  "function removeAdmin(address)",
  "function transferAdmin(address)",
  "function setLivestockRegistry(address)",
  "function livestockRegistry() view returns (address)",
  
  // Roles
  "function isFarmer(address) view returns (bool)",
  "function isRegulator(address) view returns (bool)",
  "function isSlaughterhouse(address) view returns (bool)",
  "function isFarmerRegistered(address) view returns (bool)",
  "function isSlaughterhouseRegistered(address) view returns (bool)",
  "function registerFarmer(address)",
  "function registerRegulator(address)",
  "function registerSlaughterhouse(address)",
  
  // Movement - View
  "function mCount() view returns (uint256)",
  "function mFrom(uint256) view returns (string)",
  "function mTo(uint256) view returns (string)",
  "function mLivestock(uint256) view returns (uint256)",
  "function mArrived(uint256) view returns (bool)",
  "function mFromDistrict(uint256) view returns (string)",
  "function mToDistrict(uint256) view returns (string)",
  "function mTransport(uint256) view returns (string)",
  "function mPermit(uint256) view returns (string)",
  "function mPurpose(uint256) view returns (string)",
  "function mDate(uint256) view returns (uint256)",
  "function getMovementCount() view returns (uint256)",
  "function getMLivestock(uint256) view returns (uint256)",
  "function getMArrived(uint256) view returns (bool)",
  
  // Movement - Actions
  "function recordMovement(uint256,string,string,string,string,string,string,string,string) returns (uint256)",
  "function confirmArrival(uint256)",
  
  // Slaughter - View
  "function sCount() view returns (uint256)",
  "function sLocation(uint256) view returns (string)",
  "function sHouse(uint256) view returns (string)",
  "function sLivestock(uint256) view returns (uint256)",
  "function sWeight(uint256) view returns (uint256)",
  "function sGrade(uint256) view returns (string)",
  "function sInspection(uint256) view returns (string)",
  "function sCert(uint256) view returns (string)",
  "function sDate(uint256) view returns (uint256)",
  "function sValid(uint256) view returns (bool)",
  "function getSlaughterCount() view returns (uint256)",
  
  // Slaughter - Actions
  "function recordSlaughter(uint256,string,string,string,uint256,string,string,string) returns (uint256)",
  "function invalidateSlaughter(uint256)",
  
  // ==================== SALE HISTORY ====================
  "function saleCount() view returns (uint256)",
  "function recordSale(uint256,address,address,uint256,string) returns (uint256)",
  "function getSale(uint256) view returns (uint256,address,address,uint256,uint256,string,string)",
  "function getFarmerSales(address) view returns (uint256[])",
  "function getFarmerPurchases(address) view returns (uint256[])",
  "function getLivestockSaleHistory(uint256) view returns (uint256[])",
  "function getSaleCount() view returns (uint256)",
  "function getAllSales(uint256,uint256) view returns (uint256[],uint256[],address[],address[],uint256[],uint256[])",
  
  // Events
  "function eCount() view returns (uint256)",
  "function logEvent(uint256,string,string,string,string) returns (uint256)",
  
  // Events
  "event SaleRecorded(uint256,uint256,address,address,uint256)"
];

// ============================================
// CARBON CREDIT TRACKER ABI
// ============================================
const CARBON_ABI = [
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
  "function addAdmin(address)",
  "function removeAdmin(address)",
  "function transferAdmin(address)",
  "function setLivestockRegistry(address)",
  "function livestockRegistry() view returns (address)",
  "function isVerifier(address) view returns (bool)",
  "function registerVerifier(address)",
  "function removeVerifier(address)",
  "function verifyFarm(address)",
  "function verifyEmissions(uint256)",
  "function fName(address) view returns (string)",
  "function fLocation(address) view returns (string)",
  "function fType(address) view returns (string)",
  "function fLivestock(address) view returns (uint256)",
  "function fEmissions(address) view returns (uint256)",
  "function fCredits(address) view returns (uint256)",
  "function fExists(address) view returns (bool)",
  "function fVerified(address) view returns (bool)",
  "function eCount() view returns (uint256)",
  "function eFarmer(uint256) view returns (address)",
  "function eTimestamp(uint256) view returns (uint256)",
  "function eEmissions(uint256) view returns (uint256)",
  "function eSource(uint256) view returns (string)",
  "function eHash(uint256) view returns (string)",
  "function eVerified(uint256) view returns (bool)",
  "function eVerifier(uint256) view returns (address)",
  "function eExists(uint256) view returns (bool)",
  "function getFName(address) view returns (string)",
  "function getFLocation(address) view returns (string)",
  "function getFType(address) view returns (string)",
  "function getFLivestock(address) view returns (uint256)",
  "function getFEmissions(address) view returns (uint256)",
  "function getFCredits(address) view returns (uint256)",
  "function getFVerified(address) view returns (bool)",
  "function getPendingCredits(address) view returns (uint256)",
  "function getEmissionCount() view returns (uint256)",
  "function isVerifierRegistered(address) view returns (bool)",
  "function registerFarm(string,string,string,uint256) returns (bool)",
  "function logEmissions(uint256,string,string) returns (uint256)",
  "function setEmissionFactor(uint256)",
  "function setCreditReward(uint256)"
];

// ============================================
// IOT HEALTH MONITOR ABI
// ============================================
const IOT_ABI = [
  "function admin() view returns (address)",
  "function isAdmin(address) view returns (bool)",
  "function isDevice(address) view returns (bool)",
  "function isFarmer(address) view returns (bool)",
  "function isVet(address) view returns (bool)",
  "function dName(address) view returns (string)",
  "function dLivestock(address) view returns (uint256)",
  "function dActive(address) view returns (bool)",
  "function rCount() view returns (uint256)",
  "function aCount() view returns (uint256)",
  "function getRTemperature(uint256) view returns (uint256)",
  "function getRDistance(uint256) view returns (uint256)",
  "function getRActivity(uint256) view returns (uint8)",
  "function getREating(uint256) view returns (bool)",
  "function getRRestless(uint256) view returns (bool)",
  "function getRSound(uint256) view returns (bool)",
  "function getRStatus(uint256) view returns (string)",
  "function getRPrediction(uint256) view returns (string)",
  "function getRConfidence(uint256) view returns (uint256)",
  "function getRHasAlert(uint256) view returns (bool)",
  "function getReadingCount() view returns (uint256)",
  "function getAlertCount() view returns (uint256)",
  "function isDeviceRegistered(address) view returns (bool)",
  "function addAdmin(address)",
  "function removeAdmin(address)",
  "function transferAdmin(address)",
  "function registerDevice(address,string,uint256)",
  "function deactivateDevice(address)",
  "function registerFarmer(address)",
  "function registerVet(address)",
  "function logReading(uint256,uint256,uint256,uint8,bool,bool,bool,string,string,uint256,string) returns (uint256)",
  "function resolveAlert(uint256)",
  "function setDeviceLivestock(address,uint256)"
];

// ============================================
// GET CONTRACTS FUNCTION
// ============================================

export const getContracts = async () => {
  if (!window.ethereum) {
    throw new Error('🦊 MetaMask not installed!');
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const network = await provider.getNetwork();
  console.log('🌐 Network:', network.name, 'Chain ID:', network.chainId);

  if (network.chainId !== 11155111) {
    throw new Error(`⚠️ Please switch to Sepolia. Current: ${network.chainId}`);
  }

  console.log('✅ Connected to Sepolia');

  return {
    livestockRegistry: new ethers.Contract(
      CONTRACT_ADDRESSES.livestockRegistry,
      LIVESTOCK_ABI,
      signer
    ),
    healthRecord: new ethers.Contract(
      CONTRACT_ADDRESSES.healthRecord,
      HEALTH_ABI,
      signer
    ),
    traceabilityManager: new ethers.Contract(
      CONTRACT_ADDRESSES.traceabilityManager,
      TRACEABILITY_ABI,
      signer
    ),
    carbonCreditTracker: new ethers.Contract(
      CONTRACT_ADDRESSES.carbonCreditTracker,
      CARBON_ABI,
      signer
    ),
    iotHealthMonitor: new ethers.Contract(
      CONTRACT_ADDRESSES.iotHealthMonitor,
      IOT_ABI,
      signer
    )
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const switchToSepolia = async () => {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }]
    });
    return true;
  } catch (error) {
    console.error('Error switching to Sepolia:', error);
    return false;
  }
};

export const isMetaMaskConnected = async () => {
  if (!window.ethereum) return false;
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts.length > 0;
  } catch {
    return false;
  }
};

export const getNetwork = async () => {
  if (!window.ethereum) return null;
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return chainId;
  } catch {
    return null;
  }
};

// ============================================
// GET ALL REGISTERED SLAUGHTERHOUSES
// ============================================

export const getAllSlaughterhouses = async () => {
  try {
    const contracts = await getContracts();
    const slaughterhouseList = [];
    
    const savedData = localStorage.getItem('slaughterhouse_data');
    const allData = savedData ? JSON.parse(savedData) : {};
    
    const knownAddresses = [
      '0x7Eed304fe1e8F51C657d7003Ba64B9ECa4FeE97b',
    ];
    
    for (const address of Object.keys(allData)) {
      if (!knownAddresses.includes(address) && address !== '0x0000000000000000000000000000000000000000') {
        knownAddresses.push(address);
      }
    }
    
    for (const addr of knownAddresses) {
      if (!addr || addr === '0x0000000000000000000000000000000000000000') continue;
      
      try {
        const isSH = await safeContractCall(
          contracts.traceabilityManager, 
          'isSlaughterhouseRegistered', 
          addr
        );
        
        if (isSH.success && isSH.data) {
          const details = allData[addr.toLowerCase()] || {};
          
          slaughterhouseList.push({
            address: addr,
            name: details.name || `Slaughterhouse ${addr.slice(0, 6)}...${addr.slice(-4)}`,
            location: details.location || 'Not specified',
            licenseNumber: details.licenseNumber || 'N/A',
            status: details.status || 'active',
            livestockProcessed: details.livestockProcessed || 0,
            registeredDate: details.registeredDate || new Date().toLocaleDateString(),
            phone: details.phone || 'N/A',
            email: details.email || 'N/A',
            capacity: details.capacity || 'N/A',
            notes: details.notes || ''
          });
        }
      } catch (e) {
        console.warn('Error checking address:', addr, e.message);
      }
    }
    
    slaughterhouseList.sort((a, b) => a.name.localeCompare(b.name));
    return slaughterhouseList;
    
  } catch (err) {
    console.error('Error getting slaughterhouses:', err);
    return [];
  }
};

export const getSlaughterhouses = async () => {
  return await getAllSlaughterhouses();
};

// ============================================
// GET ANIMAL HEALTH RECORDS
// ============================================

export const getAnimalHealthRecords = async (livestockId) => {
  try {
    const contracts = await getContracts();
    const records = [];
    
    const vCount = await safeContractCall(contracts.healthRecord, 'vCount');
    const vTotal = vCount.success ? Number(vCount.data) : 0;
    
    for (let i = 0; i < vTotal; i++) {
      const livestock = await safeContractCall(contracts.healthRecord, 'vLivestock', i);
      if (livestock.success && Number(livestock.data) === Number(livestockId)) {
        const name = await safeContractCall(contracts.healthRecord, 'vName', i);
        const batch = await safeContractCall(contracts.healthRecord, 'vBatch', i);
        const date = await safeContractCall(contracts.healthRecord, 'vDate', i);
        const expiry = await safeContractCall(contracts.healthRecord, 'vExpiry', i);
        records.push({
          type: 'Vaccination',
          name: name.success ? name.data : 'N/A',
          batch: batch.success ? batch.data : 'N/A',
          date: date.success ? new Date(Number(date.data) * 1000).toLocaleDateString() : 'N/A',
          expiry: expiry.success ? new Date(Number(expiry.data) * 1000).toLocaleDateString() : 'N/A',
          icon: '💉'
        });
      }
    }
    
    const tCount = await safeContractCall(contracts.healthRecord, 'tCount');
    const tTotal = tCount.success ? Number(tCount.data) : 0;
    
    for (let i = 0; i < tTotal; i++) {
      const livestock = await safeContractCall(contracts.healthRecord, 'tLivestock', i);
      if (livestock.success && Number(livestock.data) === Number(livestockId)) {
        const diagnosis = await safeContractCall(contracts.healthRecord, 'tDiagnosis', i);
        const medication = await safeContractCall(contracts.healthRecord, 'tMedication', i);
        const start = await safeContractCall(contracts.healthRecord, 'tStart', i);
        const done = await safeContractCall(contracts.healthRecord, 'tDone', i);
        records.push({
          type: 'Treatment',
          diagnosis: diagnosis.success ? diagnosis.data : 'N/A',
          medication: medication.success ? medication.data : 'N/A',
          date: start.success ? new Date(Number(start.data) * 1000).toLocaleDateString() : 'N/A',
          status: done.success && done.data ? 'Completed' : 'In Progress',
          icon: '💊'
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
    
    records.sort((a, b) => {
      if (a.date === 'N/A') return 1;
      if (b.date === 'N/A') return -1;
      return new Date(b.date) - new Date(a.date);
    });
    
    return records;
  } catch (err) {
    console.error('Error loading health records:', err);
    return [];
  }
};

// ============================================
// GET ANIMAL INFO
// ============================================

export const getAnimalInfo = async (livestockId) => {
  try {
    const contracts = await getContracts();
    const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', livestockId);
    
    if (info.success) {
      return {
        id: livestockId,
        name: info.data[0] || `Livestock_${livestockId}`,
        breed: info.data[1] || 'Unknown',
        owner: info.data[2],
        alive: info.data[3]
      };
    }
    return null;
  } catch (err) {
    console.error('Error getting animal info:', err);
    return null;
  }
};

// ============================================
// REGISTER DEFAULT SLAUGHTERHOUSE
// ============================================

export const registerDefaultSlaughterhouse = async (adminAccount) => {
  try {
    const contracts = await getContracts();
    const defaultSH = '0x7Eed304fe1e8F51C657d7003Ba64B9ECa4FeE97b';
    
    const isRegistered = await safeContractCall(
      contracts.traceabilityManager,
      'isSlaughterhouseRegistered',
      defaultSH
    );
    
    if (isRegistered.success && isRegistered.data) {
      const savedData = localStorage.getItem('slaughterhouse_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      
      if (!allData[defaultSH.toLowerCase()]) {
        allData[defaultSH.toLowerCase()] = {
          name: 'Kigali Meat Processing',
          location: 'Kigali, Rwanda',
          licenseNumber: 'LIC-2024-001',
          status: 'active',
          livestockProcessed: 0,
          registeredDate: new Date().toLocaleDateString()
        };
        localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));
      }
      return true;
    }
    
    if (adminAccount) {
      const tx = await contracts.traceabilityManager.registerSlaughterhouse(defaultSH);
      await tx.wait();
      
      const savedData = localStorage.getItem('slaughterhouse_data');
      const allData = savedData ? JSON.parse(savedData) : {};
      allData[defaultSH.toLowerCase()] = {
        name: 'Kigali Meat Processing',
        location: 'Kigali, Rwanda',
        licenseNumber: 'LIC-2024-001',
        status: 'active',
        livestockProcessed: 0,
        registeredDate: new Date().toLocaleDateString()
      };
      localStorage.setItem('slaughterhouse_data', JSON.stringify(allData));
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error registering default slaughterhouse:', err);
    return false;
  }
};

// ============================================
// HEALTH RECORD DELETE FUNCTIONS (Admin Only)
// ============================================

export const deleteVaccination = async (vaccinationId) => {
  try {
    const contracts = await getContracts();
    const tx = await contracts.healthRecord.removeVaccination(Number(vaccinationId));
    await tx.wait();
    return { success: true };
  } catch (err) {
    console.error('Error deleting vaccination:', err);
    return { success: false, error: err.message };
  }
};

export const deleteTreatment = async (treatmentId) => {
  try {
    const contracts = await getContracts();
    const tx = await contracts.healthRecord.removeTreatment(Number(treatmentId));
    await tx.wait();
    return { success: true };
  } catch (err) {
    console.error('Error deleting treatment:', err);
    return { success: false, error: err.message };
  }
};

export const deleteCertificate = async (certificateId) => {
  try {
    const contracts = await getContracts();
    const tx = await contracts.healthRecord.removeCertificate(Number(certificateId));
    await tx.wait();
    return { success: true };
  } catch (err) {
    console.error('Error deleting certificate:', err);
    return { success: false, error: err.message };
  }
};

export const clearAllHealthRecords = async () => {
  try {
    const contracts = await getContracts();
    const results = { vaccines: 0, treatments: 0, certificates: 0, errors: [] };
    
    const vCount = await contracts.healthRecord.vCount();
    const tCount = await contracts.healthRecord.tCount();
    const cCount = await contracts.healthRecord.cCount();
    
    console.log(`📊 Found ${Number(vCount)} vaccines, ${Number(tCount)} treatments, ${Number(cCount)} certificates`);
    
    for (let i = Number(vCount) - 1; i >= 0; i--) {
      try {
        await contracts.healthRecord.removeVaccination(i);
        results.vaccines++;
      } catch (e) {
        results.errors.push(`Vaccine ${i}: ${e.message}`);
      }
    }
    
    for (let i = Number(tCount) - 1; i >= 0; i--) {
      try {
        await contracts.healthRecord.removeTreatment(i);
        results.treatments++;
      } catch (e) {
        results.errors.push(`Treatment ${i}: ${e.message}`);
      }
    }
    
    for (let i = Number(cCount) - 1; i >= 0; i--) {
      try {
        await contracts.healthRecord.removeCertificate(i);
        results.certificates++;
      } catch (e) {
        results.errors.push(`Certificate ${i}: ${e.message}`);
      }
    }
    
    return results;
  } catch (err) {
    console.error('Error clearing health records:', err);
    return { error: err.message };
  }
};

// ============================================
// SALE HISTORY FUNCTIONS
// ============================================

export const getSaleHistory = async (account) => {
  try {
    const contracts = await getContracts();
    const sales = [];
    const purchases = [];

    // Get sale count from TraceabilityManager
    const saleCount = await safeContractCall(contracts.traceabilityManager, 'getSaleCount');
    const count = saleCount.success ? Number(saleCount.data) : 0;
    
    console.log(`📊 Total sales in TraceabilityManager: ${count}`);
    
    if (count === 0) {
      return { sales: [], purchases: [] };
    }

    // Get farmer's sales and purchases
    const salesList = await safeContractCall(contracts.traceabilityManager, 'getFarmerSales', account);
    const purchasesList = await safeContractCall(contracts.traceabilityManager, 'getFarmerPurchases', account);

    // Helper to load sale details
    const loadSaleDetails = async (saleId) => {
      try {
        const details = await safeContractCall(contracts.traceabilityManager, 'getSale', Number(saleId));
        if (details.success) {
          const [livestockId, seller, buyer, price, timestamp, location, status] = details.data;
          
          // Get livestock info from registry
          const info = await safeContractCall(contracts.livestockRegistry, 'getLivestockInfo', Number(livestockId));
          
          return {
            id: Number(saleId),
            livestockId: Number(livestockId),
            animalName: info.success ? info.data[0] : `#${livestockId}`,
            breed: info.success ? info.data[1] : 'Unknown',
            seller: seller,
            buyer: buyer,
            price: ethers.utils.formatEther(price),
            timestamp: Number(timestamp) * 1000,
            location: location,
            status: status,
            transactionHash: 'Blockchain Record'
          };
        }
        return null;
      } catch (err) {
        console.warn(`Error loading sale ${saleId}:`, err.message);
        return null;
      }
    };

    // Process sales
    if (salesList.success) {
      for (const saleId of salesList.data) {
        const record = await loadSaleDetails(saleId);
        if (record) sales.push(record);
      }
    }

    // Process purchases
    if (purchasesList.success) {
      for (const saleId of purchasesList.data) {
        // Check if already in sales list
        if (sales.some(s => s.id === Number(saleId))) continue;
        const record = await loadSaleDetails(saleId);
        if (record) purchases.push(record);
      }
    }

    console.log(`📊 Sales found: ${sales.length}`);
    console.log(`📊 Purchases found: ${purchases.length}`);
    
    return { sales, purchases };
    
  } catch (err) {
    console.error('Error loading sale history:', err);
    return { sales: [], purchases: [] };
  }
};

// ============================================
// IOT HELPER FUNCTIONS
// ============================================

export const getAllIoTDevices = async () => {
  try {
    const contracts = await getContracts();
    const deviceList = [];
    
    const storedData = localStorage.getItem('iot_devices');
    const allData = storedData ? JSON.parse(storedData) : {};
    
    const knownAddresses = [
      '0x7Eed304fe1e8F51C657d7003Ba64B9ECa4FeE97b',
    ];
    
    for (const address of Object.keys(allData)) {
      if (!knownAddresses.includes(address) && address !== '0x0000000000000000000000000000000000000000') {
        knownAddresses.push(address);
      }
    }
    
    for (const addr of knownAddresses) {
      if (!addr || addr === '0x0000000000000000000000000000000000000000') continue;
      
      try {
        const isDevice = await safeContractCall(
          contracts.iotHealthMonitor,
          'isDeviceRegistered',
          addr
        );
        
        if (isDevice.success && isDevice.data) {
          const name = await safeContractCall(contracts.iotHealthMonitor, 'dName', addr);
          const livestockId = await safeContractCall(contracts.iotHealthMonitor, 'dLivestock', addr);
          const active = await safeContractCall(contracts.iotHealthMonitor, 'dActive', addr);
          
          const details = allData[addr.toLowerCase()] || {};
          
          deviceList.push({
            address: addr,
            name: name.success ? name.data : details.name || 'Unknown Device',
            livestockId: livestockId.success ? Number(livestockId.data) : details.livestockId || 0,
            active: active.success ? active.data : details.active || false,
            status: (active.success && active.data) ? 'Online' : 'Offline',
            lastReading: details.lastReading || 'N/A',
            battery: details.battery || 85,
            signal: details.signal || 90,
            registeredAt: details.registeredAt || new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn('Error checking device:', addr, e.message);
      }
    }
    
    console.log(`📡 Found ${deviceList.length} IoT devices`);
    return deviceList;
    
  } catch (err) {
    console.error('Error getting IoT devices:', err);
    return [];
  }
};

export const saveIoTDevice = (deviceData) => {
  try {
    const stored = localStorage.getItem('iot_devices');
    const devices = stored ? JSON.parse(stored) : {};
    
    devices[deviceData.address.toLowerCase()] = {
      ...deviceData,
      savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('iot_devices', JSON.stringify(devices));
    return true;
  } catch (err) {
    console.error('Error saving IoT device:', err);
    return false;
  }
};

export const getIoTReadings = async (limit = 50) => {
  try {
    const contracts = await getContracts();
    const readingList = [];
    
    const rCount = await safeContractCall(contracts.iotHealthMonitor, 'getReadingCount');
    const count = rCount.success ? Number(rCount.data) : 0;
    
    const start = Math.max(0, count - limit);
    
    for (let i = start; i < count; i++) {
      try {
        const livestock = await safeContractCall(contracts.iotHealthMonitor, 'rLivestock', i);
        const temperature = await safeContractCall(contracts.iotHealthMonitor, 'rTemperature', i);
        const distance = await safeContractCall(contracts.iotHealthMonitor, 'rDistance', i);
        const activity = await safeContractCall(contracts.iotHealthMonitor, 'rActivity', i);
        const eating = await safeContractCall(contracts.iotHealthMonitor, 'rEating', i);
        const restless = await safeContractCall(contracts.iotHealthMonitor, 'rRestless', i);
        const sound = await safeContractCall(contracts.iotHealthMonitor, 'rSound', i);
        const status = await safeContractCall(contracts.iotHealthMonitor, 'rStatus', i);
        const prediction = await safeContractCall(contracts.iotHealthMonitor, 'rPrediction', i);
        const confidence = await safeContractCall(contracts.iotHealthMonitor, 'rConfidence', i);
        const timestamp = await safeContractCall(contracts.iotHealthMonitor, 'rTimestamp', i);
        const hasAlert = await safeContractCall(contracts.iotHealthMonitor, 'rHasAlert', i);
        
        if (livestock.success) {
          readingList.push({
            id: i,
            livestockId: Number(livestock.data),
            temperature: temperature.success ? Number(temperature.data) : 0,
            distance: distance.success ? Number(distance.data) : 0,
            activity: activity.success ? Number(activity.data) : 0,
            eating: eating.success ? eating.data : false,
            restless: restless.success ? restless.data : false,
            sound: sound.success ? sound.data : false,
            status: status.success ? status.data : 'Normal',
            prediction: prediction.success ? prediction.data : 'Healthy',
            confidence: confidence.success ? Number(confidence.data) : 0,
            timestamp: timestamp.success ? new Date(Number(timestamp.data) * 1000).toLocaleString() : 'N/A',
            hasAlert: hasAlert.success ? hasAlert.data : false
          });
        }
      } catch (err) {
        console.warn(`Error loading reading ${i}:`, err.message);
      }
    }
    
    return readingList;
  } catch (err) {
    console.error('Error getting IoT readings:', err);
    return [];
  }
};

export const getIoTAlerts = async (limit = 50) => {
  try {
    const contracts = await getContracts();
    const alertList = [];
    
    const aCount = await safeContractCall(contracts.iotHealthMonitor, 'getAlertCount');
    const count = aCount.success ? Number(aCount.data) : 0;
    
    const start = Math.max(0, count - limit);
    
    for (let i = start; i < count; i++) {
      try {
        const livestock = await safeContractCall(contracts.iotHealthMonitor, 'aLivestock', i);
        const type = await safeContractCall(contracts.iotHealthMonitor, 'aType', i);
        const desc = await safeContractCall(contracts.iotHealthMonitor, 'aDesc', i);
        const severity = await safeContractCall(contracts.iotHealthMonitor, 'aSeverity', i);
        const resolved = await safeContractCall(contracts.iotHealthMonitor, 'aResolved', i);
        const timestamp = await safeContractCall(contracts.iotHealthMonitor, 'aTimestamp', i);
        
        if (type.success) {
          alertList.push({
            id: i,
            livestockId: Number(livestock.data),
            type: type.data || 'Unknown',
            description: desc.success ? desc.data : 'No description',
            severity: severity.success ? severity.data : 'Medium',
            resolved: resolved.success ? resolved.data : false,
            timestamp: timestamp.success ? new Date(Number(timestamp.data) * 1000).toLocaleString() : 'N/A'
          });
        }
      } catch (err) {
        console.warn(`Error loading alert ${i}:`, err.message);
      }
    }
    
    return alertList;
  } catch (err) {
    console.error('Error getting IoT alerts:', err);
    return [];
  }
};

// ============================================
// SAFE CONTRACT CALLS - FIXED WITH SILENT "Not registered"
// ============================================

export const safeContractCall = async (contract, method, ...args) => {
  try {
    const result = await contract[method](...args);
    return { success: true, data: result };
  } catch (error) {
    // Silent handling for "Not registered" - this is expected
    if (error.message && error.message.includes('Not registered')) {
      return { success: false, error: 'not_registered', data: false };
    }
    if (error.message && error.message.includes('Does not exist')) {
      return { success: false, error: 'not_found' };
    }
    if (error.message && error.message.includes('Not found')) {
      return { success: false, error: 'not_found' };
    }
    if (error.message && error.message.includes('Not farmer')) {
      return { success: false, error: 'not_farmer' };
    }
    if (error.message && error.message.includes('Not slaughterhouse')) {
      return { success: false, error: 'not_slaughterhouse' };
    }
    if (error.message && error.message.includes('Not admin')) {
      return { success: false, error: 'not_admin' };
    }
    if (error.message && error.message.includes('Not device')) {
      return { success: false, error: 'not_device' };
    }
    if (error.message && error.message.includes('Not authorized')) {
      return { success: false, error: 'not_authorized' };
    }
    if (error.message && error.message.includes('Already listed')) {
      return { success: false, error: 'already_listed' };
    }
    if (error.message && error.message.includes('Not for sale')) {
      return { success: false, error: 'not_for_sale' };
    }
    if (error.message && error.message.includes('Already sold')) {
      return { success: false, error: 'already_sold' };
    }
    if (error.message && error.message.includes('execution reverted')) {
      const match = error.message.match(/execution reverted: (.+?)(?:"|$)/);
      if (match) {
        return { success: false, error: match[1] };
      }
    }
    return { success: false, error: error.message };
  }
};