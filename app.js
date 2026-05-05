// Hunter's Countdown - Chrome Extension
// Main Application JavaScript

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', init);

function init() {
  // Load user preferences from storage
  loadUserPreferences();
  
  // Populate state dropdown
  populateStateDropdown();
  
  // Populate Texas county dropdown if Texas is selected
  populateTexasCountyDropdown();
  
  // Set random background image
  setRandomBackground();
  
  // Show time and update countdowns
  showTime();
  updateCountdowns();
  
  // Update time every second
  setInterval(showTime, 1000);
  
  // Update countdowns every minute
  setInterval(updateCountdowns, 60000);
  
  // Set up event listeners
  setupEventListeners();
  
  // Load saved seasons
  loadSavedSeasons();
}

// ============================================
// TIME & DATE DISPLAY
// ============================================

function showTime() {
  const clock = document.getElementById('clock');
  const dateElement = document.getElementById('date');
  const greeting = document.getElementById('greeting');
  
  const now = new Date();
  
  // Format time
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  clock.textContent = `${hours}:${minutes} ${ampm}`;
  
  // Format date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  dateElement.textContent = now.toLocaleDateString('en-US', options);
  
  // Update greeting based on time of day
  const hour = now.getHours();
  let greetingText = 'Good evening';
  if (hour < 12) {
    greetingText = 'Good morning';
  } else if (hour < 17) {
    greetingText = 'Good afternoon';
  }
  
  // Add user name if available
  const userName = localStorage.getItem('hunterName') || 'hunter';
  greeting.textContent = `${greetingText}, ${userName}`;
}

// ============================================
// BACKGROUND IMAGES
// ============================================

function setRandomBackground() {
  try {
    const currentMonth = new Date().getMonth();
    let season;
    
    if (currentMonth >= 2 && currentMonth <= 4) {
      season = 'spring';
    } else if (currentMonth >= 5 && currentMonth <= 7) {
      season = 'summer';
    } else if (currentMonth >= 8 && currentMonth <= 10) {
      season = 'fall';
    } else {
      season = 'winter';
    }
    
    // Filter images by season
    const seasonImages = backgroundImages.filter(img => img.season === season || img.season === 'all');
    const imagesToUse = seasonImages.length > 0 ? seasonImages : backgroundImages;
    
    // Select random image
    const randomImage = imagesToUse[Math.floor(Math.random() * imagesToUse.length)];
    
    if (randomImage && randomImage.url) {
      // For Chrome extension, use chrome.runtime.getURL for local images
      const imageUrl = randomImage.url.startsWith('/') 
        ? chrome.runtime.getURL('images' + randomImage.url)
        : randomImage.url;
      document.body.style.backgroundImage = `url('${imageUrl}')`;
    }
  } catch (error) {
    console.error('Error setting background:', error);
    // Fallback to a gradient
    document.body.style.background = 'linear-gradient(135deg, #1a3a1a 0%, #2d4a2d 50%, #3d5a3d 100%)';
  }
}

// ============================================
// LOCATION & STATE MANAGEMENT
// ============================================

function populateStateDropdown() {
  const stateSelect = document.getElementById('state-select');
  if (!stateSelect) return;
  
  // Clear existing options except the first
  stateSelect.innerHTML = '<option value="">Select State</option>';
  
  // Add states
  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state.code;
    option.textContent = state.name;
    stateSelect.appendChild(option);
  });
  
  // Set saved state if exists
  const savedState = localStorage.getItem('selectedState');
  if (savedState) {
    stateSelect.value = savedState;
    updateLocationDisplay();
  }
}

