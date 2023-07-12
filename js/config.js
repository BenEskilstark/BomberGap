const isLocalHost = true;

const config = {
  isLocalHost,

  URL: isLocalHost ? null : "https://benhub.io",
  path: isLocalHost ? null : "/bombergap/socket.io",

  msPerTick: 250,

  worldSize: {width: 1000, height: 1000},

  formationRadius: 50,

  factionNames: ['USA', 'USSR', 'Z'],

  // starting configuration
  gen: 1,
  numAirbases: 1,
  numCities: 2,
  numFactories: 1,
  numLabs: 1,
  startingMoney: 5000,

  cityCost: 1000,
  moneyRate: 50, // money made per second
  factoryCost: 4000,
  productionRate: 50, // money spent per second per factory
  labCost: 5000,
  researchRate: 50, // money spent per second per lab
  genCost: [0, 0, 15000, 50000, 60000], // cost per generation
  airbaseCost: 8000,

  megaCityCost: 12000,
  megaCost: 8000,
  megaMultiplier: 2, // NOTE: this doesn't affect city income or lab research
  hardenedCost: 6000,
  hardenedGen: 3,

  afterburnDuration: 18,
  afterburnFuelCost: 200,
  afterburnSpeedMultiplier: 3,
  stealthVisionRadius: 25,
  genDogfightBonus: 0.15,

  planeDesigns: [
    // USA
    {
      // gen1
      'B-47': {
        name: 'B-47', nickname: 'Stratojet', cost: 1200,
        gen: 1, fuel: 1000, vision: 30, speed: 0.7, ammo: 1,
        isBomber: true, isNuclear: true,
        hotkey: 'Q',
      },
      'F-86': {
        name: 'F-86', nickname: 'Sabre', cost: 750,
        gen: 1, fuel: 500, vision: 40, speed: 0.9, ammo: 1,
        isFighter: true,
        hotkey: 'A',
      },

      // gen2
      'B-52': {
        name: 'B-52', nickname: 'Stratofortress', cost: 2400,
        gen: 2, fuel: 2000, vision: 45, speed: 0.8, ammo: 1,
        planeCapacity: 3, planeTypes: ['F-100', 'F-86'],
        isBomber: true, isNuclear: true,
        hotkey: 'W',
      },
      'F-100': {
        name: 'F-100', nickname: 'Super Sabre', cost: 2000,
        gen: 2, fuel: 600, vision: 40, speed: 1.2, ammo: 1,
        isFighter: true, isBomber: true,
        hotkey: 'S',
      },
      'U-2': {
        name: 'U-2', nickname: 'Dragon', cost: 600,
        gen: 2, fuel: 2400, vision: 70, speed: 0.75, ammo: 0,
        isRecon: true,
        hotkey: 'X',
      },

      // gen3
      'B-58': {
        name: 'B-58', nickname: 'Hustler', cost: 3500,
        gen: 3, fuel: 950, vision: 45, speed: 2.5, ammo: 1,
        isBomber: true, isNuclear: true,
        hotkey: 'E',
      },
      'F-4': {
        name: 'F-4', nickname: 'Phantom', cost: 3000,
        gen: 3, fuel: 1000, vision: 50, speed: 2.2, ammo: 2,
        isFighter: true, isBomber: true, isAfterburner: true,
        hotkey: 'D',
      },
      'SR-71': {
        name: 'SR-71', nickname: 'Blackbird', cost: 4000,
        gen: 3, fuel: 1800, vision: 80, speed: 3.3, ammo: 0,
        isRecon: true, isAfterburner: true,
        hotkey: 'C',
      },

      // gen4
      'XB-70': {
        name: 'XB-70', nickname: 'Valkyrie', cost: 4500,
        gen: 4, fuel: 1600, vision: 45, speed: 3.1, ammo: 1,
        isBomber: true, isNuclear: true,
        hotkey: 'R',
      },
      'XF-108': {
        name: 'XF-108', nickname: 'Rapier', cost: 3500,
        gen: 4, fuel: 1200, vision: 50, speed: 3.1, ammo: 1,
        isFighter: true,
        hotkey: 'F',
      },
    },

    // USSR
    {
      // gen1
      'IL-28': {
        name: 'IL-28', nickname: 'Beagle', cost: 600,
        gen: 1, fuel: 1000, vision: 30, speed: 0.8, ammo: 1,
        isBomber: true, isDogfighter: true,
        hotkey: 'Q',
      },
      'MIG-15': {
        name: 'MIG-15', nickname: 'Mother', cost: 400,
        gen: 1, fuel: 450, vision: 35, speed: 0.8, ammo: 1,
        isFighter: true,
        hotkey: 'A',
      },
      'YAK-25': {
        name: 'YAK-25', nickname: 'Yellow', cost: 400,
        gen: 1, fuel: 800, vision: 60, speed: 0.9, ammo: 0,
        isRecon: true,
        hotkey: 'Z',
      },

      // gen2
      'TU-16': {
        name: 'TU-16', nickname: 'Badger', cost: 1700,
        gen: 2, fuel: 1800, vision: 40, speed: 0.8, ammo: 2,
        isBomber: true, isDogfighter: true, isNuclear: true,
        hotkey: 'W',
      },
      'MIG-21': {
        name: 'MIG-21', nickname: 'Fishbed', cost: 900,
        gen: 2, fuel: 600, speed: 1.5, ammo: 1, vision: 45,
        isFighter: true, isAfterburner: true,
        hotkey: 'S',
      },
      'KH-50': {
        name: 'KH-50', nickname: 'Recon Cruise Missile', cost: 500,
        gen: 2, fuel: 1000, vision: 75, speed: 1.5, ammo: 0,
        isDrone: true, isRecon: true,
        hotkey: 'X',
      },

      // gen3
      'TU-160': {
        name: 'TU-160', nickname: 'White Swan', cost: 2500,
        gen: 3, fuel: 2000, vision: 55, speed: 2.1, ammo: 1,
        planeCapacity: 5, planeTypes: ['KH-55', 'KH-101', 'KH-50'],
        isBomber: true, isNuclear: true, isDogfighter: true,
        hotkey: 'E',
      },
      'KH-55': {
        name: 'KH-55', nickname: 'AA Cruise Missile', cost: 500,
        gen: 3, fuel: 500, vision: 40, speed: 3.2, ammo: 1,
        isDrone: true, isFighter: true, // isBomber: true,
        hotkey: 'D',
      },

      // gen4
      'KH-101': {
        name: 'KH-101', nickname: 'Nuclear Cruise Missile', cost: 500,
        gen: 4, fuel: 500, vision: 40, speed: 2.8, ammo: 1,
        isDrone: true, isNuclear: true, isBomber: true,
        hotkey: 'R',
      },
      'MIG-31': {
        name: 'MIG-31', nickname: 'Foxhound', cost: 3000,
        gen: 4, fuel: 1000, speed: 2.8, ammo: 3, vision: 45,
        isFighter: true, isAfterburner: true,
        hotkey: 'F',
      },
    },

    // Z
    {
      // gen1
      'ZF-1': {
        name: 'ZF-1', cost: 800,
        gen: 1, fuel: 600, vision: 35, speed: 1, ammo: 1,
        isFighter: true, isBomber: true,
        hotkey: 'A',
      },
      'ZR-1': {
        name: 'ZR-1', cost: 1000,
        gen: 1, fuel: 1400, speed: 0.7, vision: 60, ammo: 1,
        isRecon: true, isDogfighter: true,
        hotkey: 'Z',
      },

      // gen 2
      'ZB-2': {
        name: 'ZB-2', cost: 1500,
        gen: 2, fuel: 1000, speed: 0.8, vision: 75, ammo: 1,
        isRecon: true, isBomber: true, isNuclear: true,
        isAfterburner: true,
        hotkey: 'W',
      },
      'ZF-2': {
        name: 'ZF-2', cost: 3500,
        gen: 2, fuel: 1000, speed: 1.6, vision: 40, ammo: 3,
        isFighter: true, isAfterburner: true,
        hotkey: 'S',
      },

      // gen 3
      'ZB-3': {
        name: 'ZB-3', cost: 10000,
        gen: 3, fuel: 2000, speed: 1.3, vision: 50, ammo: 8,
        isGiant: true, isShielded: true, isBomber: true, isNuclear: true,
        hotkey: 'E',
      },
      'ZF-3': {
        name: 'ZF-3', cost: 10000,
        gen: 3, fuel: 2000, speed: 1.8, vision: 50, ammo: 10,
        isGiant: true, isShielded: true, isFighter: true,
        hotkey: 'D',
      },
      'ZC-3': {
        name: 'ZC-3', cost: 10000,
        gen: 3, fuel: 2500, speed: 0.75, vision: 65, ammo: 4,
        planeCapacity: 10, planeTypes: ['ZF-1', 'ZR-1', 'ZB-2', 'ZF-2', 'ZF-4', 'ZB-4'],
        isGiant: true, isShielded: true, // isFactory: true,
        hotkey: 'C',
      },

      // gen 4
      'ZB-4': {
        name: 'ZB-4', cost: 1800,
        gen: 4, fuel: 700, speed: 2.7, vision: 40, ammo: 1,
        isBomber: true, isNuclear: true,
        hotkey: 'R',
      },
      'ZF-4': {
        name: 'ZF-4', cost: 4000,
        gen: 4, fuel: 1200, speed: 2.7, vision: 45, ammo: 2,
        isFighter: true, isShielded: true, isAfterburner: true,
        hotkey: 'F',
      },

    },
  ],

}

module.exports = {
  config,
};
