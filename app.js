// Hunt Clock - Chrome Extension
// Main Application JavaScript

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', init);

// Soonest upcoming season, used by the greeting. Set in updateCountdowns().
let soonestSeason = null;

// Id of the season currently being edited via the card modal (null = adding new).
let editingSeasonId = null;

// True when today falls within a season's window. Requires endMonth/endDay in the
// season data; without them we can't know the season is open, so we return false.
function seasonIsActive(season) {
  if (season == null || season.endMonth == null || season.endDay == null) return false;
  return isSeasonActive(season.month, season.day, season.endMonth, season.endDay);
}

function init() {
  // Load user preferences from storage
  loadUserPreferences();
  
  // Populate state dropdown
  populateStateDropdown();
  
  // Populate Texas county dropdown if Texas is selected
  populateTexasCountyDropdown();
  
  // Set the daily background image
  setDailyBackground();

  // Show a random hunting quote
  setRandomQuote();

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

  // Build the greeting: use a live countdown to the soonest season when we have
  // one, otherwise fall back to a simple (optionally personalized) greeting.
  const userName = localStorage.getItem('hunterName');
  const namePart = userName ? `, ${userName}` : '';

  if (soonestSeason && soonestSeason.active) {
    greeting.textContent = `${greetingText}${namePart} — ${soonestSeason.name} is in season now!`;
  } else if (soonestSeason) {
    if (soonestSeason.days === 0) {
      greeting.textContent = `${greetingText}${namePart} — ${soonestSeason.name} opens today!`;
    } else {
      const dayWord = soonestSeason.days === 1 ? 'day' : 'days';
      greeting.textContent = `${greetingText}${namePart} — it's only ${soonestSeason.days} ${dayWord} until ${soonestSeason.name}`;
    }
  } else {
    greeting.textContent = `${greetingText}${userName ? namePart : ', hunter'}`;
  }
}

// ============================================
// BACKGROUND IMAGES
// ============================================

function setDailyBackground() {
  const gradient = 'linear-gradient(135deg, #1a3a1a 0%, #2d4a2d 50%, #3d5a3d 100%)';
  try {
    if (!Array.isArray(backgroundImages) || backgroundImages.length === 0) {
      document.body.style.background = gradient;
      return;
    }

    // Day number since the epoch → same image all day, a new one each day,
    // cycling through the whole list.
    const dayNumber = Math.floor(Date.now() / 86400000);
    const path = backgroundImages[dayNumber % backgroundImages.length];

    // Resolve to an extension URL when running as an extension; fall back to the
    // relative path otherwise (e.g. local preview).
    const url = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL(path)
      : path;

    // Preload so we swap in the image only once it's ready (no flash).
    const img = new Image();
    img.onload = () => { document.body.style.backgroundImage = `url('${url}')`; };
    img.onerror = () => { document.body.style.background = gradient; };
    img.src = url;
  } catch (error) {
    console.error('Error setting background:', error);
    document.body.style.background = gradient;
  }
}

// ============================================
// HUNTING QUOTES
// ============================================

