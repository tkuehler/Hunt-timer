# Chrome Web Store Submission Checklist

## Files Ready for You (Download ZIP from v0)

### Extension Files (include in ZIP):
- `manifest.json` - Extension configuration
- `index.html` - Main new tab page
- `app.js` - Application logic
- `styles.css` - Styling
- `seasons-data.js` - US hunting seasons data
- `texas-counties-data.js` - Texas county-specific data
- `background-images.js` - Background image configuration
- `icons/` folder (icon16.png, icon48.png, icon128.png)
- `images/` folder (8 background images)

### Store Assets (in store-assets/ folder):
- `screenshot-1-main.jpg` - Main view screenshot
- `screenshot-2-location.jpg` - Location selection screenshot
- `screenshot-3-seasons.jpg` - Game animal selection screenshot
- `promotional-tile-440x280.jpg` - Small promotional tile
- `marquee-1400x560.jpg` - Large marquee image

### Documentation (DO NOT include in extension ZIP):
- `PRIVACY_POLICY.md` - Privacy policy text
- `STORE_LISTING.md` - Store listing copy
- `SUBMISSION_CHECKLIST.md` - This file

---

## What YOU Need to Do:

### Step 1: Host Privacy Policy (Required)
You must host the privacy policy at a public URL. Options:
1. **GitHub Pages** (Free) - Create a repo, add privacy-policy.html, enable Pages
2. **Your Website** - Upload to your domain
3. **Google Sites** (Free) - Create a simple page at sites.google.com

Copy the content from `PRIVACY_POLICY.md` to your hosted page.

### Step 2: Pay Developer Fee
1. Go to: https://chrome.google.com/webstore/devconsole
2. Sign in with Google account
3. Pay one-time $5 USD registration fee
4. Wait for account verification (can take a few hours)

### Step 3: Create Extension ZIP
Download the project from v0, then create a ZIP containing ONLY:
```
hunters-countdown.zip
├── manifest.json
├── index.html
├── app.js
├── styles.css
├── seasons-data.js
├── texas-counties-data.js
├── background-images.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── images/
    ├── misty-forest.jpg
    ├── mountain-landscape.jpg
    ├── autumn-forest.jpg
    ├── winter-forest.jpg
    ├── spring-meadow.jpg
    ├── summer-lake.jpg
    ├── deer-forest.jpg
    └── hunting-sunrise.jpg
```

DO NOT include: store-assets/, *.md files, app/ folder, public/ folder, lib/ folder, package.json

### Step 4: Submit to Chrome Web Store
1. Go to: https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload your extension ZIP
4. Fill in store listing:
   - **Name:** Hunt Clock
   - **Summary:** (use content from STORE_LISTING.md)
   - **Description:** (use content from STORE_LISTING.md)
   - **Category:** Productivity
   - **Language:** English
5. Upload screenshots from `store-assets/` folder
6. Upload promotional images from `store-assets/` folder
7. Enter your hosted Privacy Policy URL
8. Select "This extension does not use remote code"
9. Click "Submit for Review"

### Step 5: Wait for Review
- Initial review typically takes 1-3 business days
- You'll receive email notification when approved or if changes needed

---

## Store Listing Text (Copy/Paste Ready)

### Short Description (132 chars max):
```
Beautiful new tab with hunting season countdowns. Texas county-specific dates from TPWD. Never miss opening day!
```

### Detailed Description:
```
Hunt Clock transforms your new tab into a beautiful hunting companion that keeps you informed about upcoming seasons.

FEATURES:
• Real-time countdown to hunting seasons
• Texas county-specific season dates from TPWD
• Auto-detect your location for accurate dates
• Track Whitetail Deer, Turkey, Dove, Quail, Duck, and more
• Beautiful rotating nature backgrounds
• "Season Open" indicators with days remaining
• Add custom seasons and countdowns
• Works offline after initial setup

TEXAS HUNTERS:
Select your county to get accurate season dates based on Texas Parks & Wildlife Department regulations. Covers all game animals including:
- Whitetail Deer (General & Youth)
- Spring & Fall Turkey
- Mourning Dove
- Quail
- Duck & Goose
- Javelina
- Feral Hog
- And more!

PRIVACY:
Your data stays on your device. We don't collect, store, or transmit any personal information. Location detection is optional and only used locally to determine your county.

Perfect for Texas hunters who want to stay prepared for every season!
```

---

## Common Rejection Reasons to Avoid:
1. Missing privacy policy URL - Make sure it's hosted and accessible
2. Incorrect permissions - We only request "storage" which is standard
3. Missing screenshots - Upload all 3 screenshots
4. Misleading description - Our description accurately reflects features

Good luck with your submission!
