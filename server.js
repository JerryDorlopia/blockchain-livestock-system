// server.js - IoT Data Receiver with Image Storage
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Store readings in memory
let readings = [];
let alerts = [];
let readingId = 0;
let alertId = 0;

// Data directory for persistence
const DATA_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const READINGS_FILE = path.join(DATA_DIR, 'readings.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Load existing data
function loadData() {
  try {
    if (fs.existsSync(READINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(READINGS_FILE, 'utf8'));
      readings = data;
      readingId = readings.length > 0 ? Math.max(...readings.map(r => r.id)) + 1 : 0;
    }
    if (fs.existsSync(ALERTS_FILE)) {
      alerts = JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
      alertId = alerts.length > 0 ? Math.max(...alerts.map(a => a.id)) + 1 : 0;
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// Save data
function saveData() {
  try {
    fs.writeFileSync(READINGS_FILE, JSON.stringify(readings, null, 2));
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load initial data
loadData();

// ==================== API ENDPOINTS ====================

// Test endpoint
app.get('/api/iot/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IoT Server is running',
    readings: readings.length,
    alerts: alerts.length,
    images: fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).length,
    timestamp: new Date().toISOString()
  });
});

// Get all readings
app.get('/api/iot/readings', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const animal = req.query.animal;
  
  let filtered = readings;
  if (animal) {
    filtered = filtered.filter(r => r.animal_id === animal);
  }
  
  // Return newest first
  const sorted = filtered.sort((a, b) => b.id - a.id);
  res.json({
    success: true,
    count: sorted.length,
    data: sorted.slice(0, limit)
  });
});

// Get stats
app.get('/api/iot/stats', (req, res) => {
  const totalReadings = readings.length;
  const alertsCount = readings.filter(r => r.status === 'ALERT').length;
  const warnings = readings.filter(r => r.status === 'WARNING').length;
  const healthy = readings.filter(r => r.status === 'NORMAL').length;
  
  // Count unique animals
  const animals = new Set(readings.map(r => r.animal_id));
  
  // Average temperature
  let avgTemp = 0;
  if (totalReadings > 0) {
    avgTemp = readings.reduce((sum, r) => sum + (r.temperature || 0), 0) / totalReadings;
  }
  
  res.json({
    success: true,
    stats: {
      total_readings: totalReadings,
      alerts: alertsCount,
      warnings: warnings,
      healthy: healthy,
      animals_tracked: animals.size,
      average_temperature: Math.round(avgTemp * 10) / 10
    }
  });
});

// Get alerts
app.get('/api/iot/alerts', (req, res) => {
  const unresolved = req.query.unresolved === 'true';
  let filtered = alerts;
  if (unresolved) {
    filtered = filtered.filter(a => !a.resolved);
  }
  
  res.json({
    success: true,
    count: filtered.length,
    data: filtered.sort((a, b) => b.id - a.id)
  });
});

// Serve images
app.get('/api/iot/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(IMAGES_DIR, filename);
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Get all images list
app.get('/api/iot/images', (req, res) => {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const images = files
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'))
      .map(f => ({
        filename: f,
        url: `/api/iot/images/${f}`,
        path: path.join(IMAGES_DIR, f),
        size: fs.statSync(path.join(IMAGES_DIR, f)).size
      }));
    res.json({ success: true, count: images.length, images });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Receive IoT data from ESP32
app.post('/api/iot/data', (req, res) => {
  const data = req.body;
  
  console.log('📤 Received IoT data:', {
    device: data.device_id,
    animal: data.animal_id,
    distance: data.distance,
    temperature: data.temperature,
    status: data.status,
    hasImage: !!data.image_data
  });
  
  // Generate unique ID
  const id = readingId++;
  
  // Save image if present
  let imagePath = null;
  let imageFilename = null;
  if (data.image_data) {
    try {
      // Remove the data:image/jpeg;base64, prefix
      const base64Data = data.image_data.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename with timestamp
      const timestamp = Date.now();
      imageFilename = `image_${id}_${timestamp}.jpg`;
      imagePath = path.join(IMAGES_DIR, imageFilename);
      
      // Save image to disk
      fs.writeFileSync(imagePath, imageBuffer);
      console.log(`📸 Image saved: ${imageFilename} (${Math.round(imageBuffer.length / 1024)} KB)`);
    } catch (error) {
      console.error('❌ Failed to save image:', error.message);
    }
  }
  
  // Add timestamp if not provided
  const reading = {
    id,
    ...data,
    image_path: imagePath ? path.relative(__dirname, imagePath) : null,
    image_filename: imageFilename,
    received_at: new Date().toISOString()
  };
  
  readings.push(reading);
  saveData();
  
  // Check for alerts
  if (data.status === 'ALERT' || data.alert) {
    const alert = {
      id: alertId++,
      animal_id: data.animal_id,
      type: data.alert ? 'HEALTH_ALERT' : 'STATUS_ALERT',
      message: data.alert || `${data.status} status detected for ${data.animal_id}`,
      severity: data.status === 'ALERT' ? 'High' : 'Medium',
      resolved: false,
      reading_id: id,
      image_path: imagePath ? path.relative(__dirname, imagePath) : null,
      image_filename: imageFilename,
      timestamp: new Date().toISOString()
    };
    alerts.push(alert);
    saveData();
    
    console.log('🚨 Alert created:', alert.message);
  }
  
  res.json({
    success: true,
    message: 'Data received successfully',
    id: id,
    image_saved: imagePath !== null,
    image_filename: imageFilename,
    timestamp: reading.received_at
  });
});

// Resolve an alert
app.post('/api/iot/alerts/:id/resolve', (req, res) => {
  const alertId = parseInt(req.params.id);
  const alert = alerts.find(a => a.id === alertId);
  
  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Alert not found'
    });
  }
  
  if (alert.resolved) {
    return res.json({
      success: true,
      message: 'Alert already resolved'
    });
  }
  
  alert.resolved = true;
  alert.resolved_at = new Date().toISOString();
  saveData();
  
  res.json({
    success: true,
    message: 'Alert resolved',
    data: alert
  });
});

// Clear all data
app.delete('/api/iot/data', (req, res) => {
  // Also delete images
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(IMAGES_DIR, file));
    }
    console.log('🗑️ All images deleted');
  } catch (error) {
    console.error('Error deleting images:', error);
  }
  
  readings = [];
  alerts = [];
  readingId = 0;
  alertId = 0;
  saveData();
  
  res.json({
    success: true,
    message: 'All IoT data and images cleared'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  const imageCount = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg')).length;
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║   IoT DATA SERVER - Livestock Health System     ║`);
  console.log(`╚════════════════════════════════════════════════════╝`);
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  📡 API URL: http://localhost:${PORT}/api/iot`);
  console.log(`  📊 Readings: ${readings.length}`);
  console.log(`  🚨 Alerts: ${alerts.length}`);
  console.log(`  📸 Images: ${imageCount}`);
  console.log(`  📁 Data directory: ${DATA_DIR}`);
  console.log(`  📁 Images directory: ${IMAGES_DIR}`);
  console.log(`====================================================\n`);
});