function populateTexasCountyDropdown() {
  // Check if we need to show Texas county dropdown
  const savedState = localStorage.getItem('selectedState');
  
  // Add Texas county dropdown to location modal if Texas is selected
  const locationForm = document.getElementById('location-form');
  if (!locationForm) return;
  
  // Check if county dropdown already exists
  let countyGroup = document.getElementById('county-group');
  
  if (savedState === 'TX' && window.texasCounties) {
    if (!countyGroup) {
      // Create county dropdown
      countyGroup = document.createElement('div');
      countyGroup.className = 'form-group';
      countyGroup.id = 'county-group';
      countyGroup.innerHTML = `
        <label for="county-select">Select Your Texas County</label>
        <select id="county-select">
          <option value="">Select County</option>
        </select>
        <button type="button" id="detect-location-btn" class="add-button" style="margin-top: 10px;">
          Auto-Detect My Location
        </button>
      `;
      
      // Insert after state dropdown
      const stateGroup = document.querySelector('#location-form .form-group');
      if (stateGroup) {
        stateGroup.after(countyGroup);
      }
    }
    
    // Populate counties
    const countySelect = document.getElementById('county-select');
    if (countySelect && countySelect.options.length <= 1) {
      window.texasCounties.forEach(county => {
        const option = document.createElement('option');
        option.value = county;
        option.textContent = county + ' County';
        countySelect.appendChild(option);
      });
    }
    
    // Set saved county
    const savedCounty = localStorage.getItem('selectedCounty');
    if (savedCounty && countySelect) {
      countySelect.value = savedCounty;
    }
    
    // Add auto-detect event listener
    const detectBtn = document.getElementById('detect-location-btn');
    if (detectBtn) {
      detectBtn.onclick = detectLocation;
    }
    
    countyGroup.style.display = 'block';
  } else if (countyGroup) {
    countyGroup.style.display = 'none';
  }
}

