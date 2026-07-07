// US States data
const states = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
]

// Hunting seasons data by state
// This is a simplified version - in a real extension, this would be more comprehensive
const huntingSeasonsByState = {
  // Default seasons (used if state-specific data is not available)
  default: {
    deer: { name: "Deer", month: 10, day: 1 },
    turkey: { name: "Turkey", month: 3, day: 15 },
    duck: { name: "Duck", month: 9, day: 1 },
    pheasant: { name: "Pheasant", month: 10, day: 15 },
    elk: { name: "Elk", month: 8, day: 15 },
  },

  // Texas general seasons — official TPWD 2026-2027 dates (start → end).
  // Dove/duck use South Zone; spans that cross the new year end in the next year.
  TX: {
    deer: { name: "Whitetail Deer", month: 11, day: 7, endMonth: 1, endDay: 17 },
    turkey: { name: "Spring Turkey", month: 3, day: 20, endMonth: 5, endDay: 2 },
    dove: { name: "Dove", month: 9, day: 1, endMonth: 1, endDay: 21 },
    quail: { name: "Quail", month: 11, day: 1, endMonth: 2, endDay: 28 },
    duck: { name: "Duck", month: 11, day: 7, endMonth: 1, endDay: 31 },
  },

  // Colorado seasons
  CO: {
    elk: { name: "Elk", month: 9, day: 2 },
    deer: { name: "Deer", month: 10, day: 15 },
    pronghorn: { name: "Pronghorn", month: 9, day: 1 },
    moose: { name: "Moose", month: 9, day: 9 },
    bear: { name: "Bear", month: 8, day: 15 },
  },

  // Wisconsin seasons
  WI: {
    deer: { name: "Deer", month: 10, day: 16 },
    turkey: { name: "Turkey", month: 3, day: 21 },
    bear: { name: "Bear", month: 8, day: 31 },
    grouse: { name: "Grouse", month: 8, day: 15 },
    duck: { name: "Duck", month: 9, day: 24 },
  },

  // Add more states as needed
}
