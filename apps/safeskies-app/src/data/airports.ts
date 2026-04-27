export interface Airport {
  city: string;
  country: string;
  iata: string;
  slug: string;
}

export const airports: Airport[] = [
  // India
  { city: "Bengaluru", country: "India", iata: "BLR", slug: "bengaluru-india" },
  { city: "Mumbai", country: "India", iata: "BOM", slug: "mumbai-india" },
  { city: "New Delhi", country: "India", iata: "DEL", slug: "new-delhi-india" },
  { city: "Chennai", country: "India", iata: "MAA", slug: "chennai-india" },
  { city: "Hyderabad", country: "India", iata: "HYD", slug: "hyderabad-india" },
  { city: "Kolkata", country: "India", iata: "CCU", slug: "kolkata-india" },
  { city: "Kochi", country: "India", iata: "COK", slug: "kochi-india" },
  { city: "Ahmedabad", country: "India", iata: "AMD", slug: "ahmedabad-india" },
  { city: "Goa", country: "India", iata: "GOI", slug: "goa-india" },
  { city: "Pune", country: "India", iata: "PNQ", slug: "pune-india" },
  { city: "Jaipur", country: "India", iata: "JAI", slug: "jaipur-india" },
  { city: "Thiruvananthapuram", country: "India", iata: "TRV", slug: "thiruvananthapuram-india" },

  // Western Europe
  { city: "Paris", country: "France", iata: "CDG", slug: "paris-france" },
  { city: "London", country: "United Kingdom", iata: "LHR", slug: "london-united-kingdom" },
  { city: "Amsterdam", country: "Netherlands", iata: "AMS", slug: "amsterdam-netherlands" },
  { city: "Frankfurt", country: "Germany", iata: "FRA", slug: "frankfurt-am-main-germany" },
  { city: "Munich", country: "Germany", iata: "MUC", slug: "munich-germany" },
  { city: "Zurich", country: "Switzerland", iata: "ZRH", slug: "zurich-switzerland" },
  { city: "Brussels", country: "Belgium", iata: "BRU", slug: "brussels-belgium" },
  { city: "Dublin", country: "Ireland", iata: "DUB", slug: "dublin-ireland" },
  { city: "Vienna", country: "Austria", iata: "VIE", slug: "vienna-austria" },
  { city: "Geneva", country: "Switzerland", iata: "GVA", slug: "geneva-switzerland" },

  // Southern Europe
  { city: "Milan", country: "Italy", iata: "MXP", slug: "milan-italy" },
  { city: "Rome", country: "Italy", iata: "FCO", slug: "rome-italy" },
  { city: "Barcelona", country: "Spain", iata: "BCN", slug: "barcelona-spain" },
  { city: "Madrid", country: "Spain", iata: "MAD", slug: "madrid-spain" },
  { city: "Lisbon", country: "Portugal", iata: "LIS", slug: "lisbon-portugal" },
  { city: "Athens", country: "Greece", iata: "ATH", slug: "athens-greece" },
  { city: "Venice", country: "Italy", iata: "VCE", slug: "venice-italy" },
  { city: "Porto", country: "Portugal", iata: "OPO", slug: "porto-portugal" },

  // Northern Europe
  { city: "Copenhagen", country: "Denmark", iata: "CPH", slug: "copenhagen-denmark" },
  { city: "Stockholm", country: "Sweden", iata: "ARN", slug: "stockholm-sweden" },
  { city: "Helsinki", country: "Finland", iata: "HEL", slug: "helsinki-finland" },
  { city: "Oslo", country: "Norway", iata: "OSL", slug: "oslo-norway" },
  { city: "Reykjavik", country: "Iceland", iata: "KEF", slug: "reykjavik-iceland" },

  // Eastern Europe
  { city: "Berlin", country: "Germany", iata: "BER", slug: "berlin-germany" },
  { city: "Prague", country: "Czechia", iata: "PRG", slug: "prague-czechia" },
  { city: "Budapest", country: "Hungary", iata: "BUD", slug: "budapest-hungary" },
  { city: "Warsaw", country: "Poland", iata: "WAW", slug: "warsaw-poland" },
  { city: "Bucharest", country: "Romania", iata: "OTP", slug: "bucharest-romania" },
  { city: "Krakow", country: "Poland", iata: "KRK", slug: "krakow-poland" },

  // Russia & Caucasus
  { city: "Istanbul", country: "Turkey", iata: "IST", slug: "istanbul-turkey" },
  { city: "Tbilisi", country: "Georgia", iata: "TBS", slug: "tbilisi-georgia" },
  { city: "Baku", country: "Azerbaijan", iata: "GYD", slug: "baku-azerbaijan" },
  { city: "Yerevan", country: "Armenia", iata: "EVN", slug: "yerevan-armenia" },

  // Middle East
  { city: "Dubai", country: "UAE", iata: "DXB", slug: "dubai-united-arab-emirates" },
  { city: "Abu Dhabi", country: "UAE", iata: "AUH", slug: "abu-dhabi-united-arab-emirates" },
  { city: "Doha", country: "Qatar", iata: "DOH", slug: "doha-qatar" },
  { city: "Riyadh", country: "Saudi Arabia", iata: "RUH", slug: "riyadh-saudi-arabia" },
  { city: "Jeddah", country: "Saudi Arabia", iata: "JED", slug: "jeddah-saudi-arabia" },
  { city: "Muscat", country: "Oman", iata: "MCT", slug: "muscat-oman" },
  { city: "Kuwait City", country: "Kuwait", iata: "KWI", slug: "kuwait-city-kuwait" },
  { city: "Bahrain", country: "Bahrain", iata: "BAH", slug: "bahrain-bahrain" },
  { city: "Amman", country: "Jordan", iata: "AMM", slug: "amman-jordan" },
  { city: "Tel Aviv", country: "Israel", iata: "TLV", slug: "tel-aviv-israel" },
  { city: "Beirut", country: "Lebanon", iata: "BEY", slug: "beirut-lebanon" },

  // Southeast Asia
  { city: "Singapore", country: "Singapore", iata: "SIN", slug: "singapore-singapore" },
  { city: "Bangkok", country: "Thailand", iata: "BKK", slug: "bangkok-thailand" },
  { city: "Chiang Mai", country: "Thailand", iata: "CNX", slug: "chiang-mai-thailand" },
  { city: "Phuket", country: "Thailand", iata: "HKT", slug: "phuket-thailand" },
  { city: "Krabi", country: "Thailand", iata: "KBV", slug: "krabi-thailand" },
  { city: "Koh Samui", country: "Thailand", iata: "USM", slug: "koh-samui-thailand" },
  { city: "Pattaya", country: "Thailand", iata: "UTP", slug: "pattaya-thailand" },
  { city: "Hat Yai", country: "Thailand", iata: "HDY", slug: "hat-yai-thailand" },
  { city: "Kuala Lumpur", country: "Malaysia", iata: "KUL", slug: "kuala-lumpur-malaysia" },
  { city: "Penang", country: "Malaysia", iata: "PEN", slug: "penang-malaysia" },
  { city: "Langkawi", country: "Malaysia", iata: "LGK", slug: "langkawi-malaysia" },
  { city: "Kota Kinabalu", country: "Malaysia", iata: "BKI", slug: "kota-kinabalu-malaysia" },
  { city: "Jakarta", country: "Indonesia", iata: "CGK", slug: "jakarta-indonesia" },
  { city: "Bali", country: "Indonesia", iata: "DPS", slug: "bali-indonesia" },
  { city: "Yogyakarta", country: "Indonesia", iata: "JOG", slug: "yogyakarta-indonesia" },
  { city: "Surabaya", country: "Indonesia", iata: "SUB", slug: "surabaya-indonesia" },
  { city: "Ho Chi Minh City", country: "Vietnam", iata: "SGN", slug: "ho-chi-minh-city-vietnam" },
  { city: "Hanoi", country: "Vietnam", iata: "HAN", slug: "hanoi-vietnam" },
  { city: "Da Nang", country: "Vietnam", iata: "DAD", slug: "da-nang-vietnam" },
  { city: "Manila", country: "Philippines", iata: "MNL", slug: "manila-philippines" },
  { city: "Cebu", country: "Philippines", iata: "CEB", slug: "cebu-philippines" },
  { city: "Phnom Penh", country: "Cambodia", iata: "PNH", slug: "phnom-penh-cambodia" },
  { city: "Siem Reap", country: "Cambodia", iata: "REP", slug: "siem-reap-cambodia" },
  { city: "Vientiane", country: "Laos", iata: "VTE", slug: "vientiane-laos" },
  { city: "Luang Prabang", country: "Laos", iata: "LPQ", slug: "luang-prabang-laos" },
  { city: "Yangon", country: "Myanmar", iata: "RGN", slug: "yangon-myanmar" },

  // East Asia
  { city: "Hong Kong", country: "Hong Kong", iata: "HKG", slug: "hong-kong-hong-kong" },
  { city: "Tokyo", country: "Japan", iata: "NRT", slug: "tokyo-japan" },
  { city: "Seoul", country: "South Korea", iata: "ICN", slug: "seoul-south-korea" },
  { city: "Shanghai", country: "China", iata: "PVG", slug: "shanghai-china" },
  { city: "Beijing", country: "China", iata: "PEK", slug: "beijing-china" },
  { city: "Taipei", country: "Taiwan", iata: "TPE", slug: "taipei-taiwan" },
  { city: "Osaka", country: "Japan", iata: "KIX", slug: "osaka-japan" },

  // South Asia (non-India)
  { city: "Colombo", country: "Sri Lanka", iata: "CMB", slug: "colombo-sri-lanka" },
  { city: "Kathmandu", country: "Nepal", iata: "KTM", slug: "kathmandu-nepal" },
  { city: "Dhaka", country: "Bangladesh", iata: "DAC", slug: "dhaka-bangladesh" },
  { city: "Islamabad", country: "Pakistan", iata: "ISB", slug: "islamabad-pakistan" },
  { city: "Karachi", country: "Pakistan", iata: "KHI", slug: "karachi-pakistan" },
  { city: "Lahore", country: "Pakistan", iata: "LHE", slug: "lahore-pakistan" },
  { city: "Male", country: "Maldives", iata: "MLE", slug: "male-maldives" },

  // Central Asia
  { city: "Tashkent", country: "Uzbekistan", iata: "TAS", slug: "tashkent-uzbekistan" },
  { city: "Almaty", country: "Kazakhstan", iata: "ALA", slug: "almaty-kazakhstan" },
  { city: "Nur-Sultan", country: "Kazakhstan", iata: "NQZ", slug: "nur-sultan-kazakhstan" },

  // North America
  { city: "New York", country: "USA", iata: "JFK", slug: "new-york-united-states" },
  { city: "Los Angeles", country: "USA", iata: "LAX", slug: "los-angeles-united-states" },
  { city: "San Francisco", country: "USA", iata: "SFO", slug: "san-francisco-united-states" },
  { city: "Chicago", country: "USA", iata: "ORD", slug: "chicago-united-states" },
  { city: "Miami", country: "USA", iata: "MIA", slug: "miami-united-states" },
  { city: "Washington DC", country: "USA", iata: "IAD", slug: "washington-dc-united-states" },
  { city: "Boston", country: "USA", iata: "BOS", slug: "boston-united-states" },
  { city: "Seattle", country: "USA", iata: "SEA", slug: "seattle-united-states" },
  { city: "Dallas", country: "USA", iata: "DFW", slug: "dallas-united-states" },
  { city: "Atlanta", country: "USA", iata: "ATL", slug: "atlanta-united-states" },
  { city: "Denver", country: "USA", iata: "DEN", slug: "denver-united-states" },
  { city: "Houston", country: "USA", iata: "IAH", slug: "houston-united-states" },
  { city: "Toronto", country: "Canada", iata: "YYZ", slug: "toronto-canada" },
  { city: "Vancouver", country: "Canada", iata: "YVR", slug: "vancouver-canada" },
  { city: "Montreal", country: "Canada", iata: "YUL", slug: "montreal-canada" },
  { city: "Mexico City", country: "Mexico", iata: "MEX", slug: "mexico-city-mexico" },
  { city: "Cancun", country: "Mexico", iata: "CUN", slug: "cancun-mexico" },

  // South America
  { city: "Sao Paulo", country: "Brazil", iata: "GRU", slug: "sao-paulo-brazil" },
  { city: "Buenos Aires", country: "Argentina", iata: "EZE", slug: "buenos-aires-argentina" },
  { city: "Lima", country: "Peru", iata: "LIM", slug: "lima-peru" },
  { city: "Bogota", country: "Colombia", iata: "BOG", slug: "bogota-colombia" },
  { city: "Santiago", country: "Chile", iata: "SCL", slug: "santiago-chile" },
  { city: "Rio de Janeiro", country: "Brazil", iata: "GIG", slug: "rio-de-janeiro-brazil" },
  { city: "Medellin", country: "Colombia", iata: "MDE", slug: "medellin-colombia" },

  // Africa
  { city: "Nairobi", country: "Kenya", iata: "NBO", slug: "nairobi-kenya" },
  { city: "Addis Ababa", country: "Ethiopia", iata: "ADD", slug: "addis-ababa-ethiopia" },
  { city: "Johannesburg", country: "South Africa", iata: "JNB", slug: "johannesburg-south-africa" },
  { city: "Cape Town", country: "South Africa", iata: "CPT", slug: "cape-town-south-africa" },
  { city: "Cairo", country: "Egypt", iata: "CAI", slug: "cairo-egypt" },
  { city: "Casablanca", country: "Morocco", iata: "CMN", slug: "casablanca-morocco" },
  { city: "Lagos", country: "Nigeria", iata: "LOS", slug: "lagos-nigeria" },
  { city: "Dar es Salaam", country: "Tanzania", iata: "DAR", slug: "dar-es-salaam-tanzania" },
  { city: "Mauritius", country: "Mauritius", iata: "MRU", slug: "mauritius-mauritius" },
  { city: "Seychelles", country: "Seychelles", iata: "SEZ", slug: "seychelles-seychelles" },

  // Oceania
  { city: "Sydney", country: "Australia", iata: "SYD", slug: "sydney-australia" },
  { city: "Melbourne", country: "Australia", iata: "MEL", slug: "melbourne-australia" },
  { city: "Auckland", country: "New Zealand", iata: "AKL", slug: "auckland-new-zealand" },
  { city: "Perth", country: "Australia", iata: "PER", slug: "perth-australia" },
  { city: "Brisbane", country: "Australia", iata: "BNE", slug: "brisbane-australia" },
  { city: "Fiji", country: "Fiji", iata: "NAN", slug: "nadi-fiji" },
];
