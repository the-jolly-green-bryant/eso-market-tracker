/**
 * This is an old script from an import system that should have some fairly
 *  robust (albeit noisy) logic around converting between and item's name and
 *  EMT's labeling system it uses internally. We want to map those internal
 *  labels back into regular item names.
 */

type NameToInternalOptions = {
  trySkippingSetTransformation?: boolean
  tryingLooseSetTransformation?: boolean
  setItems?: ReadonlySet<string> | string[]
}

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

/**
 * Converts an ESO Market Tracker internal label to a fully qualified item name.
 * @param {string} itemName
 * @param {NameToInternalOptions} opts
 * @returns {string}
 */
export function nameToInternal(
  itemName: string,
  opts: NameToInternalOptions = {}
): string {
  const {
    trySkippingSetTransformation = false,
    tryingLooseSetTransformation = false,
    setItems = DEFAULT_SET_ITEMS,
  } = opts

  const SET_ITEMS =
    setItems instanceof Set
      ? setItems
      : new Set<string>(
          (setItems as string[]).map((s: string) => s.toLowerCase())
        )

  // 1) normalize
  let label = itemName
    .toLowerCase()
    .trim()
    .replace(/\s{2,}/g, ' ')
  label = label
    .replace('&', 'and')
    .replace('.', '')
    .replace('(', '')
    .replace(')', '')

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
  label = label.replace(/,?\s*\d+\s*d[ao]y[s]?/g, '')

  // 4) crafting motif: keep the section name only
  // e.g. "... motif 15: daedric" -> "daedric"
  label = label.replace(
    /[cg].{4,8}g m[ao][ar]?tif \d+:?\s*([a-z\s]*)/g,
    (_m, g1: string) => g1.trim()
  )

  // 5) treasure map: keep up to "... treasure map"
  label = label.replace(/(.* t[ri]easure map).*/g, '$1').trim()

  // 6) Song of Pelinal volumes: collapse to base title
  if (label.includes('the song of pelinal volume')) {
    label = 'the song of pelinal volume'
  }

  // 7) "vivecs X of duality" -> "x of vivecs duality"
  label = label.replace(
    /vivecs (.*) of duality/g,
    (_m, g1: string) => `${g1} of vivecs duality`
  )

  // 8) word replacements unless it contains "duriatundars"
  if (!label.includes('duriatundars')) {
    label = label
      .replace(/\bamulet\b/g, 'necklace')
      .replace(/\blocket\b/g, 'necklace')

    if (label !== 'titanborn family signet') {
      label = label.replace(/\bsignet\b/g, 'ring')
    }

    if (label.endsWith(' band')) {
      label = label.replace(/ band$/, ' ring')
    }

    // avoid kittens collar
    if (label.endsWith(' collar') && !label.endsWith('kittens collar')) {
      label = label.replace(/ collar$/, ' necklace')
    }
  }

  // 9) set-name transform: "<equipment> of <set>" -> "<set> <equipment>"
  if (!label.includes('shield of senchal') && !trySkippingSetTransformation) {
    const m = label.match(/^(.*?) of (.*)$/)
    if (m) {
      const equipment = m[1].trim()
      let setName = m[2].trim()

      const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const traitRx = new RegExp(`\\b(${TRAITS.map(escapeRx).join('|')})$`, 'i')
      const tMatch = setName.match(traitRx)
      const trait = tMatch?.[1] ?? ''
      if (trait) {
        setName = setName
          .replace(new RegExp(`\\s*${escapeRx(trait)}$`, 'i'), '')
          .trim()
      }

      const isEquipmentKnown = SET_ITEMS.has(equipment)
      if (isEquipmentKnown || tryingLooseSetTransformation) {
        // fix leading articles and common typos
        setName = setName
          .replace(/^(the|tbe|rhe)\s+/, '')
          .replace(/^he\s+/, '') // typo of "the"
          .replace(/^(a|o)\s+/, '') // typo of "a"

        label = `${setName} ${equipment}${trait ? ' ' + trait : ''}`.trim()
      }
    }
  }

  // 10) final cleanup and specific normalizations
  label = label
    .replace(/'/g, '')
    .replace(/’/g, '')
    .replace(/blackreach:\s*greymoor/g, 'greymoor')
    .replace(/blackreach:\s*arkthzand/g, 'arkthzand')
    .replace(/blackreach\s+greymoor/g, 'greymoor')
    .replace(/blackreach\s+arkthzand/g, 'arkthzand')
    .replace(/[:,]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace('dragoon jack ii', 'dragoon jack 2')
    .replace('dragoon jack i', 'dragoon jack 1')
    .trim()

  return label
}

// call earlier: displayName = displayName.toLowerCase().replace("acres tracking", "aeras tracking")

export const internalToName = (unflippedName: string): string => {
  const name = unflippedName
    .toLowerCase()
    .trim()
    .replace(':', '')
    .replace(',', '')
    .replace(/\s+/gu, ' ')
  let result = name

  const nonExistantItems = [
    'alinor bookshelf polished',
    'alinor display stand noble',
    'apocrypha bed spiked',
    'argonian bookshelf woven',
    'ayleid bookshelf cluttered',
    'base game treasure maps',
    'base game treasure map',
    'blackreach treasure map',
    'blackwood ce treasure map',
    'blueprint alinor bed polished',
    'blueprint breton chamberstick tall',
    'blueprint redguard urn sealed',
    'bog raiders bracers',
    'bog raiders breeches',
    'bog raiders hat',
    'bog raiders shoes',
    'book stack levitating',
    'breaching poison',
    'brutality draining poison',
    'clockwork dial calipers handheld',
    'clockwork treasure map',
    'cloudy damage health poison',
    'cloudy gradual ravage health poison',
    'cloudy hindering poison',
    'common soul gem',
    'common soul gem empty',
    'conspicuous poison',
    'cowardice poison',
    'cyrodiils crest boots',
    'damage health poison',
    'damage magicka poison',
    'dark ether',
    'deadlands assassins girdle',
    'defilers cuirass',
    'design candles plate',
    'design candles ritual set',
    'design leyawiin meal lobster stew',
    'diagram deadlands brazier bladed tall pillar',
    'diagram dwarven mug plate',
    'diagram indoril brazier noble',
    'diagram pipe cap bolted',
    'diagram redoran spittoon gilded',
    'dish empty',
    'dragonguard ring',
    'dreamers belts',
    'dreamers more',
    'elsweyr bookcase elegant wooden',
    'elsweyr bookshelf short elegant',
    'elsweyr bookshelf wooden',
    'elsweyr mirror carved wall',
    'elsweyr pillow gold ruby throw',
    'elsweyr treasure map',
    'fine silk gloves',
    'firelogs ashen',
    'firesong circle style item',
    'flowers netch cabbage stalks',
    'frostbite arm cops',
    'frostbite boots',
    'frostbite cuirass',
    'frostbite gauntlets',
    'frostbite helm',
    'frostbite helmet',
    'frostbite pauldrons',
    'hide grocers of health',
    'hlaalu cabinet of drawers desk',
    'imperial bed four poster',
    'imperial divider curved',
    'imperial divider folding',
    'imperial nightstand scrollwork',
    'khajiit bookshelf arched',
    'khajiit red canopy',
    'legion zero vigiles girdle',
    'lemon flower sake',
    'murkmire bookshelf',
    'murkmire bookshelf full',
    'murkmire bookshelf grand',
    'mushrooms climbing ambershine',
    'mushrooms tall puspocket',
    'necrom desk elegant',
    'necrom door patterned',
    'night mother axe',
    'night mother ice staff',
    'night mother mace',
    'night mother restoration staff',
    'night mother shield',
    'nord bookshelf alcove',
    'nord sconce torch',
    'offerings',
    'old canis root',
    'orcish bookshelf peaked',
    'orsinium treasure map',
    'overland treasure map',
    'painting of arch silver',
    'painting of khajiit arch gold',
    'parcels wrapped',
    'pattern argenton mat tidy reed',
    'pattern argonian divider string',
    'pattern book stack levitating',
    'pattern high elf carpet mottled',
    'pattern indoril banner viper',
    'pattern murkmire lantern linked rings',
    'pattern necrom runner narrow patterned',
    'pattern redguard buffet oasis',
    'pebble stacked desert',
    'pattern elsweyr fountain four lions',
    'plant golden lichen',
    'plants swamp pitcher shoots',
    'praxis argonian lira clawfoot',
    'praxis ayleid bookcase short cluttered',
    'praxis ayleid bookshelf cluttered',
    'praxis clockwork sequence plaques unfolded',
    'praxis eldtertide torus stone',
    'praxis elsweyr bookshelf ancient stone tall',
    'praxis firesong lava shelf short',
    'praxis high eif lamppost stone',
    'praxis markarth past stone wall',
    'praxis murkmire bookshelf grand',
    'rabbit gnocchi raga',
    'ravaging belt',
    'ravaging rattle axe',
    'recipe hlaalu pumpkin risotto',
    'recipe meaty garlic corn chowder',
    'recipe psijic mages mazte',
    'red beer stew',
    'redguard buffet oasis',
    'redguard divider gilded',
    'redoran bench banded',
    'rough black stone brick',
    'runebox sword to the head adornment',
    'sapling desert',
    'sapling healthy forest',
    'seaport fountain floral wall',
    'seventh legion boots',
    'shadow dancer hat',
    'shrub blooming seabird',
    'shrub blowing thistle',
    'shrub glooming sunbird',
    'shrubs dormont sunbird cluster',
    'sithis the dread father',
    'skeever kabob',
    'skeever kebab',
    'solitude bed long',
    'solitude bed noble',
    'solitude cabinet narrow open filled',
    'solstheim elk and scuffle',
    'statue of hircines bitter mercy',
    'stones smooth massy',
    'stony sliver',
    'strifeswarm legplates of the sheik',
    'strodes orcish coif of necropotence',
    'summer sundas soup',
    'tapestry of a foiled incarnate the warseeker',
    'telvanni light organic azure',
    'telvanni shelves orgonic',
    'third house of hist sap shield',
    'topiary paired cypress',
    'topiary strong cypress',
    'tree ancient fig',
    'tree ferns cluster',
    'tree heavy ash',
    'tree strong olive',
    'tree vibrant pink',
    'tree whorled fig',
    'trinimacs valor necklace',
    'truly superb glyph of crushing',
    'used bait',
    'vampire fang',
    'vampiric table vampiric',
    'void essence',
    'voliar meadery seal',
    'witches torch wretched',
    'witchs totem bear',
    'writ voucher to gold',
    'dwarven lamppost reachfolk adorned',
    'ebon maul',
    'kynmarchers cruelty amulet',
    'diagram dwarven dinner bowl hearty stew',
    'gt ebony ingot',
    'praxis druidic stone oven',
    'recipe bruised sweetmeats',
    'recipe molten wor torte',
    'sanded ash+b79331',
    'telvanni peninsula treasure',
    'treasure map',
    'amino core full',
    'attunable clothier station',
    'blueprint elsweyr plate amber ceramic',
    'blueprint elsweyr plate limber ceramic',
    'bear totem balance',
    'chokethorns shoulder',
    'chokethorns mask',
    'design common candle casting',
    'design murkmire candle post timber',
    'diagram dwarven relief connected circle',
    'elsweyr carpet blossoms an blue',
    'elsweyr curtain tied back blue',
    'clan shatul gauntlets',
    'cygnus irregulars greatsword',
    'corruptions end greaves',
    'evermore greaves',
    'firsthold greaves',
    'withering staff',
    'langour of peryite shoes',
    'faithfulness ring',
    'solitude sword',
    'crystal tower staff',
    'defender cuirass',
    'maw of the infernals mask',
    'maw of the infernals shoulder',
    'ritemasters memorial battle sword',
    'tremorscales shoulder',
    'tremorscales mask',
    'balorghs shoulder',
    'balorghs mask',
    'nightflames mask',
    'nightflames shoulder',
  ]
  if (
    nonExistantItems.includes(result.toLowerCase()) ||
    result.includes('furnishing folio') ||
    result.includes('furnishers document') ||
    result.startsWith('category ') ||
    result.endsWith(' poison') ||
    result.startsWith('dreugh king slayer') ||
    result.endsWith(' repair kit') ||
    result.endsWith(' soul gem empty') ||
    result.endsWith(' soul gem') ||
    result.endsWith(' style item') ||
    result.startsWith('the morag tong') ||
    result.startsWith('writ voucher') ||
    result.includes('nigh elf') ||
    result.includes('high ell') ||
    result.includes('blueprint diagram') ||
    result.includes('readorn') ||
    result.includes('book rack l') ||
    result.includes(' mather ') ||
    result.includes(' romped ') ||
    result.includes('colavian') ||
    (result.startsWith('opal') &&
      !result.includes('ilambris ') &&
      (result.includes('s mask') ||
        result.includes('s shoulder') ||
        result.includes('s shield')))
  ) {
    return 'a savage ring'
  }

  result = result
    .toLocaleLowerCase()
    .replace('acres tracking', 'aeras tracking')
    .replace('perpetual gloom', 'perpetual bloom')
    .replace('ancient nord prayer', 'ancient nedic prayer')
    .replace(' stole creek ', ' stale creek ')
    .replace('argonian banner frilled', 'argonian banners frilled')
    .replace('azures ', 'azuras ')
    .replace('barbate', 'barbute')
    .replace('claw gauntlets', 'gauntlets of the claw')
    .replace('arm joint calipers', 'firm joint calipers')
    .replace('anima core', 'animo core')
    .replace('grafting table', 'drafting table')
    .replace('commanders ring of salvation', 'commanders signet of salvation')
    .replace('gasket', 'basket')
    .replace('corn bread', 'cornbread')
    .replace('waist ring', 'waist band')
    .replace('dark ell', 'dark elf')
    .replace(' dugan', ' dagon')
    .replace('defender cuirass', 'cuirass of the defender')
    .replace('design candles group', 'design candle group')
    .replace('tug amber', 'jug amber')
    .replace('orcish lantern hooked', 'orcish lantern hooded')
    .replace('eider radish', 'eidar radish')
    .replace('fang cuirass', 'cuirass of the fang')
    .replace('colonnade wall', 'colonnade hall')
    .replace('fulmar ', 'falmer ')
    .replace('gors axe', 'gars axe')
    .replace('giadils', 'gjadils')
    .replace('dragoon jack ii', 'dragoon jack 2')
    .replace('dragoon jack i', 'dragoon jack 1')
    .replace('grothdarrs', 'grothdarr')
    .replace('handings rage', 'hundings rage')
    .replace('widows necklace', 'widows locket')
    .replace('ring ring', 'signet ring')
    .replace('sotho sil', 'sotha sil')
    .replace('izeds treasure', 'izads treasure')
    .replace('fire pit brick', 'firepit brick')
    .replace('kwama cattle', 'kwama cuttle')
    .replace('marians metal', 'morians metal')
    // .replace("maw of the infernals", "maw of the infernal")
    .replace('chudans', 'chudan')
    .replace('nahrinas necklace', 'nahrinas locket')
    .replace('nesss', 'nasss')
    .replace('new moan', 'new moon')
    // .replace("nightflames", "nightflame")
    .replace('oath card', 'oath cord')
    .replace('spectral necklace', 'spectral amulet')
    .replace('pact ring', 'pact signet')
    .replace('pirate skeletons', 'pirate skeleton')
    .replace('crocked', 'cracked')
    .replace('flour large', 'floor large')
    .replace('solitude weil', 'solitude well')
    .replace('on the cab', 'on the cob')
    .replace('grandmoms', 'grandmams')
    .replace('hoarker', 'horker')
    .replace('part handing', 'port hunding')
    .replace('kebabs', 'kabobs')
    .replace('riekling totem skull', 'reikling totem skull')
    .replace('seed epaulets', 'seed epaulet')
    .replace('shadowrends', 'shadowrend')
    .replace('sir socks ', 'sir sockss ')
    .replace('slimecraws', 'slimecraw')
    .replace('solitude sword', 'sword of solitude')
    .replace('spawn of mephalas', 'spawn of mephala')
    .replace('stonekeepers', 'stonekeeper')
    .replace('stormfists', 'stormfist')
    .replace('necklace of eyevea', 'amulet of eyevea')
    .replace('traders ring', 'traders signet')
    .replace('reverence', 'reverance')
    .replace('vicecanons helmet', 'the vicecanons helmet')
    .replace('warrior poet pauldrons', 'warrior poets pauldron')
    .replace('zen necklace', 'amulet of zen')
    .replace('broom style page', 'style page broom')
    .replace(' radish kabobs', ' radish kebabs')
    .replace(' mammoth kabobs', ' mammoth kebabs')
    .replace('grub kabobs', 'grub kebabs')
    .replace('high isle amulet', 'amulet of high isle')
    .replace('pact necklace', 'pact amulet')
    .replace('reverances mandate', 'reverences mandate')
    .replace('coup de grce', 'coup de grace')

  // Sets whose names should be flipped when they prefix equipment
  const setsToAddThe = [
    'ancient mariner',
    'arch mage',
    'archers mind',
    'arena',
    'armor master',
    'ascendant magus',
    'bad performance',
    'black rose',
    'courier',
    'crystal tower',
    'cygnus irregulars',
    'eyes of mara',
    'fallen comrade',
    'fallen wastes',
    'footman',
    'forest protector',
    'furious one',
    'ghost knight',
    'green pact',
    'green sister',
    'harbinger',
    'healer',
    'heartland',
    'holdfast',
    'insatiable',
    'juggernaut',
    'last captain',
    'lich',
    'lutepicker',
    'night mother',
    'wyrd tree',
    'order of diagna',
    'phoenix',
    'planes',
    'ra gada',
    'ranger',
    'schemer',
    'seducer',
    'sentry',
    'serpent',
    'shadow dancer',
    'shadow walker',
    'shield breaker',
    'sightless pirate',
    'song of lamae',
    'spectres eye',
    'spirit within',
    'storm knight',
    'subservient',
    'swampstrider',
    'swift',
    'twice born star',
    'ugly mug',
    'unrequited',
    'valiant',
    'voidcaller',
    'waylaid traveler of salvation',
    'wilderqueen',
    'willows path',
    'wolf father',
    'radiant bastion',
    'twin sisters',
    'weald',
    'orders wrath',
  ]

  const setsToFlip = setsToAddThe.concat([
    'aetherial ascension',
    'akatoshs law',
    'alessias bulwark',
    'alteration mastery',
    'ambition',
    'ashen grip',
    'beckoning steel',
    'bulwark ruination',
    'clan shatul',
    'clan tumnosh',
    'corrupted springs',
    'corruptions end',
    'critical riposte',
    'cyrodiils crest',
    'cyrodiils light',
    'cyrodiils ward',
    'daedric trickery',
    'deaths wind',
    'destruction mastery',
    'dragons appetite',
    'draugr heritage',
    'elastic girth',
    'evermore',
    'faithfulness',
    'fallen ambition',
    'fasallas guile',
    'firsthold',
    'flanking',
    'forbidden knowledge',
    'frostbite',
    'grounding',
    'hundings rage',
    'hist bark',
    'hist sap',
    'imperial physique',
    'inguya',
    'iron flask',
    'julianos',
    'kagrenacs hope',
    'khalis strength',
    'mechanical acuity',
    'memory',
    'meritorious service',
    'morkuldin',
    'mothers embrace',
    'natures accord',
    'natures fury',
    'nights silence',
    'notched memories',
    'oblivions foe',
    'orgnums scales',
    'penumbra',
    'red eagles fury',
    'redistribution',
    'remembrance',
    'resonance',
    'riften',
    'sancre tor',
    'secundus',
    'serpents disdain',
    'shalidors curse',
    'sizzling',
    'syrabane',
    'the morag tong',
    'tonal dissonance',
    'torugs pact',
    'trials',
    'trinimacs valor',
    'twilights embrace',
    'vampires kiss',
    'varens legacy',
    'withering',
    'wretched vitality',
    'baan dars blessing',
    'dark convergence',
    'eternal vigor',
    'kynmarchers cruelty',
    'marauders haste',
    'nocturnals ploy',
    'oakfathers retribution',
    'winters respite',
    // add more as needed...
  ])

  // Common ESO equipment pieces (multi-word first to avoid partial matches)
  const PIECES = [
    'restoration staff',
    'lightning staff',
    'inferno staff',
    'ice staff',
    'destruction staff',
    'battle axe',
    'greatsword',
    'maul',
    'shield',
    'bow',
    'dagger',
    'sword',
    'axe',
    'mace',
    'helmet',
    'helm',
    'hat',
    'mask',
    'pauldrons',
    'pauldron',
    'shoulders',
    'epaulets',
    'cuirass',
    'jerkin',
    'jack',
    'robe',
    'shirt',
    'armor',
    'chest',
    'gauntlets',
    'gloves',
    'bracers',
    'belt',
    'girdle',
    'sash',
    'greaves',
    'guards',
    'legs',
    'leggings',
    'sabatons',
    'boots',
    'shoes',
    'ring',
    'necklace',
    'amulet',
    'breeches',
    'arm cops',
    'staff',
    'boots',
  ]

  const escapeRx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const piecePattern = PIECES.slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRx)
    .join('|')
  const traitAlt = `(?:${TRAITS.map(escapeRx).join('|')})\\b`
  const setsPattern = setsToFlip.map(escapeRx).join('|')
  const addTheSet = new Set(setsToAddThe.map((s) => s.toLowerCase()))

  const flipName = (input: string) => {
    let result = input.trim()
    if (['ra gada shoulders', 'ra gada legs'].includes(result)) {
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
    for (const setName of setsToFlip) {
      const rx = new RegExp(
        `^\\s*${escapeRx(setName)}\\s+(?:the\\s+)?\\b(${piecePattern})\\b(?:\\s+(${traitAlt}))?\\s*$`,
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

  result = flipName(result)

  const setsToAmulet = [
    'aetherial ascension',
    'aldmions',
    'coldharbours favorite',
    'critical riposte',
    'darkstride hatespinner',
    'deadlands assassins',
    'forest wraiths',
    'iron flask',
    'rootsong',
    'seeker synthesis',
    'senche rahts',
    'stuhns',
    'tharrikers',
    'the birthsign',
    'threads of war',
    'unchained aggressors',
  ]
  for (const setName of setsToAmulet) {
    if (!result.includes(setName)) {
      continue
    }

    result = result.replace('necklace', 'amulet')
  }

  const setsToSignet = [
    'baelborne',
    'dwemerdark',
    'high kings',
    'merethic',
    'nasss',
    'sancre tor',
  ]
  for (const setName of setsToSignet) {
    if (!result.includes(setName)) {
      continue
    }

    result = result.replace('ring', 'signet')
  }

  const setsToBand = [
    'cathartic',
    'forgemasters',
    'hidden moon',
    'hists root',
    'prisoner cynhamouths undulating',
  ]
  for (const setName of setsToBand) {
    if (!result.includes(setName)) {
      continue
    }

    result = result.replace('ring', 'band')
  }

  // core list (lowercase), source: UESP
  const craftingMotifs: [string, number][] = [
    // base game & early
    ['ancient elf', 11],
    ['barbaric', 12],
    ['primal', 13],
    ['dwemer', 15],
    ['glass', 16],
    ['xivkyn', 17],
    ['mercenary', 19],
    ['yokudan', 20],
    ['ancient orc', 21],
    ['trinimac', 22],
    ['malacath', 23],
    ['outlaw', 24],
    ['aldmeri dominion', 25],
    ['daggerfall covenant', 26],
    ['ebonheart pact', 27],
    ['ra gada', 28],
    ['soul shriven', 29],
    ['morag tong', 30],
    ['skinchanger', 31],
    ['abahs watch', 32],
    ['thieves guild', 33],
    ['assassins league', 34],
    ['dro mathra', 35],
    ['dark brotherhood', 36],
    ['ebony', 37],
    ['draugr', 38],
    ['minotaur', 39],
    ['order of the hour', 40],
    ['celestial', 41],

    // Morrowind + after
    ['buoyant armiger', 47],
    ['ashlander', 48],
    ['telvanni', 50],
    ['hlaalu', 51],
    ['redoran', 52],
    ['bloodforge', 54],
    ['dreadhorn', 55],
    ['apostle', 56],
    ['ebonshadow', 57],
    ['fang lair', 58],
    ['scalecaller', 59],
    ['psijic', 61],
    ['sapiarch', 62],
    ['pyandonean', 64],
    ['huntsman', 65],
    ['silver dawn', 66],
    ['welkynar', 67],
    ['honor guard', 68],
    ['dead water', 69],
    ['elder argonian', 70],
    ['coldsnap', 71],
    ['meridian', 72],
    ['anequina', 73],
    ['pellitine', 74],
    ['sunspire', 75],
    ['dragonguard', 76],
    ['stags of zen', 77],
    ['refabricated', 79],
    ['shield of senchal', 80],
    ['new moon priest', 81],
    ['icereach coven', 82],
    ['blackreach vanguard', 84],
    ['greymoor', 85],
    ['sea giant', 86],
    ['ancestral nord', 87],
    ['ancestral orc', 88],
    ['ancestral high elf', 89],

    ['hazardous alchemy', 91],

    // Blackreach → Deadlands → Ascending Tide
    ['arkthzand armory', 96],
    ['wayward guardian', 97],
    ['house hexos', 98],
    ['waking flame', 99],
    ['true sworn', 100],
    ['ivory brigade', 101],
    ['sul xan', 102],
    ['black fin legion', 103],
    ['ancient daedric', 104],
    ['crimson oath', 105],
    ['silver rose', 106],
    ['annihilarchs chosen', 107],
    ['dreadsails', 110],
    ['ascendant order', 111],

    ['drowned mariner', 116],
    ['firesong', 117],

    // High Isle → Necrom → Scions → Fallen Banners
    ['house mornard', 118],
    ['clan dreamcarver', 121],
    ['dead keeper', 122],
    ['the recollection', 124],
    ['blind path cultist', 125],
    ['exiles revenge', 130],
    ['militant monk', 131],

    ['tide born', 134],

    // Moved to end for filtering.
    // ["high elf", 1], ["wood elf", 3], ["breton", 5],
    // ["redguard", 6], ["khajiit", 7], ["orc", 8], ["argonian", 9], ["imperial", 10],

    // add these
    ['hollowjack', 42],
    ['grim harlequin', 43],
    ['silken ring', 44],
    ['mazzatun', 45],
    ['frostcaster', 46],
    ['militant ordinator', 49],
    ['tsaesci', 53],
    ['worm cult', 60],
    ['dremora', 63],
    ['moongrave fane', 78],
    ['pyre watch', 83],
    ['thorn legion', 90],
    ['ancestral akaviri', 92],
    ['ancestral breton', 93],
    ['ancestral reach', 94],
    ['nighthollow', 95],
    ['fargrave guardian', 108],
    ['syrabanic marine', 112],
    ['steadfast society', 113],
    ['systres guardian', 114],
    ['yffres will', 115],
    ['blessed inheritor', 119],
    ['scribes of mora', 120],
    ['kindreds concord', 123],
    ['shardborn', 126],
    ['west weald legion', 127],
    ['lucent sentinel', 128],
    ['hircine bloodhunter', 129],
  ]

  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  // allow only real gear/style terms
  const WHITELIST_RX =
    /\b(belts|style|gloves|boots|shoulders|helmets|chests|legs|swords|daggers|axes|maces|bows|shields|staves)\b/i

  for (const [motifName, motifNumber] of craftingMotifs) {
    if (motifName == 'imperial' && !result.includes('style')) {
      break
    }

    if (
      result.includes('imperial physique') ||
      result.includes('daedric trickery') ||
      result.includes('crafting motif') ||
      result.includes('draugr heritage') ||
      result == 'armored gauntlets of the ivory brigade' ||
      result == 'pauldrons of the ivory brigade' ||
      result == 'ivory brigade pauldrons' ||
      result.includes('praxis') ||
      result.includes('blueprint') ||
      result == 'yokudan epaulets' ||
      result.includes('of the') ||
      result.includes('runebox') ||
      result == 'ashlander axe' ||
      result.includes('telvanni efficiency') ||
      result.includes('worm cult hunter') ||
      result.includes('psijic psion') ||
      result.includes('dragonguard elites') ||
      result.endsWith('divines') ||
      result.endsWith('training') ||
      result.includes('egg handling')
    ) {
      break
    }

    // must mention a gear term or "style"
    if (!WHITELIST_RX.test(result)) continue

    // exact phrase match for motif name
    const rx = new RegExp(
      `(?:^|\\W)${esc(motifName).replace(/\s+/g, '\\s+')}\\b`,
      'i'
    )
    if (!rx.test(result)) continue

    result = `crafting motif ${motifNumber} ${result}`
    break
  }

  const styleNames = [
    'balorgh',
    'chokethorn',
    'banner bearer',
    'ebonsteel knight',
    'gold road dragoon',
    'grothdarr',
    'infernal guardian',
    'knight of the circle',
    'legacy of the draoife',
    'legion zero',
    'maw of the infernal',
    'mighty chudan',
    'nightflame',
    'pirate skeleton',
    'roksa the warped',
    'second legion',
    'second seed',
    'shadowrend',
    'slimecraw',
    'snowhawk mage',
    'spawn of mephala',
    'stonekeeper',
    'stormfist',
    'swarm mother',
    'tremorscale',
  ]
  for (const styleName of styleNames) {
    if (
      !result.includes(styleName) ||
      result == 'seventh legions ayleid breastplate'
    ) {
      continue
    }

    result = `style page ${result}`
  }

  if (result.startsWith('opal ')) {
    if (!result.includes('ilambris ')) {
      result = result
        .replace('s shoulder', ' shoulder')
        .replace('s mask', ' mask')
    }

    result = `style page ${result}`
  }

  result = result
    .replace('the the ', 'the ')
    .replace('style page style page', 'style page')

  if (result == 'bucket style page') {
    return 'style page bucket'
  }

  return result.replace(':', '').replace(',', '')
}