function detectLocation() {
  const detectBtn = document.getElementById('detect-location-btn');
  if (detectBtn) {
    detectBtn.textContent = 'Detecting...';
    detectBtn.disabled = true;
  }
  
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    resetDetectButton();
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        
        // Use reverse geocoding to get county
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
        );
        
        if (!response.ok) throw new Error('Geocoding failed');
        
        const data = await response.json();
        const county = data.address?.county?.replace(' County', '') || 
                       data.address?.city ||
                       null;
        const state = data.address?.state;
        
        if (state === 'Texas' && county) {
          // Set state to Texas
          const stateSelect = document.getElementById('state-select');
          if (stateSelect) stateSelect.value = 'TX';
          
          // Show county dropdown and set county
          populateTexasCountyDropdown();
          const countySelect = document.getElementById('county-select');
          if (countySelect) {
            // Try to find matching county
            const matchingCounty = window.texasCounties.find(c => 
              c.toLowerCase() === county.toLowerCase()
            );
            if (matchingCounty) {
              countySelect.value = matchingCounty;
            }
          }
          
          alert(`Location detected: ${county} County, Texas`);
        } else if (state) {
          alert(`You are in ${state}. County-specific seasons are currently only available for Texas.`);
        } else {
          alert('Could not determine your location. Please select manually.');
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        alert('Error detecting location. Please select manually.');
      } finally {
        resetDetectButton();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      let message = 'Could not get your location.';
      if (error.code === error.PERMISSION_DENIED) {
        message = 'Location permission denied. Please enable location access or select manually.';
      }
      alert(message);
      resetDetectButton();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function resetDetectButton() {
  const detectBtn = document.getElementById('detect-location-btn');
  if (detectBtn) {
    detectBtn.textContent = 'Auto-Detect My Location';
    detectBtn.disabled = false;
  }
}

function updateLocationDisplay() {
  const locationText = document.getElementById('location-text');
  if (!locationText) return;
  
  const savedState = localStorage.getItem('selectedState');
  const savedCounty = localStorage.getItem('selectedCounty');
  
  if (savedCounty && savedState === 'TX') {
    locationText.textContent = `${savedCounty} County, Texas`;
  } else if (savedState) {
    const state = states.find(s => s.code === savedState);
    locationText.textContent = state ? state.name : savedState;
  } else {
    locationText.textContent = 'Not set';
  }
}

// ============================================
// COUNTDOWN CALCULATIONS
// ============================================

function calculateDaysUntil(month, day) {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Create target date for this year
  let targetDate = new Date(currentYear, month - 1, day);
  
  // If the date has passed this year, use next year
  if (targetDate < now) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }
  
  // Calculate difference in days
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function isSeasonActive(startMonth, startDay, endMonth, endDay) {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  let startDate = new Date(currentYear, startMonth - 1, startDay);
  let endDate = new Date(currentYear, endMonth - 1, endDay);
  
  // Handle seasons that span years (e.g., Nov - Jan)
  if (endDate < startDate) {
    // Check if we're in the current year's season or next year's
    if (now >= startDate) {
      endDate = new Date(currentYear + 1, endMonth - 1, endDay);
    } else {
      startDate = new Date(currentYear - 1, startMonth - 1, startDay);
    }
  }
  
  return now >= startDate && now <= endDate;
}

function updateCountdowns() {
  const container = document.getElementById('countdown-container');
  if (!container) return;
  
  // Get saved custom seasons
  const customSeasons = JSON.parse(localStorage.getItem('customSeasons') || '[]');
  
  // Get state/county specific seasons
  const savedState = localStorage.getItem('selectedState');
  const savedCounty = localStorage.getItem('selectedCounty');
  
  let defaultSeasons = [];
  
  // Check for Texas county-specific seasons
  if (savedState === 'TX' && savedCounty && window.texasCountySeasons) {
    const countySeasons = window.texasCountySeasons[savedCounty];
    if (countySeasons) {
      // Auto-add deer, dove, and turkey for Texas counties
      if (countySeasons.whitetail_deer) {
        defaultSeasons.push({
          id: 'whitetail_deer',
          name: countySeasons.whitetail_deer.name,
          month: countySeasons.whitetail_deer.month,
          day: countySeasons.whitetail_deer.day,
          isDefault: true
        });
      }
      if (countySeasons.dove) {
        defaultSeasons.push({
          id: 'dove',
          name: countySeasons.dove.name,
          month: countySeasons.dove.month,
          day: countySeasons.dove.day,
          isDefault: true
        });
      }
      if (countySeasons.turkey_spring) {
        defaultSeasons.push({
          id: 'turkey_spring',
          name: countySeasons.turkey_spring.name,
          month: countySeasons.turkey_spring.month,
          day: countySeasons.turkey_spring.day,
          isDefault: true
        });
      }
    }
  } else if (savedState && huntingSeasonsByState[savedState]) {
    // Use state-specific seasons
    const stateSeasons = huntingSeasonsByState[savedState];
    Object.keys(stateSeasons).forEach(key => {
      const season = stateSeasons[key];
      defaultSeasons.push({
        id: key,
        name: season.name,
        month: season.month,
        day: season.day,
        isDefault: true
      });
    });
  } else if (huntingSeasonsByState.default) {
    // Use default seasons
    const defaultStateSeasons = huntingSeasonsByState.default;
    Object.keys(defaultStateSeasons).forEach(key => {
      const season = defaultStateSeasons[key];
      defaultSeasons.push({
        id: key,
        name: season.name,
        month: season.month,
        day: season.day,
        isDefault: true
      });
    });
  }
  
  // Combine default and custom seasons
  const allSeasons = [...defaultSeasons, ...customSeasons];
  
  // Clear container
  container.innerHTML = '';
  
  // Create countdown tiles
  allSeasons.forEach(season => {
    const days = calculateDaysUntil(season.month, season.day);
    const tile = createCountdownTile(season, days);
    container.appendChild(tile);
  });
  
  // Add "Add Season" button tile
  const addTile = document.createElement('div');
  addTile.className = 'countdown add-tile';
  addTile.innerHTML = `
    <div class="days">+</div>
    <div class="label">Add Season</div>
  `;
  addTile.style.cursor = 'pointer';
  addTile.onclick = openCustomSeasonModal;
  container.appendChild(addTile);
}

function createCountdownTile(season, days) {
  const tile = document.createElement('div');
  tile.className = 'countdown';
  tile.dataset.seasonId = season.id;
  
  let statusText = 'days until';
  let daysDisplay = days;
  
  if (days === 0) {
    statusText = 'Opens today!';
    daysDisplay = '';
  } else if (days < 0) {
    statusText = 'Season is open!';
    daysDisplay = 'NOW';
  }
  
  tile.innerHTML = `
    <div class="days">${daysDisplay}</div>
    <div class="label">${statusText}<br><strong>${season.name}</strong></div>
    ${!season.isDefault ? '<button class="remove-season" aria-label="Remove season">×</button>' : ''}
  `;
  
  // Add remove functionality for custom seasons
  const removeBtn = tile.querySelector('.remove-season');
  if (removeBtn) {
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeSeason(season.id);
    };
  }
  
  return tile;
}

