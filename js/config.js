const isLocalHost = true;

const config = {
  isLocalHost,

  URL: isLocalHost ? null : "https://benhub.io",
  path: isLocalHost ? null : "/bombergap/socket.io",

  msPerTick: 250,

  worldSize: {width: 1000, height: 1000},

  formationRadius: 50,

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
  genCost: [0, 0, 15000, 50000, 50000], // cost per generation
  airbaseCost: 8000,

  stealthVisionReduction: 0.5,
  genDogfightBonus: 0.15,

  planeDesigns: [
    // USA
    {
      // gen1
      'B-47': {
        name: 'B-47', nickname: 'Stratojet', cost: 700,
        gen: 1, fuel: 1000, vision: 30, speed: 0.7, ammo: 1,
        isBomber: true, isNuclear: true,
      },
      'F-86': {
        name: 'F-86', nickname: 'Sabre', cost: 500,
        gen: 1, fuel: 500, vision: 40, speed: 0.9, ammo: 1,
        isFighter: true,
      },

      // gen2
      'B-52': {
        name: 'B-52', nickname: 'Stratofortress', cost: 2400,
        gen: 2, fuel: 2000, vision: 45, speed: 0.85, ammo: 1,
        planeCapacity: 3, planeTypes: ['F-100', 'F-86'],
        isBomber: true, isNuclear: true,
      },
      'F-100': {
        name: 'F-100', nickname: 'Super Sabre', cost: 1000,
        gen: 2, fuel: 600, vision: 40, speed: 1.2, ammo: 1,
        isFighter: true, isBomber: true,
      },
      'U-2': {
        name: 'U-2', nickname: 'Dragon', cost: 600,
        gen: 2, fuel: 2400, vision: 80, speed: 0.75, ammo: 0,
        isRecon: true,
      },

      // gen3
      'XB-70': {
        name: 'XB-70', nickname: 'Valkyrie', cost: 4500,
        gen: 3, fuel: 2400, vision: 50, speed: 3.1, ammo: 1,
        isBomber: true, isNuclear: true,
      },
      'F-4': {
        name: 'F-4', nickname: 'Phantom', cost: 2500,
        gen: 3, fuel: 1200, vision: 55, speed: 2.2, ammo: 2,
        isFighter: true, isBomber: true,
      },
      'SR-71': {
        name: 'SR-71', nickname: 'Blackbird', cost: 3000,
        gen: 3, fuel: 2500, vision: 120, speed: 3.3, ammo: 0,
        isRecon: true,
      },

      // gen4
      'F-117': {
        name: 'F-117', nickname: 'Nighthawk', cost: 6000,
        gen: 4, fuel: 1800, vision: 65, speed: 0.95, ammo: 3,
        isFighter: true, isBomber: true, isStealth: true,
      },
      'B-2': {
        name: 'B-2', nickname: 'Spirit', cost: 8000,
        gen: 4, fuel: 3000, vision: 70, speed: 0.9, ammo: 3,
        isBomber: true, isStealth: true, isNuclear: true,
      },
    },

    // USSR
    {
      // gen1
      'IL-28': {
        name: 'IL-28', nickname: 'Beagle', cost: 500,
        gen: 1, fuel: 900, vision: 30, speed: 0.7, ammo: 1,
        isBomber: true,
      },
      'MIG-15': {
        name: 'MIG-15', nickname: 'Mother', cost: 400,
        gen: 1, fuel: 400, vision: 35, speed: 0.8, ammo: 1,
        isFighter: true,
      },
      'YAK-25': {
        name: 'YAK-25', nickname: 'Yellow', cost: 400,
        gen: 1, fuel: 800, vision: 60, speed: 0.8, ammo: 0,
        isRecon: true,
      },

      // gen2
      'TU-16': {
        name: 'TU-16', nickname: 'Badger', cost: 2000,
        gen: 2, fuel: 1800, vision: 40, speed: 0.8, ammo: 1,
        isBomber: true, isDogfighter: true, isNuclear: true,
      },
      'MIG-21': {
        name: 'MIG-21', nickname: 'Fishbed', cost: 900,
        gen: 2, fuel: 600, speed: 1.5, ammo: 1, vision: 45,
        isFighter: true,
      },
      'KH-50': {
        name: 'KH-50', nickname: 'Recon Cruise Missile', cost: 500,
        gen: 2, fuel: 1000, vision: 75, speed: 1.5, ammo: 0,
        isDrone: true, isRecon: true,
      },

      // gen3
      'KH-55': {
        name: 'KH-55', nickname: 'AA Cruise Missile', cost: 1000,
        gen: 3, fuel: 500, vision: 40, speed: 2, ammo: 1,
        isDrone: true, isFighter: true,
      },
      'MIG-25': {
        name: 'MIG-25', nickname: 'Foxbat', cost: 2200,
        gen: 3, fuel: 900, speed: 3.2, ammo: 1, vision: 45,
        isFighter: true,
      },

      // gen4
      'TU-160': {
        name: 'TU-160', nickname: 'White Swan', cost: 6000,
        gen: 4, fuel: 2000, vision: 60, speed: 2.8, ammo: 2,
        planeCapacity: 4, planeTypes: ['KH-55', 'KH-101'],
        isBomber: true, isNuclear: true,
      },
      'KH-101': {
        name: 'KH-101', nickname: 'Nuclear Cruise Missile', cost: 3000,
        gen: 4, fuel: 500, vision: 40, speed: 1.5, ammo: 1,
        isDrone: true, isNuclear: true, isBomber: true,
      },

    },
  ],

}

module.exports = {
  config,
};