const huntingQuotes = [
  { text: "The wildlife and its habitat cannot speak, so we must and we will.", author: "Theodore Roosevelt" },
  { text: "The true hunter counts his achievement in proportion to the effort involved and the fairness of the sport.", author: "Jack O'Connor" },
  { text: "In every walk with nature one receives far more than he seeks.", author: "John Muir" },
  { text: "There is a delight in the hardy life of the open. There are no words that can tell the hidden spirit of the wilderness.", author: "Theodore Roosevelt" },
  { text: "A hunt based only on the trophies taken falls far short of what the ultimate goal should be.", author: "Fred Bear" },
  { text: "Nobody can grant you the right to bear arms. It's something you're born with.", author: "Ted Nugent" },
  { text: "The gun has been called the great equalizer, meaning that a small person with a gun is equal to a large person.", author: "Roy Rogers" },
  { text: "Conservation is a state of harmony between men and land.", author: "Aldo Leopold" },
  { text: "When the hunter is in the woods, the rest of the world disappears.", author: "Anonymous" },
  { text: "Hunting is not a matter of life and death. It is far more important than that.", author: "Robert Ruark" },
  { text: "The wilderness holds answers to questions man has not yet learned to ask.", author: "Nancy Wynne Newhall" },
  { text: "Good things come to those who bait.", author: "Anonymous" },
  { text: "We don't stop hunting because we grow old — we grow old because we stop hunting.", author: "Anonymous" },
  { text: "May your blind be warm, your aim be true, and your freezer full.", author: "Anonymous" },
  // Theodore Roosevelt
  { text: "In hunting, the finding and killing of the game is after all but a part of the whole.", author: "Theodore Roosevelt" },
  { text: "The farther one gets into the wilderness, the greater is the attraction of its lonely freedom.", author: "Theodore Roosevelt" },
  // Ted Nugent
  { text: "Hunting is the last perfect thing.", author: "Ted Nugent" },
  { text: "My idea of fast food is a mallard.", author: "Ted Nugent" },
  // Steven Rinella
  { text: "Just the pursuit of the ingredients is some of the best exercise you can get.", author: "Steven Rinella" },
  // Ernest Hemingway
  { text: "Perhaps I should not have been a fisherman. But that was the thing that I was born for.", author: "Ernest Hemingway" },
  { text: "When you have shot one bird flying you have shot all birds flying.", author: "Ernest Hemingway" },
  // Mark Twain
  { text: "To one in sympathy with nature, each season, in its turn, seems the loveliest.", author: "Mark Twain" },
  { text: "One can enjoy a rainbow without necessarily forgetting the forces that made it.", author: "Mark Twain" }
];

function setRandomQuote() {
  const el = document.getElementById('quote');
  if (!el) return;
  const q = huntingQuotes[Math.floor(Math.random() * huntingQuotes.length)];
  el.innerHTML = `&ldquo;${q.text}&rdquo;<span class="quote-author">— ${q.author}</span>`;
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
  
  // Check for Texas county-specific seasons (fall through to general TX
  // seasons below for counties that don't yet have county-specific data)
  if (savedState === 'TX' && savedCounty && window.texasCountySeasons && window.texasCountySeasons[savedCounty]) {
    const countySeasons = window.texasCountySeasons[savedCounty];
    if (countySeasons) {
      // Auto-add deer, dove, and turkey for Texas counties
      ['whitetail_deer', 'dove', 'turkey_spring'].forEach(key => {
        const s = countySeasons[key];
        if (s) {
          defaultSeasons.push({
            id: key,
            name: s.name,
            month: s.month,
            day: s.day,
            endMonth: s.endMonth,
            endDay: s.endDay,
            isDefault: true
          });
        }
      });
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
        endMonth: season.endMonth,
        endDay: season.endDay,
        isDefault: true
      });
    });
  }
  // No location set → no generic seasons; an empty-state prompt is shown below.
  
  // An edited season (saved as custom with the same id) overrides its default
  const overriddenIds = new Set(customSeasons.map(c => c.id));
  const activeDefaults = defaultSeasons.filter(d => !overriddenIds.has(d.id));

  // Combine location-based and custom seasons
  const allSeasons = [...activeDefaults, ...customSeasons];

  // Greeting: prefer a season that is open right now, otherwise the soonest one
  soonestSeason = null;
  const openNow = allSeasons.find(seasonIsActive);
  if (openNow) {
    soonestSeason = { name: openNow.name, days: 0, active: true };
  } else {
    allSeasons.forEach(season => {
      const d = calculateDaysUntil(season.month, season.day);
      if (soonestSeason === null || d < soonestSeason.days) {
        soonestSeason = { name: season.name, days: d };
      }
    });
  }

  // Clear container
  container.innerHTML = '';

  // Empty state: prompt to set a location instead of showing generic seasons
  if (allSeasons.length === 0) {
    const prompt = document.createElement('div');
    prompt.className = 'empty-prompt';
    prompt.innerHTML = '<p class="empty-text">Set your location to see your hunting season countdowns.</p>';
    const btn = document.createElement('button');
    btn.className = 'add-button empty-cta';
    btn.textContent = 'Set Location';
    btn.onclick = openLocationModal;
    prompt.appendChild(btn);
    container.appendChild(prompt);
    showTime(); // refresh greeting (no season → simple greeting)
    return;
  }

  // Create countdown tiles (Add Season now lives in the top-right menu)
  allSeasons.forEach(season => {
    const days = calculateDaysUntil(season.month, season.day);
    const tile = createCountdownTile(season, days);
    container.appendChild(tile);
  });

  // Refresh greeting now that we know the soonest / open season
  showTime();
}