function removeSeason(seasonId) {
  const customSeasons = JSON.parse(localStorage.getItem('customSeasons') || '[]');
  const filtered = customSeasons.filter(s => s.id !== seasonId);
  localStorage.setItem('customSeasons', JSON.stringify(filtered));
  updateCountdowns();
}

// ============================================
// CUSTOM SEASON MODAL
// ============================================

function openCustomSeasonModal() {
  const modal = document.getElementById('custom-season-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  
  // Populate season type dropdown with county-specific options
  populateSeasonTypeDropdown();
}

function closeCustomSeasonModal() {
  const modal = document.getElementById('custom-season-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  
  // Reset form
  const form = document.getElementById('season-form');
  if (form) form.reset();
  
  // Hide custom name field
  const customNameGroup = document.getElementById('custom-name-group');
  if (customNameGroup) customNameGroup.style.display = 'none';
}

function populateSeasonTypeDropdown() {
  const seasonType = document.getElementById('season-type');
  if (!seasonType) return;
  
  // Clear existing options
  seasonType.innerHTML = '<option value="">Select Game Animal</option>';
  
  const savedState = localStorage.getItem('selectedState');
  const savedCounty = localStorage.getItem('selectedCounty');
  
  // Get available seasons based on location
  let availableSeasons = [];
  
  if (savedState === 'TX' && savedCounty && window.texasCountySeasons) {
    const countySeasons = window.texasCountySeasons[savedCounty];
    if (countySeasons) {
      Object.keys(countySeasons).forEach(key => {
        availableSeasons.push({
          value: key,
          name: countySeasons[key].name,
          month: countySeasons[key].month,
          day: countySeasons[key].day
        });
      });
    }
  }
  
  // Add county-specific seasons
  availableSeasons.forEach(season => {
    const option = document.createElement('option');
    option.value = season.value;
    option.textContent = season.name;
    option.dataset.month = season.month;
    option.dataset.day = season.day;
    seasonType.appendChild(option);
  });
  
  // Add standard options
  const standardOptions = [
    { value: 'deer', name: 'Deer' },
    { value: 'turkey', name: 'Turkey' },
    { value: 'dove', name: 'Dove' },
    { value: 'duck', name: 'Duck' },
    { value: 'pheasant', name: 'Pheasant' },
    { value: 'elk', name: 'Elk' },
    { value: 'quail', name: 'Quail' },
    { value: 'custom', name: 'Custom...' }
  ];
  
  // Only add standard options that aren't already in the list
  const existingValues = availableSeasons.map(s => s.value);
  standardOptions.forEach(opt => {
    if (!existingValues.includes(opt.value)) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.name;
      seasonType.appendChild(option);
    }
  });
}

function handleSeasonTypeChange() {
  const seasonType = document.getElementById('season-type');
  const customNameGroup = document.getElementById('custom-name-group');
  const dateInput = document.getElementById('season-date');
  
  if (!seasonType || !customNameGroup) return;
  
  // Show/hide custom name field
  customNameGroup.style.display = seasonType.value === 'custom' ? 'block' : 'none';
  
  // Auto-fill date if available
  const selectedOption = seasonType.options[seasonType.selectedIndex];
  if (selectedOption.dataset.month && selectedOption.dataset.day) {
    const year = new Date().getFullYear();
    const month = selectedOption.dataset.month.padStart(2, '0');
    const day = selectedOption.dataset.day.padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;
  }
}

function addCustomSeason(e) {
  e.preventDefault();
  
  const seasonType = document.getElementById('season-type');
  const customName = document.getElementById('custom-name');
  const seasonDate = document.getElementById('season-date');
  
  if (!seasonType || !seasonDate) return;
  
  const selectedOption = seasonType.options[seasonType.selectedIndex];
  const name = seasonType.value === 'custom' ? customName.value : selectedOption.textContent;
  const date = new Date(seasonDate.value);
  
  const newSeason = {
    id: 'custom_' + Date.now(),
    name: name,
    month: date.getMonth() + 1,
    day: date.getDate(),
    isDefault: false
  };
  
  // Save to localStorage
  const customSeasons = JSON.parse(localStorage.getItem('customSeasons') || '[]');
  customSeasons.push(newSeason);
  localStorage.setItem('customSeasons', JSON.stringify(customSeasons));
  
  // Close modal and update
  closeCustomSeasonModal();
  updateCountdowns();
}

// ============================================
// LOCATION MODAL
// ============================================

function openLocationModal() {
  const modal = document.getElementById('location-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
  
  populateTexasCountyDropdown();
}

function closeLocationModal() {
  const modal = document.getElementById('location-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function saveLocation(e) {
  e.preventDefault();
  
  const stateSelect = document.getElementById('state-select');
  const countySelect = document.getElementById('county-select');
  
  if (stateSelect && stateSelect.value) {
    localStorage.setItem('selectedState', stateSelect.value);
    
    if (stateSelect.value === 'TX' && countySelect && countySelect.value) {
      localStorage.setItem('selectedCounty', countySelect.value);
    } else {
      localStorage.removeItem('selectedCounty');
    }
    
    updateLocationDisplay();
    updateCountdowns();
    closeLocationModal();
  }
}

// ============================================
// LOGIN MODAL
// ============================================

function openLoginModal() {
  const modal = document.getElementById('login-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email');
  if (email && email.value) {
    const userName = email.value.split('@')[0];
    localStorage.setItem('hunterName', userName);
    localStorage.setItem('isLoggedIn', 'true');
    
    showTime(); // Update greeting
    closeLoginModal();
  }
}

// ============================================
// PRIVACY MODAL
// ============================================

function openPrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  const overlay = document.getElementById('modal-overlay');
  const content = document.querySelector('.privacy-content');
  
  if (content) {
    content.innerHTML = `
      <h2 class="privacy-heading">Privacy Policy</h2>
      <p class="privacy-date">Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3 class="privacy-subheading">Information We Collect</h3>
      <p>Hunter's Countdown collects and stores the following information locally on your device:</p>
      <ul>
        <li>Your selected state and county (for displaying relevant hunting seasons)</li>
        <li>Custom hunting seasons you create</li>
        <li>Your display name (if you choose to log in)</li>
      </ul>
      
      <h3 class="privacy-subheading">How We Use Your Information</h3>
      <p>All information is stored locally using Chrome's storage API and is used solely to personalize your new tab experience. We do not transmit any personal data to external servers.</p>
      
      <h3 class="privacy-subheading">Location Data</h3>
      <p>If you choose to use the auto-detect location feature, your location is used only to determine your county and is not stored or transmitted beyond your device.</p>
      
      <h3 class="privacy-subheading">Third-Party Services</h3>
      <p>This extension uses OpenStreetMap's Nominatim service for reverse geocoding when you use the auto-detect feature. No personal information is shared with this service.</p>
      
      <h3 class="privacy-subheading">Data Security</h3>
      <p>All your data remains on your device and is not accessible to us or any third parties.</p>
      
      <h3 class="privacy-subheading">Contact</h3>
      <p>If you have questions about this privacy policy, please contact us through the Chrome Web Store.</p>
    `;
  }
  
  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closePrivacyModal() {
  const modal = document.getElementById('privacy-modal');
  const overlay = document.getElementById('modal-overlay');
  
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function toggleSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  
  if (searchForm.style.display === 'none') {
    searchForm.style.display = 'flex';
    searchInput.focus();
  } else {
    searchForm.style.display = 'none';
  }
}

function handleSearch(e) {
  e.preventDefault();
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();
  
  if (query) {
    // Open Google search in new tab
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    searchInput.value = '';
  }
}

// ============================================
// USER PREFERENCES
// ============================================

function loadUserPreferences() {
  // Load user name
  const userName = localStorage.getItem('hunterName');
  if (userName) {
    const greeting = document.getElementById('greeting');
    if (greeting) {
      const hour = new Date().getHours();
      let greetingText = 'Good evening';
      if (hour < 12) greetingText = 'Good morning';
      else if (hour < 17) greetingText = 'Good afternoon';
      greeting.textContent = `${greetingText}, ${userName}`;
    }
  }
  
  // Update location display
  updateLocationDisplay();
}

function loadSavedSeasons() {
  // Seasons are loaded in updateCountdowns()
  updateCountdowns();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Settings button - opens location modal
  const settingsBtn = document.getElementById('settings-button');
  if (settingsBtn) {
    settingsBtn.onclick = openLocationModal;
  }
  
  // State select change
  const stateSelect = document.getElementById('state-select');
  if (stateSelect) {
    stateSelect.onchange = () => {
      populateTexasCountyDropdown();
    };
  }
  
  // Location form submit
  const locationForm = document.getElementById('location-form');
  if (locationForm) {
    locationForm.onsubmit = saveLocation;
  }
  
  // Close location modal
  const closeLocationBtn = document.getElementById('close-location-modal');
  if (closeLocationBtn) {
    closeLocationBtn.onclick = closeLocationModal;
  }
  
  // Season form
  const seasonForm = document.getElementById('season-form');
  if (seasonForm) {
    seasonForm.onsubmit = addCustomSeason;
  }
  
  // Season type change
  const seasonType = document.getElementById('season-type');
  if (seasonType) {
    seasonType.onchange = handleSeasonTypeChange;
  }
  
  // Close custom season modal
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) {
    closeModalBtn.onclick = closeCustomSeasonModal;
  }
  
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = handleLogin;
  }
  
  // Close login modal
  const closeLoginBtn = document.getElementById('close-login-modal');
  if (closeLoginBtn) {
    closeLoginBtn.onclick = closeLoginModal;
  }
  
  // Privacy button and modal
  const privacyBtn = document.getElementById('privacy-button');
  if (privacyBtn) {
    privacyBtn.onclick = openPrivacyModal;
  }
  
  const closePrivacyBtn = document.getElementById('close-privacy-modal');
  if (closePrivacyBtn) {
    closePrivacyBtn.onclick = closePrivacyModal;
  }
  
  // Search toggle
  const searchToggle = document.getElementById('search-toggle');
  if (searchToggle) {
    searchToggle.onclick = toggleSearch;
  }
  
  // Search form
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.onsubmit = handleSearch;
  }
  
  // Modal overlay - close any open modal
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.onclick = () => {
      closeCustomSeasonModal();
      closeLocationModal();
      closeLoginModal();
      closePrivacyModal();
    };
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCustomSeasonModal();
      closeLocationModal();
      closeLoginModal();
      closePrivacyModal();
    }
  });
}
