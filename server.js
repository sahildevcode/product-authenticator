const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Database File Path
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initial Seed Data matching the user's uploaded images
const INITIAL_DATA = {
  products: [
    {
      id: "prod-001",
      itemType: "Dietary Supplement",
      name: "Optimum Nutrition (ON) Serious Mass",
      flavor: "Double Rich Chocolate",
      qty: "1 N",
      netWt: "6 lb (2.75Kg)",
      mrp: "7499",
      countryOfOrigin: "USA",
      mfgBy: "Iovate Health Sciences / Glanbia Nutritionals, 3880 Jeffrey Blvd, Blasdell, NY 14219, USA",
      mfgDt: "08/2026",
      expDt: "07/2028",
      batchNo: "ON-SM-94821",
      importerName: "MusclePro Nutrition Pvt. Ltd. (MPN)",
      importerAddress: "Unit 339, Kanakia Zillion, LBS Rd, Kurla (W) Mumbai-70, Maharashtra",
      fssaiLicense: "10015022003370",
      fssaiApproved: true,
      fccCertified: true,
      customerCare: "+91-80871 79998",
      email: "info@musclepronutrition.com"
    },
    {
      id: "prod-002",
      itemType: "Dietary Supplement",
      name: "RC Pro-Antium",
      flavor: "Vanilla Wafer",
      qty: "1 N",
      netWt: "6 lb (2.75Kg)",
      mrp: "7499",
      countryOfOrigin: "USA",
      mfgBy: "Iovate Health Sciences, 3880 Jeffrey Blvd, Blasdell, NY 14219, USA",
      mfgDt: "09/2026",
      expDt: "08/2028",
      batchNo: "RC-PA-34428",
      importerName: "MusclePro Nutrition Pvt. Ltd. (MPN)",
      importerAddress: "Unit 339, Kanakia Zillion, LBS Rd, Kurla (W) Mumbai-70, Maharashtra",
      fssaiLicense: "10015022003370",
      fssaiApproved: true,
      fccCertified: true,
      customerCare: "+91-80871 79998",
      email: "info@musclepronutrition.com"
    }
  ],
  codes: [
    {
      code: "804577", // The exact scratch code from Image 2
      serialNo: "3442854",
      productId: "prod-002",
      status: "ACTIVE", // ACTIVE, REVOKED
      scanCount: 0,
      firstScannedAt: null,
      lastScannedAt: null,
      scanHistory: []
    },
    {
      code: "942185",
      serialNo: "3442855",
      productId: "prod-001",
      status: "ACTIVE",
      scanCount: 0,
      firstScannedAt: null,
      lastScannedAt: null,
      scanHistory: []
    },
    {
      code: "518392",
      serialNo: "3442856",
      productId: "prod-001",
      status: "ACTIVE",
      scanCount: 0,
      firstScannedAt: null,
      lastScannedAt: null,
      scanHistory: []
    }
  ]
};