function createCountdownTile(season, days) {
  const tile = document.createElement('div');
  tile.className = 'countdown';
  tile.dataset.seasonId = season.id;
  tile.style.cursor = 'pointer';
  tile.title = 'Click to edit · Right-click for TPWD regulations';

  const active = seasonIsActive(season);
  let statusText = 'days until';
  let daysDisplay = days;

  if (active) {
    statusText = 'In season now';
    daysDisplay = 'OPEN';
    tile.classList.add('in-season');
  } else if (days === 0) {
    statusText = 'Opens today!';
    daysDisplay = '';
  }

  tile.innerHTML = `
    <div class="days">${daysDisplay}</div>
    <div class="label">${statusText}<br><strong>${season.name}</strong></div>
    ${!season.isDefault ? '<button class="remove-season" aria-label="Remove season">×</button>' : ''}
  `;

  // Click a card to edit its name/date
  tile.addEventListener('click', () => openEditSeason(season));

  // Right-click a card → TPWD regulations for the selected county
  tile.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    openTpwdRegs();
  });

  // Remove button (custom / edited seasons only)
  const removeBtn = tile.querySelector('.remove-season');
  if (removeBtn) {
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeSeason(season.id);
    };
  }

  return tile;
}

function openTpwdRegs() {
  const county = localStorage.getItem('selectedCounty');
  const state = localStorage.getItem('selectedState');
  let url = 'https://tpwd.texas.gov/regulations/outdoor-annual/';
  if (state === 'TX' && county) {
    url = 'https://www.google.com/search?q=' +
      encodeURIComponent('site:tpwd.texas.gov ' + county + ' County hunting seasons');
  }
  window.open(url, '_blank', 'noopener');
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

  // Default to "add" mode; openEditSeason() overrides this afterwards.
  editingSeasonId = null;
  const title = document.getElementById('custom-season-title');
  if (title) title.textContent = 'Add Custom Season';
  const submitBtn = document.querySelector('#season-form .add-button');
  if (submitBtn) submitBtn.textContent = 'Add Season';

  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');

  // Populate season type dropdown with county-specific options
  populateSeasonTypeDropdown();
}

