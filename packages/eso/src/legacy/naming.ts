/**
 * This is an old script from an import system that should have some fairly
 *  robust (albeit noisy) logic around converting between and item's name and
 *  EMT's labeling system it uses internally. We want to map those internal
 *  labels back into regular item names.
 *
 *  A bulk of the noise is due to inconsistencies and typos in the source
 *   material. In order to catch every name, we need an alarming number of
 *   special cases and handling.
 *
 * I've added some strong testing around this to verify all names map correctly.
 *  I figure this can just stay messy since it has 100% coverage...
 */
import {
  CRAFTING_MOTIFS,
  MONSTER_STYLE_NAMES,
  PREAPPROVED_ITEMS,
  SETS_TO_ADD_THE,
  SETS_TO_FLIP,
  STYLE_BOOKS,
  STYLE_NAMES,
} from './naming.constants'

const TRAITS = [
  'divines',
  'training',
  'nirnhoned',
  'ornate',
  'arcane',
  'healthy',
  'robust',
]

const DEFAULT_SET_ITEMS = new Set<string>([
  'battle axe',
  'greatsword',
  'maul',
  'ring',
  'signet',
  'necklace',
  'amulet',
  'sword',
  'dagger',
  'axe',
  'mace',
  'bow',
  'shield',
  'hat',
  'helm',
  'helmet',
  'gloves',
  'gauntlets',
  'bracers',
  'boots',
  'sabatons',
  'girdle',
  'belt',
  'sash',
  'pauldron',
  'pauldrons',
  'epaulets',
  'cuirass',
  'jack',
  'jerkin',
  'shirt',
  'robe',
  'staff',
  'inferno staff',
  'ice staff',
  'restoration staff',
  'lightning staff',
  'breeches',
  'guards',
  'arm cops',
  'greaves',
  'shoes',
])