// Database helper functions
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database, resetting to default:", err);
    saveDB(INITIAL_DATA);
    return INITIAL_DATA;
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Generate QR Code Helper
app.get('/api/qr', async (req, res) => {
  try {
    const text = req.query.text || 'http://localhost:3000';
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 250,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    res.json({ success: true, dataUrl: qrDataUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verification API (Customer scans QR and enters number)
app.post('/api/verify', (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide a valid code.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const db = loadDB();

  const codeEntry = db.codes.find(c => {
    const stripped = cleanCode.replace(/^SN[-:\s]*/i, '');
    return c.code.toUpperCase() === cleanCode || 
           c.serialNo.toUpperCase() === cleanCode ||
           c.serialNo.toUpperCase() === stripped ||
           ('SN-' + c.serialNo).toUpperCase() === cleanCode;
  });

  if (!codeEntry) {
    return res.json({
      success: false,
      status: 'INVALID',
      message: 'Invalid Authentication Code! This product could not be verified in the database.'
    });
  }

  if (codeEntry.status === 'REVOKED') {
    return res.json({
      success: false,
      status: 'REVOKED',
      message: 'This security code has been revoked or reported compromised.'
    });
  }

  const product = db.products.find(p => p.id === codeEntry.productId) || db.products[0];

  const now = new Date().toISOString();
  const isFirstScan = (codeEntry.scanCount === 0);

  if (isFirstScan) {
    codeEntry.firstScannedAt = now;
  }
  codeEntry.scanCount += 1;
  codeEntry.lastScannedAt = now;
  codeEntry.scanHistory.push({
    timestamp: now,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || 'unknown'
  });

  saveDB(db);

  let status = 'GENUINE';
  if (!isFirstScan) {
    status = 'ALREADY_SCANNED';
  }

  return res.json({
    success: true,
    status: status,
    isFirstScan: isFirstScan,
    scanCount: codeEntry.scanCount,
    firstScannedAt: codeEntry.firstScannedAt,
    lastScannedAt: codeEntry.lastScannedAt,
    code: codeEntry.code,
    serialNo: codeEntry.serialNo,
    product: product
  });
});

// Admin: Get all codes & products
app.get('/api/admin/data', (req, res) => {
  const db = loadDB();
  res.json({ success: true, products: db.products, codes: db.codes });
});

// Admin: Generate new batch of unique codes
app.post('/api/admin/generate-codes', (req, res) => {
  const { productId, count = 10, codeLength = 6 } = req.body;
  const numCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 500);

  const db = loadDB();
  const selectedProduct = db.products.find(p => p.id === productId) || db.products[0];

  const newCodes = [];
  const existingCodesSet = new Set(db.codes.map(c => c.code));

  for (let i = 0; i < numCount; i++) {
    let generatedCode;
    do {
      if (codeLength === 6) {
        // 6-digit numeric like 804577
        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      } else {
        // 8-character alphanumeric like 8A42-X9K2
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        generatedCode = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      }
    } while (existingCodesSet.has(generatedCode));

    existingCodesSet.add(generatedCode);
    const serialNo = (3442850 + db.codes.length + i + 1).toString();

    const codeObj = {
      code: generatedCode,
      serialNo: serialNo,
      productId: selectedProduct.id,
      status: "ACTIVE",
      scanCount: 0,
      firstScannedAt: null,
      lastScannedAt: null,
      scanHistory: []
    };

    db.codes.push(codeObj);
    newCodes.push(codeObj);
  }

  saveDB(db);
  res.json({ success: true, count: newCodes.length, generated: newCodes });
});

// Admin: Reset a code's scan count for testing
app.post('/api/admin/reset-code', (req, res) => {
  const { code } = req.body;
  const db = loadDB();
  const item = db.codes.find(c => c.code === code);
  if (item) {
    item.scanCount = 0;
    item.firstScannedAt = null;
    item.lastScannedAt = null;
    item.scanHistory = [];
    saveDB(db);
    return res.json({ success: true, message: `Code ${code} reset successfully.` });
  }
  res.status(404).json({ success: false, message: 'Code not found' });
});

// Product Management API
app.get('/api/products', (req, res) => {
  const db = loadDB();
  res.json({ success: true, products: db.products || [] });
});

app.post('/api/products', (req, res) => {
  const productData = req.body;
  if (!productData || !productData.name) {
    return res.status(400).json({ success: false, message: 'Product name is required' });
  }

  const db = loadDB();
  if (!db.products) db.products = [];

  let product = null;
  if (productData.id) {
    const idx = db.products.findIndex(p => p.id === productData.id);
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...productData };
      product = db.products[idx];
    }
  }

  if (!product) {
    const idx = db.products.findIndex(p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase());
    if (idx >= 0) {
      db.products[idx] = { ...db.products[idx], ...productData };
      product = db.products[idx];
    } else {
      product = {
        id: 'prod-' + Date.now(),
        ...productData
      };
      db.products.push(product);
    }
  }

  saveDB(db);
  res.json({ success: true, product, message: 'Product saved successfully!' });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  db.products = (db.products || []).filter(p => p.id !== id);
  saveDB(db);
  res.json({ success: true, message: 'Product deleted successfully' });
});

// Redirect /verify to slip-generator.html
app.get('/verify', (req, res) => {
  res.redirect('/slip-generator.html');
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Product Slip & QR Generator Running!`);
  console.log(`🏷️ Main Slip Generator:  http://localhost:${PORT}`);
  console.log(`⚡ Mini QR Sticker:       http://localhost:${PORT}/mini-sticker.html`);
  console.log(`⚙️ Admin Dashboard:       http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});
