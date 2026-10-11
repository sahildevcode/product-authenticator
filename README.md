# 🏷️ Product Authenticity Slip & QR Code Generator

A complete solution for **Fitness Supplements (Protein, Mass Gainers, Creatine, etc.) and Consumer Brands** to generate authentic importer/manufacturer product slips and QR codes with 1-click database saving and print sheet support.

---

## 🌟 Key Features

1. **Product Authenticity Slip Generator (`/slip-generator.html` / `/`)**:
   - Importer slip layout with live preview (FSSAI license, MRP, Net Weight, Flavor, Mfg/Exp dates).
   - Centered QR Code encoding your target website link.
   - Print-ready format (`@media print` optimized: prints only clean slips without menus or buttons).
   - Save / update product details directly to the local database.

2. **Admin Product & Print Manager (`/admin.html`)**:
   - **Quick Print**: Select any saved product from a dropdown, choose quantity (1, 2, 4, 6, 12, 18 slips), and print immediately.
   - **Product Database**: List of saved products with 1-click printing and deletion.
   - **Add New Product**: Form to add new products so you never have to re-type details every time.

3. **Horizontal Mini QR Sticker (`/mini-sticker.html`)**:
   - Compact security seal sticker featuring headline, QR Code, and unique serial number.

---

## 🚀 How to Run Locally

1. Clone or download the repository:
   ```bash
   git clone <YOUR_REPO_URL>
   cd product-authenticator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open in browser:
   - **Slip Generator & Print**: [http://localhost:3000](http://localhost:3000)
   - **Admin Product Manager**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
   - **Mini QR Sticker**: [http://localhost:3000/mini-sticker.html](http://localhost:3000/mini-sticker.html)
