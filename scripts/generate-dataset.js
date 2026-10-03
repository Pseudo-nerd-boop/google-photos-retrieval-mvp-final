const fs = require('fs');
const path = require('path');

const datasetDir = path.join(__dirname, '..', 'public', 'dataset');
const dataDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(datasetDir)) {
  fs.mkdirSync(datasetDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to generate SVG visual illustration for photos
function generateSvg(id, title, category, tags, bgGradient, iconSymbol) {
  const isScreenshot = category === 'screenshot' || category === 'document';
  const headerBg = isScreenshot ? '#1e293b' : 'rgba(0,0,0,0.4)';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" fill="url(#bg-${id})" />
  
  <!-- Visual Pattern / Card Content -->
  <g filter="url(#shadow)">
    <rect x="60" y="60" width="680" height="480" rx="16" fill="#ffffff" fill-opacity="${isScreenshot ? '0.95' : '0.15'}" stroke="#ffffff" stroke-opacity="0.3" stroke-width="2" />
    
    <!-- Icon/Illustration Center -->
    <text x="400" y="260" font-family="sans-serif" font-size="72" text-anchor="middle" fill="${isScreenshot ? '#334155' : '#ffffff'}">${iconSymbol}</text>
    
    <!-- Title / Content -->
    <text x="400" y="340" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="${isScreenshot ? '#0f172a' : '#ffffff'}">${title}</text>
    
    <!-- Subtitle Category Badge -->
    <rect x="330" y="370" width="140" height="32" rx="16" fill="${isScreenshot ? '#3b82f6' : 'rgba(255,255,255,0.25)'}" />
    <text x="400" y="391" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="#ffffff">${category.toUpperCase()}</text>
    
    <!-- Tags Footer -->
    <text x="400" y="450" font-family="sans-serif" font-size="16" text-anchor="middle" fill="${isScreenshot ? '#64748b' : 'rgba(255,255,255,0.85)'}">Tags: ${tags.slice(0, 4).join(', ')}</text>
  </g>
  
  <!-- ID Badge Header -->
  <rect x="80" y="80" width="110" height="30" rx="6" fill="${headerBg}" />
  <text x="135" y="100" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="#ffffff">${id}</text>
</svg>`;
}

// Raw dataset definitions with 100 photos
const rawPhotos = [];

// Helper to add photo
function addPhoto(item) {
  const numId = String(rawPhotos.length + 1).padStart(3, '0');
  const id = `photo-${numId}`;
  const filename = `dataset/${id}.svg`;
  
  const photo = {
    id,
    filename,
    title: item.title,
    description: item.description || item.title,
    date: item.date,
    year: parseInt(item.date.split('-')[0]),
    month: parseInt(item.date.split('-')[1]),
    season: item.season,
    location: item.location,
    people: item.people || [],
    activities: item.activities || [],
    objects: item.objects || [],
    event: item.event || "General Photo",
    category: item.category || "photo",
    visual_tags: item.visual_tags || [],
    ocr_text: item.ocr_text || "",
    source: "Controlled representative prototype dataset — Google Photos Retrieval MVP",
    license: "Original prototype asset — created specifically for this project."
  };
  
  // Write SVG file
  const svgContent = generateSvg(
    id,
    item.title,
    item.category || "photo",
    item.visual_tags || [],
    item.gradient || ["#3b82f6", "#1d4ed8"],
    item.icon || "📷"
  );
  fs.writeFileSync(path.join(datasetDir, `${id}.svg`), svgContent);
  
  rawPhotos.push(photo);
}

// -------------------------------------------------------------
// CLUSTER 1: Bicycles, Mountain Riding & Outdoor Trail (Items 001 - 012)
// -------------------------------------------------------------
addPhoto({
  title: "Alex Riding Mountain Bike on Forest Trail",
  date: "2024-07-15", season: "summer",
  location: { name: "Pine Forest Trail", city: "Manali", country: "India", setting: "outdoors" },
  people: ["Alex"], activities: ["biking", "riding mountain bike"], objects: ["mountain bike", "helmet", "pine trees"],
  event: "Summer Mountain Trip 2024", category: "photo",
  visual_tags: ["mountain bike", "forest", "trail", "trees", "sunny", "cycling"],
  gradient: ["#059669", "#10b981"], icon: "🚴‍♂️"
}); // photo-001 (BENCHMARK TARGET 1)

addPhoto({
  title: "City Commuter Bicycle Parked by Coffee Shop",
  date: "2024-05-10", season: "spring",
  location: { name: "Blue Tokai Coffee", city: "Delhi", country: "India", setting: "outdoors" },
  people: [], activities: ["cycling", "coffee break"], objects: ["commuter bike", "coffee cup", "brick wall"],
  event: "Weekend Coffee Run", category: "photo",
  visual_tags: ["bicycle", "coffee", "urban", "street", "cafe"],
  gradient: ["#d97706", "#f59e0b"], icon: "🚲"
});

addPhoto({
  title: "Road Bike Resting on Coastal Highway",
  date: "2023-11-04", season: "autumn",
  location: { name: "Marine Drive", city: "Mumbai", country: "India", setting: "outdoors" },
  people: ["Rohan"], activities: ["cycling", "road biking"], objects: ["road bike", "ocean", "guardrail"],
  event: "Coastal Ride 2023", category: "photo",
  visual_tags: ["bicycle", "ocean", "highway", "coastline", "road bike"],
  gradient: ["#0284c7", "#38bdf8"], icon: "🚲"
});

addPhoto({
  title: "Alex Riding Bicycle in City Park",
  date: "2024-04-20", season: "spring",
  location: { name: "Cubbon Park", city: "Bengaluru", country: "India", setting: "outdoors" },
  people: ["Alex"], activities: ["biking", "casual riding"], objects: ["hybrid bike", "park bench", "green grass"],
  event: "Spring Park Outing", category: "photo",
  visual_tags: ["bicycle", "park", "greenery", "trees", "cycling"],
  gradient: ["#16a34a", "#4ade80"], icon: "🚴‍♂️"
});

addPhoto({
  title: "Vintage Bicycle Against Brick Wall",
  date: "2023-09-12", season: "autumn",
  location: { name: "Old Town Alley", city: "Jaipur", country: "India", setting: "outdoors" },
  people: [], activities: [], objects: ["vintage bicycle", "basket", "brick wall"],
  event: "Heritage Walk", category: "photo",
  visual_tags: ["vintage bike", "architecture", "rustic", "brick"],
  gradient: ["#b45309", "#d97706"], icon: "🚲"
});

addPhoto({
  title: "Mountain Bike Leaning Against Pine Tree",
  date: "2024-07-16", season: "summer",
  location: { name: "Pine Forest Trail", city: "Manali", country: "India", setting: "outdoors" },
  people: [], activities: ["resting"], objects: ["mountain bike", "pine trees", "dirt trail"],
  event: "Summer Mountain Trip 2024", category: "photo",
  visual_tags: ["mountain bike", "forest", "trail", "trees", "nature"],
  gradient: ["#047857", "#10b981"], icon: "🚵"
});

addPhoto({
  title: "Group of Cyclists Riding Mountain Pass",
  date: "2023-06-18", season: "summer",
  location: { name: "Rohtang Pass", city: "Ladakh", country: "India", setting: "outdoors" },
  people: ["Alex", "Rohan", "Vikram"], activities: ["group cycling", "touring"], objects: ["bicycles", "helmets", "snow mountains"],
  event: "Himalayan Expedition", category: "photo",
  visual_tags: ["bicycles", "mountains", "group", "snow", "cycling"],
  gradient: ["#475569", "#94a3b8"], icon: "🚴‍♀️"
});

addPhoto({
  title: "Alex Hiking on Forest Trail (No Bike)",
  date: "2024-07-17", season: "summer",
  location: { name: "Pine Forest Trail", city: "Manali", country: "India", setting: "outdoors" },
  people: ["Alex"], activities: ["hiking", "walking"], objects: ["backpack", "hiking boots", "pine trees"],
  event: "Summer Mountain Trip 2024", category: "photo",
  visual_tags: ["forest", "trail", "hiking", "backpack", "trees"],
  gradient: ["#15803d", "#22c55e"], icon: "🥾"
});

addPhoto({
  title: "Electric Cargo Bike in Shopping Plaza",
  date: "2024-08-05", season: "summer",
  location: { name: "Connaught Place", city: "Delhi", country: "India", setting: "outdoors" },
  people: [], activities: ["shopping"], objects: ["cargo bike", "shopping bags"],
  event: "Weekend Shopping", category: "photo",
  visual_tags: ["electric bike", "shopping", "city", "plaza"],
  gradient: ["#6366f1", "#818cf8"], icon: "🚲"
});

addPhoto({
  title: "Bicycle Helmet and Gloves on Wooden Table",
  date: "2024-07-15", season: "summer",
  location: { name: "Trailside Cafe", city: "Manali", country: "India", setting: "outdoors" },
  people: ["Alex"], activities: ["rest break"], objects: ["helmet", "gloves", "water bottle"],
  event: "Summer Mountain Trip 2024", category: "photo",
  visual_tags: ["gear", "helmet", "cycling", "table"],
  gradient: ["#ca8a04", "#eab308"], icon: "🪖"
});

addPhoto({
  title: "Bicycle Maintenance Workshop with Tools",
  date: "2024-03-11", season: "spring",
  location: { name: "Garage Workshop", city: "Delhi", country: "India", setting: "indoors" },
  people: ["Rohan"], activities: ["repairing bike"], objects: ["tools", "bike wheel", "chain lube"],
  event: "Spring Bike Tune-up", category: "photo",
  visual_tags: ["workshop", "tools", "repair", "bicycle"],
  gradient: ["#334155", "#64748b"], icon: "🔧"
});

addPhoto({
  title: "Children's Tricycle in Sunny Back Garden",
  date: "2023-05-14", season: "spring",
  location: { name: "Home Garden", city: "Delhi", country: "India", setting: "outdoors" },
  people: ["Maya"], activities: ["playing"], objects: ["tricycle", "lawn", "toys"],
  event: "Family Garden Afternoon", category: "photo",
  visual_tags: ["tricycle", "garden", "kids", "sunny"],
  gradient: ["#ec4899", "#f472b6"], icon: "🧸"
});


// -------------------------------------------------------------
// CLUSTER 2: Beach, Sunsets, Ocean & Goa Trip (Items 013 - 026)
// -------------------------------------------------------------
addPhoto({
  title: "Sunrise Over Ocean Beach in Bali",
  date: "2024-01-10", season: "winter",
  location: { name: "Sanur Beach", city: "Bali", country: "Indonesia", setting: "outdoors" },
  people: ["Maya"], activities: ["watching sunrise"], objects: ["ocean", "waves", "sun"],
  event: "Bali Winter Vacation", category: "photo",
  visual_tags: ["sunrise", "beach", "ocean", "waves", "sky"],
  gradient: ["#f97316", "#fb923c"], icon: "🌅"
}); // photo-013

addPhoto({
  title: "Beach Volleyball Match at Midday",
  date: "2023-12-18", season: "winter",
  location: { name: "Baga Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Rohan", "Vikram"], activities: ["playing volleyball", "sports"], objects: ["volleyball", "net", "sand"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "volleyball", "sports", "sand", "sunny"],
  gradient: ["#0284c7", "#06b6d4"], icon: "🏐"
}); // photo-014

addPhoto({
  title: "Golden Hour Sunset Over City Skyline",
  date: "2024-02-14", season: "winter",
  location: { name: "Rooftop Lounge", city: "Mumbai", country: "India", setting: "outdoors" },
  people: ["Priya"], activities: ["dining", "watching sunset"], objects: ["skyscrapers", "sun", "glasses"],
  event: "Valentine Dinner", category: "photo",
  visual_tags: ["sunset", "skyline", "city", "golden hour"],
  gradient: ["#ea580c", "#f97316"], icon: "🌇"
}); // photo-015

addPhoto({
  title: "Sunset Over Mountain Range Valley",
  date: "2023-10-05", season: "autumn",
  location: { name: "Tiger Hill", city: "Darjeeling", country: "India", setting: "outdoors" },
  people: [], activities: ["sightseeing"], objects: ["mountains", "clouds", "sun"],
  event: "Darjeeling Trip", category: "photo",
  visual_tags: ["sunset", "mountains", "clouds", "landscape"],
  gradient: ["#7c3aed", "#a855f7"], icon: "🌄"
}); // photo-016

addPhoto({
  title: "Beach Umbrella and Sun Loungers in Goa",
  date: "2023-12-19", season: "winter",
  location: { name: "Palolem Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: [], activities: ["relaxing"], objects: ["umbrella", "loungers", "sand", "palm trees"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "umbrella", "resort", "palm trees", "sand"],
  gradient: ["#0d9488", "#14b8a6"], icon: "🏖️"
}); // photo-017

addPhoto({
  title: "People Walking on Shoreline at Dusk",
  date: "2023-12-20", season: "winter",
  location: { name: "Anjuna Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya"], activities: ["walking", "strolling"], objects: ["ocean", "sand", "waves"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "sunset", "walking", "silhouette"],
  gradient: ["#c026d3", "#e879f9"], icon: "🚶‍♂️"
}); // photo-018

addPhoto({
  title: "Tropical Beach with Palm Trees in Goa",
  date: "2023-12-21", season: "winter",
  location: { name: "Agonda Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Maya"], activities: ["swimming", "vacationing"], objects: ["palm trees", "ocean", "blue sky"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "palm trees", "ocean", "tropical", "sea"],
  gradient: ["#0284c7", "#38bdf8"], icon: "🌴"
}); // photo-019

addPhoto({
  title: "Sunset Over Lake from Wooden Boat",
  date: "2024-06-12", season: "summer",
  location: { name: "Dal Lake", city: "Srinagar", country: "India", setting: "outdoors" },
  people: ["Priya"], activities: ["boating"], objects: ["boat", "water reflections", "sun"],
  event: "Kashmir Summer Trip", category: "photo",
  visual_tags: ["sunset", "lake", "boat", "reflections"],
  gradient: ["#d97706", "#f59e0b"], icon: "⛵"
}); // photo-020

addPhoto({
  title: "Alex and Maya Sitting on Beach at Sunset",
  date: "2023-12-22", season: "winter",
  location: { name: "Morjim Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya"], activities: ["watching sunset", "sitting"], objects: ["sand", "sun", "ocean"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "sunset", "couples", "ocean", "sand"],
  gradient: ["#e11d48", "#fb7185"], icon: "🌅"
}); // photo-021

addPhoto({
  title: "Rocky Coastal Cliff Overlooking Ocean",
  date: "2023-12-23", season: "winter",
  location: { name: "Cabo de Rama", city: "Goa", country: "India", setting: "outdoors" },
  people: [], activities: ["sightseeing"], objects: ["cliffs", "waves", "rocks"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["beach", "cliffs", "ocean", "nature", "waves"],
  gradient: ["#0369a1", "#0284c7"], icon: "🌊"
}); // photo-022

addPhoto({
  title: "Surfing in Morning Ocean Waves",
  date: "2023-12-20", season: "winter",
  location: { name: "Arambol Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Vikram"], activities: ["surfing", "water sports"], objects: ["surfboard", "waves", "wetsuit"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["surfing", "beach", "ocean", "waves", "sports"],
  gradient: ["#0891b2", "#06b6d4"], icon: "🏄‍♂️"
}); // photo-023

addPhoto({
  title: "Beach Shack Seafood Dinner with Lanterns",
  date: "2023-12-21", season: "winter",
  location: { name: "Curlies Beach Shack", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya", "Rohan"], activities: ["dining", "eating seafood"], objects: ["lanterns", "seafood plate", "wooden table"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["dining", "beach shack", "night", "food", "lanterns"],
  gradient: ["#b45309", "#f59e0b"], icon: "🦞"
}); // photo-024

// photo-025 (BENCHMARK TARGET 2)
addPhoto({
  title: "Sunset Over Beach During Trip to Goa",
  date: "2023-12-22", season: "winter",
  location: { name: "Vagator Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya", "Priya"], activities: ["watching sunset", "relaxing"], objects: ["sun", "ocean", "waves", "sand"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["sunset", "beach", "ocean", "waves", "horizon", "sun", "goa"],
  gradient: ["#ea580c", "#f97316"], icon: "🌅"
}); // photo-025 (BENCHMARK TARGET 2)

addPhoto({
  title: "Bonfire Party on Beach at Night",
  date: "2023-12-24", season: "winter",
  location: { name: "Anjuna Beach", city: "Goa", country: "India", setting: "outdoors" },
  people: ["Alex", "Rohan", "Maya"], activities: ["bonfire", "party"], objects: ["fire", "wood logs", "sand", "ocean"],
  event: "Goa Trip Dec 2023", category: "photo",
  visual_tags: ["bonfire", "beach", "night", "fire", "party"],
  gradient: ["#dc2626", "#ef4444"], icon: "🔥"
}); // photo-026


// -------------------------------------------------------------
// CLUSTER 3: Campfire, Guitars, Music & Camping (Items 027 - 045)
// -------------------------------------------------------------
addPhoto({
  title: "Campfire Burning Bright in Dark Forest",
  date: "2023-10-14", season: "autumn",
  location: { name: "Rishikesh Camping Grounds", city: "Rishikesh", country: "India", setting: "outdoors" },
  people: [], activities: ["camping"], objects: ["fire", "logs", "sparks", "trees"],
  event: "Rishikesh Camping 2023", category: "photo",
  visual_tags: ["campfire", "fire", "night", "camping", "forest"],
  gradient: ["#b91c1c", "#dc2626"], icon: "🔥"
}); // photo-027

addPhoto({
  title: "Acoustic Guitar Resting Against Sofa Indoors",
  date: "2024-01-25", season: "winter",
  location: { name: "Living Room", city: "Delhi", country: "India", setting: "indoors" },
  people: [], activities: [], objects: ["acoustic guitar", "sofa", "cushion"],
  event: "Home Cozy Days", category: "photo",
  visual_tags: ["acoustic guitar", "music", "indoors", "home"],
  gradient: ["#92400e", "#b45309"], icon: "🎸"
}); // photo-028

addPhoto({
  title: "Electric Guitar on Concert Stage Under Spotlights",
  date: "2023-11-18", season: "autumn",
  location: { name: "Jawaharlal Nehru Stadium", city: "Delhi", country: "India", setting: "indoors" },
  people: ["Rohan"], activities: ["concert", "playing music"], objects: ["electric guitar", "amplifiers", "spotlights"],
  event: "Rock Fest 2023", category: "photo",
  visual_tags: ["electric guitar", "stage", "concert", "spotlights", "music"],
  gradient: ["#4c1d95", "#6d28d9"], icon: "🎸"
}); // photo-029

addPhoto({
  title: "Friends Sitting Around Campfire Chatting",
  date: "2023-10-14", season: "autumn",
  location: { name: "Rishikesh Camping Grounds", city: "Rishikesh", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya", "Priya"], activities: ["chatting", "campfire"], objects: ["fire", "camp chairs", "blankets"],
  event: "Rishikesh Camping 2023", category: "photo",
  visual_tags: ["campfire", "friends", "night", "camping", "chatting"],
  gradient: ["#c2410c", "#ea580c"], icon: "⛺"
}); // photo-030

// photo-031 (BENCHMARK TARGET 3)
addPhoto({
  title: "Playing Acoustic Guitar by Campfire at Night",
  date: "2023-10-14", season: "autumn",
  location: { name: "Rishikesh Camping Grounds", city: "Rishikesh", country: "India", setting: "outdoors" },
  people: ["Alex", "Maya"], activities: ["playing acoustic guitar", "singing", "campfire"], objects: ["acoustic guitar", "campfire", "fire", "camp chairs"],
  event: "Rishikesh Camping 2023", category: "photo",
  visual_tags: ["acoustic guitar", "campfire", "night", "singing", "music", "fire", "outdoors"],
  gradient: ["#9a3412", "#c2410c"], icon: "🎸"
}); // photo-031 (BENCHMARK TARGET 3)

addPhoto({
  title: "Camping Tent Near Campfire Under Starry Night Sky",
  date: "2023-10-15", season: "autumn",
  location: { name: "Rishikesh Camping Grounds", city: "Rishikesh", country: "India", setting: "outdoors" },
  people: [], activities: ["camping", "stargazing"], objects: ["tent", "campfire", "stars", "milky way"],
  event: "Rishikesh Camping 2023", category: "photo",
  visual_tags: ["tent", "campfire", "stars", "night", "camping"],
  gradient: ["#1e1b4b", "#312e81"], icon: "🌌"
}); // photo-032

addPhoto({
  title: "Person Singing with Acoustic Guitar Indoors",
  date: "2024-02-08", season: "winter",
  location: { name: "Music Studio", city: "Delhi", country: "India", setting: "indoors" },
  people: ["Alex"], activities: ["singing", "playing guitar"], objects: ["acoustic guitar", "microphone", "headphones"],
  event: "Studio Jam Session", category: "photo",
  visual_tags: ["acoustic guitar", "singing", "microphone", "indoors", "music"],
  gradient: ["#3730a3", "#4338ca"], icon: "🎙️"
}); // photo-033

addPhoto({
  title: "Marshmallows Roasting Over Campfire Flame",
  date: "2023-10-14", season: "autumn",
  location: { name: "Rishikesh Camping Grounds", city: "Rishikesh", country: "India", setting: "outdoors" },
  people: ["Maya"], activities: ["roasting marshmallows", "eating"], objects: ["marshmallows", "sticks", "campfire"],
  event: "Rishikesh Camping 2023", category: "photo",
  visual_tags: ["marshmallows", "campfire", "fire", "food", "night"],
  gradient: ["#d97706", "#f59e0b"], icon: "🍢"
}); // photo-034

for (let i = 35; i <= 45; i++) {
  addPhoto({
    title: `Campfire & Jam Session Variation #${i-34}`,
    date: `2023-10-${10 + (i%5)}`, season: "autumn",
    location: { name: "Himalayan Foothills Camp", city: "Shimla", country: "India", setting: "outdoors" },
    people: ["Rohan", "Priya"], activities: ["singing", "camping"], objects: ["fire", "guitar case", "backpacks"],
    event: "Autumn Hill Camp", category: "photo",
    visual_tags: ["campfire", "guitar", "night", "camping", "music"],
    gradient: ["#9a3412", "#ea580c"], icon: "🔥"
  });
}


// -------------------------------------------------------------
// CLUSTER 4: Screenshots, Tickets, Receipts & Documents (Items 046 - 070)
// -------------------------------------------------------------

// photo-046 (BENCHMARK TARGET 4)
addPhoto({
  title: "Concert Ticket Screenshot for Coldplay",
  date: "2024-08-12", season: "summer",
  location: { name: "BookMyShow App", city: "Online", country: "India", setting: "digital" },
  people: [], activities: ["ticket booking"], objects: ["ticket QR code", "order summary"],
  event: "Coldplay Music of the Spheres Tour", category: "screenshot",
  visual_tags: ["ticket", "concert", "coldplay", "qr code", "screenshot", "confirmation"],
  ocr_text: "COLDPLAY Music of the Spheres Tour. Venue: DY Patil Stadium Mumbai. Date: 18 Jan 2025. Order Confirmation Code: CP-98234. Section: Standing Ground. Total Paid: ₹6,500.",
  gradient: ["#1e293b", "#334155"], icon: "🎟️"
}); // photo-046 (BENCHMARK TARGET 4)

addPhoto({
  title: "Flight Boarding Pass Screenshot for London Trip",
  date: "2024-06-01", season: "summer",
  location: { name: "British Airways App", city: "Online", country: "UK", setting: "digital" },
  people: ["Alex"], activities: ["flight check-in"], objects: ["boarding pass", "barcode", "gate info"],
  event: "London Summer Vacation", category: "screenshot",
  visual_tags: ["boarding pass", "flight", "airline", "screenshot", "travel"],
  ocr_text: "British Airways Flight BA-142. Delhi DEL to London LHR. Passenger: ALEX JOHNSON. Seat: 14B. Gate: 07. Departure: 08:30 AM.",
  gradient: ["#1e3a8a", "#1d4ed8"], icon: "✈️"
}); // photo-047

addPhoto({
  title: "Movie Ticket Confirmation Screenshot for Interstellar",
  date: "2024-03-15", season: "spring",
  location: { name: "PVR Cinemas App", city: "Delhi", country: "India", setting: "digital" },
  people: ["Alex", "Maya"], activities: ["movie booking"], objects: ["seat numbers", "barcode"],
  event: "Movie Night", category: "screenshot",
  visual_tags: ["movie ticket", "cinema", "screenshot", "pvr", "entertainment"],
  ocr_text: "PVR Directors Cut. Movie: INTERSTELLAR IMAX 70mm. Date: 15 Mar 2024. Seats: F11, F12. Booking Ref: PVR-99120.",
  gradient: ["#312e81", "#4338ca"], icon: "🎬"
}); // photo-048

addPhoto({
  title: "Train Ticket Confirmation Screenshot (IRCTC)",
  date: "2023-12-15", season: "winter",
  location: { name: "IRCTC Mobile", city: "Online", country: "India", setting: "digital" },
  people: ["Alex", "Maya", "Priya"], activities: ["rail travel"], objects: ["PNR number", "train timing"],
  event: "Goa Trip Dec 2023", category: "screenshot",
  visual_tags: ["train ticket", "irctc", "pnr", "screenshot", "railway"],
  ocr_text: "IRCTC E-Ticket. Train: 12432 Rajdhani Express. PNR: 2419820194. From: NZM to: MAO (Goa). Class: 2A. Passengers: 3.",
  gradient: ["#831843", "#9d174d"], icon: "🚆"
}); // photo-049

addPhoto({
  title: "Coffee Shop Receipt Document Photo",
  date: "2024-07-02", season: "summer",
  location: { name: "Blue Tokai Coffee", city: "Delhi", country: "India", setting: "indoors" },
  people: [], activities: ["buying coffee"], objects: ["paper receipt", "coffee cup", "table"],
  event: "Work & Coffee", category: "document",
  visual_tags: ["receipt", "coffee", "paper", "document", "invoice"],
  ocr_text: "BLUE TOKAI COFFEE ROASTERS. Date: 02/07/2024. 1x Iced Latte ₹280. 1x Almond Croissant ₹220. Subtotal: ₹500. GST: ₹25. Total: ₹525. Paid via UPI.",
  gradient: ["#78350f", "#92400e"], icon: "🧾"
}); // photo-050

addPhoto({
  title: "Restaurant Bill Receipt Screenshot ($45.50)",
  date: "2024-05-18", season: "spring",
  location: { name: "Swiggy App", city: "Online", country: "India", setting: "digital" },
  people: ["Alex"], activities: ["food delivery"], objects: ["bill summary", "delivery address"],
  event: "Weekend Dinner at Home", category: "screenshot",
  visual_tags: ["receipt", "swiggy", "food delivery", "bill", "screenshot"],
  ocr_text: "Swiggy Order #882104. Restaurant: Punjab Grill. Items: Butter Chicken x1, Garlic Naan x3. Total Paid: ₹850. Delivered to Home.",
  gradient: ["#c2410c", "#ea580c"], icon: "🛵"
}); // photo-051

addPhoto({
  title: "Grocery Store Invoice Receipt Document",
  date: "2024-04-10", season: "spring",
  location: { name: "Nature's Basket", city: "Delhi", country: "India", setting: "indoors" },
  people: [], activities: ["grocery shopping"], objects: ["printed receipt", "paper invoice"],
  event: "Monthly Groceries", category: "document",
  visual_tags: ["receipt", "groceries", "invoice", "document"],
  ocr_text: "NATURES BASKET SUPERMARKET. Tax Invoice #NB-44102. Date: 10-04-2024. Items: Milk, Oats, Olive Oil, Berries. Total Amount: ₹1,420.",
  gradient: ["#14532d", "#166534"], icon: "🛒"
}); // photo-052

addPhoto({
  title: "Wi-Fi Password Note Screenshot",
  date: "2024-01-05", season: "winter",
  location: { name: "Airbnb Apartment", city: "Goa", country: "India", setting: "digital" },
  people: [], activities: [], objects: ["notes app", "wifi details"],
  event: "Goa Trip", category: "screenshot",
  visual_tags: ["wifi", "password", "notes", "screenshot"],
  ocr_text: "Goa Villa Wifi Network: Villa_Palolem_5G. Password: sunnybeach2024! Host Contact: +91-9876543210.",
  gradient: ["#0f172a", "#1e293b"], icon: "📶"
}); // photo-053

addPhoto({
  title: "Google Maps Route Screenshot to Goa Beach",
  date: "2023-12-18", season: "winter",
  location: { name: "Google Maps App", city: "Goa", country: "India", setting: "digital" },
  people: [], activities: ["navigation"], objects: ["map route", "gps icon"],
  event: "Goa Trip Dec 2023", category: "screenshot",
  visual_tags: ["map", "navigation", "google maps", "route", "screenshot"],
  ocr_text: "Google Maps Navigation. Route to Vagator Beach Goa. Distance: 18 km. Estimated Time: 35 mins via NH66.",
  gradient: ["#047857", "#059669"], icon: "🗺️"
}); // photo-054

addPhoto({
  title: "Concert Poster Photo for Coldplay (Not Screenshot)",
  date: "2024-08-10", season: "summer",
  location: { name: "Street Billboard", city: "Mumbai", country: "India", setting: "outdoors" },
  people: [], activities: ["street walking"], objects: ["billboard", "poster", "lights"],
  event: "City Walk", category: "photo",
  visual_tags: ["poster", "coldplay", "concert", "billboard", "street"],
  ocr_text: "COLDPLAY LIVE IN MUMBAI 2025. Tickets on BookMyShow.",
  gradient: ["#3730a3", "#4f46e5"], icon: "🖼️"
}); // photo-055

for (let i = 56; i <= 70; i++) {
  addPhoto({
    title: `Digital Screenshot / Receipt Document #${i-55}`,
    date: `2024-0${1 + (i%8)}-15`, season: (i%2 === 0 ? "spring" : "summer"),
    location: { name: "Mobile Screen", city: "Online", country: "India", setting: "digital" },
    people: [], activities: ["digital transaction"], objects: ["payment summary", "qr code"],
    event: "Online Purchase", category: (i%3 === 0 ? "document" : "screenshot"),
    visual_tags: ["screenshot", "receipt", "payment", "document", "digital"],
    ocr_text: `UPI Payment Successful. Amount: ₹${i * 50}. Reference ID: TXN-${900000 + i}. Date: 2024-0${1 + (i%8)}-15.`,
    gradient: ["#1e293b", "#475569"], icon: "📱"
  });
}


// -------------------------------------------------------------
// CLUSTER 5: Family Gatherings, Parties, Dining & Pets (Items 071 - 100)
// -------------------------------------------------------------
for (let i = 71; i <= 100; i++) {
  const category = i % 4 === 0 ? "document" : "photo";
  let title = `Family Dining & Event Photo #${i-70}`;
  let people = ["Alex", "Maya"];
  let visual_tags = ["family", "dining", "celebration", "food"];
  let icon = "🍽️";
  let gradient = ["#0284c7", "#38bdf8"];
  
  if (i % 3 === 0) {
    title = `Pet Dog Playing in Lawn #${i-70}`;
    people = ["Rohan"];
    visual_tags = ["pet", "dog", "lawn", "playing", "animals"];
    icon = "🐕";
    gradient = ["#15803d", "#22c55e"];
  } else if (i % 5 === 0) {
    title = `Birthday Cake Celebration #${i-70}`;
    people = ["Alex", "Maya", "Priya", "Vikram"];
    visual_tags = ["birthday", "cake", "party", "candles", "celebration"];
    icon = "🎂";
    gradient = ["#db2777", "#f472b6"];
  } else if (i % 7 === 0) {
    title = `Winter Snow Mountain Scenery #${i-70}`;
    people = [];
    visual_tags = ["snow", "mountains", "winter", "landscape"];
    icon = "❄️";
    gradient = ["#0284c7", "#06b6d4"];
  }
  
  addPhoto({
    title,
    date: `2024-0${1 + (i%9)}-${10 + (i%15)}`,
    season: (i%4 === 0 ? "winter" : (i%4 === 1 ? "spring" : (i%4 === 2 ? "summer" : "autumn"))),
    location: { name: "City Venue", city: "Delhi", country: "India", setting: (i%2 === 0 ? "indoors" : "outdoors") },
    people,
    activities: ["celebrating", "gathering"],
    objects: ["table", "decorations"],
    event: "Family Weekend",
    category,
    visual_tags,
    ocr_text: category === "document" ? `Event Invitation #${i}. Date: 2024. Venue: Delhi.` : "",
    gradient,
    icon
  });
}

// -------------------------------------------------------------
// Write photos.json
// -------------------------------------------------------------
fs.writeFileSync(path.join(dataDir, 'photos.json'), JSON.stringify(rawPhotos, null, 2));
console.log(`Successfully generated ${rawPhotos.length} photos in data/photos.json and public/dataset/!`);

// -------------------------------------------------------------
// Write benchmark_tasks.json mapping with unique, non-duplicated near miss IDs
// -------------------------------------------------------------
const benchmarkTasks = [
  {
    id: "task-1",
    title: "Compound Person/Activity/Trip Query",
    target_photo_id: "photo-001",
    prompt: "Alex riding a mountain bike on the forest trail in summer 2024",
    expected_clues: {
      people: ["Alex"],
      activities: ["biking", "riding mountain bike"],
      time_frame: { year: 2024, season: "summer" },
      visual_tags: ["mountain bike", "forest", "trail"]
    },
    known_near_miss_ids: ["photo-002", "photo-003", "photo-004", "photo-006", "photo-007", "photo-008", "photo-010"],
    expected_recovery_dimensions: ["activities", "people", "category"]
  },
  {
    id: "task-2",
    title: "Place/Event Query",
    target_photo_id: "photo-025",
    prompt: "Sunset over the beach during our trip to Goa in December 2023",
    expected_clues: {
      location: { city: "Goa", name: "Vagator Beach" },
      time_frame: { year: 2023, month: 12, season: "winter" },
      visual_tags: ["sunset", "beach", "ocean", "goa"]
    },
    known_near_miss_ids: ["photo-013", "photo-014", "photo-015", "photo-017", "photo-019", "photo-021", "photo-026"],
    expected_recovery_dimensions: ["location", "time_frame", "visual_tags"]
  },
  {
    id: "task-3",
    title: "Visually Ambiguous Activity Query",
    target_photo_id: "photo-031",
    prompt: "Playing acoustic guitar by the campfire at night",
    expected_clues: {
      activities: ["playing acoustic guitar"],
      objects: ["acoustic guitar", "campfire"],
      time_of_day: "night",
      setting: "outdoors"
    },
    known_near_miss_ids: ["photo-027", "photo-028", "photo-029", "photo-030", "photo-032", "photo-033", "photo-034"],
    expected_recovery_dimensions: ["objects", "setting", "activities"]
  },
  {
    id: "task-4",
    title: "Screenshot/Category/Text Query",
    target_photo_id: "photo-046",
    prompt: "Concert ticket screenshot for Coldplay with order confirmation code",
    expected_clues: {
      category: "screenshot",
      event: "Coldplay Music of the Spheres Tour",
      ocr_text: "Coldplay CP-98234 ticket"
    },
    known_near_miss_ids: ["photo-047", "photo-048", "photo-049", "photo-050", "photo-051", "photo-055"],
    expected_recovery_dimensions: ["category", "ocr_text", "event"]
  }
];

fs.writeFileSync(path.join(dataDir, 'benchmark_tasks.json'), JSON.stringify(benchmarkTasks, null, 2));
console.log(`Successfully generated 4 benchmark tasks in data/benchmark_tasks.json!`);
