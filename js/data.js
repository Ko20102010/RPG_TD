/* ==========================================================================
   Ancient Arcane Bastion (古域魔陣：守護神殿) - RPG Data & Content Definitions
   Contains 5 Ancient Realms (250 Waves + Endless), 18 Ground Logos/Rune Pads,
   4 Playable Hero Classes, 3 Active Spells, 24 Astral Talents, Equipment & Quests
   ========================================================================== */

window.GAME_DATA = {
  version: "1.2.0",

  // 5 Distinct Ancient Realms (Chapters) for 10+ hours of progression
  realms: [
    {
      id: 1,
      name: "第一章：荒漠古遺跡",
      sub: "Scorched Sun-Canyon Ruins",
      desc: "烈日灼燒的遠古砂岩峽谷，紅巾哥布林教團與沙漠巨蠍正衝擊神殿外牆。",
      groundColor: "#d6a165",
      pathColor: "#9c6d3e",
      cliffColor: "#8b542b",
      wallColor: "#c28b52",
      enemyMult: 1.0,
      rewardMult: 1.0,
      wavesToClear: 50,
      bossName: "法老巨神兵・阿努比斯 (Pharaoh Titan)",
      bossColor: "#f59e0b"
    },
    {
      id: 2,
      name: "第二章：幽暗符文地窟",
      sub: "Obsidian Rune Cavern",
      desc: "蘊藏魔力紫水晶的地下古城，暗影刺客與黑曜石魔像從深淵湧出。",
      groundColor: "#3b3355",
      pathColor: "#26203a",
      cliffColor: "#1b162b",
      wallColor: "#524775",
      enemyMult: 3.8,
      rewardMult: 3.2,
      wavesToClear: 50,
      bossName: "紫晶巫妖王・瑪爾扎克 (Arch-Lich Malzak)",
      bossColor: "#a855f7"
    },
    {
      id: 3,
      name: "第三章：冰封太古神殿",
      sub: "Frostbite Elder Sanctum",
      desc: "永凍極光籠罩的太古神廟，寒霜巨魔與冰晶女武神企圖凍結聖火。",
      groundColor: "#8ab4cc",
      pathColor: "#5e89a3",
      cliffColor: "#3b617a",
      wallColor: "#a5cce0",
      enemyMult: 14.0,
      rewardMult: 10.5,
      wavesToClear: 50,
      bossName: "永凍利維坦・弗羅斯 (Glacial Leviathan)",
      bossColor: "#38bdf8"
    },
    {
      id: 4,
      name: "第四章：熔岩魔龍火山",
      sub: "Cinderheart Dragon Caldera",
      desc: "赤紅岩漿奔流的古龍祭壇，煉獄混沌騎士與炎魔領主大舉進犯。",
      groundColor: "#5c2c29",
      pathColor: "#3d1a18",
      cliffColor: "#290f0e",
      wallColor: "#7a3b36",
      enemyMult: 52.0,
      rewardMult: 36.0,
      wavesToClear: 50,
      bossName: "太古紅龍皇・伊格尼斯 (Ignis the Elder Wyrm)",
      bossColor: "#ef4444"
    },
    {
      id: 5,
      name: "第五章：星界虛空王座",
      sub: "Astral Void Citadel",
      desc: "懸浮於星海與時間裂隙的終極神殿，虛空收割者與墮落熾天使降臨。",
      groundColor: "#1f2442",
      pathColor: "#13172e",
      cliffColor: "#0b0d1c",
      wallColor: "#3b4378",
      enemyMult: 200.0,
      rewardMult: 130.0,
      wavesToClear: 50,
      bossName: "時空古神・克羅諾斯 (Chronos the Eternity God)",
      bossColor: "#fde047"
    }
  ],

  // 4 Playable Hero Classes
  heroClasses: [
    {
      id: "runeblade",
      name: "符文聖劍士",
      title: "Arcane Runeblade",
      icon: "⚔️",
      color: "#38bdf8",
      capeColor: "#0284c7",
      desc: "攻守兼備的古域劍士，揮舞散發青色魔力的符文長劍，攻擊附帶穿透劍氣。",
      baseDmg: 18,
      atkRate: 0.42,
      range: 135,
      moveSpeed: 215,
      magnetBonus: 1.0,
      projType: "sword_wave"
    },
    {
      id: "archmage",
      name: "時空大魔導",
      title: "Chronos Archmage",
      icon: "🔮",
      color: "#a855f7",
      capeColor: "#7e22ce",
      desc: "掌控太古奧術的賢者，遠距離發射連鎖奧術彈，技能冷卻速度提升 25%。",
      baseDmg: 26,
      atkRate: 0.55,
      range: 220,
      moveSpeed: 195,
      magnetBonus: 1.15,
      projType: "arcane_chain"
    },
    {
      id: "paladin",
      name: "烈陽聖騎士",
      title: "Solar Paladin",
      icon: "🛡️",
      color: "#fbbf24",
      capeColor: "#d97706",
      desc: "神殿守護者，攻擊時落下一道神聖雷錘，並每秒自動修復聖殿城牆耐久。",
      baseDmg: 22,
      atkRate: 0.48,
      range: 155,
      moveSpeed: 205,
      magnetBonus: 1.1,
      projType: "holy_hammer"
    },
    {
      id: "hunter",
      name: "幻影獵魔人",
      title: "Shadow Chakram",
      icon: "🏹",
      color: "#22c55e",
      capeColor: "#15803d",
      desc: "極速穿梭戰場的獵手，高移動速度與超大拾取磁鐵範圍，一次投擲三枚魔力飛輪。",
      baseDmg: 15,
      atkRate: 0.30,
      range: 195,
      moveSpeed: 255,
      magnetBonus: 1.5,
      projType: "multi_chakram"
    }
  ],

  // 18 Interactive Ground Logos / Rune Pads across 4 Expandable Zones
  // Coordinates are in world space (1200 x 850 canvas map)
  // Notice the diagonal fortress wall runs roughly from (210, 810) to (890, 230)
  groundPads: [
    // ================= ZONE 0: CORE SANCTUARY (初始核心聖殿) =================
    {
      id: "pad_FrostStatue",
      zone: 0,
      type: "tower",
      name: "寒冰賢者神像",
      sub: "Frost Sage Statue",
      icon: "❄️",
      x: 425,
      y: 495,
      currency: "gold",
      baseCost: 30,
      costScale: 1.38,
      maxLevel: 60,
      towerKind: "frost",
      desc: "踏上地下魔陣投入金幣，建造並升級銀白寒冰神像，發射穿透冰槍並減速敵群。"
    },
    {
      id: "pad_HammerStatue",
      zone: 0,
      type: "tower",
      name: "黃金戰錘神像",
      sub: "Golden Titan Idol",
      icon: "🔨",
      x: 310,
      y: 595,
      currency: "gold",
      baseCost: 30,
      costScale: 1.40,
      maxLevel: 60,
      towerKind: "hammer",
      desc: "廣告經典黃金巨錘神像！對範圍內怪物轟出雷霆震地波並造成暈眩。"
    },
    {
      id: "pad_FlameStatue",
      zone: 0,
      type: "tower",
      name: "烈焰魔神雕像",
      sub: "Crimson Flame Idol",
      icon: "🔥",
      x: 540,
      y: 395,
      currency: "gold",
      baseCost: 35,
      costScale: 1.38,
      maxLevel: 60,
      towerKind: "flame",
      desc: "召喚赤紅烈焰魔像，投擲高爆火球並在地面留下持續灼燒的熔岩火海。"
    },
    {
      id: "pad_GoldMine",
      zone: 0,
      type: "mine",
      name: "聖殿金脈工坊",
      sub: "Sanctuary Gold Tent",
      icon: "⛺",
      x: 175,
      y: 265,
      currency: "gold",
      baseCost: 50,
      costScale: 1.35,
      maxLevel: 50,
      desc: "左上角藍頂聖殿工坊！每秒自動產出金幣，每升 5 級額外派遣一隻符文小精靈自動撿幣。"
    },
    {
      id: "pad_WallFortify",
      zone: 0,
      type: "wall",
      name: "古域城牆銘刻陣",
      sub: "Bastion Wall Rune",
      icon: "🛡️",
      x: 330,
      y: 415,
      currency: "gold",
      baseCost: 40,
      costScale: 1.36,
      maxLevel: 50,
      desc: "踏上立即修復城牆耐久，並永久提升城牆最大生命值與荊棘反傷護盾。"
    },
    {
      id: "pad_ExpandNorth",
      zone: 0,
      type: "expand",
      unlocksZone: 1,
      name: "擴建：北境劍聖高台",
      sub: "EXPAND: North Cliff Outpost",
      icon: "🗺️",
      x: 525,
      y: 235,
      currency: "gold",
      baseCost: 120,
      costScale: 1.0,
      maxLevel: 1,
      desc: "投入金幣解開北境山崖封印！擴張領地並解鎖【紫電劍聖高台】、【魔力晶泉】與【鐵匠神爐】。"
    },

    // ================= ZONE 1: NORTH VANGUARD OUTPOST (北境劍聖高台) =================
    {
      id: "pad_SwordPedestal",
      zone: 1,
      type: "tower",
      name: "紫電劍聖高台",
      sub: "Blade Sovereign Altar",
      icon: "⚡",
      x: 595,
      y: 195,
      currency: "gold",
      baseCost: 90,
      costScale: 1.42,
      maxLevel: 60,
      towerKind: "sword",
      desc: "重現廣告北境高台紫髮劍聖！居高臨下斬出超遠程紫電次元劍氣，橫掃整條峽谷。"
    },
    {
      id: "pad_ManaWell",
      zone: 1,
      type: "mana_well",
      name: "太古魔力晶泉",
      sub: "Arcane Mana Well",
      icon: "💎",
      x: 390,
      y: 165,
      currency: "gold",
      baseCost: 100,
      costScale: 1.40,
      maxLevel: 40,
      desc: "汲取地脈奧術能量，每秒自動產出【魔力水晶 💎】，並加速所有英雄主動技能冷卻。"
    },
    {
      id: "pad_Runeforge",
      zone: 1,
      type: "forge",
      name: "遠古鐵匠神爐陣",
      sub: "Ancient Runeforge Pad",
      icon: "⚒️",
      x: 270,
      y: 185,
      currency: "gold",
      baseCost: 85,
      costScale: 1.32,
      maxLevel: 99,
      desc: "踏上神爐消耗金幣直接鍛造隨機【RPG 裝備/聖物】掉落地面，並永久強化英雄武器光環！"
    },
    {
      id: "pad_ExpandEast",
      zone: 1,
      type: "expand",
      unlocksZone: 2,
      name: "擴建：東翼星辰防線",
      sub: "EXPAND: East Starlight Wing",
      icon: "🗺️",
      x: 685,
      y: 280,
      currency: "gold",
      baseCost: 350,
      costScale: 1.0,
      maxLevel: 1,
      desc: "向東擴建神殿防線！解鎖【星隕魔導巨砲】、【亡靈古墓召喚陣】與【天罰元素神龕】。"
    },

    // ================= ZONE 2: EAST STARLIGHT BASTION (東翼星辰防線) =================
    {
      id: "pad_StarBallista",
      zone: 2,
      type: "tower",
      name: "星隕魔導巨砲",
      sub: "Starlight Ballista",
      icon: "☄️",
      x: 660,
      y: 315,
      currency: "gold",
      baseCost: 220,
      costScale: 1.42,
      maxLevel: 60,
      towerKind: "ballista",
      desc: "發射高能星辰貫穿光束，對直線上的所有敵人與首領造成毀滅性真實傷害。"
    },
    {
      id: "pad_NecroCrypt",
      zone: 2,
      type: "barracks",
      name: "亡靈古墓召喚陣",
      sub: "Necro-Crypt Obelisk",
      icon: "💀",
      x: 475,
      y: 315,
      currency: "gold",
      baseCost: 180,
      costScale: 1.38,
      maxLevel: 50,
      desc: "定期召喚【遠古骷髏衛士】與【符文石魔像】走出城牆外阻擋並圍毆怪物大軍！"
    },
    {
      id: "pad_CataclysmShrine",
      zone: 2,
      type: "shrine",
      name: "天罰元素神龕陣",
      sub: "Cataclysm Shrine Logo",
      icon: "🌋",
      x: 755,
      y: 185,
      currency: "mana",
      baseCost: 25,
      costScale: 1.15,
      maxLevel: 99,
      desc: "特殊功能魔陣：踏上注入【魔力水晶 💎】，立即引爆全屏【太古流星火雨 + 時間凝滯】！"
    },
    {
      id: "pad_ExpandSouth",
      zone: 2,
      type: "expand",
      unlocksZone: 3,
      name: "擴建：深淵龍魂聖域",
      sub: "EXPAND: Dragon Soul Sanctum",
      icon: "🗺️",
      x: 195,
      y: 585,
      currency: "gold",
      baseCost: 900,
      costScale: 1.0,
      maxLevel: 1,
      desc: "解開南翼太古龍魂封印！解鎖【太古金龍神座】、【虛空黑洞碑】、【皇家傭兵營】與【時空傳送門】。"
    },

    // ================= ZONE 3: DRAGON SOUL SANCTUM (深淵龍魂聖域) =================
    {
      id: "pad_DragonAltar",
      zone: 3,
      type: "tower",
      name: "太古金龍神座",
      sub: "Solar Dragon Altar",
      icon: "🐉",
      x: 215,
      y: 685,
      currency: "gold",
      baseCost: 550,
      costScale: 1.45,
      maxLevel: 60,
      towerKind: "dragon",
      desc: "召喚太古黃金巨龍神像，噴吐橫掃戰場的烈陽龍息，融化敵方護甲。"
    },
    {
      id: "pad_VoidObelisk",
      zone: 3,
      type: "tower",
      name: "虛空黑洞方尖碑",
      sub: "Void Singularity Obelisk",
      icon: "🌀",
      x: 120,
      y: 515,
      currency: "mana",
      baseCost: 45,
      costScale: 1.38,
      maxLevel: 50,
      towerKind: "void",
      desc: "消耗魔力水晶升級，在敵群中央製造引力黑洞，將怪物聚攏並造成最大生命百分比傷害。"
    },
    {
      id: "pad_MercCamp",
      zone: 3,
      type: "mercenary",
      name: "皇家傭兵戰營陣",
      sub: "Royal Mercenary Camp",
      icon: "🏇",
      x: 115,
      y: 390,
      currency: "gold",
      baseCost: 420,
      costScale: 1.40,
      maxLevel: 40,
      desc: "招募【烈陽聖殿騎士】主動出城巡邏作戰，並自動幫你拾取遠處掉落的金幣與寶箱！"
    },
    {
      id: "pad_BossPortal",
      zone: 3,
      type: "portal",
      name: "時空魔王召喚陣",
      sub: "Dimensional Boss Portal",
      icon: "⛩️",
      x: 95,
      y: 660,
      currency: "mana",
      baseCost: 40,
      costScale: 1.25,
      maxLevel: 99,
      desc: "踏上魔陣消耗魔力水晶，立即召喚【遠古深淵魔王】降臨！擊敗必掉靈魂結晶 🔮 與高階神裝。"
    }
  ],

  // 24 Permanent Astral Talent Tree Nodes (3 Branches x 8 Nodes)
  talents: [
    // Combat Branch
    { id: "t_hero_dmg", branch: "combat", name: "符文劍刃強化", icon: "⚔️", maxLv: 25, baseCost: 1, costCurrency: "soul", desc: "英雄基礎傷害永久 +20% / 級", effectPerLv: 0.20 },
    { id: "t_tower_dmg", branch: "combat", name: "古神雕像共鳴", icon: "🗿", maxLv: 25, baseCost: 1, costCurrency: "soul", desc: "所有神像與高台傷害永久 +18% / 級", effectPerLv: 0.18 },
    { id: "t_atk_spd", branch: "combat", name: "極速奧術迴路", icon: "⚡", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "英雄與神像攻擊速度 +6% / 級", effectPerLv: 0.06 },
    { id: "t_crit_chance", branch: "combat", name: "弱點洞察魔眼", icon: "🎯", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "全軍暴擊率 +3% / 級，暴擊傷害 +15% / 級", effectPerLv: 0.03 },
    { id: "t_summon_pow", branch: "combat", name: "亡靈與傭兵戰歌", icon: "💀", maxLv: 20, baseCost: 2, costCurrency: "soul", desc: "召喚骷髏與傭兵生命及攻擊 +25% / 級", effectPerLv: 0.25 },
    { id: "t_boss_slayer", branch: "combat", name: "弒神者威壓", icon: "👑", maxLv: 20, baseCost: 3, costCurrency: "soul", desc: "對首領 (Boss) 與菁英怪造成額外 +25% / 級傷害", effectPerLv: 0.25 },

    // Economy Branch
    { id: "t_gold_drop", branch: "economy", name: "黃金煉金術", icon: "🪙", maxLv: 25, baseCost: 1, costCurrency: "soul", desc: "擊殺怪物掉落金幣量 +20% / 級", effectPerLv: 0.20 },
    { id: "t_pad_discount", branch: "economy", name: "古陣節能銘文", icon: "📉", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "踏上地下魔陣建造/升級消耗降低 3% / 級 (最高 -45%)", effectPerLv: 0.03 },
    { id: "t_mine_yield", branch: "economy", name: "地脈晶礦增幅", icon: "⛏️", maxLv: 20, baseCost: 1, costCurrency: "soul", desc: "金脈工坊與魔力晶泉產量 +25% / 級", effectPerLv: 0.25 },
    { id: "t_magnet_rad", branch: "economy", name: "引力星環擴張", icon: "🧲", maxLv: 15, baseCost: 1, costCurrency: "soul", desc: "英雄拾取金幣與寶物磁鐵範圍 +15% / 級", effectPerLv: 0.15 },
    { id: "t_mana_drop", branch: "economy", name: "奧術結晶萃取", icon: "💎", maxLv: 20, baseCost: 2, costCurrency: "soul", desc: "怪物掉落魔力水晶機率與數量提升 +15% / 級", effectPerLv: 0.15 },
    { id: "t_offline_gain", branch: "economy", name: "時空掛機冥想", icon: "⏳", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "離線與自動巡邏收益倍率 +20% / 級", effectPerLv: 0.20 },

    // Bastion Branch
    { id: "t_wall_hp", branch: "bastion", name: "不朽金剛城牆", icon: "🏰", maxLv: 25, baseCost: 1, costCurrency: "soul", desc: "神殿城牆最大耐久度 +25% / 級", effectPerLv: 0.25 },
    { id: "t_wall_regen", branch: "bastion", name: "大地脈動修復", icon: "🌿", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "城牆每秒自動恢復 0.5% / 級最大耐久", effectPerLv: 0.005 },
    { id: "t_wall_thorns", branch: "bastion", name: "雷霆荊棘反甲", icon: "🌵", maxLv: 20, baseCost: 2, costCurrency: "soul", desc: "攻擊城牆的敵人受到英雄攻擊力 50% / 級的反彈傷害", effectPerLv: 0.50 },
    { id: "t_step_speed", branch: "bastion", name: "瞬發踏陣共鳴", icon: "🏃", maxLv: 10, baseCost: 2, costCurrency: "soul", desc: "踏上地下 Logo 投幣與充能速度提升 +25% / 級", effectPerLv: 0.25 },
    { id: "t_skill_cd", branch: "bastion", name: "星界秘典減冷卻", icon: "📖", maxLv: 15, baseCost: 2, costCurrency: "soul", desc: "主動技能與神龕冷卻時間縮短 3% / 級", effectPerLv: 0.03 },
    { id: "t_start_gold", branch: "bastion", name: "轉生皇族遺產", icon: "🏆", maxLv: 15, baseCost: 3, costCurrency: "soul", desc: "切換章節或古神轉生後初始獲得 +200 / 級金幣", effectPerLv: 200 }
  ],

  // Equipment Rarity Tiers
  rarities: [
    { tier: 0, name: "普通 (Common)", color: "#94a3b8", mult: 1.0 },
    { tier: 1, name: "精良 (Uncommon)", color: "#22c55e", mult: 1.6 },
    { tier: 2, name: "稀有 (Rare)", color: "#38bdf8", mult: 2.6 },
    { tier: 3, name: "史詩 (Epic)", color: "#a855f7", mult: 4.5 },
    { tier: 4, name: "傳說 (Legendary)", color: "#fbbf24", mult: 8.5 },
    { tier: 5, name: "太古神話 (Mythic)", color: "#f43f5e", mult: 18.0 }
  ],

  // Equipment Templates across 4 Slots
  equipTemplates: {
    weapon: [
      { name: "古銅符文劍", icon: "🗡️", statType: "heroDmg", baseVal: 0.25 },
      { name: "寒霜魔導杖", icon: "🦯", statType: "heroDmg", baseVal: 0.35 },
      { name: "黃金泰坦戰錘", icon: "🔨", statType: "heroDmg", baseVal: 0.45 },
      { name: "太古星隕聖劍", icon: "⚔️", statType: "heroDmg", baseVal: 0.65 }
    ],
    armor: [
      { name: "砂岩守衛戰甲", icon: "🦺", statType: "wallHp", baseVal: 0.30 },
      { name: "秘銀符文胸甲", icon: "🛡️", statType: "wallHp", baseVal: 0.42 },
      { name: "烈陽金龍聖鎧", icon: "🥋", statType: "wallHp", baseVal: 0.55 },
      { name: "虛空不朽神袍", icon: "👑", statType: "wallHp", baseVal: 0.80 }
    ],
    ring: [
      { name: "貪婪黃金戒", icon: "💍", statType: "goldBonus", baseVal: 0.25 },
      { name: "星辰奧術戒", icon: "💎", statType: "towerDmg", baseVal: 0.30 },
      { name: "雷神極速指環", icon: "⚡", statType: "towerDmg", baseVal: 0.45 },
      { name: "所羅門王魔戒", icon: "🧿", statType: "goldBonus", baseVal: 0.65 }
    ],
    relic: [
      { name: "遠古太陽聖甲蟲", icon: "🪲", statType: "allMult", baseVal: 0.20 },
      { name: "時空沙漏聖物", icon: "⏳", statType: "allMult", baseVal: 0.32 },
      { name: "不死鳥火羽", icon: "🪶", statType: "allMult", baseVal: 0.48 },
      { name: "創世古神核心", icon: "🔮", statType: "allMult", baseVal: 0.75 }
    ]
  },

  // Enemy Bestiary Codex (14 Distinct Archetypes)
  bestiary: [
    { id: "cultist", name: "紅巾哥布林狂信徒", icon: "👺", hpMult: 1.0, spd: 58, gold: 4, desc: "成群結隊衝向城牆的沙漠狂熱份子（還原廣告紅帽小怪）。" },
    { id: "orc_warrior", name: "重甲半獸人戰狂", icon: "👹", hpMult: 2.8, spd: 42, gold: 10, desc: "手持雙手戰斧的重裝步兵（還原廣告白盔大怪）。" },
    { id: "scorpion", name: "黃金劇毒魔蠍", icon: "🦂", hpMult: 1.6, spd: 76, gold: 7, desc: "移動迅速的沙漠魔物，能快速逼近防線。" },
    { id: "dark_mage", name: "深淵暗影術士", icon: "🧙", hpMult: 2.2, spd: 46, gold: 12, desc: "受到奧術護盾保護的遠古黑魔導。" },
    { id: "stone_golem", name: "黑曜石符文巨像", icon: "🗿", hpMult: 6.5, spd: 28, gold: 25, desc: "生命值極高的岩石巨獸，需要火力集中擊破。" },
    { id: "frost_wolf", name: "極地寒霜魔狼", icon: "🐺", hpMult: 2.4, spd: 88, gold: 14, desc: "成群突襲的冰原掠食者。" },
    { id: "flame_demon", name: "煉獄炎魔督軍", icon: "😈", hpMult: 8.5, spd: 38, gold: 35, desc: "全身纏繞地獄業火的巨型惡魔。" },
    { id: "void_reaver", name: "星界虛空收割者", icon: "👾", hpMult: 14.0, spd: 52, gold: 60, desc: "來自時間裂隙的高階虛空生物。" },
    { id: "realm_boss", name: "遠古領域主宰 (Boss)", icon: "🐲", hpMult: 45.0, spd: 24, gold: 250, desc: "每 10 波或透過時空傳送陣降臨的滅世巨型首領！" }
  ],

  // Guided Story Quests (Rolling progression for 10+ hours)
  quests: [
    { id: 1, title: "踏上寒冰魔陣建造第一座神像", type: "pad_lv", targetId: "pad_FrostStatue", goal: 1, rewardGold: 60, rewardMana: 5, rewardSoul: 1 },
    { id: 2, title: "建造廣告經典【黃金戰錘神像】", type: "pad_lv", targetId: "pad_HammerStatue", goal: 1, rewardGold: 80, rewardMana: 8, rewardSoul: 1 },
    { id: 3, title: "建造左上角【聖殿金脈工坊】產金", type: "pad_lv", targetId: "pad_GoldMine", goal: 1, rewardGold: 100, rewardMana: 10, rewardSoul: 1 },
    { id: 4, title: "擊退第 3 波魔物大軍", type: "wave", goal: 3, rewardGold: 150, rewardMana: 15, rewardSoul: 2 },
    { id: 5, title: "踏上擴建魔陣：解鎖【北境劍聖高台】", type: "zone", goal: 1, rewardGold: 220, rewardMana: 20, rewardSoul: 2 },
    { id: 6, title: "在北境高台召喚【紫電劍聖】", type: "pad_lv", targetId: "pad_SwordPedestal", goal: 1, rewardGold: 300, rewardMana: 25, rewardSoul: 2 },
    { id: 7, title: "踏上【遠古鐵匠神爐】鍛造第一件裝備", type: "pad_lv", targetId: "pad_Runeforge", goal: 1, rewardGold: 350, rewardMana: 30, rewardSoul: 3 },
    { id: 8, title: "將任意神像升級至 Lv.5", type: "any_tower_lv", goal: 5, rewardGold: 500, rewardMana: 40, rewardSoul: 3 },
    { id: 9, title: "踏上擴建魔陣：解鎖【東翼星辰防線】", type: "zone", goal: 2, rewardGold: 800, rewardMana: 60, rewardSoul: 4 },
    { id: 10, title: "突破第 10 波並擊敗領域首領", type: "wave", goal: 10, rewardGold: 1500, rewardMana: 100, rewardSoul: 6 },
    { id: 11, title: "踏上擴建魔陣：解鎖【深淵龍魂聖域】", type: "zone", goal: 3, rewardGold: 2500, rewardMana: 150, rewardSoul: 8 },
    { id: 12, title: "召喚【太古金龍神座】", type: "pad_lv", targetId: "pad_DragonAltar", goal: 1, rewardGold: 4000, rewardMana: 220, rewardSoul: 10 },
    { id: 13, title: "將任意神像進化至 Lv.15 (黃金高階形態)", type: "any_tower_lv", goal: 15, rewardGold: 8000, rewardMana: 400, rewardSoul: 15 },
    { id: 14, title: "通關第 25 波魔物狂潮", type: "wave", goal: 25, rewardGold: 18000, rewardMana: 800, rewardSoul: 25 },
    { id: 15, title: "征服第一章 50 波並前往第二章古域", type: "wave", goal: 50, rewardGold: 50000, rewardMana: 2000, rewardSoul: 50 }
  ]
};