const _getNormalizedName = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[,:".()/']/g, '')
    .replace(/\s+/gu, ' ')

/**
 * Converts an ESO Market Tracker internal label to a fully qualified item name.
 * @param {string} itemName
 * @returns {string}
 */
export function nameToInternal(itemName: string): string {
  let label = _getNormalizedName(itemName).replace('&', 'and')

  if (
    label.startsWithAny([
      'bound ',
      'crown crafting ',
      'achievement furnishings',
    ])
  ) {
    return 'a savage ring'
  }

  // 2) strip "style page" prefixes and variants
  // matches: "style page", common typos like "stlye page" via s[ti]yle, trailing colon, optional 0/1, and spaces
  label = label
    .replace(/(s[ti]yle page.*?:?[01]?\s*)/g, '')
    .replace(/\bstyle page:?\s*/g, '')

  // special case: "bucket" that originally had "style page" in itemName
  if (label === 'bucket' && /style page/i.test(itemName)) {
    label = 'bucket style page'
  }

  // 3) remove research scroll day markers like ", 30 day" or " 7 doy(s)" with common vowel swaps
  label = label.replace(/,? \d+ days?\b/g, '')

  // 4) crafting motif: keep the section name only
  // e.g. "... motif 15: daedric" -> "daedric"
  label = label.replace(
    /crafting motif \d+:?\s*([a-z\s]*)/g,
    (_m, g1: string) => g1.trim()
  )

  // 5) treasure map: keep up to "... treasure map"
  label = label.replace(/(.* treasure map).*/g, '$1').trim()
  label = label.replace(/(the song of pelinal volume).*/g, '$1').trim()

  // 7) "vivecs X of duality" -> "x of vivecs duality"
  label = label.replace(
    /vivecs (.*) of duality/g,
    (_m, g1: string) => `${g1} of vivecs duality`
  )

  // Common word replacements.
  label = label
    .replace(/\b(amulet|locket|collar)\b/g, 'necklace')
    .replace(/ (band|signet)$/, ' ring')

  // 9) set-name transform: "<equipment> of <set>" -> "<set> <equipment>"
  const ofSetPattern = new RegExp(
    `^(${[...DEFAULT_SET_ITEMS].join('|')}) of (${SETS_TO_FLIP.join('|')})$`
  )
  label = label.replace(ofSetPattern, '$2 $1')

  // 10) final cleanup and specific normalizations
  label = label
    .replace(/['’:,]/g, '')
    .replace(/blackreach:\s*greymoor/g, 'greymoor')
    .replace(/blackreach:\s*arkthzand/g, 'arkthzand')
    .replace(/blackreach\s+greymoor/g, 'greymoor')
    .replace(/blackreach\s+arkthzand/g, 'arkthzand')
    .replace(/\s{2,}/g, ' ')
    .replace(/dragoon jack ii$/, 'dragoon jack 2')
    .replace(/dragoon jack i$/, 'dragoon jack 1')
    .trim()

  return label
}

// These are items from the legacy market tracker which don't have a direct
//  mapping in this database. These are items that were placeholders, existed
//  solely for testing purposes, artifacts of the days when data was collected
//  via OCR, or perhaps were renamed on the game-front.
const NON_EXISTENT_ITEMS = [
  'tree banana',
  'tree sierra palm',
  'alinor bookshelf polished',
  'alinor display stand noble',
  'amino core full',
  'apocrypha bed spiked',
  'apocrypha tree spare',
  'argonian bookshelf woven',
  'artifact hunters ring',
  'attunable clothier station',
  'ayleid bookcase cluttered',
  'ayleid bookshelf cluttered',
  'baffle axe of the willows path',
  'balorghs mask',
  'balorghs shoulder',
  'base game treasure map',
  'base game treasure maps',
  'bear totem balance',
  'bear totem solitary',
  'blackreach treasure map',
  'blackwood ce treasure map',
  'bloodthorn stibbanss dapper chapeau',
  'blueprint alinor bed polished',
  'blueprint breton chamberstick tall',
  'blueprint elsweyr plate amber ceramic',
  'blueprint elsweyr plate limber ceramic',
  'blueprint redguard urn sealed',
  'bog raiders bracers',
  'bog raiders breeches',
  'bog raiders hat',
  'bog raiders shoes',
  'book stack levitating',
  'breaching poison',
  'brutality draining poison',
  'calcinium sword of weapon damage',
  'chokethorns mask',
  'chokethorns shoulder',
  'clockwork treasure map',
  'common soul gem empty',
  'common soul gem',
  'companions dog ger',
  'conspicuous poison',
  'cowardice poison',
  'crystal tower staff',
  'cygnus irregulars greatsword',
  'cyrodiils crest boots',
  'damage health poison',
  'damage magicka poison',
  'dark ether',
  'deadlands assassins girdle',
  'defender cuirass',
  'defilers cuirass',
  'design candles plate',
  'design candles ritual set',
  'design common candle casting',
  'design leyawiin meal lobster stew',
  'design murkmire candle post timber',
  'diagram deadlands brazier bladed tall pillar',
  'diagram dwarven dinner bowl hearty stew',
  'diagram dwarven mug plate',
  'diagram dwarven relief connected circle',
  'diagram indoril brazier noble',
  'diagram pipe cap bolted',
  'diagram redoran spittoon gilded',
  'dish empty',
  'dragonguard ring',
  'dreamers belts',
  'dreamers helmet',
  'dreamers more',
  'ebon maul',
  'elsweyr bookcase elegant wooden',
  'elsweyr bookshelf short elegant',
  'elsweyr bookshelf wooden',
  'elsweyr carpet blossoms an blue',
  'elsweyr curtain tied back blue',
  'elsweyr mirror carved wall',
  'elsweyr pillow gold ruby throw',
  'elsweyr treasure map',
  'essence of weapon crit',
  'fine silk gloves',
  'firesong circle style item',
  'flowers netch cabbage stalks',
  'formula telvanni sconce fungal standing',
  'frostbite arm cops',
  'frostbite boots',
  'frostbite cuirass',
  'frostbite gauntlets',
  'frostbite helm',
  'frostbite helmet',
  'frostbite pauldrons',
  'fuchsia hasta',
  'gilded wristguards',
  'gt ebony ingot',
  'hide grocers of health',
  'high isle ce treasure map',
  'hlaalu cabinet of drawers desk',
  'honorblade of chorrol',
  'icehearts pauldrons',
  'imperial bed four poster',
  'imperial divider curved',
  'imperial divider folding',
  'imperial nightstand scrollwork',
  'khajiit bookshelf arched',
  'khajiit red canopy',
  'kynmarchers cruelty amulet',
  'l',
  'langour of peryite shoes',
  'legion zero vigiles girdle',
  'lemon flower sake',
  'maw of the infernals mask',
  'maw of the infernals shoulder',
  'murkmire bookshelf full',
  'murkmire bookshelf grand',
  'murkmire bookshelf',
  'mushrooms climbing ambershine',
  'mushrooms tall puspocket',
  'necrom desk elegant',
  'necrom door patterned',
  'night mother axe',
  'night mother ice staff',
  'night mother mace',
  'night mother restoration staff',
  'night mother shield',
  'nightflames mask',
  'nightflames shoulder',
  'nord bookshelf alcove',
  'nord sconce torch',
  'offerings',
  'old canis root',
  'opal domihaus weapon',
  'orcish bookshelf peaked',
  'orsinium treasure map',
  'overland treasure map',
  'painting of arch silver',
  'painting of khajiit arch gold',
  'parcels wrapped',
  'pattern argenton mat tidy reed',
  'pattern argonian divider string',
  'pattern book stack levitating',
  'pattern elsweyr fountain four lions',
  'pattern high elf carpet mottled',
  'pattern indoril banner viper',
  'pattern murkmire lantern linked rings',
  'pattern necrom runner narrow patterned',
  'pattern redguard buffet oasis',
  'pebble stacked desert',
  'perditions wrath',
  'potion of weapon crit',
  'potion of weapon power',
  'praxis argonian lira clawfoot',
  'praxis ayleid bookcase cluttered',
  'praxis ayleid bookcase short cluttered',
  'praxis ayleid bookshelf cluttered',
  'praxis clockwork sequence plaques unfolded',
  'praxis druidic stone oven',
  'praxis eldtertide torus stone',
  'praxis elsweyr bookshelf ancient stone tall',
  'praxis firesong lava shelf short',
  'praxis high eif lamppost stone',
  'praxis markarth past stone wall',
  'praxis murkmire bookshelf grand',
  'rabbit gnocchi raga',
  'ravaging belt',
  'ravaging dogger',
  'ravaging rattle axe',
  'raw fish',
  'recipe bruised sweetmeats',
  'recipe dubious comoran throne',
  'recipe hlaalu pumpkin risotto',
  'recipe lost seed salad',
  'recipe meaty garlic corn chowder',
  'recipe molten wor torte',
  'recipe psijic mages mazte',
  'red beer stew',
  'redguard bar baroque',
  'redguard buffet oasis',
  'redguard divider gilded',
  'redoran bench banded',
  'replica jubilee cake slice 2019',
  'ritemasters memorial battle sword',
  'rohssans antique cutlass',
  'rough black stone brick',
  'runebound tome mask of battled powers adornment',
  'runebox sword to the head adornment',
  'sanded ash+b79331',
  'sapling desert',
  'sapling healthy forest',
  'seaport fountain floral wall',
  'seventh legion boots',
  'shadow dancer hat',
  'shrub blooming seabird',
  'shrub blowing thistle',
  'shrub glooming sunbird',
  'shrubs dormont sunbird cluster',
  'sip of ravage stamino',
  'sithis the dread father',
  'skeever kabob',
  'skeever kebab',
  'solitude bed long',
  'solitude bed noble',
  'solitude cabinet narrow open filled',
  'solitude sword',
  'solstheim elk and scuffle',
  'statue of hircines bitter mercy',
  'steadfasts mettle helm',
  'stones smooth massy',
  'stony sliver',
  'stormfist weapon',
  'strifeswarm legplates of the sheik',
  'strodes orcish coif of necropotence',
  'summer sundas soup',
  'tapestry of a foiled incarnate the warseeker',
  'telvanni light organic azure',
  'telvanni peninsula treasure',
  'telvanni sconce fungal standing',
  'telvanni shelves orgonic',
  'the woodsmans friend',
  'third house of hist sap shield',
  'topiary paired cypress',
  'topiary strong cypress',
  'treasure map',
  'tremorscales mask',
  'tremorscales shoulder',
  'trinimacs valor necklace',
  'unknown craglorn weapon',
  'unrecognized wooden weapon',
  'vampire fang',
  'vampiric table vampiric',
  'void essence',
  'voliar meadery seal',
  'witches torch wretched',
  'witchs totem bear',
  'writ voucher to gold',
]

const _checkForFakeItem = (result: string) =>
  NON_EXISTENT_ITEMS.includes(result.toLowerCase()) ||
  result.endsWith(' poison') ||
  result.endsWith(' style item') ||
  result.includes(' mather ') ||
  result.includes(' romped ') ||
  result.includes('blueprint diagram') ||
  result.includes('book rack l') ||
  result.includes('colavian') ||
  result.includes('furnishers document') ||
  result.includes('furnishing folio') ||
  result.includes('high ell') ||
  result.includes('nigh elf') ||
  result.includes('readorn') ||
  result.startsWith('category ') ||
  result.startsWith('dreugh king slayer') ||
  result.startsWith('the morag tong') ||
  result.startsWith('writ voucher') ||
  (result.startsWith('opal') &&
    !result.includes('ilambris ') &&
    (result.includes('s mask') ||
      result.includes('s shoulder') ||
      result.includes('s shield')))
    ? 'a savage ring'
    : result

export const _fixCommonTypos = (result: string) =>
  result
    // .replace('defender cuirass', 'cuirass of the defender')
    // .replace("nightflames", "nightflame")
    .replace(' dugan', ' dagon')
    .replace(' mammoth kabobs', ' mammoth kebabs')
    .replace(' radish kabobs', ' radish kebabs')
    .replace(' stole creek ', ' stale creek ')
    .replace('acres tracking', 'aeras tracking')
    .replace('ancient nord prayer', 'ancient nedic prayer')
    .replace('anima core', 'animo core')
    .replace('argonian banner frilled', 'argonian banners frilled')
    .replace('arm joint calipers', 'firm joint calipers')
    .replace('azures ', 'azuras ')
    .replace('barbate', 'barbute')
    .replace('broom style page', 'style page broom')
    .replace('claw gauntlets', 'gauntlets of the claw')
    .replace('colonnade wall', 'colonnade hall')
    .replace('commanders ring of salvation', 'commanders signet of salvation')
    .replace('corn bread', 'cornbread')
    .replace('coup de grce', 'coup de grace')
    .replace('crocked', 'cracked')
    .replace('dark ell', 'dark elf')
    .replace('design candles group', 'design candle group')
    .replace(/dragoon jack i$/, 'dragoon jack 1')
    .replace(/dragoon jack ii$/, 'dragoon jack 2')
    .replace('eider radish', 'eidar radish')
    .replace('fang cuirass', 'cuirass of the fang')
    .replace('fire pit brick', 'firepit brick')
    .replace('flour large', 'floor large')
    .replace('fulmar ', 'falmer ')
    .replace('gasket', 'basket')
    .replace('giadils', 'gjadils')
    .replace('gors axe', 'gars axe')
    .replace('grafting table', 'drafting table')
    .replace('grandmoms', 'grandmams')
    .replace('green pact signet', 'green pact ring')
    .replace('grub kabobs', 'grub kebabs')
    .replace('handings rage', 'hundings rage')
    .replace('high isle amulet', 'amulet of high isle')
    .replace('hoarker', 'horker')
    .replace('izeds treasure', 'izads treasure')
    .replace('kebabs', 'kabobs')
    .replace('kwama cattle', 'kwama cuttle')
    .replace('lunar reverance', 'lunar reverence')
    .replace('marians metal', 'morians metal')
    .replace('necklace of eyevea', 'amulet of eyevea')
    .replace('nesss', 'nasss')
    .replace('new moan', 'new moon')
    .replace('oath card', 'oath cord')
    .replace('on the cab', 'on the cob')
    .replace('orcish lantern hooked', 'orcish lantern hooded')
    .replace('pact necklace', 'pact amulet')
    .replace('pact ring', 'pact signet')
    .replace('part handing', 'port hunding')
    .replace('perpetual gloom', 'perpetual bloom')
    .replace('pirate skeletons', 'pirate skeleton')
    .replace('reverence', 'reverance')
    .replace('reverances mandate', 'reverences mandate')
    .replace('riekling totem skull', 'reikling totem skull')
    .replace('ring ring', 'signet ring')
    .replace('seed epaulets', 'seed epaulet')
    .replace('sir socks ', 'sir sockss ')
    .replace('solitude sword', 'sword of solitude')
    .replace('solitude weil', 'solitude well')
    .replace('sotho sil', 'sotha sil')
    .replace('spectral necklace', 'spectral amulet')
    .replace('traders ring', 'traders signet')
    .replace('tug amber', 'jug amber')
    .replace('vicecanons helmet', 'the vicecanons helmet')
    .replace('waist ring', 'waist band')
    .replace('warrior poet pauldrons', 'warrior poets pauldron')
    .replace('zen necklace', 'amulet of zen')

const KNOWN_HYPHENABLES = [
  '"Eel Strangler"',
  '"Heen Hoon"',
  '"Orc Cordian"',
  '(A M)',
  '(N Z)',
  '36 Sermon',
  'Ability Altering',
  'Abyss Drenched',
  'Adabal A',
  'Algae Laden',
  'All Beneficent',
  'All Flags',
  'All Weather',
  'Amber Encased',
  'Amethyst Studded',
  'Animate The-Dead',
  'Ankle Wraps',
  'Anti Tumble',
  'Anti Venom',
  'Aojee Sakka',
  'Apple Bobbing',
  'Apple Eidar',
  'Arch Mage',
  'Arm Cleaver',
  'Arm Flute',
  'Arm Sling',
  'Arrow Damaged',
  'Ash Begone',
  'Ash Caked',
  'Ash Hands',
  'Ash Hopper',
  'Ash Slake',
  'Asp Tongue',
  'At Tura',
  'Auri El',
  'Auta Kerchief',
  'Auto Stamper',
  'Aviel Fold',
  'Axe Haft',
  'Ball Peen',
  'Banana Bunny',
  'Banana Radish',
  'Banner Bearer',
  'Banner Torn',
  'Bar Sakka',
  'Bark Skinned',
  'Bark skinned',
  'Bas Relief,',
  'Basalt Blood',
  'Basalt Blooded',
  'Bat Bone',
  'Battle Crab',
  'Battle Scarred',
  'Bear Claw',
  'Bear Hide',
  'Beet Glazed',
  'Beetle Be-Gone',
  'beetle cheese',
  'Beetle Leg',
  'Beetle Scale',
  'Beetle Shot',
  'Belly Scales',
  'Bent Tail',
  'Big Eared',
  'Bile Soaked',
  'Bird Of-Paradise',
  'Black Glove',
  'Blade Shard',
  'Blaze Veined',
  'Blood Curse',
  'Blood Encrusted',
  'Blood On-The-Snow',
  'Blood Orange',
  'Blood Red',
  'Blood Soaked',
  'Blood Stained',
  'Blue Ringed',
  'Boar Bladder',
  'Bog Iron',
  'Bond Ring',
  'Bone Handled',
  'Bone Worker',
  'Bop A-Barbarian',
  'Bramble Band',
  'Brief Axiom',
  'Bright Throat',
  'Broken Toothed',
  'Bronze Stitched',
  'Brutality Draining',
  'Bubble and-Squeak',
  'Bug Parade',
  'Calf Skin',
  'Candle Filled',
  'Cane Oil',
  'Carapace Shaped',
  'Cardinal Feather',
  'Cast Iron',
  'Cast Off',
  'Cat Man',
  'Cathay Raht',
  'Cauldron Stirring',
  'Centipede Leg',
  'Chain Breaker',
  'Cheese Baked',
  'Cheese Toasting',
  'Chevre Radish',
  'Chicken and-Banana',
  'Chicken Mudcrab',
  'Chid Moska',
  'Claw Dance',
  'Claw File',
  'Claw Polish',
  'Claw Torn',
  'Clear Eye',
  'Cliff Strider',
  'Cloth Of-Gold',
  'Cloth of-Gold',
  'Cobweb Laced',
  'Cocoa Coated',
  'Coffin Shaped',
  'Coin Concealing',
  'Cold Bite',
  'Cold Blooded',
  'Cold Flame',
  'Cold Iron',
  'Cold Moon',
  'Color Changing',
  'Coral Grip',
  'Coral Smasher',
  'Corkscrew Handle',
  'Counter Censer',
  'Counter Rotating',
  'Crab Slaughter-Crane',
  'Crimson Orange',
  'Croc In-The-Box',
  'Croc Tooth',
  'Cross Cultural',
  'Crow Touched',
  'Crystal Column',
  'Curse Eating',
  'Daedra Skull',
  'Dagon Breaker',
  'Dawn Prism',
  'Dead Water',
  'Death Dancer',
  'Defiance Stone',
  'Depth Bottle',
  'Diamond Studded',
  'Diamond Tipped',
  'Diamond Tooth',
  'Die Cast',
  'Divine Touched',
  'Divining Lens',
  'Double Backed',
  'Double Sided',
  'Dovah Fly',
  'Drag Net',
  'Dragon Headed',
  'Dragon Scale',
  'Draws The-Sap',
  'Dreugh Claw',
  'Dreugh Hide',
  'Drinks Not',
  'Dual Arched',
  'Dual Sided',
  'Dungeon Delving',
  'Durzog Hide',
  'Dwarf Brass',
  'Dwarven Rune',
  'Dwemer Metal',
  'Eagle Bone',
  'Eagle Eyed',
  'Eagle Screech',
  'Eagle Shaped',
  'Ear Hair',
  'Earth Shaker',
  'Earth Turner',
  'Ebony Inlaid',
  'Echalette Skull',
  'eel goby',
  'Egg Handling',
  'Egg Sculpture',
  'Egg Shards',
  'Eight Tine',
  'Elf Doom',
  'Elf Poker',
  'Emerald Infused',
  'Ever Blooming',
  'Ever Breath',
  'Ever Dipping',
  'Ever Filling',
  'Ever Full',
  'Ever Shrouded',
  'Ever Turning',
  'Every Morndas',
  'Expedition Staff',
  'Eye Opener',
  'Eye Spoons',
  'Face Eating',
  'Factotum Finger',
  'Fallen Wood',
  'False Face',
  'Fang Furl',
  'Fast Running',
  'Fate Eater',
  'Feast Day',
  'Feather Duster',
  'Felt lined',
  'Fend Em-Off',
  'Fiend Smasher',
  'Fine Mesh',
  'Fine Wrought',
  'Finely Crafted',
  'Finger Bone',
  'Finger Pen',
  'Finger Trap',
  'Finger Weights',
  'Fire Shaped',
  'Firm Joint',
  'Fish Bone',
  'Fish Eye',
  'Fish Skin',
  'Fishing Mitt',
  'Five Claw',
  'Five Coast',
  'Five Filtered',
  'Five Fireball',
  'Flame Kissed',
  'Flame Skull',
  'Flame Twist',
  'Flat Bottomed',
  'Flesh Mask',
  'Flesh Sculpting',
  'Foe Smasher',
  'Folio Binding',
  'Foont Pipe',
  'Forge Blind',
  'Forge Lord',
  'Forge Sized',
  'Foul Smelling',
  'Four Column',
  'Four Eye',
  'Four Faced',
  'Four Flame',
  'Four Jar',
  'Four Poster',
  'Four Way',
  'Fox Bone',
  'Freeze Dried',
  'Fresh Water',
  'Frog Caller,',
  'frog caller',
  'Frog Kebab',
  'Frog Metal',
  'Frost Cursed',
  'Frost Rib',
  'Full Leather',
  'full leather',
  'Full Length',
  'Fur Removing',
  'Game Piece',
  'Gargoyle Skin',
  'Garlic and-Pepper',
  'Gear Driven',
  'Gem Encrusted',
  'Gem Studded',
  'Giant Friend',
  'Gil Var-Delle',
  'Gizzard Canteen',
  'Glazed Clay',
  'Glimmer Stein',
  'Gloom Graced',
  'Glow Spotted',
  'Glow Wine',
  'Gnaw Root',
  'Goat Hair',
  'Goblin Cloth',
  'Goblin Sized',
  'Goblin Style',
  'Goblin Tooth',
  'Goblin Wood',
  'Gods Blind-Me',
  'Gold Blink',
  'Gold Emerald',
  'Gold Flecked',
  'Gold Framed',
  'Gold Leaf',
  'Gold Plated',
  'Gold Ruby',
  'Gold Spun',
  'Gold Tinged',
  'Gold Trimmed',
  'Graht Oak',
  'Grape Glazed',
  'Grave Stake',
  'Gro Yazgu',
  'Grub Cage',
  'Grudge Pen',
  'Gryphon Feather',
  'Guar Mount',
  'Guar Skin',
  'Gull Feather',
  'Gut Rock',
  'Guzzard Feather',
  'Haft Shard',
  'Hag Husband',
  'Hair Cage',
  'Hair Choked',
  'Hair Knot',
  'Hair Rollers',
  'Half Digested',
  'Half Hearted',
  'Half Moon',
  'Half Rotten',
  'Half Rug,',
  'half rug',
  'Half Timber',
  'Hand Carved',
  'Hand Cloths',
  'Hand Crafted',
  'Hand Drawn',
  'Hand Drill,',
  'hand drill',
  'Hand Knitted',
  'Hand Napkin',
  'hand sculpture',
  'Hand Scultpure',
  'Hand Spoon',
  'Hand Stitched',
  'Hand Woven',
  'Harpy Wing',
  'Head Needle',
  'Head Spine',
  'Hearth Wife',
  'heather tea',
  'Helm Freshener',
  'Hemo Loam',
  'Herb Scissors',
  'Hide Out',
  'High Backed',
  'Hircine Blessed',
  'Hircine Fang',
  'Hist Deek',
  'Hist Dooka',
  'Hist Soaked',
  'Hist Tsoko',
  'Hoarvor Sac',
  'Hoarvor Skin',
  'Hollow Heart',
  'Horker Skin',
  'Horse Folk',
  'Horse Hide',
  'Hundred Year',
  'Ice Effigy',
  'Ice Fire',
  'Ill Gotten',
  'Imp Repelling',
  'In Law',
  'Ink Grass',
  'Ink Squid',
  'Ink Stained',
  'Ivory Handled',
  'Ivy Adorned',
  'Ivy Berry',
  'Ivy Clad',
  'Jagga Drenched',
  'Jagga Junga',
  'Jewel Encrusted',
  'King Chief',
  'Knotted Rope',
  'Knuckle Stamp',
  'Kwama Cutter',
  'Kwama Grease',
  'Kwama Hide',
  'Lamia Scale',
  'Lamia Slayer',
  'Last Ditch',
  'Late Summer',
  'Lava Charred',
  'Lava Etched',
  'Lean To,',
  'Lean To',
  'Leather Bound',
  'Lich Crusher',
  'Lich Heart',
  'Limb Render',
  'Lion Tooth',
  'Litter Mates',
  'Live Catch',
  'Lizard Eye',
  'Lizard Leather',
  'Long Handled',
  'Long Sleeved',
  'Loon Down',
  'Loose Fit',
  'Love Blessed',
  'Low Backed',
  'Mace Ladle',
  'Magma Suit,',
  'Magna Geode,',
  'Magna Geode',
  'Mallari Mora',
  'Mammoth Ball',
  'Mammoth Hide',
  'Man Bull',
  'Mane Herald',
  'Many Hued',
  'Meady Matey',
  'Meat Pick',
  'Mega Structures',
  'Melon Baked',
  'Melon Chevre',
  'Melon Radish',
  'Merid Nunda',
  'Micro Etched',
  'Mid Flight',
  'Millet Carrot',
  'Millet Stuffed',
  'Mineral Based',
  'Minnow Tin',
  'Monkey Hide',
  'Moon Blessed',
  'Moon Kissed',
  'Moon Sugar,',
  'Moon Sugar',
  'Moon Sugarcane',
  'Moons Blessed',
  'Morkul Forged',
  'Mother Of-Pearl',
  'Moulted Scale',
  'Mouth Harp',
  'Mouth Plover',
  'Mud Choked',
  'Mud House',
  'Mud Nectar',
  'Mudcrab Chitin',
  'Mudcrab Shaped',
  'Multi Target',
  'Mummy Wrap',
  'Musk Scented',
  'Naga Skin',
  'Naj Caldeesh',
  'Name Daughters',
  'Neat And-Tidy',
  'Neck Pillow',
  'Netch Hide',
  'Netch hide',
  'Netch Hook',
  'Netch Leather',
  'Netch Robes',
  'Never Ending',
  'Never Gives-Up',
  'Never Wet',
  'Night Grog',
  'Night Oil',
  'Night Spectacles',
  'Nine Holes',
  'Nine Shells',
  'Nirncrux Laden',
  'Nix Guar',
  'Nix Hound',
  'Nix Ox',
  'No Rhubarb',
  'Non Reactive',
  'Non Sitck',
  'Nord to-Dark',
  'Nose Ring',
  'Not So-Lucky',
  'Oath Band',
  'Oath Gem',
  'Oath Ring',
  'Off Balance',
  'Ohmes Raht',
  'Oil Be-Gone',
  'Oil Eater',
  'Oil Filled',
  'Oil Stained',
  'Oiled Leather',
  'Olive Wood',
  'Omnium Gatherum',
  'Ooze Blender',
  'Orc Father',
  'Orc Forged',
  'orichalc steel',
  'Otter Skin',
  'Out Of-Tune',
  'Over Sized',
  'Owl Feather',
  'Ox Hoof',
  'Ox Tail',
  'Oyster Shell',
  'Page Turner',
  'Paint Stained',
  'Pan Fried',
  'Pan Tamriel',
  'Parrot and-Pumpkin',
  'Parrot Feather',
  'Pearl Glass',
  'Pearl Handled',
  'Pearl Shimmer',
  'Petal Strewn',
  'Pig Milk',
  'Pigs In-A-Blanket',
  'Pigs in-a-Blanket',
  'Pincer Crab',
  'Pitch Bile',
  'Pitch Filled',
  'Plague Drenched',
  'Plant Wear"',
  'Plate Helm',
  'Pole Strung',
  'Pommel Wraps',
  'Pork and-Beets',
  'Potato Stuffed',
  'Prairie Fire',
  'Precious Color',
  'Proper Life:',
  'Prophecy Draining',
  'Protection Reversing',
  'Pull Toy',
  'Pummel Doll',
  'Pumpkin Stuffed',
  'Rabbit Hide',
  'Rain Bringer',
  'Rain Repellent',
  'Rat Fang',
  'Raven Feather',
  'Raven Perch',
  'Razor Edged',
  'Reach Mage',
  'Red Sails',
  'Relic Tender',
  'Reman Era',
  'Resolve Draining',
  'Ripper Skin',
  'Rithana Di-Renada',
  'Rock Climbing',
  'Room Divider,',
  'room divider',
  'Rope Handled',
  'Ruby Encrusted',
  'Ruby Maroon',
  'Ruby Studded',
  'Rune Carved',
  'Rye In-Your-Eye',
  'Sabre Skin',
  'Saddle Cured',
  'Sage Stitched',
  'Salmon Millet',
  'Sand Shaker',
  'Sap Speaker',
  'Sapphire Handled',
  'Sapphire Studded',
  'Savagery Draining',
  'Savory Sweet',
  'Saw Spoon',
  'Scalp on-a-Stick',
  'Scamp Head',
  'Scent Block',
  'Scorpion Tail',
  'Scrap Metal',
  'Scrib Powered',
  'Sea Tossed',
  'Seal Skin',
  'Second Best',
  'See All',
  'Self Chewing',
  'Self Turning',
  'Senche Jaw',
  'Senche Lion',
  'Senche Pelt',
  'Senche Raht',
  'Senche Skin',
  'Senche Stalked',
  'Senche Tiger',
  'Serpent Rider',
  'Serpent Veil',
  'Servo Splint',
  'Sextant Scope',
  'Shaja Nushmeeko',
  'Shalk Brother',
  'Shalk Resin',
  'Shatter Shard',
  'Sheepskin Covered',
  'Shell Tide',
  'Shell Topped',
  'Shellback Gammon',
  'Short Sleeved',
  'Shoulder Mounted',
  'Shriek of-Silk',
  'Shroom Wood',
  'Side Stitched',
  'Sil Var-Woad',
  'Silver Chased',
  'Silver Handled',
  'Silver Lidded',
  'Silver Plated',
  'Silver Quill',
  'Silver Spun',
  'Silver Tined',
  'Silver Tongued',
  'Silver Trimmed',
  'Silver Wrapped',
  'Single Tined',
  'Six Fold',
  'Six Silk',
  'Skaal Carved',
  'Skald King',
  'Skein Woven',
  'Skull Cleaver',
  'Sky Key',
  'Sky Talker',
  'Slave Coffles',
  'Sleeping Basket',
  'Sliced Coral',
  'Slide Flute',
  'Slime Covered',
  'Sload Carved',
  'Sload Skin',
  'Slow Running',
  'Slow Simmered',
  'Snail Hook',
  'Snake Etched',
  'Snake Sword',
  'Snakeskin Head',
  'Snout Powder',
  'Soil Repelling',
  'Soot Stained',
  'Sorcery Draining',
  'Sought After',
  'Soul Meld',
  'Soul Reave',
  'Soul Reaving',
  'Soul Siphon',
  'Soul Touched',
  'Soul Trapping',
  'Soup and-Saltrice',
  'Speed Draining',
  'Spell Lattice',
  'Spider Shaped',
  'Spider Slayer',
  'Spirit Walker',
  'Split Bolt',
  'Sponge Blanket',
  'Spring Loaded',
  'Stain Scrubber',
  'Stand Me-Up',
  'Star Gazer',
  'Star Shell',
  'Star Studded',
  'Stealth Draining',
  'Steps Practice',
  'Sticky Fingered',
  'Stilt Boots',
  'Sting Vine',
  'Stir Fried',
  'Stone Nest',
  'Storm Cursed',
  'Stormhold Style',
  'Straight Razor',
  'Stuffed Sheep',
  'Su Zahleel',
  'Suction Sealed',
  'Sugar Bear',
  'Sugar Hemp',
  'Sul Xan',
  'Sun Bronzed',
  'Sun Dried',
  'Sun Gilded',
  'Sun Sighter',
  'Suthay Raht',
  'Swan Feather',
  'Swan Satin',
  'Sweet Box',
  'Sweet Stuffed',
  'Swine Herder',
  'Sword Oil',
  'Sword Pie',
  'Sword Singer',
  'Swords And-Boards',
  'Tail Apron',
  'Tail Bows',
  'Tattoo Skin',
  'Tear Stained',
  'Teeba Enoo',
  'Teeba Hatsei',
  'Ten Foot',
  'Terrapin Shell',
  'Three Hole',
  'Three Stab',
  'Three Tea',
  'Three Temples',
  'Three Tier',
  'Thrice Baked',
  'Throat Scales',
  'Throne Tattoo',
  'Thtithil Gah',
  'Thunderbug Shell',
  'Tide Born',
  'Tied Back',
  'Time Lost',
  'Time Worn',
  'Toad Atlatl',
  'Tomato Beet',
  'Tooth Purse',
  'Torchbug Dance',
  'Towers Eight',
  'Tree Sap',
  'Tree Themed',
  'Tri Restoration',
  'Tri Socket',
  'Troll Hair',
  'Troll Mane',
  'Troll Skin',
  'Troll Tooth',
  'True Sworn',
  'True Told',
  'Truth Glimpse',
  'Tusk Carved',
  'Twenty Four-Raven',
  'Twenty Year',
  'Twice Baked',
  'Twice Born',
  'Twice Fanged',
  'Twice Spiked',
  'Twice Split',
  'Twig Of-Falinesti',
  'Twin Tail',
  'Two Faced',
  'Two Fanged',
  'Two Person',
  'Two Share',
  'Two Tined',
  'Two Way',
  'Two Zephyr',
  'Uka Lute',
  'Under Doublet',
  'Under Girdle',
  'Vassir Didanat',
  'Vine Covered',
  'Vine Slicer',
  'Vitality Draining',
  'Vos Toh',
  'Vossa Satl,',
  'Vossa Satl',
  'Wamasu Hide',
  'War Gods',
  'War Sworn',
  'Warble Fife',
  'Ward Draining',
  'Warp Weighted',
  'Warrior Poet',
  'Wart Away',
  'Wasp Head',
  'Wasp Wing',
  'Wasso Leaf',
  'Water Themed',
  'Well Made',
  'Well Practiced',
  'Well Read',
  'Well Worn',
  'Whale Bone',
  'Whisker Handled',
  'White Ash',
  'White Eye',
  'White Gold',
  'Wide Eye',
  'Wide Trunked',
  'Wild Boar-and-Beets',
  'Wind Up',
  'Wine Stained',
  'Winter Shoeing',
  'Witch Eye',
  'Witch Hunter',
  'Witch Knight',
  'Wolf Blessing',
  'wolf eel',
  'Wolf Father',
  'Wolf Hair',
  'Wolf Head',
  'Wolf Jaw',
  'Wolf Lizard',
  'Wolf Sister',
  'Wood Planked',
  'Wool Filled',
  'Work Hammer',
  'Worm Touched',
  'Worship Plaque',
  'Wraith Lantern',
  'Wraith of-Crows',
  'Xeech Bok',
  'Xinchei Konu',
  'You Know-What',
  "Antler Fur's",
  "Apartment Owner's",
  "Appraising Spine's",
  "Artifact Hunter's",
  "Auri El's",
  "Banner Bearer's",
  "Banner Torn's",
  "Bar Sakka's",
  "Bard's Throat",
  "Bashshi ra's",
  "Bat Catcher's",
  "Blood Friend's",
  "Bright Throat's",
  "Corpse Caller's",
  "Crow Eye's",
  "Curse Breaker's",
  "Dead Water's",
  "Death In-Winter's",
  "Deesh Jee's",
  "Dragon's Tongue",
  "Dro M'Athra's",
  "Dro M'Athra",
  "Egg Tender's",
  "Elf Stabber's",
  "Er Jaseen's",
  "Ever Wakeful's",
  "Ex Legionaire's",
  "Ex Legionairy's",
  "Fire Breather's",
  "Fire Quencher's",
  "Forge Mother's",
  "Forge Wife's",
  "Frog Tender's",
  "Gee Lo's",
  "Goblin Slayer's",
  "Grove Keeper's",
  "Grove Watcher's",
  "Guar Guardian's",
  "Hare Tracker's",
  "Hearth Wife's",
  "Heem Jas'",
  "Heem Jas's",
  "Hunt Father's",
  "Hunt Wife's",
  "Ice Heart's",
  "Knight Errant's",
  "Magus General's",
  "Manor Owner's",
  "Map Hunter's",
  "Meenai Shai's",
  "Mezha Dro's",
  "Murk Watcher's",
  "Nam Li's",
  "Netch Hunter's",
  "Nimble Knuckles'",
  "Nix Hound's",
  "Oath Speaker's",
  "Pact Keeper's",
  "Razum Dar's",
  "Reach Warden's",
  "Reeh La's",
  "Reezal Jul's",
  "Rid Thar-ri'Datta",
  "Rid Thar's",
  "Scamp Binder's",
  "Scent of-Graves'",
  "Sea Monster's",
  "Sea Raider's",
  "Senche Raht's",
  "Sharp Arrow's",
  "Silver Claw's",
  "Skald King's",
  "Smash Skull's",
  "Snake Charmer's",
  "Snow Squatter's",
  "Spider Wrangler's",
  "Standard Bearer's",
  "Star Gazer's",
  "Star Gazers'",
  "Steady Hand's",
  "Stone Talker's",
  "Storm Slave's",
  "Storm Summoner's",
  "Sugar Baron's",
  "Sul Xan's",
  "Sword Disciple's",
  "Sword Singer's",
  "Sword Swallower's",
  "Tah Tehat's",
  "Thane Guard's",
  "Thief God's",
  "Thief Lord's",
  "Vault Cracker's",
  "War Mage's",
  "Warrior Poet's",
  "Witch Hunter's",
  "Witch Knight's",
  "Wolf's Head",
]

// We have to reinsert hyphens because EMT replaces them with spaces, but we
//  are now removing them entirely.
export const _replaceHyphens = (result: string) => {
  KNOWN_HYPHENABLES.map((i) => i.toLowerCase().replace("'", ''))
    .filter((i) => result.includes(i))
    .forEach((i) => {
      result = result.replace(i, i.replace(' ', '-'))
    })

  return result
    .replace('rye in your eye', 'rye-in-your-eye')
    .replace('stand me up', 'stand-me-up')
    .replace('pork and beets', 'pork-and-beets')
    .replace('twenty four raven', 'twenty-four-raven')
    .replace('wild boar and beets', 'wild-boar-and-beets')
    .replace('blood on the snow', 'blood-on-the-snow')
    .replace('bubble and squeak', 'bubble-and-squeak')
    .replace('parrot and pumpkin', 'parrot-and-pumpkin')
}

// Some of these are easier to hardcode so we can derive consistent rules for
//  similarly named items.
const KNOWN_MATCHES: Record<string, string> = {
  'sancre tor ring': 'signet of sancre tor',
  broom: 'style page broom',
  'design grub kabobs': 'design grub kebabs',
  'daedric style': 'crafting motif 14 daedric style',
  'dead keeper shoulder': 'dead keeper shoulders',
  'solitude necklace': 'solitude locket',
  'cyrodilic cornbread': 'cyrodilic corn bread',
  'mazzatun lightning staff': 'lightning staff of mazzatun',
  'abnur tharns epaulets': 'style page abnur tharns epaulets',
  'akaviri war gauntlets': 'gauntlets of the akaviri war',
  'alchemist necklace': 'amulet of the alchemist',
  'oblivion sword': 'sword of oblivion',
  'stalker ring': 'signet of the stalker',
  'glenmoril wyrd treasure map': 'glenmoril wyrd treasure map malabal tor',
  'green pact necklace': 'necklace of the green pact',
  'centurions ring': 'centurions signet',
  'angatas ring': 'angatas signet',
  'argonian tablet vos-toh of dance': 'argonian tablet  vos-toh of dance',
  'baan dars blessing necklace': 'baan dars blessing amulet',
  'agarabugs broad sword': 'agarabugs broadsword',
  'vaulting belt': 'belt of vaulting',
  'bloodthorn necklace': 'bloodthorn amulet',
  'apple bobbing cold iron cauldron': 'apple-bobbing cold iron cauldron',
  'crimson oath axe': 'axe of the crimson oath',
  'scalecaller cops': 'crafting motif 59 scalecaller cops',
  'fallowstone hall ring stamp': 'fallowstone hall signet stamp',
  'khenarthis roost ce treasure map': 'khenarthis roost ce treasure map i',
  'lost necklace': 'lost amulet',
  'reawakened hierophant shield': 'style page reawakened hierophant shield',
  'reawakened hierophant sword': 'style page reawakened hierophant sword',
  'reawakened hierophant hat': 'style page reawakened hierophant hat',
  'reawakened hierophant mace': 'style page reawakened hierophant mace',
  'reawakened hierophant maul': 'style page reawakened hierophant maul',
  '"barbas" dog necklace': '"barbas" dog collar',
  bucket: 'style page bucket',
  'bucket style page': 'style page bucket',
  'ivory brigade gloves': 'crafting motif 101 ivory brigade gloves',
  'pirate skeleton shoulder': 'style page pirate skeleton shoulder',
  'runebox soul shriven skin': 'runebox soul-shriven skin',
  'reawakened hierophant greatsword':
    'style page reawakened hierophant greatsword',
  'reawakened hierophant gloves': 'style page reawakened hierophant gloves',
  'reawakened hierophant breeches': 'style page reawakened hierophant breeches',
  'reawakened hierophant shoes': 'style page reawakened hierophant shoes',
  'reawakened hierophant battle axe':
    'style page reawakened hierophant battle axe',
  'reawakened hierophant sash': 'style page reawakened hierophant sash',
  'wrathsun battle axe': 'style page wrathsun battle axe',
  'worm ring': 'signet of the worm',
  'earthgores mask': 'style page earthgore mask',
  'zmajas necklace chain': 'zmajas amulet chain',
  'reawakened hierophant jerkin': 'style page reawakened hierophant jerkin',
  'gloamsedge arm cop': 'style page gloamsedge arm cop',
  'reawakened hierophant dagger': 'style page reawakened hierophant dagger',
  'ivory brigade boots': 'crafting motif 101 ivory brigade boots',
  'ivory brigade legs': 'crafting motif 101 ivory brigade legs',
  'ivory brigade shoulders': 'crafting motif 101 ivory brigade shoulders',
  'reawakened hierophant epaulets': 'style page reawakened hierophant epaulets',
  'reawakened hierophant axe': 'style page reawakened hierophant axe',
  'style page lord wardens mask': 'style page lord warden mask',
  'the song of pelinal volume': 'the song of pelinal volume 1',
  'magnus staff': 'staff of magnus',
  'arkay drained staff': 'staff of arkay drained',
  'orcish seal battle axe': 'orcish seal battle-axe',
  'torugs pact necklace': 'necklace of torugs pact',
  'metal ring': 'metal band',
  'praxis high elf bookcase verdant': 'praxis high elf bookshelf verdant',
  'psijic ambrosia fragment': 'recipe psijic ambrosia fragment i',
  'almalexias mercy necklace': 'necklace of almalexias mercy',
  'reawakened hierophant staff': 'style page reawakened hierophant staff',
  'soulcleaver dagger': 'style page soulcleaver dagger',
  'sapling autumn cluster': 'saplings autumn cluster',
  'sapling budding red': 'saplings budding red',
  'sapling short highland': 'saplings short highland',
  'sapling strong highland': 'saplings strong highland',
  'sapling sturdy ash laurel': 'saplings sturdy ash laurel',
  'sapling withered thicket': 'saplings withered thicket',
  'seventh legions conjured oath ring': 'seventh legions conjured oath-band',
  'spawn of mephalas shoulder': 'style page spawn of mephala shoulder',
  'reawakened hierophant bow': 'style page reawakened hierophant bow',
  'big-eared ginger kittens necklace': 'big-eared ginger kittens collar',
  'tide born dagger': 'tide-born dagger',
  'torugs pact ring': 'ring of torugs pact',
  'witchmothers servants epaulets': 'style page witchmothers servants epaulets',
  'spotless goods ring stamp': 'spotless goods signet stamp',
  'agility axe': 'axe of agility',
  'air arm cops': 'arm cops of the air',
  'air axe': 'axe of the air',
  'air battle axe': 'battle axe of the air',
  ...Object.fromEntries(
    [...DEFAULT_SET_ITEMS].map((item) => [`air ${item}`, `${item} of the air`])
  ),
  ...Object.fromEntries(
    [...DEFAULT_SET_ITEMS].map((item) => [
      `alchemist ${item}`,
      `${item} of the alchemist`,
    ])
  ),
  ...Object.fromEntries(
    [...DEFAULT_SET_ITEMS].map((item) => [
      `almalexias mercy ${item}`,
      `${item} of almalexias mercy`,
    ])
  ),
}

// Common ESO equipment pieces (multi-word first to avoid partial matches)
const PIECES = [
  'amulet',
  'arm cops',
  'armor',
  'axe',
  'battle axe',
  'belt',
  'boots',
  'boots',
  'bow',
  'bracers',
  'breeches',
  'chest',
  'cuirass',
  'dagger',
  'destruction staff',
  'epaulets',
  'gauntlets',
  'girdle',
  'gloves',
  'greatsword',
  'greaves',
  'guards',
  'hat',
  'helm',
  'helmet',
  'ice staff',
  'inferno staff',
  'jack',
  'jerkin',
  'leggings',
  'legs',
  'lightning staff',
  'locket',
  'mace',
  'mask',
  'maul',
  'necklace',
  'pauldron',
  'pauldrons',
  'restoration staff',
  'ring',
  'robe',
  'sabatons',
  'sash',
  'shield',
  'shirt',
  'shoes',
  'shoulders',
  'staff',
  'sword',
]

const SETS_TO_AMULET = [
  'abyssal brace',
  'adamant lurker',
  'aetherial ascension',
  'aetheric lancer',
  'anchorstone',
  'apocryphal',
  'ayleid refuge',
  'basalt-blooded warrior',
  'bats',
  'beacon of oblivion',
  'black foundry steel',
  'blackfeather flight',
  'blind path induction',
  'bloodthorn',
  'blunted blades',
  'bone',
  'bulwark ruination',
  'camonna tong',
  'catalyst',
  'cinders of anthelmir',
  'conflagration',
  'coral riptide',
  'corpseburster',
  'coup de grâce',
  'coup de gr�ce',
  'coup de grace',
  'crimson',
  'critical riposte',
  'dark convergence',
  'darkstride hatespinner',
  'death-dancer',
  'deeproot zeal',
  'dolorous',
  'draoife',
  'draugrkin',
  'enervating',
  'eternal vigor',
  'explosive rebuke',
  'eye of the grasp',
  'farstrider',
  'frostbite',
  'full belly',
  'gardener of seasons',
  'golden',
  'grave inevitability',
  'harmony in chaos',
  'hatespinner',
  'heroic unity',
  'hew and sunder',
  'high isle',
  'highland sentinel',
  'iron flask',
  'kings',
  'kyne',
  'langour of peryite',
  'languor of peryite',
  'lost',
  'lucent echoes perfected',
  'lucent echoes',
  'lustrous soulwell',
  'macabre vintage',
  'monolith of storms',
  'moulted-scale',
  'netch oil',
  'nobility in decay',
  'noxious boulder',
  'null arca',
  'old growth',
  'pact',
  'peace and serenity',
  'pearlescent',
  'perfected coral riptide',
  'perfected dolorous',
  'perfected harmony in chaos',
  'perfected null arca',
  'perfected peace and serenity',
  'perfected pearlescent',
  'perfected recovery convergence',
  'perfected test of resolve',
  'perfected transformative hope',
  'phoenix moth',
  'plaguebreak',
  'pyrebrand',
  'rage of the ursauk',
  'rallying cry',
  'reawakened hierophant',
  'recovery convergence',
  'reflected fury',
  'rootsong',
  'seeker synthesis',
  'shared burden',
  'shared pain',
  'shattered fate',
  'shell splitter',
  'skystone',
  'snake in the stars',
  'spattering disjunction',
  'spellshredder',
  'stonehulk domination',
  'storm-cursed',
  'tarnished nightmare',
  'telvanni efficiency',
  'telvanni enforcer',
  'test of resolve',
  'the alchemist',
  'the birthsign',
  'the depths',
  'the gorethief',
  'the pestilent host',
  'radiant bastion',
  'the ritualist',
  'the silver rose',
  'the turning tide',
  'voidcaller',
  'weald',
  'threads of war',
  'three queens',
  'tide-born',
  'tools of the trapmaster',
  'transformative hope',
  'true-sworn fury',
  'umbral edge',
  'unflinching ultimate',
  'unleashed',
  'venomous',
  'vivecs duality',
  'vosh rakh',
  'wrathsun',
  'wretched vitality',
  'xanmeer genesis',
  'xanmeer spellweaver',
  "aegis caller's",
  "aerie's cry",
  "akatosh's law",
  "aldmion's",
  "ancient dragonguard's",
  "ansuul's perfected",
  "ansuul's",
  "arkasis's",
  "arkay's charity",
  "baan dar's blessing",
  "baan dar's blessing",
  "bahsei's mania",
  "bani's",
  "bog raider's",
  "bonehand's",
  "chimera's",
  "coldharbour's favorite",
  "crafty alfiq's",
  "dagon's",
  "daring corsair's",
  "darkhammer's",
  "darloc brae's",
  "dauntless combatant's",
  "deadlands assassin's",
  "deadlands demolisher's",
  "death's",
  "diamond's victory",
  "dragon's appetite",
  "dragonguard elite's",
  "drake's rush",
  "druid's",
  "duriatundur's frigid",
  "false god's",
  "fellowship's fortitude",
  "fledgling's",
  "foolkiller's",
  "forest wraith's",
  "glacial guardian's",
  "gourmand's",
  "grave guardian's",
  "grisly gourmet's",
  "heartland conqueror's",
  "hex siphoner's",
  "hexos' ward",
  "hist whisperer's",
  "hiti's",
  "hrothgar's",
  "jerensi's",
  "karth's",
  "kazpian's perfected",
  "kazpian's",
  "kinras's",
  "kraglen's",
  "kyne's wind",
  "lamp knight's",
  "lokkestiiz's",
  "lucilla's",
  "maligalig's",
  "mara's balm",
  "marauder's haste",
  "mezha-dro's sealing",
  "mora scribe's perfected",
  "mora scribe's",
  "nahviintaas's",
  "new moon acolyte's",
  "nix-hound's",
  "nocturnal's ploy",
  "oakfather's retribution",
  "oakfather's retribution",
  "odilon's spectral",
  "pangrit denmother's",
  "perfected false god's",
  "perfected lokkestiiz's",
  "perfected nahviintaas's",
  "perfected pillager's",
  "perfected yolnahkriin's",
  "phylactery's grasp",
  "pillager's",
  "prisoner duriatundar's frigid",
  "red eagle's fury",
  "risa's",
  "ritemaster's",
  "roaring opportunist's perfected",
  "roaring opportunist's",
  "runecarver's",
  "saxhleel champion's perfected",
  "saxhleel champion's",
  "scorion's",
  "senchal defender's",
  "senche-raht's",
  "serpent's disdain",
  "siegemaster's",
  "sluthrug's hunger",
  "spell parasite's",
  "spriggan's vigor",
  "steadfast's mettle",
  "stone-talker's perfected",
  "stone-talker's",
  "stone's accord",
  "stuhn's",
  "sul-xan's torment",
  "systres'",
  "talfyg's",
  "tharriker's",
  "the kynmarcher's cruelty",
  'kynmarchers cruelty',
  'orders wrath',
  "thukhozod's",
  "thunder caller's",
  "titanborn's",
  "tracker's lash",
  "unchained aggressor's",
  "undertaker's",
  "unidentified bahraha's curse",
  "vandorallen's",
  "vastarie's",
  "vrol's perfected",
  "vrol's",
  "vykand's soulfury",
  "winter's respite",
  "witch-knight's",
  "xoryn's perfected",
  "xoryn's",
  "yandir's perfected",
  "yandir's",
  "yolnahkriin's",
  "z'en",
].map((i) => _getNormalizedName(i))

const SETS_TO_SIGNET = [
  'baelborne',
  'bloodthorn baelborne',
  'commanders',
  'dwemerdark',
  'high kings',
  'imperial officers',
  'mage masters',
  'merethic',
  'nasss',
  'pacts',
  'sancre tor',
  'scamplords',
  'snowy',
  'succession',
  'warlock',
  'worm',
].map((i) => _getNormalizedName(i))

const SETS_TO_BAND = [
  'argonian tail',
  'briarheart',
  'cathartic',
  'coupling',
  'covenants',
  'daggerfall guard waist',
  'dominions',
  'golden braid',
  'hidden moon',
  'house tirethi signet',
  'lost imperial',
  'lost wedding',
  'mammoth',
  'metal',
  'metal',
  'para bellum',
  'ravaging',
  'tarnished wedding',
  'werewolf hide',
  'werewolf hide',
  'werewolf hide',
  "artifact-hunter's",
  "covenant's",
  "cynhamoth's undulating",
  "dominion's",
  "drulshasa's dark",
  "forgemaster's",
  "hist's root",
  "naeraizozan's",
  "pact's",
  "perfected pillager's",
  "pillager's",
  "prisoner cynhamouth's undulating",
  "speaker's",
  "tazkad's",
  "widow's",
  "zarukhair's",
].map((i) => _getNormalizedName(i))

const SETS_TO_LOCKET = [
  'almalexias mercy',
  'cheap',
  'cyrodiils crest',
  'engraved',
  'footman',
  'heartless widows',
  'nahrinas',
  'pariah',
  'questionable',
  'rosalinds',
  'stolen',
  'sylvians',
]

const SETS_TO_COLLAR = [
  'blighted iron',
  'briarheart',
  'cruel',
  'dremora',
  'prefects resignation replica',
]

const resultCanNotBeMotif = (result: string) =>
  result.match(/^(praxis|blueprint|runebox|crafting motif)/) ||
  result.match(/(divines|training)$/) ||
  result.includes('imperial physique') ||
  result.includes('daedric trickery') ||
  result.includes('draugr heritage') ||
  result == 'armored gauntlets of the ivory brigade' ||
  result == 'pauldrons of the ivory brigade' ||
  result == 'ivory brigade pauldrons' ||
  result == 'yokudan epaulets' ||
  result.includes('of the') ||
  result == 'ashlander axe' ||
  result.includes('telvanni efficiency') ||
  result.includes('worm cult hunter') ||
  result.includes('psijic psion') ||
  result.includes('dragonguard elites') ||
  result.includes('egg handling') ||
  result.includes('motif fragment')

const STYLE_BOOK_ITEMS = [
  'hands',
  'boots',
  'dagger',
  'breeches',
  'cuirass',
  'battle axe',
  'greaves',
  'helm',
  'pauldrons',
  'pauldron',
  'bow',
  'hood',
  'shawl',
  'legs',
  'sandals',
  'sabatons',
  'shield',
  'boots',
  'jack',
  'axe',
  'shoulder',
  'jerkin',
  'epaulets',
  'epaulet',
  'shoes',
  'hat',
  'staff',
  'gauntlets',
  'bracers',
  'maul',
  'belt',
  'jack 1',
  'jack 2',
  'arm cops',
  'sash',
  'greatsword',
  'sword',
  'guards',
  '"staff"',
  'gloves',
  'mace',
  'mask',
  'helmet',
  'girdle',
  'wraps',
  'skirt',
  'robe',
]

const _escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const flipName = (input: string) => {
  let result = input.trim()
  if (['ra gada shoulders', 'ra gada legs'].includes(result)) {
    return result
  }

  const piecePattern = PIECES.slice()
    .sort((a, b) => b.length - a.length)
    .map(_escapeRx)
    .join('|')
  const traitAlt = `(?:${TRAITS.map(_escapeRx).join('|')})\\b`
  const setsPattern = SETS_TO_FLIP.map(_escapeRx).join('|')
  const addTheSet = new Set(SETS_TO_ADD_THE.map((s) => s.toLowerCase()))

  if (
    result.startsWithAny([
      'crimson oath',
      'daggerfall covenant',
      'mazzatun',
      'morag tong',
      'nobility in decay',
      'ra gada',
      'silver rose',
      'worm cult',
    ]) &&
    result.endsWith('s') &&
    !result.endsWithAny([
      'arm cops',
      'bracers',
      'breeches',
      'cuirass',
      'epaulets',
      'gauntlets',
      'greaves',
      'guards',
      'pauldrons',
      'sabatons',
      'shoes',
    ])
  ) {
    return result
  }

  // already flipped: "<piece> of [the] <set> [trait] ..."
  const alreadyRx = new RegExp(
    `^(?:${piecePattern})\\s+of\\s+(?:the\\s+)?(?:${setsPattern})\\b(?:\\s+(?:${traitAlt}))?\\s*$`,
    'i'
  )
  if (alreadyRx.test(result)) {
    return result.replace(/\s+/g, ' ').trim()
  }

  // try each set, capturing piece, optional trait, then the rest
  for (const setName of SETS_TO_FLIP.filter((i) => result.startsWith(i))) {
    const rx = new RegExp(
      `^\\s*${_escapeRx(setName)}\\s+(?:the\\s+)?\\b(${piecePattern})\\b(?:\\s+(${traitAlt}))?\\s*$`,
      'i'
    )
    const m = result.match(rx)
    if (!m) continue

    const piece = m[1].trim()
    const trait = (m[2] || '').trim()
    const addThe = addTheSet.has(setName.toLowerCase()) ? ' the' : ''

    result = `${piece} of${addThe} ${setName}${trait ? ' ' + trait : ''}`
      .replace(/\s+/g, ' ')
      .trim()
    break
  }

  return result
}

const appendMotifNumbers = (result: string) => {
  // allow only real gear/style terms
  const WHITELIST_RX =
    /\b(belts|style|gloves|boots|shoulders|helmets|helmet|shield|chests|legs|swords|daggers|axes|maces|bows|shields|staves|dagger)\b/i

  for (const [motifName, motifNumber] of CRAFTING_MOTIFS.filter(
    (i) => result.startsWith(i[0]) || result.endsWith('guards')
  )) {
    if (
      STYLE_BOOKS.map((i) => i[0]).includes(motifName) &&
      result.startsWith(motifName) &&
      !result.endsWith('style')
    ) {
      continue
    }

    if (resultCanNotBeMotif(result)) {
      break
    }

    // must mention a gear term or "style"
    if (!WHITELIST_RX.test(result)) continue
    result = result.replace(
      new RegExp(`^(${_escapeRx(motifName)} .*)`),
      `crafting motif ${motifNumber} $1`
    )
    break
  }

  return result
}

const appendStylePage = (result: string) => {
  STYLE_NAMES.filter((i) =>
    result.isAny(STYLE_BOOK_ITEMS.map((k) => new RegExp(`^${i} ${k}`)))
  ).forEach((i) => {
    if (
      MONSTER_STYLE_NAMES.includes(i) &&
      !result.endsWithAny(['shoulder', 'shoulders', 'mask'])
    ) {
      return
    }

    result = `style page ${result}`
  })

  if (
    result.endsWithAny(['s pauldron', 's shoulder', 's epaulets', 's mask']) &&
    !result.match(
      new RegExp(MONSTER_STYLE_NAMES.filter((i) => i.endsWith('s')).join('|'))
    ) &&
    !result.includes(' opal ')
  ) {
    result = result.replace(/^style page /, '')
  }

  return result
}

const replaceAmpersands = (result: string) =>
  result
    .replace('foxes and felines', 'foxes & felines')
    .replace('hoops and holes', 'hoops & holes')
    .replace('public and swe', 'public & swe')
    .replace('guilds and glory', 'guilds & glory')
    .replace('pranks and pleasures', 'pranks & pleasures')

const replaceStubbornResults = (result: string) =>
  replaceAmpersands(result)
    .replace(' choir ', ' chair ')
    .replace('alinor bookcase wall', 'alinor bookshelf wall')
    .replace('alinor bookshelf', 'alinor bookcase')
    .replace(/corpse burnt (sprawled|seated)/, 'corpse burned $1')
    .replace('dawnwood serving', 'dawnwood  serving')
    .replace('elsweyr bookshelf wooden', 'elsweyr bookcase wooden')
    .replace(/poison [ivx]{1,3}/, 'poison i')
    .replace('polished dame', 'polished dome')
    .replace('tribute tapestry', 'tapestry')
    .replace(
      /^recipe psijic ambrosia fragment$/,
      'recipe psijic ambrosia fragment i'
    )
    .replace('azure wrought iron', 'azure wrought-iron')
    .replace('draws the sap', 'draws-the-sap')
    .replace('earthgores shoulder', 'earthgore shoulder')
    .replace('metal band', 'metal ring')
    .replace('style page dwarven broom restored', 'dwarven broom restored')
    .replace('telvanni-bookcase', 'telvanni bookcase')
    .replace('fighters guild citation', 'fighters  guild citation')
    .replace('fountain wolf-head', 'fountain wolf head')
    .replace('garlic and pepper', 'garlic-and-pepper')
    .replace(
      'style page the engine guardians pauldron',
      'the engine guardians pauldron'
    )
    .replace('briarheart blood-red', 'briarheart blood red')
    .replace(/^masters ring/, 'masters signet')
    .replace('pirate skeleton ', 'pirate skeletons ')
    .replace('gloamsedge arm cops', 'gloamsedge arm cop')
    .replace('gods blind me', 'gods-blind-me')
    .replace('tablet vos-toh of dance', 'tablet  vos-toh of dance')
    .replace('animate the dead', 'animate-the-dead')
    .replace(
      'lucent defensive spike straight',
      'lucent  defensive spike straight'
    )
    .replace('hand-sculpture', 'hand-scultpure')
    .replace('painting in progess', 'painting in progress')
    .replace('style page chitinous jack', 'style page  chitinous jack')
    .replace('soup and saltrice', 'soup-and-saltrice')
    .replace('leyawiin of night', 'leyawiin at night')
    .replace('god and missing', 'god & missing')
    .replace(
      /style page (pirate skeleton|nerieneth|velidreth|mighty chudan)s (mask|shoulder)/,
      'style page $1 $2'
    )
    .replace('necklace of the pariah', 'locket of the pariah')
    .replace('ring of the pariah', 'signet of the pariah')
    .replace(
      'praxis ayleid desk ornate stone',
      'praxis ayleid deskornate stone'
    )
    .replace('pigs in a blanket', 'pigs-in-a-blanket')
    .replace('statue blade master', 'statue blademaster')
    .replace('chicken and banana', 'chicken-and-banana')
    .replace('rithana di renada', 'rithana-di-renada')
    .replace('style page slimecraws shoulder', 'style page slimecraw shoulder')
    .replace(
      'crafting motif 134 tide-born egg-handling',
      'tide-born egg-handling'
    )
    .replace(
      /crafting motif 134 tide-born (helmet|shield|dagger)$/,
      'tide-born $1'
    )
    .replace('werewolf hide wolfs-head band', 'werewolf hide wolfs-head ring')
    .replace('elsweyr door lunar reverance', 'elsweyr door lunar reverence')
    .replace('green pact signet', 'ring of the green pact')
    .replace(/(mammoth|radish|grub) kabobs/, '$1 kebabs')
    .replace('necklace of bones', 'collar of bones')
    .replace('coup de grace', 'coup de grâce')
    .replace('rageclaws necklace of stendarr', 'rageclaws collar of stendarr')
    .replace('abnur tharns epaulets', 'style page abnur tharns epaulets')

// In generating internal labels, we standardize various nouns to `ring` and
//  `necklace`. We need to undo that here.
const replaceGenerics = (result: string) => {
  result = _getNormalizedName(result)
  const _straightReplace = (set: string, before: string, after: string) => {
    result = result.replace(
      new RegExp(`(${set} ${before})(${TRAITS.join('|')})?`),
      `${set} ${after}$2`
    )
    result = result == `${set} ${before}` ? `${set} ${after}` : result
  }

  // Fix Signets, Bands, Collars, Lockets
  SETS_TO_SIGNET.forEach((i) => _straightReplace(i, 'ring', 'signet'))
  SETS_TO_BAND.forEach((i) => _straightReplace(i, 'ring', 'band'))
  SETS_TO_COLLAR.forEach((i) => _straightReplace(i, 'necklace', 'collar'))
  SETS_TO_LOCKET.forEach((i) => _straightReplace(i, 'necklace', 'locket'))
  SETS_TO_AMULET.forEach((i) => _straightReplace(i, 'necklace', 'amulet'))
  return result
}

// Convert a given internal label into the real item name. Some internal labels
//  match up against multiple items and are mapped to the preferred item.
export const internalToName = (unflippedName: string): string => {
  if (unflippedName.toLowerCase().startsWith('bound ')) {
    return 'a savage ring'
  }
  unflippedName = KNOWN_MATCHES[unflippedName.toLowerCase()] || unflippedName

  if (PREAPPROVED_ITEMS.includes(unflippedName)) {
    return unflippedName
  }

  let result = _getNormalizedName(unflippedName)
  const original = result.toString()
  result = _checkForFakeItem(result)
  result = _fixCommonTypos(result)

  result = replaceGenerics(result)
  result = flipName(result)
  result = appendMotifNumbers(result)
  result = appendStylePage(result)

  result = result
    .replace('the the ', 'the ')
    .replace('style page style page', 'style page')

  if (
    result.endsWith('treasure map') &&
    !result.includes('arkthzand') &&
    !result.includes(' ce ')
  ) {
    result = result + ' i'
  }

  if (result.startsWith('research scroll') && !result.includes('day')) {
    result = `${result} 1 day`
  }

  result = /^(arkthzand|greymoor) cavern/.test(result)
    ? `blackreach ${result}`
    : result

  result = _replaceHyphens(result)
  result = replaceStubbornResults(result)

  if (original.startsWith('mothers sorrow')) {
    result = result.replace('of mothers sorrow', 'of a mothers sorrow')
  }

  // 7) "vivecs X of duality" -> "x of vivecs duality"
  result = result
    .replace(/^vivecs duality ([^\s]+)(.*)$/i, 'vivecs $1 of duality$2')
    .replace(/^(.*) of vivecs duality(.*)$/i, 'vivecs $1 of duality$2')
    .replace('vivecs battle of duality axe', 'vivecs battle axe of duality')
    .replace(
      /vivecs (ice|inferno|lightning|restoration) of duality staff/,
      'vivecs $1 staff of duality'
    )
    .replace('vivecs necklace of duality', 'vivecs amulet of duality')

  return result.replace(':', '').replace(',', '')
}