// Open the modal pre-filled to edit an existing card's name and date.
function openEditSeason(season) {
  openCustomSeasonModal();
  editingSeasonId = season.id;

  const title = document.getElementById('custom-season-title');
  if (title) title.textContent = 'Edit Season';
  const submitBtn = document.querySelector('#season-form .add-button');
  if (submitBtn) submitBtn.textContent = 'Save Changes';

  const seasonType = document.getElementById('season-type');
  const customNameGroup = document.getElementById('custom-name-group');
  const customName = document.getElementById('custom-name');
  const dateInput = document.getElementById('season-date');

  if (seasonType) seasonType.value = 'custom';
  if (customNameGroup) customNameGroup.style.display = 'block';
  if (customName) customName.value = season.name;
  if (dateInput) {
    const y = new Date().getFullYear();
    dateInput.value = `${y}-${String(season.month).padStart(2, '0')}-${String(season.day).padStart(2, '0')}`;
  }
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

  // Reset edit state / labels back to "add" mode
  editingSeasonId = null;
  const title = document.getElementById('custom-season-title');
  if (title) title.textContent = 'Add Custom Season';
  const submitBtn = document.querySelector('#season-form .add-button');
  if (submitBtn) submitBtn.textContent = 'Add Season';
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
  
  if (!seasonDate.value) return;
  const selectedOption = seasonType.options[seasonType.selectedIndex];
  const name = (seasonType.value === 'custom' ? customName.value.trim() : selectedOption.textContent) || 'Season';
  // Parse YYYY-MM-DD by parts to avoid timezone shifting the day
  const [, month, day] = seasonDate.value.split('-').map(Number);

  const customSeasons = JSON.parse(localStorage.getItem('customSeasons') || '[]');

  if (editingSeasonId) {
    // Editing: replace the season with this id (an edit of a default becomes an override)
    const idx = customSeasons.findIndex(s => s.id === editingSeasonId);
    const edited = { id: editingSeasonId, name, month, day, isDefault: false };
    if (idx >= 0) customSeasons[idx] = edited;
    else customSeasons.push(edited);
  } else {
    customSeasons.push({ id: 'custom_' + Date.now(), name, month, day, isDefault: false });
  }

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

  // Prefill the optional name field with any saved name
  const nameInput = document.getElementById('hunter-name');
  if (nameInput) {
    const savedName = localStorage.getItem('hunterName');
    nameInput.value = savedName && savedName !== 'hunter' ? savedName : '';
  }

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

    // Save optional display name
    const nameInput = document.getElementById('hunter-name');
    if (nameInput) {
      const name = nameInput.value.trim();
      if (name) {
        localStorage.setItem('hunterName', name);
      } else {
        localStorage.removeItem('hunterName');
      }
      showTime(); // refresh greeting
    }

    updateLocationDisplay();
    updateCountdowns();
    closeLocationModal();
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
      <p>Hunt Clock collects and stores the following information locally on your device:</p>
      <ul>
        <li>Your selected state and county (for displaying relevant hunting seasons)</li>
        <li>Custom hunting seasons you create</li>
        <li>Your display name (optional)</li>
      </ul>
      <p>If you opt in to Season Alerts, the email address you submit is sent to our form provider (Formspree) to email you season reminders and updates. This is optional and you can unsubscribe anytime.</p>
      
      <h3 class="privacy-subheading">How We Use Your Information</h3>
      <p>All information is stored locally using Chrome's storage API and is used solely to personalize your new tab experience. We do not transmit any personal data to external servers.</p>
      
      <h3 class="privacy-subheading">Location Data</h3>
      <p>If you choose to use the auto-detect location feature, your location is used only to determine your county and is not stored or transmitted beyond your device.</p>
      
      <h3 class="privacy-subheading">Third-Party Services</h3>
      <p>This extension uses OpenStreetMap's Nominatim service for reverse geocoding when you use the auto-detect feature. No personal information is shared with this service.</p>
      
      <h3 class="privacy-subheading">Data Security</h3>
      <p>All your data remains on your device and is not accessible to us or any third parties.</p>
      
      <h3 class="privacy-subheading">Contact</h3>
      <p>If you have questions about this privacy policy, please contact us at travisk90@gmail.com.</p>
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
// EMAIL SIGNUP (optional, opt-in)
// ============================================

// Create a free form at https://formspree.io and paste its endpoint here,
// e.g. 'https://formspree.io/f/abcdwxyz'. Until then, signup is disabled.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

function openSignupModal() {
  const modal = document.getElementById('signup-modal');
  const overlay = document.getElementById('modal-overlay');
  const status = document.getElementById('signup-status');
  if (status) status.textContent = '';
  if (modal) modal.classList.add('active');
  if (overlay) overlay.classList.add('active');
}

function closeSignupModal() {
  const modal = document.getElementById('signup-modal');
  const overlay = document.getElementById('modal-overlay');
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

async function handleSignup(e) {
  e.preventDefault();
  const emailEl = document.getElementById('signup-email');
  const consentEl = document.getElementById('signup-consent');
  const statusEl = document.getElementById('signup-status');
  const submitBtn = document.querySelector('#signup-form .add-button');

  if (!emailEl || !emailEl.value || !consentEl || !consentEl.checked) return;

  if (FORMSPREE_ENDPOINT.includes('YOUR_FORM_ID')) {
    if (statusEl) statusEl.textContent = 'Email signup is not configured yet.';
    return;
  }

  if (statusEl) statusEl.textContent = 'Subscribing…';
  if (submitBtn) submitBtn.disabled = true;
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: emailEl.value, source: 'Hunt Clock extension' })
    });
    if (res.ok) {
      if (statusEl) statusEl.textContent = 'Subscribed — thanks!';
      emailEl.value = '';
      consentEl.checked = false;
      setTimeout(closeSignupModal, 1200);
    } else {
      if (statusEl) statusEl.textContent = 'Something went wrong. Please try again.';
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = 'Network error. Please try again.';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function toggleSearch() {
  const corner = document.getElementById('search-corner');
  if (!corner) return;
  const willOpen = !corner.classList.contains('open');
  corner.classList.toggle('open', willOpen);
  closeMenu();
  if (willOpen) {
    const input = document.getElementById('search-input');
    if (input) setTimeout(() => input.focus(), 50);
  }
}

function closeSearch() {
  const corner = document.getElementById('search-corner');
  if (corner) corner.classList.remove('open');
}

function handleSearch(e) {
  e.preventDefault();
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();

  if (query) {
    // Navigate the current tab to Google results
    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    searchInput.value = '';
    closeSearch();
  }
}

// ============================================
// CONFIG MENU (top-right 3-dot)
// ============================================

function toggleMenu() {
  const menu = document.getElementById('menu-corner');
  const btn = document.getElementById('menu-button');
  if (!menu) return;
  const willOpen = !menu.classList.contains('open');
  menu.classList.toggle('open', willOpen);
  if (btn) btn.setAttribute('aria-expanded', String(willOpen));
  closeSearch();
}

function closeMenu() {
  const menu = document.getElementById('menu-corner');
  const btn = document.getElementById('menu-button');
  if (menu) menu.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
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
  // Top-right 3-dot config menu
  const menuButton = document.getElementById('menu-button');
  if (menuButton) {
    menuButton.onclick = (e) => { e.stopPropagation(); toggleMenu(); };
  }
  const menuLocation = document.getElementById('menu-location');
  if (menuLocation) {
    menuLocation.onclick = () => { closeMenu(); openLocationModal(); };
  }
  const menuAddSeason = document.getElementById('menu-add-season');
  if (menuAddSeason) {
    menuAddSeason.onclick = () => { closeMenu(); openCustomSeasonModal(); };
  }
  const menuAlerts = document.getElementById('menu-alerts');
  if (menuAlerts) {
    menuAlerts.onclick = () => { closeMenu(); openSignupModal(); };
  }
  const menuPrivacy = document.getElementById('menu-privacy');
  if (menuPrivacy) {
    menuPrivacy.onclick = () => { closeMenu(); openPrivacyModal(); };
  }

  // Email signup modal
  const signupForm = document.getElementById('signup-form');
  if (signupForm) signupForm.onsubmit = handleSignup;
  const closeSignupBtn = document.getElementById('close-signup-modal');
  if (closeSignupBtn) closeSignupBtn.onclick = closeSignupModal;
  const signupPrivacyLink = document.getElementById('signup-privacy-link');
  if (signupPrivacyLink) signupPrivacyLink.onclick = () => { closeSignupModal(); openPrivacyModal(); };
  
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
  
  // Privacy modal close button (privacy is opened from the menu)
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
      closePrivacyModal();
      closeSignupModal();
    };
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCustomSeasonModal();
      closeLocationModal();
      closePrivacyModal();
      closeSignupModal();
      closeMenu();
      closeSearch();
    }
  });

  // Click outside the menu / search to close them
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#menu-corner')) closeMenu();
    if (!e.target.closest('#search-corner')) closeSearch();
  });
}
