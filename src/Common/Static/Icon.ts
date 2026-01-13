import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import {
  faAppleWhole,
  faArrowsRotate,
  faArrowsToDot,
  faArrowUp,
  faBars,
  faBinoculars,
  faBolt,
  faBomb,
  faBook,
  faBookOpen,
  faBuilding,
  faBullseye,
  faCaretDown,
  faCaretUp,
  faCarrot,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleDot,
  faCircleExclamation,
  faCity,
  faClover,
  faCog,
  faCoins,
  faCompress,
  faCrown,
  faDumbbell,
  faEarthAmericas,
  faExpand,
  faEye,
  faFaceSmile,
  faFaucet,
  faFaucetDrip,
  faFileArrowDown,
  faFileImport,
  faFireFlameSimple,
  faFish,
  faFlask,
  faFloppyDisk,
  faFolderOpen,
  faGavel,
  faGem,
  faGlobe,
  faHammer,
  faHandFist,
  faHands,
  faHandsPraying,
  faHeart,
  faHeartCrack,
  faHelicopter,
  faHelmetSafety,
  faHorse,
  faHourglassHalf,
  faHouse,
  faInbox,
  faIndustry,
  faLandmark,
  faLocationArrow,
  faLocationDot,
  faMagnifyingGlass,
  faMap,
  faMasksTheater,
  faMinus,
  faMoon,
  faMound,
  faMountain,
  faMountainSun,
  faObjectGroup,
  faParachuteBox,
  faPause,
  faPaw,
  faPen,
  faPepperHot,
  faPerson,
  faPersonRifle,
  faPlaceOfWorship,
  faPlane,
  faPlaneCircleExclamation,
  faPlaneSlash,
  faPlaneUp,
  faPlantWilt,
  faPlay,
  faPlus,
  faQuestion,
  faRadiation,
  faRandom,
  faRightLeft,
  faRoad,
  faRotateLeft,
  faRotateRight,
  faRoute,
  faSatellite,
  faScroll,
  faSeedling,
  faShield,
  faShip,
  faShirt,
  faShop,
  faSkull,
  faSnowflake,
  faSquare,
  faStar,
  faStepBackward,
  faStepForward,
  faSun,
  faTimesCircle,
  faTrash,
  faTree,
  faTruck,
  faUpDownLeftRight,
  faUpRightAndDownLeftFromCenter,
  faUser,
  faUsers,
  faUserSecret,
  faUserShield,
  faWater,
  faWheatAwn,
  faWind,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const colors = {
  default: "#f1f5f9", // slate-100
  gold: "#facc15", // yellow-400
  science: "#60a5fa", // blue-400
  culture: "#e879f9", // fuchsia-400
  faith: "#8b5cf6", // violet-500
  influence: "#94a3b8", // slate-400
  happiness: "#4ade80", // green-400
  darkGreen: "#174308", // green-950
  danger: "#ef4444", // red-500
  military: "#a8a29e", // stone-400
  trade: "#fb923c", // orange-400
  food: "#bef264", // lime-300
  health: "#f43f5e", // rose-500
};

export const icon = {
  building: { icon: faHouse, color: colors.default },
  city: { icon: faHouse, color: colors.default },
  close: { icon: faXmark, color: colors.danger },
  cog: { icon: faCog, color: colors.default },
  concept: { icon: faBook, color: colors.default },
  bookOpen: { icon: faBookOpen, color: colors.default },
  down: { icon: faCaretDown, color: colors.default },
  chevronDown: { icon: faChevronDown, color: colors.default },
  chevronUp: { icon: faChevronUp, color: colors.default },
  chevronLeft: { icon: faChevronLeft, color: colors.default },
  chevronRight: { icon: faChevronRight, color: colors.default },
  arrowUp: { icon: faArrowUp, color: colors.default },
  folderOpen: { icon: faFolderOpen, color: colors.default },
  fullscreenEnter: { icon: faExpand, color: colors.default },
  fullscreenExit: { icon: faCompress, color: colors.default },
  fullscreenAlt: { icon: faUpRightAndDownLeftFromCenter, color: colors.default },
  menu: { icon: faBars, color: colors.default },
  minus: { icon: faMinus, color: colors.default },
  plus: { icon: faPlus, color: colors.default },
  play: { icon: faPlay, color: colors.default },
  pause: { icon: faPause, color: colors.default },
  question: { icon: faQuestion, color: colors.default },
  edit: { icon: faPen, color: colors.default },
  search: { icon: faMagnifyingGlass, color: colors.default },
  locate: { icon: faLocationDot, color: colors.default },
  cityAlt: { icon: faCity, color: colors.default },
  undo: { icon: faRotateLeft, color: colors.default },
  redo: { icon: faRotateRight, color: colors.default },
  load: { icon: faFileImport, color: colors.default },
  settings: { icon: faCog, color: colors.default },
  handsPraying: { icon: faHandsPraying, color: colors.faith },
  masksTheater: { icon: faMasksTheater, color: colors.culture },
  users: { icon: faUsers, color: colors.default },
  stepBackward: { icon: faStepBackward, color: colors.default },
  stepForward: { icon: faStepForward, color: colors.default },
  timesCircle: { icon: faTimesCircle, color: colors.danger },
  route: { icon: faRoute, color: colors.default },
  scroll: { icon: faScroll, color: colors.default },
  shield: { icon: faShield, color: colors.default },
  star: { icon: faStar, color: colors.default },
  bullseye: { icon: faBullseye, color: colors.default },
  handFist: { icon: faHandFist, color: colors.default },
  landmark: { icon: faLandmark, color: colors.default },
  coins: { icon: faCoins, color: colors.gold },
  tech: { icon: faFlask, color: colors.default },
  unit: { icon: faUserShield, color: colors.default },
  up: { icon: faCaretUp, color: colors.default },
  user: { icon: faUser, color: colors.default },
  world: { icon: faGlobe, color: colors.default },
  earth: { icon: faEarthAmericas, color: colors.default },
  random: { icon: faRandom, color: colors.default },
  move: { icon: faLocationArrow, color: colors.default },
  map: { icon: faMap, color: colors.default },
  objectGroup: { icon: faObjectGroup, color: colors.default },
  upload: { icon: faFileImport, color: colors.default },
  save: { icon: faFloppyDisk, color: colors.default },
  download: { icon: faFileArrowDown, color: colors.default },
  trash: { icon: faTrash, color: colors.default },
  check: { icon: faCircleCheck, color: colors.default },
  alert: { icon: faCircleExclamation, color: colors.default },
};

const categoryKeys: Record<string, ObjectIcon> = {
  // Buildings
  "buildingCategory:culture": { icon: faMasksTheater, color: colors.culture },
  "buildingCategory:defense": { icon: faShield, color: colors.military },
  "buildingCategory:faith": { icon: faHandsPraying, color: colors.faith },
  "buildingCategory:gold": { icon: faCoins, color: colors.gold },
  "buildingCategory:growth": { icon: faSeedling, color: colors.food },
  "buildingCategory:happiness": { icon: faFaceSmile, color: colors.happiness },
  "buildingCategory:health": { icon: faHeart, color: colors.health },
  "buildingCategory:influence": { icon: faScroll, color: colors.influence },
  "buildingCategory:milLand": { icon: faPerson, color: colors.military },
  "buildingCategory:milWater": { icon: faShip, color: colors.military },
  "buildingCategory:order": { icon: faGavel, color: colors.danger },
  "buildingCategory:powerPlant": { icon: faBolt, color: colors.default },
  "buildingCategory:production": { icon: faHammer, color: colors.default },
  "buildingCategory:resourceProduction": {
    icon: faIndustry,
    color: colors.default,
  },
  "buildingCategory:science": { icon: faFlask, color: colors.science },
  "buildingCategory:trade": { icon: faRightLeft, color: colors.trade },
  "buildingCategory:unitProduction": { icon: faHammer, color: colors.military },
  "buildingCategory:water": { icon: faWater, color: colors.default },

  // Culture
  "cultureCategory:major": { icon: faMasksTheater, color: colors.culture },
  "cultureCategory:minor": { icon: faMasksTheater, color: colors.culture },

  // Dogma (Religion)
  "dogmaCategory:afterlife": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:authority": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:belief": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:deathRites": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:devotion": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:expression": { icon: faHandsPraying, color: colors.culture },
  "dogmaCategory:gods": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:identity": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:journey": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:monuments": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:outreach": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:practice": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:service": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:support": { icon: faHandsPraying, color: colors.faith },
  "dogmaCategory:texts": { icon: faHandsPraying, color: colors.faith },

  // Equipment categories (combat roles)
  "equipmentCategory:airCombat": { icon: faPlaneUp, color: colors.military },
  "equipmentCategory:antiAir": { icon: faPlaneSlash, color: colors.military },
  "equipmentCategory:antiCavalry": { icon: faHorse, color: colors.military },
  "equipmentCategory:antiTank": { icon: faCircleDot, color: colors.military },
  "equipmentCategory:artillery": { icon: faBomb, color: colors.military },
  "equipmentCategory:bomb": { icon: faBomb, color: colors.military },
  "equipmentCategory:carrier": { icon: faShip, color: colors.military },
  "equipmentCategory:diplomat": { icon: faUsers, color: colors.default },
  "equipmentCategory:firearm": { icon: faPersonRifle, color: colors.military },
  "equipmentCategory:groundAttack": { icon: faTruck, color: colors.military },
  "equipmentCategory:melee": { icon: faHandFist, color: colors.military },
  "equipmentCategory:missileBay": { icon: faCircleDot, color: colors.military },
  "equipmentCategory:missionary": { icon: faHandsPraying, color: colors.faith },
  "equipmentCategory:mortar": { icon: faBomb, color: colors.military },
  "equipmentCategory:navalMelee": { icon: faShip, color: colors.military },
  "equipmentCategory:ranged": { icon: faCircleDot, color: colors.military },
  "equipmentCategory:satellite": { icon: faSatellite, color: colors.military },
  "equipmentCategory:scout": { icon: faBinoculars, color: colors.military },
  "equipmentCategory:settler": { icon: faHouse, color: colors.default },
  "equipmentCategory:siege": { icon: faBomb, color: colors.military },
  "equipmentCategory:specOps": { icon: faUserSecret, color: colors.military },
  "equipmentCategory:spy": { icon: faUserSecret, color: colors.military },
  "equipmentCategory:tankGun": { icon: faCircleDot, color: colors.military },
  "equipmentCategory:torpedo": { icon: faWater, color: colors.military },
  "equipmentCategory:trader": { icon: faRightLeft, color: colors.trade },
  "equipmentCategory:worker": { icon: faHelmetSafety, color: colors.default },

  // Feature
  "featureCategory:forest": { icon: faTree, color: colors.default },

  // Gods
  "godCategory:godMother": { icon: faHands, color: colors.default },
  "godCategory:godOfFertility": { icon: faWheatAwn, color: colors.default },
  "godCategory:godOfFire": { icon: faFireFlameSimple, color: colors.default },
  "godCategory:godOfFishing": { icon: faWater, color: colors.default },
  "godCategory:godOfHunting": { icon: faPaw, color: colors.default },
  "godCategory:godOfTheHarvest": { icon: faWheatAwn, color: colors.default },
  "godCategory:godOfTheMoon": { icon: faMoon, color: colors.default },
  "godCategory:godOfTheSea": { icon: faWater, color: colors.default },
  "godCategory:kingOfGods": { icon: faCrown, color: colors.default },

  // Heritage
  "heritageCategory:heritage": { icon: faLandmark, color: colors.default },

  // Improvements
  "improvementCategory:airfield": { icon: faPlane, color: colors.default },
  "improvementCategory:boats": { icon: faShip, color: colors.default },
  "improvementCategory:bridge": { icon: faRoad, color: colors.default },
  "improvementCategory:camp": { icon: faHouse, color: colors.default },
  "improvementCategory:farm": { icon: faWheatAwn, color: colors.default },
  "improvementCategory:fort": { icon: faShield, color: colors.default },
  "improvementCategory:mine": { icon: faHelmetSafety, color: colors.default },
  "improvementCategory:outpost": { icon: faHouse, color: colors.default },
  "improvementCategory:pasture": { icon: faPaw, color: colors.default },
  "improvementCategory:plantation": { icon: faTree, color: colors.default },
  "improvementCategory:quarry": { icon: faMountain, color: colors.default },
  "improvementCategory:sawmill": { icon: faTree, color: colors.default },
  "improvementCategory:well": { icon: faFaucetDrip, color: colors.default },

  // Leaders
  "leaderCategory:major": { icon: faUsers, color: colors.default },
  "leaderCategory:minor": { icon: faUser, color: colors.default },

  // Myths
  "mythCategory:creation": { icon: faStar, color: colors.default },
  "mythCategory:death": { icon: faSkull, color: colors.default },
  "mythCategory:humans": { icon: faUsers, color: colors.default },
  "mythCategory:stars": { icon: faStar, color: colors.default },

  // National wonders
  "nationalWonderCategory:culture": {
    icon: faMasksTheater,
    color: colors.culture,
  },
  "nationalWonderCategory:defense": { icon: faShield, color: colors.military },
  "nationalWonderCategory:faith": { icon: faHandsPraying, color: colors.faith },
  "nationalWonderCategory:gold": { icon: faCoins, color: colors.gold },
  "nationalWonderCategory:growth": {
    icon: faSeedling,
    color: colors.happiness,
  },
  "nationalWonderCategory:happiness": {
    icon: faFaceSmile,
    color: colors.happiness,
  },
  "nationalWonderCategory:health": { icon: faHeart, color: colors.default },
  "nationalWonderCategory:influence": {
    icon: faScroll,
    color: colors.influence,
  },
  "nationalWonderCategory:milLand": { icon: faPerson, color: colors.military },
  "nationalWonderCategory:milWater": { icon: faShip, color: colors.military },
  "nationalWonderCategory:order": { icon: faGavel, color: colors.danger },
  "nationalWonderCategory:other": { icon: faQuestion, color: colors.default },
  "nationalWonderCategory:production": {
    icon: faHammer,
    color: colors.default,
  },
  "nationalWonderCategory:science": { icon: faFlask, color: colors.science },
  "nationalWonderCategory:trade": { icon: faRightLeft, color: colors.trade },
  "nationalWonderCategory:water": { icon: faWater, color: colors.default },

  // Natural wonders
  "naturalWonderCategory:canyon": {
    icon: faMountainSun,
    color: colors.default,
  },
  "naturalWonderCategory:coast": { icon: faWater, color: colors.default },
  "naturalWonderCategory:desert": { icon: faSun, color: colors.default },
  "naturalWonderCategory:floodPlains": { icon: faWater, color: colors.default },
  "naturalWonderCategory:forest": { icon: faTree, color: colors.default },
  "naturalWonderCategory:hills": { icon: faMountainSun, color: colors.default },
  "naturalWonderCategory:islands": { icon: faWater, color: colors.default },
  "naturalWonderCategory:lake": { icon: faWater, color: colors.default },
  "naturalWonderCategory:mountain": { icon: faMountain, color: colors.default },
  "naturalWonderCategory:spring": { icon: faFaucetDrip, color: colors.default },
  "naturalWonderCategory:volcano": {
    icon: faMountainSun,
    color: colors.default,
  },
  "naturalWonderCategory:waterfall": { icon: faWater, color: colors.default },

  // Platforms
  "platformCategory:aircraft": { icon: faPlane, color: colors.military },
  "platformCategory:helicopter": { icon: faHelicopter, color: colors.military },
  "platformCategory:human": { icon: faPerson, color: colors.military },
  "platformCategory:missile": { icon: faCircleDot, color: colors.military },
  "platformCategory:mounted": { icon: faHorse, color: colors.military },
  "platformCategory:poweredHull": { icon: faShip, color: colors.military },
  "platformCategory:sailHull": { icon: faShip, color: colors.military },
  "platformCategory:satellite": { icon: faSatellite, color: colors.military },
  "platformCategory:submersible": { icon: faWater, color: colors.military },
  "platformCategory:vehicle": { icon: faTruck, color: colors.military },

  // Policies
  "policyCategory:economy": { icon: faCoins, color: colors.gold },
  "policyCategory:faith": { icon: faHandsPraying, color: colors.faith },
  "policyCategory:leadership": { icon: faUsers, color: colors.default },
  "policyCategory:military": { icon: faShield, color: colors.military },
  "policyCategory:trade": { icon: faRightLeft, color: colors.trade },

  // Resources
  "resourceCategory:beanNut": { icon: faSeedling, color: colors.default },
  "resourceCategory:cattleGame": { icon: faPaw, color: colors.default },
  "resourceCategory:cloth": { icon: faShirt, color: colors.default },
  "resourceCategory:fish": { icon: faFish, color: colors.default },
  "resourceCategory:fruit": { icon: faAppleWhole, color: colors.default },
  "resourceCategory:grain": { icon: faWheatAwn, color: colors.default },
  "resourceCategory:manufactured": { icon: faIndustry, color: colors.default },
  "resourceCategory:marine": { icon: faWater, color: colors.default },
  "resourceCategory:mineral": { icon: faGem, color: colors.default },
  "resourceCategory:plant": { icon: faSeedling, color: colors.default },
  "resourceCategory:spice": { icon: faPepperHot, color: colors.default },
  "resourceCategory:strategic": { icon: faGem, color: colors.default },
  "resourceCategory:vegetable": { icon: faCarrot, color: colors.default },

  // Stockpiles
  "stockpileCategory:biological": { icon: faSeedling, color: colors.default },
  "stockpileCategory:nuclear": { icon: faRadiation, color: colors.default },

  // Traits
  "traitCategory:culture": { icon: faMasksTheater, color: colors.culture },
  "traitCategory:faith": { icon: faHandsPraying, color: colors.faith },
  "traitCategory:food": { icon: faWheatAwn, color: colors.default },
  "traitCategory:gold": { icon: faCoins, color: colors.gold },
  "traitCategory:happiness": { icon: faFaceSmile, color: colors.happiness },
  "traitCategory:health": { icon: faHeart, color: colors.default },
  "traitCategory:influence": { icon: faScroll, color: colors.influence },
  "traitCategory:order": { icon: faGavel, color: colors.danger },
  "traitCategory:others": { icon: faQuestion, color: colors.default },
  "traitCategory:production": { icon: faHammer, color: colors.default },
  "traitCategory:science": { icon: faFlask, color: colors.science },
  "traitCategory:strength": { icon: faDumbbell, color: colors.default },
  "traitCategory:trade": { icon: faRightLeft, color: colors.trade },

  // WorldState wonders
  "worldWonderCategory:culture": {
    icon: faMasksTheater,
    color: colors.culture,
  },
  "worldWonderCategory:defense": { icon: faShield, color: colors.military },
  "worldWonderCategory:faith": { icon: faHandsPraying, color: colors.faith },
  "worldWonderCategory:gold": { icon: faCoins, color: colors.gold },
  "worldWonderCategory:growth": { icon: faSeedling, color: colors.happiness },
  "worldWonderCategory:happiness": {
    icon: faFaceSmile,
    color: colors.happiness,
  },
  "worldWonderCategory:health": { icon: faHeart, color: colors.default },
  "worldWonderCategory:influence": { icon: faScroll, color: colors.influence },
  "worldWonderCategory:milLand": { icon: faPerson, color: colors.military },
  "worldWonderCategory:milWater": { icon: faShip, color: colors.military },
  "worldWonderCategory:order": { icon: faGavel, color: colors.danger },
  "worldWonderCategory:other": { icon: faQuestion, color: colors.default },
  "worldWonderCategory:production": { icon: faHammer, color: colors.default },
  "worldWonderCategory:science": { icon: faFlask, color: colors.science },
  "worldWonderCategory:trade": { icon: faRightLeft, color: colors.trade },
  "worldWonderCategory:water": { icon: faWater, color: colors.default },
};

// Note: placeholders retained as simple lists for now; categories mapping above is the focus of this file.
const conceptKeys: Record<string, ObjectIcon> = {
  "conceptType:building": { icon: faBuilding, color: colors.default },
  "conceptType:citizen": { icon: faUser, color: colors.default },
  "conceptType:city": { icon: faCity, color: colors.default },
  "conceptType:climate": { icon: faGlobe, color: colors.default },
  "conceptType:concept": { icon: faBook, color: colors.default },
  "conceptType:continent": { icon: faGlobe, color: colors.default },
  "conceptType:dogma": { icon: faBook, color: colors.default },
  "conceptType:domain": { icon: faGlobe, color: colors.default },
  "conceptType:elevation": { icon: faGlobe, color: colors.default },
  "conceptType:equipment": { icon: faHammer, color: colors.default },
  "conceptType:era": { icon: faHourglassHalf, color: colors.default },
  "conceptType:feature": { icon: faGlobe, color: colors.default },
  "conceptType:flatLand": { icon: faSquare, color: colors.default },
  "conceptType:freshWater": { icon: faWater, color: colors.default },
  "conceptType:goal": { icon: faStar, color: colors.default },
  "conceptType:god": { icon: faBook, color: colors.default },
  "conceptType:heritage": { icon: faBook, color: colors.default },
  "conceptType:improvement": { icon: faShop, color: colors.default },
  "conceptType:majorCulture": { icon: faBook, color: colors.default },
  "conceptType:majorLeader": { icon: faUser, color: colors.default },
  "conceptType:minorCulture": { icon: faBook, color: colors.default },
  "conceptType:minorLeader": { icon: faUser, color: colors.default },
  "conceptType:mountains": { icon: faMountain, color: colors.default },
  "conceptType:myth": { icon: faBook, color: colors.default },
  "conceptType:nationalWonder": { icon: faLandmark, color: colors.default },
  "conceptType:naturalWonder": { icon: faMountainSun, color: colors.default },
  "conceptType:navigableRiver": { icon: faWater, color: colors.default },
  "conceptType:ocean": { icon: faGlobe, color: colors.default },
  "conceptType:platform": { icon: faTruck, color: colors.default },
  "conceptType:player": { icon: faUser, color: colors.default },
  "conceptType:policy": { icon: faBook, color: colors.default },
  "conceptType:region": { icon: faGlobe, color: colors.default },
  "conceptType:religion": { icon: faPlaceOfWorship, color: colors.default },
  "conceptType:resource": { icon: faGem, color: colors.default },
  "conceptType:river": { icon: faWater, color: colors.default },
  "conceptType:route": { icon: faRoad, color: colors.default },
  "conceptType:special": { icon: faBook, color: colors.default },
  "conceptType:stockpile": { icon: faInbox, color: colors.default },
  "conceptType:technology": { icon: faFlask, color: colors.default },
  "conceptType:terrain": { icon: faGlobe, color: colors.default },
  "conceptType:tile": { icon: faSquare, color: colors.default },
  "conceptType:tradeRoute": { icon: faRightLeft, color: colors.default },
  "conceptType:trait": { icon: faStar, color: colors.default },
  "conceptType:turn": { icon: faArrowsRotate, color: colors.default },
  "conceptType:turnStart": { icon: faPlay, color: colors.default },
  "conceptType:unit": { icon: faUserShield, color: colors.default },
  "conceptType:unitDesign": { icon: faHammer, color: colors.default },
  "conceptType:urban": { icon: faBuilding, color: colors.default },
  "conceptType:world": { icon: faGlobe, color: colors.default },
  "conceptType:worldWonder": { icon: faLandmark, color: colors.default },
  "conceptType:yield": { icon: faCoins, color: colors.default },
};

const keys: Record<string, ObjectIcon> = {
  "elevationType:hill": { icon: faMound, color: colors.trade },
  "elevationType:mountain": { icon: faMountainSun, color: colors.military },
  "elevationType:snowMountain": { icon: faMountain, color: colors.default },

  // Features
  "featureType:pineForest": { icon: faTree, color: colors.darkGreen },
  "featureType:forest": { icon: faClover, color: colors.happiness },
  "featureType:jungle": { icon: faClover, color: colors.darkGreen },
  "featureType:shrubs": { icon: faSeedling, color: colors.trade },
  "featureType:oasis": { icon: faFaucet, color: colors.science },
  "featureType:floodPlain": { icon: faWater, color: colors.science },
  "featureType:swamp": { icon: faWater, color: colors.military },
  "featureType:ice": { icon: faSnowflake, color: colors.default },
  "featureType:kelp": { icon: faPlantWilt, color: colors.happiness },
  "featureType:lagoon": { icon: faWater, color: colors.trade },
  "featureType:atoll": { icon: faMound, color: colors.science },
  "featureType:tradeWind": { icon: faWind, color: colors.default },

  "yieldType:airSlot": { icon: faInbox, color: colors.military },
  "yieldType:attack": { icon: faArrowsToDot, color: colors.military },
  "yieldType:citizenSlot": { icon: faInbox, color: colors.default },
  "yieldType:culture": { icon: faMasksTheater, color: colors.culture },
  "yieldType:damage": { icon: faHeartCrack, color: colors.health },
  "yieldType:defense": { icon: faShield, color: colors.military },
  "yieldType:evasion": { icon: faUpDownLeftRight, color: colors.military },
  "yieldType:faith": { icon: faHandsPraying, color: colors.faith },
  "yieldType:food": { icon: faWheatAwn, color: colors.food },
  "yieldType:goalPoint": { icon: faStar, color: colors.default },
  "yieldType:gold": { icon: faCoins, color: colors.gold },
  "yieldType:happiness": { icon: faFaceSmile, color: colors.happiness },
  "yieldType:heal": { icon: faHeart, color: colors.health },
  "yieldType:health": { icon: faHeart, color: colors.health },
  "yieldType:heritagePoint": { icon: faStar, color: colors.default },
  "yieldType:heritagePointCost": { icon: faStar, color: colors.danger },
  "yieldType:hitRadius": { icon: faBullseye, color: colors.military },
  "yieldType:influence": { icon: faScroll, color: colors.influence },
  "yieldType:influenceCost": { icon: faScroll, color: colors.danger },
  "yieldType:intercept": {
    icon: faPlaneCircleExclamation,
    color: colors.military,
  },
  "yieldType:missileSlot": { icon: faInbox, color: colors.military },
  "yieldType:moveCost": { icon: faLocationArrow, color: colors.danger },
  "yieldType:moves": { icon: faLocationArrow, color: colors.military },
  "yieldType:order": { icon: faGavel, color: colors.danger },
  "yieldType:otherCulture": { icon: faMasksTheater, color: colors.culture },
  "yieldType:otherFaith": { icon: faHandsPraying, color: colors.faith },
  "yieldType:paradropRange": { icon: faParachuteBox, color: colors.military },
  "yieldType:production": { icon: faHammer, color: colors.default },
  "yieldType:productionCost": { icon: faHammer, color: colors.danger },
  "yieldType:range": { icon: faBullseye, color: colors.military },
  "yieldType:resourceYield": { icon: faGem, color: colors.default },
  "yieldType:science": { icon: faFlask, color: colors.science },
  "yieldType:scienceCost": { icon: faFlask, color: colors.danger },
  "yieldType:sightRadius": { icon: faEye, color: colors.military },
  "yieldType:span": { icon: faUpDownLeftRight, color: colors.default },
  "yieldType:strength": { icon: faDumbbell, color: colors.military },
  "yieldType:tradeRange": { icon: faRightLeft, color: colors.trade },
  "yieldType:tradeRoute": { icon: faRightLeft, color: colors.trade },
  "yieldType:tradeSlot": { icon: faInbox, color: colors.trade },
  "yieldType:tradeYield": { icon: faRightLeft, color: colors.trade },
  "yieldType:upkeep": { icon: faCoins, color: colors.gold },
};

export type IconKey = keyof typeof icon;

export function getIcon(iconKey: IconKey | ObjectIcon): ObjectIcon {
  if (typeof iconKey === "object") return iconKey;
  if (iconKey in icon) {
    return icon[iconKey as keyof typeof icon];
  }
  if (iconKey in categoryKeys) {
    return categoryKeys[iconKey];
  }
  if (iconKey in conceptKeys) {
    return conceptKeys[iconKey];
  }
  if (iconKey in keys) {
    return keys[iconKey];
  }

  // eslint-disable-next-line no-console
  console.warn(`Icon key "${iconKey}" not found in icons.ts`);
  return { icon: faQuestion, color: colors.default };
}

export function getObjectIcon(
  key: string,
  conceptKey: string | null | undefined = null,
  categoryKey: string | null | undefined = null,
): ObjectIcon {
  if (key && key in keys) {
    return keys[key];
  }
  if (key in categoryKeys) {
    return categoryKeys[key];
  }
  if (key in conceptKeys) {
    return conceptKeys[key];
  }
  if (categoryKey && categoryKey in categoryKeys) {
    return categoryKeys[categoryKey];
  }
  if (conceptKey && conceptKey in conceptKeys) {
    return conceptKeys[conceptKey];
  }
  return { icon: faQuestion, color: colors.default };
}

export default getIcon;

// Helper: expose the set of Font Awesome icon used by yieldType mappings
// Helper: expose the set of Font Awesome icon used by all mappings
export function getAllIcons(): IconDefinition[] {
  const set = new Set<IconDefinition>();
  const collect = (obj: Record<string, ObjectIcon>) => {
    for (const val of Object.values(obj)) {
      if (val && typeof val === "object" && "icon" in val) {
        set.add(val.icon as IconDefinition);
      }
    }
  };
  collect(icon);
  collect(categoryKeys);
  collect(conceptKeys);
  collect(keys);
  return Array.from(set.values());
}

export function getYieldTypeFaIcons(): IconDefinition[] {
  const set = new Set<IconDefinition>();
  for (const [key, val] of Object.entries(keys)) {
    if (key.startsWith("yieldType:")) {
      set.add(val.icon as IconDefinition);
    }
  }
  return Array.from(set.values());
}

export type ObjectIcon = {
  icon: IconDefinition;
  color: string;
};
