import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getContracts, safeContractCall, CONTRACT_ADDRESSES } from '../utils/contracts';
import { useRole } from '../App';
import { useToast } from './Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import {
  Wifi, Thermometer, Activity, AlertCircle, CheckCircle,
  RefreshCw, PlusCircle, Eye, TrendingUp,
  Heart, Search, Server, Upload, Database, Image, Cpu
} from 'react-feather';

// Server API base URL
const API_BASE = import.meta.env.DEV ? '/api' : 'http://10.36.163.23:3001/api';

function IoTMonitor({ account }) {
  // ============================================
  // STATE
  // ============================================
  const [devices, setDevices] = useState([]);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [livestockList, setLivestockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAIUploadModal, setShowAIUploadModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedReading, setSelectedReading] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [dataSource, setDataSource] = useState('server');
  const [serverStats, setServerStats] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [imageCount, setImageCount] = useState(0);
  const [aiStatus, setAiStatus] = useState(null);
  const [aiPredictions, setAiPredictions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedImageForAI, setSelectedImageForAI] = useState(null);
  const [aiAnalysisHistory, setAiAnalysisHistory] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    deviceAddress: '',
    deviceName: '',
    livestockId: '',
    temperature: '',
    distance: '',
    activity: '',
    eating: false,
    restless: false,
    sound: false,
    status: '',
    prediction: '',
    confidence: '',
    imageHash: ''
  });

  // Stats
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalReadings: 0,
    totalAlerts: 0,
    unresolvedAlerts: 0,
    averageTemperature: 0,
    healthyAnimals: 0,
    atRiskAnimals: 0
  });

  // Chart data
  const [chartData, setChartData] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [alertData, setAlertData] = useState([]);

  // Hooks
  const { userRole } = useRole();
  const { showToast } = useToast();

  // Permissions
  const isAdmin = userRole === 'admin';
  const isVet = userRole === 'vet' || userRole === 'admin';
  const isFarmer = userRole === 'farmer' || userRole === 'admin';
  const canManageDevices = isAdmin;
  const canViewReadings = isVet || isFarmer;
  const canResolveAlerts = isVet || isFarmer;

  // ============================================
  // AI FUNCTIONS
  // ============================================

  // Send image to AI for processing
  const sendImageToAI = async (imageData, readingData = null) => {
    try {
      setAiLoading(true);
      setAiStatus('processing');
      showToast('🧠 Sending image to AI for analysis...', 'info', 3000);

      // Prepare data for AI
      const aiPayload = {
        image: imageData, // Base64 image data
        sensor_data: readingData ? {
          temperature: readingData.temperature || 38.5,
          distance: readingData.distance || 0,
          activity: readingData.activity || 0,
          eating: readingData.eating || false,
          restless: readingData.restless || false,
          sound: readingData.sound || false,
          status: readingData.status || 'NORMAL'
        } : null,
        animal_id: readingData?.livestockName || 'COW_001',
        timestamp: new Date().toISOString()
      };

      // ============================================================
      // TODO: Replace with actual AI API call when ready
      // For now, simulate AI analysis based on sensor data
      // ============================================================
      
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate simulated predictions based on sensor data
      const temp = readingData?.temperature || 38.5;
      const isEating = readingData?.eating || false;
      const isRestless = readingData?.restless || false;
      const hasSound = readingData?.sound || false;
      const status = readingData?.status || 'NORMAL';

      let predictions = [];
      
      if (status === 'ALERT' || temp > 39.5 || isRestless || hasSound) {
        predictions = [
          { class: 'Sick / Injured', confidence: 0.72 },
          { class: 'Healthy', confidence: 0.18 },
          { class: 'Stress', confidence: 0.10 }
        ];
      } else if (status === 'WARNING' || temp > 39.0 || !isEating) {
        predictions = [
          { class: 'Monitor / Watch', confidence: 0.65 },
          { class: 'Healthy', confidence: 0.25 },
          { class: 'Sick', confidence: 0.10 }
        ];
      } else {
        predictions = [
          { class: 'Healthy', confidence: 0.88 },
          { class: 'Monitor', confidence: 0.07 },
          { class: 'Sick', confidence: 0.05 }
        ];
      }

      // Add image analysis results (simulated)
      const imageAnalysis = {
        class: 'Image Analysis',
        confidence: 0.78,
        details: 'No visible abnormalities detected'
      };

      setAiPredictions(predictions);
      setAiStatus('complete');
      
      // Save to history
      const analysisRecord = {
        id: Date.now(),
        image_filename: readingData?.image_filename || 'unknown',
        timestamp: new Date().toISOString(),
        predictions: predictions,
        imageAnalysis: imageAnalysis,
        sensorData: aiPayload.sensor_data
      };
      setAiAnalysisHistory(prev => [analysisRecord, ...prev]);
      
      showToast('✅ AI analysis complete!', 'success', 3000);
      setShowAIModal(true);
      
      return predictions;
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiStatus('error');
      showToast('❌ AI analysis failed: ' + error.message, 'error');
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  // Send reading with image to AI
  const sendReadingToAI = async (reading) => {
    if (!reading) {
      showToast('❌ No reading selected for analysis', 'error');
      return;
    }

    // Check if reading has an image
    if (!reading.image_filename && !reading.image_path && !reading.image_data) {
      showToast('⚠️ This reading has no image to analyze', 'warning');
      return;
    }

    try {
      // Get the image data
      let imageData = null;
      
      if (reading.image_filename) {
        // Fetch image from server
        const response = await fetch(`http://10.36.163.23:3001/api/iot/images/${reading.image_filename}`);
        const blob = await response.blob();
        imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } else if (reading.image_data) {
        imageData = reading.image_data;
      }

      if (!imageData) {
        showToast('❌ Could not load image for analysis', 'error');
        return;
      }

      await sendImageToAI(imageData, reading);
      
    } catch (error) {
      console.error('Error sending reading to AI:', error);
      showToast('❌ Failed to send reading to AI: ' + error.message, 'error');
    }
  };

  // Send all images to AI for batch processing
  const sendBatchToAI = async () => {
    try {
      setAiLoading(true);
      setAiStatus('processing');
      showToast('🧠 Sending batch to AI for analysis...', 'info', 3000);

      const readingsWithImages = readings.filter(r => r.hasImage || r.image_filename);
      
      if (readingsWithImages.length === 0) {
        showToast('⚠️ No readings with images found for batch analysis', 'warning');
        setAiLoading(false);
        return;
      }

      const results = [];
      for (const reading of readingsWithImages.slice(0, 5)) { // Limit to 5 for batch
        try {
          const result = await sendReadingToAI(reading);
          if (result) {
            results.push({
              id: reading.id,
              livestockName: reading.livestockName,
              prediction: result[0]?.class || 'Unknown',
              confidence: result[0]?.confidence || 0
            });
          }
        } catch (e) {
          console.error('Error in batch processing:', e);
        }
      }
      
      setAiPredictions(results);
      setAiStatus('complete');
      showToast(`✅ Batch AI analysis complete for ${results.length} images!`, 'success', 3000);
      
    } catch (error) {
      console.error('Batch AI Error:', error);
      setAiStatus('error');
      showToast('❌ Batch AI failed: ' + error.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Open AI upload modal
  const openAIUploadModal = () => {
    setShowAIUploadModal(true);
  };

  // Handle image upload for AI
  const handleImageUploadForAI = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const imageData = event.target.result;
        setSelectedImageForAI(imageData);
        await sendImageToAI(imageData, null);
        e.target.value = ''; // Reset input
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading image:', error);
      showToast('❌ Failed to read image file', 'error');
    }
  };

  // ============================================
  // IMAGE FUNCTIONS
  // ============================================

  const viewImage = (imagePath) => {
    if (imagePath) {
      const filename = imagePath.split('/').pop();
      const imageUrl = `http://10.36.163.23:3001/api/iot/images/${filename}`;
      window.open(imageUrl, '_blank');
    } else {
      showToast('No image available for this reading', 'info');
    }
  };

  const viewImageFromReading = (reading) => {
    if (reading.image_filename) {
      const imageUrl = `http://10.36.163.23:3001/api/iot/images/${reading.image_filename}`;
      window.open(imageUrl, '_blank');
    } else if (reading.image_path) {
      const filename = reading.image_path.split('/').pop();
      const imageUrl = `http://10.36.163.23:3001/api/iot/images/${filename}`;
      window.open(imageUrl, '_blank');
    } else {
      showToast('No image available', 'info');
    }
  };

  const fetchImageList = async () => {
    try {
      const response = await fetch(`${API_BASE}/iot/images`);
      const data = await response.json();
      if (data.success) {
        setImageList(data.images);
        setImageCount(data.count);
        setShowImageGallery(true);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      showToast('Failed to load images', 'error');
    }
  };

  // ============================================
  // SERVER API FUNCTIONS
  // ============================================

  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/iot/test`);
      const data = await response.json();
      setServerStatus({ online: true, data });
      if (data.images !== undefined) {
        setImageCount(data.images);
      }
      console.log('✅ IoT Server is online:', data);
      return true;
    } catch (error) {
      console.warn('⚠️ IoT Server is offline:', error.message);
      setServerStatus({ online: false, error: error.message });
      return false;
    }
  };

  const fetchReadingsFromServer = async (limit = 50, animal = null) => {
    try {
      let url = `${API_BASE}/iot/readings?limit=${limit}`;
      if (animal) url += `&animal=${animal}`;
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        console.log(`📊 Fetched ${data.count} readings from server`);
        const withImages = data.data.filter(r => r.image_filename || r.image_path || r.image_data);
        console.log(`📸 Readings with images: ${withImages.length}`);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching readings from server:', error);
      return [];
    }
  };

  const fetchStatsFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/iot/stats`);
      const data = await response.json();
      if (data.success) {
        console.log('📊 Fetched stats from server:', data.stats);
        return data.stats;
      }
      return null;
    } catch (error) {
      console.error('Error fetching stats from server:', error);
      return null;
    }
  };

  const fetchAlertsFromServer = async (unresolved = false) => {
    try {
      const url = unresolved ? `${API_BASE}/iot/alerts?unresolved=true` : `${API_BASE}/iot/alerts`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        console.log(`🚨 Fetched ${data.count} alerts from server`);
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching alerts from server:', error);
      return [];
    }
  };

  const sendDataToServer = async (data) => {
    try {
      const response = await fetch(`${API_BASE}/iot/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        console.log('📤 Data sent to server successfully:', result);
        if (result.image_saved) {
          console.log(`📸 Image saved: ${result.image_filename}`);
        }
        return result;
      }
      throw new Error(result.message || 'Failed to send data');
    } catch (error) {
      console.error('Error sending data to server:', error);
      throw error;
    }
  };

  const resolveAlertOnServer = async (alertId) => {
    try {
      const response = await fetch(`${API_BASE}/iot/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();
      if (result.success) {
        console.log('✅ Alert resolved on server');
        return result;
      }
      throw new Error(result.message || 'Failed to resolve alert');
    } catch (error) {
      console.error('Error resolving alert on server:', error);
      throw error;
    }
  };

  const sendTestData = async () => {
    try {
      const testData = {
        device_id: "ESP32_001",
        wallet_address: account || "0x430Bc0a13d6Eb6e3619d084909F679Beb6d282bF",
        animal_id: `COW_${Math.floor(Math.random() * 5) + 1}`,
        farmer_id: "FARMER_001",
        farm_name: "Green Valley Farm",
        distance: Math.round((Math.random() * 30 + 10) * 10) / 10,
        temperature: Math.round((37.5 + Math.random() * 2) * 10) / 10,
        is_eating: Math.random() > 0.3,
        activity: Math.floor(Math.random() * 100),
        is_restless: Math.random() > 0.7,
        abnormal_sound: Math.random() > 0.8,
        status: Math.random() > 0.8 ? 'ALERT' : 'NORMAL'
      };

      const result = await sendDataToServer(testData);
      if (result.success) {
        showToast('✅ Test data sent to server!', 'success', 3000);
        await loadDataFromServer();
        return result;
      }
    } catch (error) {
      console.error('Error sending test data:', error);
      showToast('❌ Failed to send test data: ' + error.message, 'error');
    }
  };

  const sendBatchTestData = async () => {
    try {
      const animals = ['COW_001', 'COW_002', 'COW_003', 'SHEEP_001', 'GOAT_001'];
      let sent = 0;
      
      for (let i = 0; i < 10; i++) {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        const data = {
          device_id: `ESP32_${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`,
          wallet_address: account || "0x430Bc0a13d6Eb6e3619d084909F679Beb6d282bF",
          animal_id: animal,
          farmer_id: "FARMER_001",
          farm_name: "Green Valley Farm",
          distance: Math.round((Math.random() * 30 + 10) * 10) / 10,
          temperature: Math.round((37 + Math.random() * 3) * 10) / 10,
          is_eating: Math.random() > 0.3,
          activity: Math.floor(Math.random() * 100),
          is_restless: Math.random() > 0.7,
          abnormal_sound: Math.random() > 0.85,
          status: Math.random() > 0.75 ? 'ALERT' : 'NORMAL'
        };
        await sendDataToServer(data);
        sent++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      showToast(`✅ Sent ${sent} test readings to server!`, 'success', 3000);
      await loadDataFromServer();
    } catch (error) {
      console.error('Error sending batch test data:', error);
      showToast('❌ Failed to send batch data: ' + error.message, 'error');
    }
  };

  const clearServerData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear all IoT data from the server?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/iot/data`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        showToast('🗑️ All server data cleared!', 'success', 3000);
        setImageCount(0);
        await loadDataFromServer();
      }
    } catch (error) {
      console.error('Error clearing server data:', error);
      showToast('❌ Failed to clear server data', 'error');
    }
  };

  const loadDataFromServer = async () => {
    try {
      setLoading(true);
      setError(null);

      const isOnline = await checkServerStatus();
      if (!isOnline) {
        setError('IoT Server is offline. Using blockchain data...');
        setDataSource('blockchain');
        await loadDataFromBlockchain();
        return;
      }

      setDataSource('server');

      const serverReadings = await fetchReadingsFromServer(50);
      if (serverReadings.length > 0) {
        const formattedReadings = serverReadings.map(r => ({
          id: r.id,
          livestockId: parseInt(r.animal_id?.replace(/[^0-9]/g, '')) || 0,
          livestockName: r.animal_id || 'Unknown',
          temperature: r.temperature || 38.5,
          distance: r.distance || 0,
          activity: r.activity || 0,
          eating: r.is_eating || false,
          restless: r.is_restless || false,
          sound: r.abnormal_sound || false,
          status: r.status === 'ALERT' ? 'Warning' : (r.status === 'NORMAL' ? 'Normal' : r.status),
          prediction: r.status === 'ALERT' ? 'At Risk' : 'Healthy',
          confidence: r.status === 'ALERT' ? 65 : 90,
          timestamp: new Date(r.timestamp || r.received_at).toLocaleString(),
          hasAlert: r.status === 'ALERT',
          device_id: r.device_id,
          farm_name: r.farm_name,
          alert: r.alert,
          image_path: r.image_path || r.image_data,
          image_filename: r.image_filename,
          hasImage: !!(r.image_filename || r.image_path || r.image_data),
          ai_analyzed: false,
          ai_predictions: null
        }));
        setReadings(formattedReadings);

        const chartData = formattedReadings.slice(0, 10).map((r, i) => ({
          name: `#${r.livestockId}`,
          temperature: r.temperature,
          distance: r.distance / 10,
          activity: r.activity
        }));
        setChartData(chartData);

        const predData = {};
        formattedReadings.forEach(r => {
          predData[r.prediction] = (predData[r.prediction] || 0) + 1;
        });
        setPredictionData(Object.keys(predData).map(key => ({
          name: key,
          value: predData[key]
        })));
      }

      const serverStatsData = await fetchStatsFromServer();
      if (serverStatsData) {
        setServerStats(serverStatsData);
        setStats({
          totalDevices: serverStatsData.animals_tracked || 0,
          activeDevices: serverStatsData.animals_tracked || 0,
          totalReadings: serverStatsData.total_readings || 0,
          totalAlerts: serverStatsData.alerts || 0,
          unresolvedAlerts: serverStatsData.alerts || 0,
          averageTemperature: serverStatsData.average_temperature || 38.5,
          healthyAnimals: serverStatsData.healthy || 0,
          atRiskAnimals: serverStatsData.alerts + serverStatsData.warnings || 0
        });

        const alertSeverity = {};
        if (serverStatsData.alerts > 0) alertSeverity['High'] = serverStatsData.alerts;
        if (serverStatsData.warnings > 0) alertSeverity['Medium'] = serverStatsData.warnings;
        if (serverStatsData.healthy > 0) alertSeverity['Low'] = 0;
        setAlertData(Object.keys(alertSeverity).map(key => ({
          name: key,
          value: alertSeverity[key]
        })));
      }

      const serverAlerts = await fetchAlertsFromServer(true);
      if (serverAlerts.length > 0) {
        const formattedAlerts = serverAlerts.map(a => ({
          id: a.id,
          livestockId: parseInt(a.animal_id?.replace(/[^0-9]/g, '')) || 0,
          livestockName: a.animal_id || 'Unknown',
          type: a.type || 'Alert',
          description: a.message || 'Health issue detected',
          severity: a.type === 'ALERT' ? 'High' : 'Medium',
          resolved: a.resolved || false,
          timestamp: new Date(a.timestamp).toLocaleString(),
          image_path: a.image_path,
          image_filename: a.image_filename
        }));
        setAlerts(formattedAlerts);
      }

      setInitialLoadDone(true);
    } catch (err) {
      console.error('Error loading data from server:', err);
      setError(err.message);
      showToast('Failed to load IoT data from server', 'error');
      await loadDataFromBlockchain();
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // BLOCKCHAIN DATA FUNCTIONS (Fallback)
  // ============================================

  const getStoredDevices = () => {
    try {
      const stored = localStorage.getItem('iot_devices');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const loadDataFromBlockchain = async () => {
    try {
      setDataSource('blockchain');
      const contracts = await getContracts();

      const totalLivestock = await safeContractCall(contracts.livestockRegistry, 'getTotalLivestock');
      const total = totalLivestock.success ? Number(totalLivestock.data) : 0;
      
      const livestock = [];
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
      setLivestockList(livestock);

      const deviceList = [];
      const knownAddresses = [
        '0x430Bc0a13d6Eb6e3619d084909F679Beb6d282bF',
      ];
      
      const storedDevices = getStoredDevices();
      for (const addr of Object.keys(storedDevices)) {
        if (!knownAddresses.includes(addr)) {
          knownAddresses.push(addr);
        }
      }
      
      for (const addr of knownAddresses) {
        if (!addr || addr === '0x0000000000000000000000000000000000000000') continue;
        
        try {
          const isDevice = await safeContractCall(contracts.iotHealthMonitor, 'isDeviceRegistered', addr);
          if (isDevice.success && isDevice.data) {
            const name = await safeContractCall(contracts.iotHealthMonitor, 'dName', addr);
            const livestockId = await safeContractCall(contracts.iotHealthMonitor, 'dLivestock', addr);
            const active = await safeContractCall(contracts.iotHealthMonitor, 'dActive', addr);
            
            const details = storedDevices[addr.toLowerCase()] || {};
            
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
      
      setDevices(deviceList);
      console.log(`📡 Found ${deviceList.length} devices in blockchain`);

      const rCount = await safeContractCall(contracts.iotHealthMonitor, 'getReadingCount');
      const count = rCount.success ? Number(rCount.data) : 0;
      
      const readingList = [];
      for (let i = 0; i < Math.min(count, 50); i++) {
        try {
          const livestock = await safeContractCall(contracts.iotHealthMonitor, 'rLivestock', i);
          const temperature = await safeContractCall(contracts.iotHealthMonitor, 'rTemperature', i);
          const distance = await safeContractCall(contracts.iotHealthMonitor, 'rDistance', i);
          const activity = await safeContractCall(contracts.iotHealthMonitor, 'rActivity', i);
          const status = await safeContractCall(contracts.iotHealthMonitor, 'rStatus', i);
          const timestamp = await safeContractCall(contracts.iotHealthMonitor, 'rTimestamp', i);
          
          if (livestock.success) {
            const animal = livestockList.find(l => l.id === Number(livestock.data));
            readingList.push({
              id: i,
              livestockId: Number(livestock.data),
              livestockName: animal ? animal.name : `#${livestock.data}`,
              temperature: temperature.success ? Number(temperature.data) / 10 : 0,
              distance: distance.success ? Number(distance.data) / 10 : 0,
              activity: activity.success ? Number(activity.data) : 0,
              status: status.success ? status.data : 'Normal',
              prediction: status.success && status.data === 'ALERT' ? 'At Risk' : 'Healthy',
              confidence: status.success && status.data === 'ALERT' ? 65 : 90,
              timestamp: timestamp.success ? new Date(Number(timestamp.data) * 1000).toLocaleString() : new Date().toLocaleString(),
              hasAlert: status.success && status.data === 'ALERT',
              eating: false,
              restless: false,
              sound: false,
              hasImage: false,
              ai_analyzed: false,
              ai_predictions: null
            });
          }
        } catch (err) {
          console.warn(`Error loading reading ${i}:`, err.message);
        }
      }
      setReadings(readingList);
      setInitialLoadDone(true);

      setStats({
        totalDevices: deviceList.length,
        activeDevices: deviceList.filter(d => d.active).length,
        totalReadings: readingList.length,
        totalAlerts: 0,
        unresolvedAlerts: 0,
        averageTemperature: readingList.length > 0 
          ? readingList.reduce((sum, r) => sum + r.temperature, 0) / readingList.length 
          : 0,
        healthyAnimals: readingList.filter(r => r.status === 'NORMAL' || r.status === 'Normal').length,
        atRiskAnimals: readingList.filter(r => r.status === 'ALERT' || r.status === 'Warning').length
      });

    } catch (err) {
      console.error('Error loading blockchain data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // USE EFFECT
  // ============================================

  useEffect(() => {
    if (account && !initialLoadDone) {
      loadDataFromServer();
    }
  }, [account, initialLoadDone]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = () => {
    setInitialLoadDone(false);
    if (dataSource === 'server') {
      loadDataFromServer();
    } else {
      loadDataFromBlockchain();
    }
  };

  const toggleDataSource = () => {
    if (dataSource === 'server') {
      setDataSource('blockchain');
      loadDataFromBlockchain();
      showToast('Switched to blockchain data', 'info', 2000);
    } else {
      setDataSource('server');
      loadDataFromServer();
      showToast('Switched to server data', 'info', 2000);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      if (dataSource === 'server') {
        await resolveAlertOnServer(alertId);
      } else {
        const contracts = await getContracts();
        const tx = await contracts.iotHealthMonitor.resolveAlert(alertId);
        await tx.wait();
      }
      showToast('Alert resolved successfully!', 'success', 4000);
      await handleRefresh();
    } catch (err) {
      console.error('Error resolving alert:', err);
      showToast('Failed to resolve alert: ' + err.message, 'error');
    }
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast('Only admins can register devices', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const contracts = await getContracts();
      
      const isRegistered = await safeContractCall(
        contracts.iotHealthMonitor, 
        'isDeviceRegistered', 
        formData.deviceAddress
      );
      
      if (isRegistered.success && isRegistered.data) {
        showToast('⚠️ Device already registered in the contract!', 'warning');
        const newDevice = {
          address: formData.deviceAddress,
          name: formData.deviceName,
          livestockId: Number(formData.livestockId),
          active: true,
          status: 'Online',
          lastReading: 'N/A',
          battery: 85,
          signal: 90,
          registeredAt: new Date().toISOString()
        };
        
        const devices = getStoredDevices();
        devices[formData.deviceAddress.toLowerCase()] = newDevice;
        localStorage.setItem('iot_devices', JSON.stringify(devices));
        
        setShowDeviceModal(false);
        showToast(`Device "${formData.deviceName}" already registered!`, 'warning', 5000);
        await handleRefresh();
        return;
      }
      
      const tx = await contracts.iotHealthMonitor.registerDevice(
        formData.deviceAddress,
        formData.deviceName,
        Number(formData.livestockId)
      );
      await tx.wait();
      
      const newDevice = {
        address: formData.deviceAddress,
        name: formData.deviceName,
        livestockId: Number(formData.livestockId),
        active: true,
        status: 'Online',
        lastReading: 'N/A',
        battery: 85,
        signal: 90,
        registeredAt: new Date().toISOString()
      };
      
      const devices = getStoredDevices();
      devices[formData.deviceAddress.toLowerCase()] = newDevice;
      localStorage.setItem('iot_devices', JSON.stringify(devices));

      setShowDeviceModal(false);
      setFormData({
        deviceAddress: '',
        deviceName: '',
        livestockId: '',
        temperature: '',
        distance: '',
        activity: '',
        eating: false,
        restless: false,
        sound: false,
        status: '',
        prediction: '',
        confidence: '',
        imageHash: ''
      });
      
      showToast(`Device "${formData.deviceName}" registered successfully!`, 'success', 5000);
      await handleRefresh();
    } catch (err) {
      console.error('Error registering device:', err);
      if (err.message && err.message.includes('Already')) {
        showToast('⚠️ Device already registered in the contract!', 'warning');
        await handleRefresh();
      } else {
        showToast('Failed to register device: ' + err.message, 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const viewDeviceDetails = (device) => {
    setSelectedDevice(device);
  };

  const viewReadingDetails = (reading) => {
    setSelectedReading(reading);
  };

  // ============================================
  // ACCESS DENIED
  // ============================================
  if (!canViewReadings) {
    return (
      <div className="access-denied">
        <div className="denied-icon">🚫</div>
        <h1>Access Denied</h1>
        <p>Only farmers, vets, and admins can view IoT monitor.</p>
        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="loading-container-centered">
        <div className="loading-spinner-centered"></div>
        <p className="loading-text">Loading IoT data from {dataSource}...</p>
      </div>
    );
  }

  const filteredDevices = devices.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Normal':
      case 'Healthy': return '#4CAF50';
      case 'Warning': return '#FF9800';
      case 'Sick':
      case 'Critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const COLORS = ['#4CAF50', '#FF9800', '#F44336', '#2196F3', '#9C27B0'];

  return (
    <div className="iot-monitor">
      <div className="page-header">
        <div className="header-left">
          <h1>📡 IoT Monitor</h1>
          <p className="page-subtitle">Real-time livestock health monitoring with IoT sensors</p>
          <div className="debug-info">
            <span className="debug-badge">Role: {userRole}</span>
            <span className="debug-badge">Source: {dataSource.toUpperCase()}</span>
            <span className={`debug-badge ${serverStatus?.online ? 'online' : 'offline'}`}>
              {serverStatus?.online ? '🟢 Server Online' : '🔴 Server Offline'}
            </span>
            <span className="debug-badge">Devices: {devices.length}</span>
            <span className="debug-badge">Alerts: {alerts.filter(a => !a.resolved).length}</span>
            <span className="debug-badge" style={{ background: '#9C27B0', color: 'white' }}>
              📸 Images: {imageCount}
            </span>
            <span className={`debug-badge ${aiStatus === 'processing' ? 'processing' : aiStatus === 'complete' ? 'online' : ''}`} 
                  style={{ background: aiStatus === 'processing' ? '#FF9800' : aiStatus === 'complete' ? '#4CAF50' : '#666', color: 'white' }}>
              🧠 AI: {aiStatus === 'processing' ? 'Processing...' : aiStatus === 'complete' ? 'Ready' : 'Idle'}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn-secondary"
            onClick={toggleDataSource}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Database size={14} /> Switch to {dataSource === 'server' ? 'Blockchain' : 'Server'}
          </button>
          {canManageDevices && (
            <>
              <button 
                className="btn-primary"
                onClick={() => setShowDeviceModal(true)}
              >
                <PlusCircle size={16} /> Register Device
              </button>
              <button 
                className="btn-secondary"
                onClick={sendTestData}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Upload size={14} /> Send Test
              </button>
              <button 
                className="btn-secondary"
                onClick={sendBatchTestData}
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                <Upload size={14} /> Batch (10)
              </button>
              <button 
                className="btn-primary"
                onClick={openAIUploadModal}
                style={{ background: '#9C27B0', fontSize: '12px', padding: '6px 12px' }}
                disabled={aiLoading}
              >
                <Cpu size={14} /> {aiLoading ? 'Analyzing...' : 'Send to AI'}
              </button>
              <button 
                className="btn-secondary"
                onClick={sendBatchToAI}
                style={{ fontSize: '12px', padding: '6px 12px', background: '#7B1FA2', color: 'white' }}
                disabled={aiLoading}
              >
                <Cpu size={14} /> AI Batch
              </button>
              <button 
                className="btn-secondary"
                onClick={clearServerData}
                style={{ fontSize: '12px', padding: '6px 12px', color: '#F44336' }}
              >
                🗑️ Clear
              </button>
            </>
          )}
          <button 
            className="btn-secondary"
            onClick={fetchImageList}
            style={{ fontSize: '12px', padding: '6px 12px', background: '#9C27B0', color: 'white' }}
          >
            <Image size={14} /> Gallery ({imageCount})
          </button>
          <button className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Server Status Banner */}
      {serverStatus?.online && (
        <div className="server-status-banner online">
          <Server size={16} />
          <span>IoT Server is online. {serverStatus.data?.readings || 0} readings, {imageCount} images available.</span>
        </div>
      )}
      {serverStatus && !serverStatus.online && (
        <div className="server-status-banner offline">
          <AlertCircle size={16} />
          <span>IoT Server is offline. Using blockchain data (read-only).</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid-compact">
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Wifi size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Devices</h3>
            <p className="stat-number-compact">{stats.totalDevices}</p>
            <span className="stat-label-compact">{stats.activeDevices} active</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Activity size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Readings</h3>
            <p className="stat-number-compact">{stats.totalReadings}</p>
            <span className="stat-label-compact">Total readings</span>
          </div>
        </div>
        <div className="stat-card-compact alert-card">
          <div className="stat-card-compact-icon"><AlertCircle size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Alerts</h3>
            <p className="stat-number-compact" style={{ color: stats.unresolvedAlerts > 0 ? '#F44336' : '#4CAF50' }}>
              {stats.unresolvedAlerts}
            </p>
            <span className="stat-label-compact">Unresolved alerts</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Thermometer size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Avg Temp</h3>
            <p className="stat-number-compact">{stats.averageTemperature}°C</p>
            <span className="stat-label-compact">Average temperature</span>
          </div>
        </div>
        <div className="stat-card-compact">
          <div className="stat-card-compact-icon"><Heart size={20} /></div>
          <div className="stat-card-compact-content">
            <h3>Health</h3>
            <p className="stat-number-compact">{stats.healthyAnimals}</p>
            <span className="stat-label-compact">Healthy animals</span>
          </div>
        </div>
        <div className="stat-card-compact" style={{ borderColor: '#9C27B0' }}>
          <div className="stat-card-compact-icon"><Image size={20} color="#9C27B0" /></div>
          <div className="stat-card-compact-content">
            <h3>📸 Images</h3>
            <p className="stat-number-compact" style={{ color: '#9C27B0' }}>{imageCount}</p>
            <span className="stat-label-compact">Captured images</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <h2><TrendingUp size={20} /> IoT Analytics</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <h4><Thermometer size={16} /> Temperature & Activity Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#F44336" name="Temperature" />
                <Bar yAxisId="right" dataKey="activity" fill="#4CAF50" name="Activity" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><Activity size={16} /> Health Predictions</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={predictionData.length > 0 ? predictionData : [{ name: 'Healthy', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {predictionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><AlertCircle size={16} /> Alerts by Severity</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertData.length > 0 ? alertData : [{ name: 'None', value: 1 }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h4><Activity size={16} /> Reading Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: stats.healthyAnimals || 1 },
                    { name: 'At Risk', value: stats.atRiskAnimals || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  <Cell fill="#4CAF50" />
                  <Cell fill="#F44336" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search devices by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input-large"
          />
        </div>
      </div>

      {/* Devices Table */}
      <div className="table-container">
        <table className="iot-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Device</th>
              <th>Address</th>
              <th>Livestock</th>
              <th>Status</th>
              <th>Last Reading</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <div className="empty-state-content">
                    <Wifi size={48} className="empty-icon" />
                    <p>No devices registered yet</p>
                    {canManageDevices && (
                      <button 
                        className="btn-primary"
                        onClick={() => setShowDeviceModal(true)}
                      >
                        <PlusCircle size={16} /> Register First Device
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, index) => (
                <tr key={device.address}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="device-name-cell">
                      <span className="device-icon">📡</span>
                      <span className="device-name">{device.name}</span>
                    </div>
                  </td>
                  <td className="address-cell">
                    <span className="address-text">
                      {device.address.slice(0, 6)}...{device.address.slice(-4)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="livestock-link"
                      onClick={() => {
                        const animal = livestockList.find(l => l.id === device.livestockId);
                        if (animal) {
                          showToast(`Livestock #${animal.id} - ${animal.name}`, 'info', 3000);
                        }
                      }}
                    >
                      #{device.livestockId}
                    </button>
                  </td>
                  <td>
                    <span className={`status-badge ${device.active ? 'active' : 'inactive'}`}>
                      {device.active ? '✅ Online' : '❌ Offline'}
                    </span>
                  </td>
                  <td>{device.lastReading}</td>
                  <td>
                    <div className="action-buttons-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => viewDeviceDetails(device)}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Readings Table with Images and AI */}
      <div className="readings-section" style={{ marginTop: '24px' }}>
        <h2>📊 Recent Readings</h2>
        <div className="table-container">
          <table className="iot-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Animal</th>
                <th>Temperature</th>
                <th>Distance</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Time</th>
                <th>Image</th>
                <th>AI</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {readings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-state">
                    <div className="empty-state-content">
                      <Activity size={48} className="empty-icon" />
                      <p>No readings available yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                readings.slice(0, 20).map((reading, index) => (
                  <tr key={reading.id || index} className={reading.status === 'Warning' ? 'warning-row' : ''}>
                    <td>#{reading.id || index + 1}</td>
                    <td>{reading.livestockName}</td>
                    <td style={{ color: reading.temperature > 39 ? '#F44336' : '#4CAF50' }}>
                      {reading.temperature}°C
                    </td>
                    <td>{reading.distance} cm</td>
                    <td>{reading.activity}%</td>
                    <td>
                      <span className={`status-badge ${reading.status === 'Normal' ? 'active' : reading.status === 'Warning' ? 'warning' : 'inactive'}`}>
                        {reading.status}
                      </span>
                    </td>
                    <td>{reading.timestamp}</td>
                    <td>
                      {reading.hasImage ? (
                        <button 
                          className="action-btn view"
                          onClick={() => viewImageFromReading(reading)}
                          style={{ background: '#9C27B0', color: 'white', padding: '2px 8px', fontSize: '10px' }}
                        >
                          📸 View
                        </button>
                      ) : '—'}
                    </td>
                    <td>
                      {reading.ai_analyzed ? (
                        <span className="status-badge active" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          ✅ AI
                        </span>
                      ) : (
                        reading.hasImage ? (
                          <button 
                            className="action-btn"
                            onClick={() => sendReadingToAI(reading)}
                            style={{ background: '#9C27B0', color: 'white', padding: '2px 8px', fontSize: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            disabled={aiLoading}
                          >
                            <Cpu size={12} /> Analyze
                          </button>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#999' }}>No image</span>
                        )
                      )}
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button 
                          className="action-btn view"
                          onClick={() => {
                            setSelectedReading(reading);
                            setShowReadingModal(true);
                          }}
                        >
                          <Eye size={14} /> Details
                        </button>
                        {reading.hasImage && !reading.ai_analyzed && (
                          <button 
                            className="action-btn"
                            onClick={() => sendReadingToAI(reading)}
                            style={{ background: '#9C27B0', color: 'white' }}
                            disabled={aiLoading}
                          >
                            <Cpu size={14} /> AI
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
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section" style={{ marginTop: '24px' }}>
          <h2><AlertCircle size={20} /> Recent Alerts</h2>
          <div className="table-container">
            <table className="iot-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Livestock</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Description</th>
                  <th>Time</th>
                  <th>Image</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 10).map((alert) => (
                  <tr key={alert.id} className={alert.resolved ? '' : 'alert-row'}>
                    <td>#{alert.id}</td>
                    <td>#{alert.livestockId}</td>
                    <td>{alert.type}</td>
                    <td>
                      <span className={`severity-badge ${alert.severity}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>{alert.description}</td>
                    <td>{alert.timestamp}</td>
                    <td>
                      {alert.image_filename ? (
                        <button 
                          className="action-btn view"
                          onClick={() => viewImageFromReading(alert)}
                          style={{ background: '#9C27B0', color: 'white', padding: '2px 8px', fontSize: '10px' }}
                        >
                          📸 View
                        </button>
                      ) : '—'}
                    </td>
                    <td>
                      <span className={`status-badge ${alert.resolved ? 'active' : 'inactive'}`}>
                        {alert.resolved ? '✅ Resolved' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        {!alert.resolved && canResolveAlerts && (
                          <button 
                            className="action-btn activate"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle size={14} /> Resolve
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

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Device Details Modal */}
      {selectedDevice && (
        <div className="modal-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📡 Device Details</h2>
              <button className="modal-close" onClick={() => setSelectedDevice(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedDevice.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value address-full">{selectedDevice.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Livestock ID:</span>
                <span className="detail-value">#{selectedDevice.livestockId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge ${selectedDevice.active ? 'active' : 'inactive'}`}>
                  {selectedDevice.active ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Battery:</span>
                <span className="detail-value">{selectedDevice.battery}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Signal:</span>
                <span className="detail-value">{selectedDevice.signal}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Registered:</span>
                <span className="detail-value">{new Date(selectedDevice.registeredAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedDevice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reading Details Modal */}
      {selectedReading && (
        <div className="modal-overlay" onClick={() => setSelectedReading(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Reading Details</h2>
              <button className="modal-close" onClick={() => setSelectedReading(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Livestock:</span>
                <span className="detail-value">{selectedReading.livestockName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Temperature:</span>
                <span className="detail-value" style={{ color: selectedReading.temperature > 39 ? '#F44336' : '#4CAF50' }}>
                  {selectedReading.temperature}°C
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Distance:</span>
                <span className="detail-value">{selectedReading.distance} cm</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Activity:</span>
                <span className="detail-value">{selectedReading.activity}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value" style={{ color: getStatusColor(selectedReading.status) }}>
                  {selectedReading.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Prediction:</span>
                <span className="detail-value">{selectedReading.prediction}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Confidence:</span>
                <span className="detail-value">{selectedReading.confidence}%</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Eating:</span>
                <span className="detail-value">{selectedReading.eating ? '✅ Yes' : '❌ No'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Restless:</span>
                <span className="detail-value">{selectedReading.restless ? '⚠️ Yes' : '❌ No'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span className="detail-value">{selectedReading.timestamp}</span>
              </div>
              {selectedReading.hasImage && (
                <div className="detail-row">
                  <span className="detail-label">Image:</span>
                  <span className="detail-value">
                    <button 
                      className="btn-primary"
                      onClick={() => viewImageFromReading(selectedReading)}
                      style={{ padding: '4px 12px', fontSize: '12px', background: '#9C27B0' }}
                    >
                      📸 View Image
                    </button>
                  </span>
                </div>
              )}
              {selectedReading.ai_analyzed && selectedReading.ai_predictions && (
                <div className="detail-row">
                  <span className="detail-label">AI Predictions:</span>
                  <span className="detail-value">
                    {selectedReading.ai_predictions.map((p, i) => (
                      <div key={i} style={{ fontSize: '12px' }}>
                        {p.class}: {(p.confidence * 100).toFixed(1)}%
                      </div>
                    ))}
                  </span>
                </div>
              )}
              {!selectedReading.ai_analyzed && selectedReading.hasImage && (
                <div className="detail-row">
                  <span className="detail-label">AI Analysis:</span>
                  <span className="detail-value">
                    <button 
                      className="btn-primary"
                      onClick={() => sendReadingToAI(selectedReading)}
                      style={{ padding: '4px 12px', fontSize: '12px', background: '#9C27B0' }}
                      disabled={aiLoading}
                    >
                      <Cpu size={14} /> Analyze with AI
                    </button>
                  </span>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedReading(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <div className="modal-overlay" onClick={() => setShowImageGallery(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📸 Image Gallery</h2>
              <div className="modal-subtitle">
                {imageList.length} images captured by IoT devices
              </div>
              <button className="modal-close" onClick={() => setShowImageGallery(false)}>✕</button>
            </div>
            <div className="modal-body">
              {imageList.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📸</span>
                  <p>No images captured yet</p>
                  <p style={{ fontSize: '13px', color: '#999' }}>Images will appear here when the ESP32 captures them on motion events.</p>
                </div>
              ) : (
                <div className="image-gallery-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '16px' 
                }}>
                  {imageList.map((img, index) => (
                    <div key={index} className="image-gallery-item" style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}>
                      <img 
                        src={`http://10.36.163.23:3001${img.url}`} 
                        alt={`Image ${index + 1}`}
                        onClick={() => window.open(`http://10.36.163.23:3001${img.url}`, '_blank')}
                        style={{ 
                          width: '100%', 
                          height: '200px', 
                          objectFit: 'cover',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                          e.target.style.objectFit = 'contain';
                        }}
                      />
                      <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                        <span className="image-filename" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                          {img.filename}
                        </span>
                        <span className="image-size">{Math.round(img.size / 1024)} KB</span>
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          const reading = readings.find(r => r.image_filename === img.filename);
                          if (reading) {
                            sendReadingToAI(reading);
                          } else {
                            // Send just the image
                            fetch(`http://10.36.163.23:3001${img.url}`)
                              .then(res => res.blob())
                              .then(blob => {
                                const reader = new FileReader();
                                reader.onload = (e) => sendImageToAI(e.target.result, null);
                                reader.readAsDataURL(blob);
                              });
                          }
                        }}
                        style={{ 
                          width: '100%', 
                          padding: '4px', 
                          fontSize: '11px', 
                          background: '#9C27B0', 
                          color: 'white', 
                          border: 'none', 
                          cursor: 'pointer' 
                        }}
                        disabled={aiLoading}
                      >
                        <Cpu size={12} /> Analyze with AI
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImageGallery(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧠 AI Analysis Results</h2>
              <button className="modal-close" onClick={() => setShowAIModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#9C27B0' }}>Prediction Results</h4>
                {aiPredictions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiPredictions.map((pred, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: index === 0 ? '#e8f5e9' : '#f5f5f5',
                        borderRadius: '6px',
                        border: index === 0 ? '1px solid #4CAF50' : '1px solid #e0e0e0'
                      }}>
                        <span style={{ fontWeight: index === 0 ? '600' : '400' }}>{pred.class}</span>
                        <span style={{ 
                          fontWeight: '600',
                          color: pred.confidence > 0.7 ? '#4CAF50' : pred.confidence > 0.4 ? '#FF9800' : '#F44336'
                        }}>
                          {(pred.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No predictions available</p>
                )}
              </div>
              <div style={{ 
                padding: '12px', 
                background: '#fff3e0', 
                borderRadius: '6px',
                border: '1px solid #ffb74d'
              }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
                  <strong>Note:</strong> AI analysis is currently in simulation mode. 
                  To use real AI predictions, integrate your Teachable Machine model.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAIModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Upload Modal */}
      {showAIUploadModal && (
        <div className="modal-overlay" onClick={() => setShowAIUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🧠 Upload Image for AI Analysis</h2>
              <button className="modal-close" onClick={() => setShowAIUploadModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                border: '2px dashed #9C27B0',
                borderRadius: '12px',
                background: '#faf0ff'
              }}>
                <Cpu size={48} color="#9C27B0" />
                <h3 style={{ margin: '16px 0 8px 0', color: '#9C27B0' }}>Upload Image for AI Analysis</h3>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Upload an image of your livestock to get AI-powered health predictions
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUploadForAI}
                  style={{ display: 'none' }}
                  id="ai-image-upload"
                />
                <label 
                  htmlFor="ai-image-upload" 
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: '#9C27B0',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Select Image
                </label>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '12px' }}>
                  Supported formats: JPG, PNG, JPEG
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAIUploadModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Register Device Modal */}
      {showDeviceModal && (
        <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📡 Register Device</h2>
              <button className="modal-close" onClick={() => setShowDeviceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRegisterDevice}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Device Address *</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={formData.deviceAddress}
                    onChange={(e) => setFormData({...formData, deviceAddress: e.target.value})}
                    required
                    className="styled-input"
                  />
                  <small className="form-hint">Enter the Ethereum address of the IoT device</small>
                </div>
                <div className="form-group">
                  <label>Device Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Sensor-01"
                    value={formData.deviceName}
                    onChange={(e) => setFormData({...formData, deviceName: e.target.value})}
                    required
                    className="styled-input"
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Livestock *</label>
                  <select
                    value={formData.livestockId}
                    onChange={(e) => setFormData({...formData, livestockId: e.target.value})}
                    required
                    className="styled-select"
                  >
                    <option value="">Select livestock</option>
                    {livestockList.map((l) => (
                      <option key={l.id} value={l.id}>
                        #{l.id} - {l.name} ({l.breed})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowDeviceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : '📡 Register Device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default IoTMonitor;