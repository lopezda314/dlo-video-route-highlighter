// Pre-configured NYC Biking & Vlogging Routes for "The Co-Op Life"
// Coordinates are real [lat, lon] waypoints along each corridor.

window.ROUTE_PRESETS = {
  nz_full: {
    id: "nz_full",
    title: "New Zealand Grand Adventure",
    subtitle: "North & South Island",
    defaultColor: "#10b981",
    defaultStart: 0,
    defaultEnd: 14,
    stops: [
      { name: "Auckland", mile: "Dec 22", icon: "🛬", lat: -36.8485, lon: 174.7633 },
      { name: "Rotorua (Zipline)", mile: "Dec 22–24", icon: "🌲", lat: -38.1368, lon: 176.2497 },
      { name: "Waitomo Caves", mile: "Dec 24", icon: "🕳️", lat: -38.2608, lon: 175.1036 },
      { name: "Queenstown", mile: "Dec 25–26", icon: "🎄", lat: -45.0312, lon: 168.6626 },
      { name: "Milford Track (53.5km)", mile: "Dec 27–30", icon: "🥾", lat: -44.6716, lon: 167.9256 },
      { name: "Routeburn Track (33km)", mile: "Dec 31–Jan 3", icon: "🏔️", lat: -44.7495, lon: 168.1636 },
      { name: "Wanaka", mile: "Jan 5", icon: "🌊", lat: -44.7032, lon: 169.1321 },
      { name: "Aoraki / Mt Cook & Twizel", mile: "Jan 6–7", icon: "⛰️", lat: -43.7340, lon: 170.0960 },
      { name: "Omarama (Alps 2 Ocean)", mile: "Jan 8–11", icon: "🚴", lat: -44.4910, lon: 169.9710 },
      { name: "Oamaru (Blue Penguins)", mile: "Jan 12", icon: "🐧", lat: -45.0976, lon: 170.9704 },
      { name: "Dunedin & Otago Peninsula", mile: "Jan 13–14", icon: "🦅", lat: -45.8788, lon: 170.5028 },
      { name: "Invercargill", mile: "Jan 15", icon: "🥧", lat: -46.4132, lon: 168.3538 },
      { name: "Stewart Island (Wild Kiwis)", mile: "Jan 16–19", icon: "🥝", lat: -46.8986, lon: 168.1286 },
      { name: "Catlins Coast", mile: "Jan 19", icon: "🦭", lat: -46.4478, lon: 169.8169 },
      { name: "Queenstown Airport → AKL", mile: "Jan 20", icon: "✈️", lat: -45.0211, lon: 168.7392 }
    ]
  },

  nz_a2o: {
    id: "nz_a2o",
    title: "Alps 2 Ocean Cycle Trail",
    subtitle: "300km Southern Alps → Pacific Ocean",
    defaultColor: "#38bdf8",
    defaultStart: 0,
    defaultEnd: 7,
    stops: [
      { name: "Aoraki / Mount Cook", mile: "0 km", icon: "⛰️", lat: -43.7340, lon: 170.0960 },
      { name: "Lake Pukaki / Braemar", mile: "60 km", icon: "💧", lat: -44.1130, lon: 170.1810 },
      { name: "Twizel", mile: "85 km", icon: "🏡", lat: -44.2583, lon: 170.0994 },
      { name: "Lake Ohau", mile: "123 km", icon: "🏔️", lat: -44.2367, lon: 169.8247 },
      { name: "Omarama", mile: "168 km", icon: "🚴", lat: -44.4910, lon: 169.9710 },
      { name: "Kurow (Waitaki Valley)", mile: "230 km", icon: "🍷", lat: -44.7310, lon: 170.4670 },
      { name: "Duntroon / Elephant Rocks", mile: "255 km", icon: "🪨", lat: -44.8475, lon: 170.6772 },
      { name: "Oamaru Harbour (Pacific)", mile: "301 km", icon: "🐧", lat: -45.1028, lon: 170.9722 }
    ]
  },

  hudson: {
    id: "hudson",
    title: "Hudson River Greenway",
    subtitle: "Manhattan Waterfront Bike Path",
    defaultColor: "#22c55e",
    defaultStart: 0,
    defaultEnd: 3, // Battery Park -> 14th Street
    stops: [
      { name: "Battery Park", mile: "0.0 mi", icon: "🗽", lat: 40.7033, lon: -74.0170 },
      { name: "Chambers St / Tribeca", mile: "0.8 mi", icon: "🚴", lat: 40.7176, lon: -74.0132 },
      { name: "Christopher St Pier", mile: "1.8 mi", icon: "🌊", lat: 40.7336, lon: -74.0106 },
      { name: "14th St / Little Island", mile: "2.6 mi", icon: "🏝️", lat: 40.7421, lon: -74.0089 },
      { name: "34th St / Hudson Yards", mile: "3.7 mi", icon: "🏙️", lat: 40.7575, lon: -74.0045 },
      { name: "59th St / Riverside South", mile: "5.0 mi", icon: "🌉", lat: 40.7738, lon: -73.9936 },
      { name: "79th St Boat Basin", mile: "6.1 mi", icon: "⛵", lat: 40.7870, lon: -73.9845 },
      { name: "125th St / West Harlem Piers", mile: "8.5 mi", icon: "⚓", lat: 40.8180, lon: -73.9612 },
      { name: "Little Red Lighthouse / GWB", mile: "11.2 mi", icon: "🚨", lat: 40.8502, lon: -73.9469 }
    ]
  },

  bedford: {
    id: "bedford",
    title: "Video 1: Bedford Avenue",
    subtitle: "Brooklyn's Longest Street (10 Miles)",
    defaultColor: "#f97316",
    defaultStart: 0,
    defaultEnd: 4,
    stops: [
      { name: "Greenpoint / McCarren Park", mile: "Mile 0.0", icon: "🥐", lat: 40.7218, lon: -73.9517 },
      { name: "Williamsburg (Grand St)", mile: "Mile 1.2", icon: "☕", lat: 40.7136, lon: -73.9612 },
      { name: "Historic Bed-Stuy (Fulton St)", mile: "Mile 3.2", icon: "🏛️", lat: 40.6806, lon: -73.9532 },
      { name: "Crown Heights (Eastern Pkwy)", mile: "Mile 4.3", icon: "🥟", lat: 40.6701, lon: -73.9530 },
      { name: "Flatbush / Prospect Lefferts", mile: "Mile 5.8", icon: "🍦", lat: 40.6508, lon: -73.9533 },
      { name: "Flatbush / Kings Theatre Area", mile: "Mile 6.8", icon: "🎭", lat: 40.6382, lon: -73.9522 },
      { name: "Sheepshead Bay / Emmons Ave", mile: "Mile 10.2", icon: "🌊", lat: 40.5839, lon: -73.9438 }
    ]
  },

  ave34: {
    id: "ave34",
    title: "Video 2: 34th Avenue Open Street",
    subtitle: "3 Miles, 6 Countries (Jackson Hts → Corona)",
    defaultColor: "#38bdf8",
    defaultStart: 0,
    defaultEnd: 3,
    stops: [
      { name: "69th St & 34th Ave (Start)", mile: "0.0 mi", icon: "🚦", lat: 40.7523, lon: -73.8967 },
      { name: "77th St (Tibetan Momos)", mile: "0.4 mi", icon: "🥟", lat: 40.7537, lon: -73.8892 },
      { name: "82nd–90th Open Street Hub", mile: "0.9 mi", icon: "🥭", lat: 40.7552, lon: -73.8794 },
      { name: "Corona Plaza (103rd St)", mile: "1.6 mi", icon: "🌮", lat: 40.7576, lon: -73.8650 },
      { name: "114th St / Flushing Meadows Edge", mile: "2.2 mi", icon: "🏁", lat: 40.7595, lon: -73.8542 }
    ]
  },

  ocean: {
    id: "ocean",
    title: "Video 3: Ocean Parkway",
    subtitle: "America's Oldest Bike Path (1894)",
    defaultColor: "#06b6d4",
    defaultStart: 0,
    defaultEnd: 4,
    stops: [
      { name: "Prospect Park (Machate Circle)", mile: "0.0 mi", icon: "🌳", lat: 40.6514, lon: -73.9756 },
      { name: "Ditmas Park (Cortelyou Rd)", mile: "1.1 mi", icon: "☕", lat: 40.6381, lon: -73.9725 },
      { name: "Midwood (Avenue J / Di Fara)", mile: "2.4 mi", icon: "🍕", lat: 40.6247, lon: -73.9704 },
      { name: "Kings Highway", mile: "3.5 mi", icon: "🥯", lat: 40.6085, lon: -73.9679 },
      { name: "Brighton Beach & Coney Island", mile: "5.0 mi", icon: "🎡", lat: 40.5762, lon: -73.9685 }
    ]
  },

  grand: {
    id: "grand",
    title: "Video 4: Grand Concourse",
    subtitle: "Art Deco & Bronx Street Food",
    defaultColor: "#eab308",
    defaultStart: 0,
    defaultEnd: 3,
    stops: [
      { name: "The Hub / 149th St Start", mile: "0.0 mi", icon: "🥟", lat: 40.8179, lon: -73.9270 },
      { name: "161st St / Yankee Stadium & Art Deco", mile: "0.9 mi", icon: "🏛️", lat: 40.8270, lon: -73.9229 },
      { name: "Tremont Ave / 177th St", mile: "2.3 mi", icon: "🥤", lat: 40.8482, lon: -73.9087 },
      { name: "Poe Park & Fordham Rd Finish", mile: "4.1 mi", icon: "🍽️", lat: 40.8648, lon: -73.8950 }
    ]
  },

  stnick: {
    id: "stnick",
    title: "Video 5: St. Nicholas Avenue",
    subtitle: "Manhattan's Oldest Lenape Trail",
    defaultColor: "#f43f5e",
    defaultStart: 0,
    defaultEnd: 3,
    stops: [
      { name: "110th St (Central Park NW)", mile: "0.0 mi", icon: "☕", lat: 40.7993, lon: -73.9553 },
      { name: "125th St (Apollo / Harlem Core)", mile: "0.9 mi", icon: "🎷", lat: 40.8105, lon: -73.9519 },
      { name: "145th St (Sugar Hill Climb)", mile: "2.0 mi", icon: "🍗", lat: 40.8241, lon: -73.9447 },
      { name: "181st St (El Alto / Wash Heights)", mile: "3.8 mi", icon: "🍔", lat: 40.8496, lon: -73.9337 }
    ]
  },

  lga_citibike: {
    id: "lga_citibike",
    title: "Challenge: Citi Bike to LGA Airport",
    subtitle: "Bike-to-Terminal Flight Challenge",
    defaultColor: "#3b82f6",
    defaultStart: 0,
    defaultEnd: 3,
    stops: [
      { name: "Queensboro Bridge (Queens Plaza)", mile: "0.0 mi", icon: "🌉", lat: 40.7505, lon: -73.9402 },
      { name: "Astoria Park Waterfront", mile: "2.6 mi", icon: "🌊", lat: 40.7785, lon: -73.9228 },
      { name: "20th Ave & 81st St Bike Lane", mile: "4.4 mi", icon: "🚲", lat: 40.7720, lon: -73.8888 },
      { name: "LGA Airport Citi Bike Dock (94th St)", mile: "5.8 mi", icon: "✈️", lat: 40.7731, lon: -73.8726 }
    ]
  }
};
