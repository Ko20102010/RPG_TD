/* ==========================================================================
   Ancient Arcane Bastion (古域魔陣：守護神殿) v1.6.0 - RPG Data & Definitions
   - Stage-Specific Dynamic Maps (realmMapConfigs):
     * Stage 1: Single Wall & Single Gate (1 Wall, 1 Gate, 1 Keep, 1 Road)
     * Stage 2: 1 Long Line Canyon Road with 3 Checkpoint Walls & Massive Hordes
     * Stage 3: 4 Walls & 4 Gates (East, South, West, North - ESWT)
     * Stage 4: Multiple Halls (Forward Outpost Keep + Main Citadel Keep)
     * Stage 5: Grand Apex Astral Mega-Fortress
   - Tower Locking: Once built (Lv >= 1), tower type is locked.
   - 3 Building Types -> 10 Blueprints -> 4-Tier Skill Tree
   ========================================================================== */

window.GAME_DATA = {
  version: "1.6.0",

  // 3 Strategic Building / Tower Categories for Type-First Selection
  towerTypes: [
    {
      id: "type_elemental",
      name: "元素魔塔",
      shortName: "元素塔",
      icon: "⚡",
      color: "#38bdf8",
      roleDesc: "法術控場與範圍元素打擊",
      summary: "【元素魔塔系】專精於冰霜減速、連鎖雷電麻痺與持續熔岩火海。適合建造於城門口與轉角，能大幅延緩魔物推進並高效清理群怪。"
    },
    {
      id: "type_siege",
      name: "破甲重塔",
      shortName: "重砲塔",
      icon: "☄️",
      color: "#c084fc",
      roleDesc: "超遠程貫穿、重砲破甲與黑洞聚怪",
      summary: "【破甲重塔系】具備超遠射程與高穿甲爆發力，涵蓋直線劍氣貫穿、星辰巨砲單體破甲與引力黑洞聚怪，是對抗重甲巨像與首領 Boss 的核心主力。"
    },
    {
      id: "type_barracks",
      name: "派兵兵營",
      shortName: "兵營系",
      icon: "🛡️",
      color: "#fbbf24",
      roleDesc: "定期召喚精銳部隊出城攔截阻擋",
      summary: "【派兵兵營系】可定期派遣鐵衛步兵、精靈弓手、皇家聖騎與泰坦魔像走上道路，正面攔截並卡住魔物行進路線，與後排魔塔形成完美防線配合！"
    }
  ],

  // 10 Unlockable Player-Choice Blueprints
  towerBlueprints: [
    {
      id: "bp_arcane_spire",
      index: 1,
      typeId: "type_elemental",
      name: "奧術塔",
      engName: "Arcane Spire",
      engLabel: "ARCANE\nSPIRE",
      category: "tower",
      icon: "🏰",
      color: "#38bdf8",
      roofColor: "#2563eb",
      unlockedByDefault: true,
      unlockCost: 0,
      unlockCurrency: "gold",
      buildCostGold: 35,
      upgradeScale: 1.36,
      baseDmg: 26,
      atkRate: 0.60,
      range: 560,
      projKind: "frost",
      counterTags: ["swarm", "fast", "flying"],
      roleTag: "追蹤減速",
      adviceTag: "三連發冰晶・減速 55%",
      adviceWhen: "高速狼群或大量小怪時，奧術塔連發減速最有效。",
      desc: "齊射 3 枚奧術追蹤冰晶，命中後使魔物移動速度降低 55%（持續 2.8 秒），控場主力基石。"
    },
    {
      id: "bp_knight_statue",
      index: 2,
      typeId: "type_elemental",
      name: "雷霆像",
      engName: "Knight Statue",
      engLabel: "THUNDER\nSTATUE",
      category: "tower",
      icon: "🗿",
      color: "#60a5fa",
      roofColor: "#dc2626",
      unlockedByDefault: true,
      unlockCost: 0,
      unlockCurrency: "gold",
      buildCostGold: 40,
      upgradeScale: 1.38,
      baseDmg: 38,
      atkRate: 0.90,
      range: 500,
      projKind: "hammer",
      counterTags: ["swarm", "armored"],
      roleTag: "連鎖麻痺",
      adviceTag: "連鎖閃電・群體暈眩",
      adviceWhen: "成群骷髏與重甲獸人時，連鎖閃電可彈跳麻痺多名敵軍。",
      desc: "引導九天雷霆劈向敵群，閃電在周圍 3 名魔物間彈跳並造成 0.45 秒麻痺暈眩。"
    },
    {
      id: "bp_flame_mage",
      index: 3,
      typeId: "type_elemental",
      name: "烈焰台",
      engName: "Pyro Altar",
      engLabel: "FLAME\nALTAR",
      category: "tower",
      icon: "🔥",
      color: "#f97316",
      roofColor: "#ea580c",
      unlockedByDefault: false,
      unlockCost: 120,
      unlockCurrency: "gold",
      buildCostGold: 55,
      upgradeScale: 1.38,
      baseDmg: 46,
      atkRate: 0.80,
      range: 520,
      projKind: "flame",
      counterTags: ["swarm", "regen", "undead"],
      roleTag: "持續火海",
      adviceTag: "範圍火球・地面熔岩灼燒",
      adviceWhen: "敵群聚集在城門或狹道時，火海能迅速融化敵潮。",
      desc: "發射高爆烈焰火球，命中處形成持續 3.2 秒的熔岩火海，造成高頻範圍灼燒。"
    },
    {
      id: "bp_guard_barracks",
      index: 4,
      typeId: "type_barracks",
      name: "鐵衛營",
      engName: "Guard Barracks",
      engLabel: "GUARD\nBARRACKS",
      category: "barracks",
      icon: "🛡️",
      color: "#fbbf24",
      roofColor: "#b45309",
      unlockedByDefault: false,
      unlockCost: 150,
      unlockCurrency: "gold",
      buildCostGold: 65,
      upgradeScale: 1.36,
      baseDmg: 30,
      troopHp: 220,
      troopDmg: 28,
      spawnInterval: 4.8,
      troopCount: 1,
      troopType: "guard",
      counterTags: ["melee", "fast", "boss"],
      roleTag: "持盾攔截",
      adviceTag: "召喚持盾步兵・正面阻擋",
      adviceWhen: "建在道路旁可直接派兵出城迎戰，阻擋怪物靠近城牆！",
      desc: "定期派遣持盾聖堂鐵衛沿道前進，正面卡位阻截魔物，為後排爭取輸出時間。"
    },
    {
      id: "bp_archer_lodge",
      index: 5,
      typeId: "type_barracks",
      name: "弓手營",
      engName: "Archer Lodge",
      engLabel: "ARCHER\nLODGE",
      category: "barracks",
      icon: "🏹",
      color: "#22c55e",
      roofColor: "#15803d",
      unlockedByDefault: false,
      unlockCost: 240,
      unlockCurrency: "gold",
      buildCostGold: 85,
      upgradeScale: 1.38,
      baseDmg: 35,
      troopHp: 160,
      troopDmg: 32,
      spawnInterval: 5.2,
      troopCount: 1,
      troopType: "archer",
      counterTags: ["ranged", "mage", "fast"],
      roleTag: "遠程齊射",
      adviceTag: "召喚精靈遊俠・三連飛輪箭",
      adviceWhen: "對付後排術士與高速怪，精靈射手能遠程風箏牽制。",
      desc: "招募精靈射手出城巡邏，向魔物連續齊射 3 枚穿透飛輪箭，火力密集。"
    },
    {
      id: "bp_blade_altar",
      index: 6,
      typeId: "type_siege",
      name: "劍聖壇",
      engName: "Blade Altar",
      engLabel: "BLADE\nALTAR",
      category: "tower",
      icon: "⚡",
      color: "#c084fc",
      roofColor: "#7e22ce",
      unlockedByDefault: false,
      unlockCost: 380,
      unlockCurrency: "gold",
      buildCostGold: 110,
      upgradeScale: 1.40,
      baseDmg: 68,
      atkRate: 0.70,
      range: 680,
      projKind: "sword",
      counterTags: ["line", "swarm", "mage"],
      roleTag: "直線貫穿",
      adviceTag: "超遠程劍氣・直線貫穿 4 敵",
      adviceWhen: "建在筆直道路旁，劍氣能一舉貫穿整排前進的怪物。",
      desc: "凝聚古域劍意斬出超遠程次元劍氣，直線貫穿路徑上最多 4 名敵人。"
    },
    {
      id: "bp_star_cannon",
      index: 7,
      typeId: "type_siege",
      name: "星隕砲",
      engName: "Siege Cannon",
      engLabel: "SIEGE\nCANNON",
      category: "tower",
      icon: "☄️",
      color: "#22d3ee",
      roofColor: "#0e7490",
      unlockedByDefault: false,
      unlockCost: 580,
      unlockCurrency: "gold",
      buildCostGold: 160,
      upgradeScale: 1.42,
      baseDmg: 135,
      atkRate: 1.20,
      range: 740,
      projKind: "ballista",
      counterTags: ["armored", "golem", "boss"],
      roleTag: "重型破甲",
      adviceTag: "超高單體重砲・破甲貫穿",
      adviceWhen: "Boss 波與石巨像來襲時必備！超高單體重砲破甲打擊。",
      desc: "超遠射程（740）的重型星辰破甲巨砲，單發傷害極高，專殺石巨像與首領。"
    },
    {
      id: "bp_cavalry_stable",
      index: 8,
      typeId: "type_barracks",
      name: "聖騎營",
      engName: "Cavalry Stable",
      engLabel: "KNIGHT\nSTABLE",
      category: "barracks",
      icon: "🏇",
      color: "#f59e0b",
      roofColor: "#b45309",
      unlockedByDefault: false,
      unlockCost: 65,
      unlockCurrency: "mana",
      buildCostGold: 220,
      upgradeScale: 1.40,
      baseDmg: 75,
      troopHp: 380,
      troopDmg: 45,
      spawnInterval: 5.8,
      troopCount: 1,
      troopType: "cavalry",
      counterTags: ["boss", "armored", "loot"],
      roleTag: "衝鋒撿幣",
      adviceTag: "召喚重裝聖騎・衝鋒兼撿金幣",
      adviceWhen: "聖騎士血量極厚且能自動拾取外圍道路掉落的金幣寶箱。",
      desc: "訓練白馬烈陽聖騎士出城高速衝鋒抗線，並自動拾取沿途掉落的金幣與魔晶！"
    },
    {
      id: "bp_void_obelisk",
      index: 9,
      typeId: "type_siege",
      name: "黑洞碑",
      engName: "Void Obelisk",
      engLabel: "VOID\nOBELISK",
      category: "tower",
      icon: "🌀",
      color: "#a855f7",
      roofColor: "#581c87",
      unlockedByDefault: false,
      unlockCost: 90,
      unlockCurrency: "mana",
      buildCostGold: 290,
      upgradeScale: 1.42,
      baseDmg: 98,
      atkRate: 1.05,
      range: 600,
      projKind: "void",
      counterTags: ["boss", "golem", "swarm"],
      roleTag: "聚怪真實傷",
      adviceTag: "引力黑洞聚怪・附帶 3% 最大生命傷",
      adviceWhen: "怪物數量極多或高血量炎魔來襲時，黑洞可強制聚怪並削血。",
      desc: "撕裂空間釋放引力黑洞，聚攏 140 範圍敵軍並造成目標最大生命 3% 真實傷害！"
    },
    {
      id: "bp_dragon_golem_foundry",
      index: 10,
      typeId: "type_barracks",
      name: "金龍殿",
      engName: "Dragon Temple",
      engLabel: "DRAGON\nTEMPLE",
      category: "barracks",
      icon: "🐉",
      color: "#f43f5e",
      roofColor: "#9f1239",
      unlockedByDefault: false,
      unlockCost: 140,
      unlockCurrency: "mana",
      buildCostGold: 420,
      upgradeScale: 1.45,
      baseDmg: 185,
      troopHp: 750,
      troopDmg: 80,
      spawnInterval: 7.5,
      troopCount: 1,
      troopType: "golem",
      counterTags: ["boss", "swarm", "armored"],
      roleTag: "龍息魔像",
      adviceTag: "召喚泰坦巨像・普攻暈眩重擊",
      adviceWhen: "終極鎮殿兵營！定期召喚超高血量的泰坦魔像正面碾壓敵軍。",
      desc: "古域終極神殿！定期召喚 750+ 基礎生命且附帶重擊暈眩的符文泰坦巨像！"
    }
  ],

  // 5 Strategic Realm Map Configurations (Different Stage = Different Map!)
  realmMapConfigs: {
    // ------------------------------------------------------------------------
    // STAGE 1: 古林單門要塞 (Single Gate, Single Wall, 1 Road, 1 Keep)
    // ------------------------------------------------------------------------
    1: {
      width: 2400,
      height: 1500,
      layoutType: "single_wall_single_gate",
      halls: [
        { id: "hall_main", name: "守護大本營", x: 280, y: 750, baseHp: 1800, hpPerLevel: 450, radius: 46, isMain: true }
      ],
      wallSegments: [
        { id: "wall_n", type: "wall", x1: 950, y1: 100, x2: 950, y2: 660, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_east", type: "gate", x1: 950, y1: 660, x2: 950, y2: 840, isGate: true, isSolid: false, name: "東城門", thickness: 52 },
        { id: "wall_s", type: "wall", x1: 950, y1: 840, x2: 950, y2: 1400, isSolid: true, isGate: false, thickness: 46 }
      ],
      bastionTurrets: [
        { x: 950, y: 100, name: "北角樓" },
        { x: 950, y: 660, name: "東門左塔" },
        { x: 950, y: 840, name: "東門右塔" },
        { x: 950, y: 1400, name: "南角樓" }
      ],
      roads: [
        {
          id: "road_main",
          name: "古林大道",
          gateId: "gate_east",
          waypoints: [
            { x: 2300, y: 750 },
            { x: 1950, y: 720 },
            { x: 1600, y: 800 },
            { x: 1250, y: 750 },
            { x: 950, y: 750 }, // Gate
            { x: 620, y: 750 },
            { x: 280, y: 750 }  // Town Hall
          ]
        }
      ],
      groundPads: [
        { id: "pad_TownHall", zone: 0, type: "town_hall", name: "大本營", icon: "🏛️", x: 280, y: 750, currency: "gold", baseCost: 50, costScale: 1.35, maxLevel: 50, desc: "守護大本營核心！升級提升生命並發射自衛弩砲。" },
        { id: "pad_GoldMine", zone: 0, type: "mine", name: "金庫", icon: "🪙", x: 280, y: 520, currency: "gold", baseCost: 40, costScale: 1.35, maxLevel: 50, desc: "地下黃金礦脈，每秒產金並派小精靈撿幣。" },
        { id: "pad_WallFortify", zone: 0, type: "wall", name: "城防", icon: "🧱", x: 600, y: 750, currency: "gold", baseCost: 35, costScale: 1.35, maxLevel: 50, desc: "強化城牆與東城門耐久，立即修復 50% 城防。" },
        { id: "pad_ManaWell", zone: 0, type: "mana_well", name: "魔晶井", icon: "💎", x: 420, y: 350, currency: "gold", baseCost: 75, costScale: 1.38, maxLevel: 40, desc: "產出魔力水晶 💎，縮短技能冷卻。" },
        { id: "pad_Runeforge", zone: 0, type: "forge", name: "神爐", icon: "⚒️", x: 320, y: 1050, currency: "gold", baseCost: 80, costScale: 1.32, maxLevel: 99, desc: "鍛造聖物裝備寶箱，強化武器等級。" },
        { id: "pad_GateInner", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_arcane_spire", name: "門內陣位", icon: "🏰", x: 780, y: 640, towerX: 820, towerY: 580, currency: "gold", baseCost: 30, costScale: 1.36, maxLevel: 60, desc: "東城門內側防守陣位，可自選魔塔或兵營。" },
        { id: "pad_GateSouthInner", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_knight_statue", name: "內城南陣", icon: "🗿", x: 780, y: 860, towerX: 820, towerY: 920, currency: "gold", baseCost: 35, costScale: 1.38, maxLevel: 60, desc: "城門南側陣位，火力覆蓋城門入口。" },
        { id: "pad_ExpandEast", zone: 0, type: "expand", unlocksZone: 1, name: "擴建城外", icon: "🔒", x: 1100, y: 750, currency: "gold", baseCost: 95, costScale: 1.0, maxLevel: 1, desc: "解鎖城外古林古道建地與天罰神龕。" },
        { id: "pad_GateFront", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_guard_barracks", name: "門前哨站", icon: "🛡️", x: 1220, y: 650, towerX: 1220, towerY: 600, currency: "gold", baseCost: 65, costScale: 1.38, maxLevel: 60, desc: "城門前咽喉陣位，極力推薦建造派兵兵營堵門！" },
        { id: "pad_RoadMid", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_flame_mage", name: "古道中陣", icon: "🔥", x: 1550, y: 880, towerX: 1550, towerY: 830, currency: "gold", baseCost: 85, costScale: 1.38, maxLevel: 60, desc: "道路中段開闊陣位，適合範圍火海輸出。" },
        { id: "pad_Shrine", zone: 1, type: "shrine", name: "天罰神龕", icon: "🌋", x: 1650, y: 480, currency: "mana", baseCost: 20, costScale: 1.15, maxLevel: 99, desc: "注入魔晶引爆全屏流星天罰火雨。" },
        { id: "pad_BossPortal", zone: 1, type: "portal", name: "魔王召喚", icon: "⛩️", x: 2050, y: 550, currency: "mana", baseCost: 35, costScale: 1.25, maxLevel: 99, desc: "召喚領域首領，擊敗必掉靈魂與神裝。" }
      ]
    },

    // ------------------------------------------------------------------------
    // STAGE 2: 荒漠長道峽谷 (1 Long Road with 3 Checkpoint Walls, Monster Swarms)
    // ------------------------------------------------------------------------
    2: {
      width: 3200,
      height: 1300,
      layoutType: "long_line_three_checkpoints",
      halls: [
        { id: "hall_main", name: "守護大本營", x: 260, y: 650, baseHp: 3200, hpPerLevel: 600, radius: 46, isMain: true }
      ],
      wallSegments: [
        // Checkpoint 1 (Outer Redoubt) at x = 2350
        { id: "cp1_wall_n", type: "wall", x1: 2350, y1: 100, x2: 2350, y2: 560, isSolid: true, isGate: false, thickness: 46, cpIndex: 1 },
        { id: "cp1_gate", type: "gate", x1: 2350, y1: 560, x2: 2350, y2: 740, isGate: true, isSolid: false, name: "第一道前哨關卡", thickness: 52, cpIndex: 1 },
        { id: "cp1_wall_s", type: "wall", x1: 2350, y1: 740, x2: 2350, y2: 1200, isSolid: true, isGate: false, thickness: 46, cpIndex: 1 },

        // Checkpoint 2 (Mid Fortress) at x = 1500
        { id: "cp2_wall_n", type: "wall", x1: 1500, y1: 100, x2: 1500, y2: 560, isSolid: true, isGate: false, thickness: 46, cpIndex: 2 },
        { id: "cp2_gate", type: "gate", x1: 1500, y1: 560, x2: 1500, y2: 740, isGate: true, isSolid: false, name: "第二道要塞關卡", thickness: 52, cpIndex: 2 },
        { id: "cp2_wall_s", type: "wall", x1: 1500, y1: 740, x2: 1500, y2: 1200, isSolid: true, isGate: false, thickness: 46, cpIndex: 2 },

        // Checkpoint 3 (Inner Keep Gate) at x = 750
        { id: "cp3_wall_n", type: "wall", x1: 750, y1: 100, x2: 750, y2: 560, isSolid: true, isGate: false, thickness: 46, cpIndex: 3 },
        { id: "cp3_gate", type: "gate", x1: 750, y1: 560, x2: 750, y2: 740, isGate: true, isSolid: false, name: "第三道王城關卡", thickness: 52, cpIndex: 3 },
        { id: "cp3_wall_s", type: "wall", x1: 750, y1: 740, x2: 750, y2: 1200, isSolid: true, isGate: false, thickness: 46, cpIndex: 3 }
      ],
      bastionTurrets: [
        { x: 2350, y: 560, name: "前哨左塔" }, { x: 2350, y: 740, name: "前哨右塔" },
        { x: 1500, y: 560, name: "中軍左塔" }, { x: 1500, y: 740, name: "中軍右塔" },
        { x: 750, y: 560, name: "內閘左塔" }, { x: 750, y: 740, name: "內閘右塔" }
      ],
      roads: [
        {
          id: "road_long",
          name: "長道峽谷",
          waypoints: [
            { x: 3100, y: 650 },
            { x: 2750, y: 650 },
            { x: 2350, y: 650 }, // Checkpoint 1
            { x: 1950, y: 650 },
            { x: 1500, y: 650 }, // Checkpoint 2
            { x: 1100, y: 650 },
            { x: 750, y: 650 },  // Checkpoint 3
            { x: 450, y: 650 },
            { x: 260, y: 650 }   // Town Hall
          ]
        }
      ],
      groundPads: [
        { id: "pad_TownHall", zone: 0, type: "town_hall", name: "大本營", icon: "🏛️", x: 260, y: 650, currency: "gold", baseCost: 65, costScale: 1.35, maxLevel: 50, desc: "大本營核心！" },
        { id: "pad_GoldMine", zone: 0, type: "mine", name: "金庫", icon: "🪙", x: 260, y: 440, currency: "gold", baseCost: 50, costScale: 1.35, maxLevel: 50, desc: "地下產金。" },
        { id: "pad_WallFortify", zone: 0, type: "wall", name: "城防", icon: "🧱", x: 520, y: 650, currency: "gold", baseCost: 45, costScale: 1.35, maxLevel: 50, desc: "強化三大關卡防禦！" },
        { id: "pad_CP3_Top", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_star_cannon", name: "內閘北陣", icon: "☄️", x: 620, y: 520, towerX: 620, towerY: 470, currency: "gold", baseCost: 45, costScale: 1.38, maxLevel: 60, desc: "第三關卡內側重砲陣位。" },
        { id: "pad_CP3_Bot", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_arcane_spire", name: "內閘南陣", icon: "🏰", x: 620, y: 780, towerX: 620, towerY: 830, currency: "gold", baseCost: 45, costScale: 1.38, maxLevel: 60, desc: "第三關卡內側冰霜陣位。" },
        { id: "pad_ExpandCP2", zone: 0, type: "expand", unlocksZone: 1, name: "解鎖中軍", icon: "🔒", x: 920, y: 650, currency: "gold", baseCost: 150, costScale: 1.0, maxLevel: 1, desc: "解鎖第二道要塞關卡建地。" },
        { id: "pad_CP2_Top", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_blade_altar", name: "中軍北陣", icon: "⚡", x: 1350, y: 520, towerX: 1350, towerY: 470, currency: "gold", baseCost: 90, costScale: 1.38, maxLevel: 60, desc: "第二關卡前線貫穿陣位。" },
        { id: "pad_CP2_Bot", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_guard_barracks", name: "中軍兵營", icon: "🛡️", x: 1350, y: 780, towerX: 1350, towerY: 830, currency: "gold", baseCost: 95, costScale: 1.38, maxLevel: 60, desc: "第二關卡派兵陣位。" },
        { id: "pad_ExpandCP1", zone: 1, type: "expand", unlocksZone: 2, name: "解鎖前哨", icon: "🔒", x: 1750, y: 650, currency: "gold", baseCost: 350, costScale: 1.0, maxLevel: 1, desc: "解鎖第一道前哨關卡建地。" },
        { id: "pad_CP1_Top", zone: 2, type: "tower", customizable: true, defaultBlueprint: "bp_flame_mage", name: "前哨北陣", icon: "🔥", x: 2200, y: 520, towerX: 2200, towerY: 470, currency: "gold", baseCost: 140, costScale: 1.38, maxLevel: 60, desc: "第一道關卡迎敵火海。" },
        { id: "pad_CP1_Bot", zone: 2, type: "tower", customizable: true, defaultBlueprint: "bp_cavalry_stable", name: "前哨聖騎", icon: "🏇", x: 2200, y: 780, towerX: 2200, towerY: 830, currency: "gold", baseCost: 160, costScale: 1.38, maxLevel: 60, desc: "第一道關卡騎兵衝鋒。" },
        { id: "pad_Shrine", zone: 2, type: "shrine", name: "天罰神龕", icon: "🌋", x: 2550, y: 450, currency: "mana", baseCost: 30, costScale: 1.15, maxLevel: 99, desc: "流星天罰火雨。" }
      ]
    },

    // ------------------------------------------------------------------------
    // STAGE 3: 幽暗十字要塞 (4 Walls & 4 Gates: ESWT / ESWN)
    // ------------------------------------------------------------------------
    3: {
      width: 2400,
      height: 2400,
      layoutType: "four_walls_four_gates",
      halls: [
        { id: "hall_main", name: "守護大本營", x: 1200, y: 1200, baseHp: 5500, hpPerLevel: 900, radius: 50, isMain: true }
      ],
      wallSegments: [
        // North Wall & Gate (at y = 750)
        { id: "w_n_l", type: "wall", x1: 750, y1: 750, x2: 1110, y2: 750, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_north", type: "gate", x1: 1110, y1: 750, x2: 1290, y2: 750, isGate: true, isSolid: false, name: "北城門", thickness: 52 },
        { id: "w_n_r", type: "wall", x1: 1290, y1: 750, x2: 1650, y2: 750, isSolid: true, isGate: false, thickness: 46 },

        // East Wall & Gate (at x = 1650)
        { id: "w_e_t", type: "wall", x1: 1650, y1: 750, x2: 1650, y2: 1110, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_east", type: "gate", x1: 1650, y1: 1110, x2: 1650, y2: 1290, isGate: true, isSolid: false, name: "東城門", thickness: 52 },
        { id: "w_e_b", type: "wall", x1: 1650, y1: 1290, x2: 1650, y2: 1650, isSolid: true, isGate: false, thickness: 46 },

        // South Wall & Gate (at y = 1650)
        { id: "w_s_r", type: "wall", x1: 1650, y1: 1650, x2: 1290, y2: 1650, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_south", type: "gate", x1: 1290, y1: 1650, x2: 1110, y2: 1650, isGate: true, isSolid: false, name: "南城門", thickness: 52 },
        { id: "w_s_l", type: "wall", x1: 1110, y1: 1650, x2: 750, y2: 1650, isSolid: true, isGate: false, thickness: 46 },

        // West Wall & Gate (at x = 750)
        { id: "w_w_b", type: "wall", x1: 750, y1: 1650, x2: 750, y2: 1290, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_west", type: "gate", x1: 750, y1: 1290, x2: 750, y2: 1110, isGate: true, isSolid: false, name: "西城門", thickness: 52 },
        { id: "w_w_t", type: "wall", x1: 750, y1: 1110, x2: 750, y2: 750, isSolid: true, isGate: false, thickness: 46 }
      ],
      bastionTurrets: [
        { x: 750, y: 750, name: "西北角樓" }, { x: 1650, y: 750, name: "東北角樓" },
        { x: 1650, y: 1650, name: "東南角樓" }, { x: 750, y: 1650, name: "西南角樓" }
      ],
      roads: [
        { id: "road_north", name: "北道", gateId: "gate_north", waypoints: [{ x: 1200, y: 150 }, { x: 1200, y: 750 }, { x: 1200, y: 1200 }] },
        { id: "road_east", name: "東道", gateId: "gate_east", waypoints: [{ x: 2250, y: 1200 }, { x: 1650, y: 1200 }, { x: 1200, y: 1200 }] },
        { id: "road_south", name: "南道", gateId: "gate_south", waypoints: [{ x: 1200, y: 2250 }, { x: 1200, y: 1650 }, { x: 1200, y: 1200 }] },
        { id: "road_west", name: "西道", gateId: "gate_west", waypoints: [{ x: 150, y: 1200 }, { x: 750, y: 1200 }, { x: 1200, y: 1200 }] }
      ],
      groundPads: [
        { id: "pad_TownHall", zone: 0, type: "town_hall", name: "大本營", icon: "🏛️", x: 1200, y: 1200, currency: "gold", baseCost: 80, costScale: 1.35, maxLevel: 50, desc: "中心神殿要塞！" },
        { id: "pad_WallFortify", zone: 0, type: "wall", name: "四方城防", icon: "🧱", x: 1200, y: 1350, currency: "gold", baseCost: 60, costScale: 1.35, maxLevel: 50, desc: "強化四面城牆與四座城門耐久。" },
        { id: "pad_GoldMine", zone: 0, type: "mine", name: "金庫", icon: "🪙", x: 1050, y: 1050, currency: "gold", baseCost: 60, costScale: 1.35, maxLevel: 50, desc: "四方要塞產金金庫。" },
        { id: "pad_ManaWell", zone: 0, type: "mana_well", name: "魔晶井", icon: "💎", x: 1350, y: 1050, currency: "gold", baseCost: 110, costScale: 1.38, maxLevel: 40, desc: "魔力水晶採集井。" },
        { id: "pad_GateN", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_arcane_spire", name: "北門陣位", icon: "🏰", x: 1200, y: 880, towerX: 1200, towerY: 830, currency: "gold", baseCost: 55, costScale: 1.38, maxLevel: 60, desc: "守護北城門的陣位。" },
        { id: "pad_GateE", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_knight_statue", name: "東門陣位", icon: "🗿", x: 1520, y: 1200, towerX: 1570, towerY: 1200, currency: "gold", baseCost: 55, costScale: 1.38, maxLevel: 60, desc: "守護東城門的陣位。" },
        { id: "pad_GateS", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_flame_mage", name: "南門陣位", icon: "🔥", x: 1200, y: 1520, towerX: 1200, towerY: 1570, currency: "gold", baseCost: 55, costScale: 1.38, maxLevel: 60, desc: "守護南城門的陣位。" },
        { id: "pad_GateW", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_blade_altar", name: "西門陣位", icon: "⚡", x: 880, y: 1200, towerX: 830, towerY: 1200, currency: "gold", baseCost: 55, costScale: 1.38, maxLevel: 60, desc: "守護西城門的陣位。" },
        { id: "pad_ExpandOuter", zone: 0, type: "expand", unlocksZone: 1, name: "解鎖四方外圍", icon: "🔒", x: 1200, y: 620, currency: "gold", baseCost: 450, costScale: 1.0, maxLevel: 1, desc: "解鎖城外四面外哨陣位與神龕。" },
        { id: "pad_OutN", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_guard_barracks", name: "北道外哨", icon: "🛡️", x: 1200, y: 450, towerX: 1200, towerY: 400, currency: "gold", baseCost: 150, costScale: 1.38, maxLevel: 60, desc: "北路外哨兵營。" },
        { id: "pad_OutE", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_star_cannon", name: "東道外哨", icon: "☄️", x: 1950, y: 1200, towerX: 2000, towerY: 1200, currency: "gold", baseCost: 160, costScale: 1.38, maxLevel: 60, desc: "東路外哨重砲。" },
        { id: "pad_Shrine", zone: 1, type: "shrine", name: "天罰神龕", icon: "🌋", x: 1950, y: 450, currency: "mana", baseCost: 35, costScale: 1.15, maxLevel: 99, desc: "全圖天罰流星火雨。" }
      ]
    },

    // ------------------------------------------------------------------------
    // STAGE 4: 冰封雙子王城 (Multiple Halls: Outpost + Main Citadel Keep)
    // ------------------------------------------------------------------------
    4: {
      width: 2800,
      height: 1600,
      layoutType: "multiple_halls_outpost",
      halls: [
        { id: "hall_main", name: "守護大本營", x: 300, y: 800, baseHp: 8000, hpPerLevel: 1200, radius: 46, isMain: true },
        { id: "hall_outpost", name: "前哨要塞廳", x: 1500, y: 800, baseHp: 4500, hpPerLevel: 800, radius: 42, isOutpost: true }
      ],
      wallSegments: [
        // Outer Wall protecting Outpost (at x = 2050)
        { id: "w_out_n", type: "wall", x1: 2050, y1: 150, x2: 2050, y2: 710, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_outpost", type: "gate", x1: 2050, y1: 710, x2: 2050, y2: 890, isGate: true, isSolid: false, name: "前哨要塞門", thickness: 52 },
        { id: "w_out_s", type: "wall", x1: 2050, y1: 890, x2: 2050, y2: 1450, isSolid: true, isGate: false, thickness: 46 },

        // Inner Wall protecting Main Citadel (at x = 900)
        { id: "w_inn_n", type: "wall", x1: 900, y1: 150, x2: 900, y2: 710, isSolid: true, isGate: false, thickness: 46 },
        { id: "gate_inner", type: "gate", x1: 900, y1: 710, x2: 900, y2: 890, isGate: true, isSolid: false, name: "王城主內門", thickness: 52 },
        { id: "w_inn_s", type: "wall", x1: 900, y1: 890, x2: 900, y2: 1450, isSolid: true, isGate: false, thickness: 46 }
      ],
      bastionTurrets: [
        { x: 2050, y: 710, name: "前哨左塔" }, { x: 2050, y: 890, name: "前哨右塔" },
        { x: 900, y: 710, name: "王城左塔" }, { x: 900, y: 890, name: "王城右塔" }
      ],
      roads: [
        {
          id: "road_twin",
          name: "雙子要塞大道",
          waypoints: [
            { x: 2700, y: 800 },
            { x: 2350, y: 800 },
            { x: 2050, y: 800 }, // Outpost Gate
            { x: 1750, y: 800 },
            { x: 1500, y: 800 }, // Forward Outpost Hall!
            { x: 1200, y: 800 },
            { x: 900, y: 800 },  // Inner Gate
            { x: 600, y: 800 },
            { x: 300, y: 800 }   // Main Citadel Keep!
          ]
        }
      ],
      groundPads: [
        { id: "pad_TownHall", zone: 0, type: "town_hall", name: "大本營", icon: "🏛️", x: 300, y: 800, currency: "gold", baseCost: 110, costScale: 1.35, maxLevel: 50, desc: "終極主城核心！" },
        { id: "pad_GoldMine", zone: 0, type: "mine", name: "金庫", icon: "🪙", x: 300, y: 580, currency: "gold", baseCost: 80, costScale: 1.35, maxLevel: 50, desc: "地下高能金礦。" },
        { id: "pad_WallFortify", zone: 0, type: "wall", name: "城防", icon: "🧱", x: 600, y: 800, currency: "gold", baseCost: 75, costScale: 1.35, maxLevel: 50, desc: "強化雙重城門與前哨耐久。" },
        { id: "pad_InnTop", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_star_cannon", name: "內城北重砲", icon: "☄️", x: 750, y: 640, towerX: 750, towerY: 590, currency: "gold", baseCost: 75, costScale: 1.38, maxLevel: 60, desc: "王城內閘重砲陣位。" },
        { id: "pad_InnBot", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_dragon_golem_foundry", name: "內城金龍", icon: "🐉", x: 750, y: 960, towerX: 750, towerY: 1010, currency: "gold", baseCost: 80, costScale: 1.38, maxLevel: 60, desc: "王城金龍守護殿。" },
        { id: "pad_ExpandOutpost", zone: 0, type: "expand", unlocksZone: 1, name: "解鎖前哨", icon: "🔒", x: 1100, y: 800, currency: "gold", baseCost: 650, costScale: 1.0, maxLevel: 1, desc: "解鎖前哨大廳與外圍要塞陣位。" },
        { id: "pad_OutpostTop", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_cavalry_stable", name: "前哨聖騎", icon: "🏇", x: 1500, y: 620, towerX: 1500, towerY: 570, currency: "gold", baseCost: 180, costScale: 1.38, maxLevel: 60, desc: "前哨大廳聖騎衝鋒營。" },
        { id: "pad_OutpostBot", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_void_obelisk", name: "前哨黑洞", icon: "🌀", x: 1500, y: 980, towerX: 1500, towerY: 1030, currency: "gold", baseCost: 190, costScale: 1.38, maxLevel: 60, desc: "前哨黑洞聚怪陣位。" },
        { id: "pad_GateOutTop", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_guard_barracks", name: "外閘鐵衛", icon: "🛡️", x: 1900, y: 650, towerX: 1900, towerY: 600, currency: "gold", baseCost: 200, costScale: 1.38, maxLevel: 60, desc: "外圍要塞大門鐵衛營。" },
        { id: "pad_Shrine", zone: 1, type: "shrine", name: "天罰神龕", icon: "🌋", x: 2300, y: 550, currency: "mana", baseCost: 45, costScale: 1.15, maxLevel: 99, desc: "全圖天罰流星雨。" }
      ]
    },

    // ------------------------------------------------------------------------
    // STAGE 5: 星界滅世神殿 (Grand Apex Mega Citadel)
    // ------------------------------------------------------------------------
    5: {
      width: 3000,
      height: 1800,
      layoutType: "grand_apex_mega_citadel",
      halls: [
        { id: "hall_main", name: "神殿大本營", x: 350, y: 900, baseHp: 16000, hpPerLevel: 2500, radius: 52, isMain: true },
        { id: "hall_outpost", name: "星界前哨廳", x: 1750, y: 900, baseHp: 9000, hpPerLevel: 1500, radius: 46, isOutpost: true }
      ],
      wallSegments: [
        { id: "w_out_n", type: "wall", x1: 2250, y1: 150, x2: 2250, y2: 800, isSolid: true, isGate: false, thickness: 48 },
        { id: "gate_outpost", type: "gate", x1: 2250, y1: 800, x2: 2250, y2: 1000, isGate: true, isSolid: false, name: "星界天門", thickness: 56 },
        { id: "w_out_s", type: "wall", x1: 2250, y1: 1000, x2: 2250, y2: 1650, isSolid: true, isGate: false, thickness: 48 },

        { id: "w_inn_n", type: "wall", x1: 1050, y1: 150, x2: 1050, y2: 800, isSolid: true, isGate: false, thickness: 48 },
        { id: "gate_inner", type: "gate", x1: 1050, y1: 800, x2: 1050, y2: 1000, isGate: true, isSolid: false, name: "神殿聖門", thickness: 56 },
        { id: "w_inn_s", type: "wall", x1: 1050, y1: 1000, x2: 1050, y2: 1650, isSolid: true, isGate: false, thickness: 48 }
      ],
      bastionTurrets: [
        { x: 2250, y: 800, name: "天門左塔" }, { x: 2250, y: 1000, name: "天門右塔" },
        { x: 1050, y: 800, name: "聖門左塔" }, { x: 1050, y: 1000, name: "聖門右塔" }
      ],
      roads: [
        {
          id: "road_apex_center",
          name: "星界王道",
          waypoints: [
            { x: 2900, y: 900 },
            { x: 2550, y: 900 },
            { x: 2250, y: 900 }, // Outer Gate
            { x: 1750, y: 900 }, // Outpost Hall
            { x: 1050, y: 900 }, // Inner Gate
            { x: 350, y: 900 }   // Main Keep
          ]
        }
      ],
      groundPads: [
        { id: "pad_TownHall", zone: 0, type: "town_hall", name: "大本營", icon: "🏛️", x: 350, y: 900, currency: "gold", baseCost: 150, costScale: 1.35, maxLevel: 50, desc: "終極滅世神殿核心！" },
        { id: "pad_GoldMine", zone: 0, type: "mine", name: "金庫", icon: "🪙", x: 350, y: 650, currency: "gold", baseCost: 120, costScale: 1.35, maxLevel: 50, desc: "太古星脈金庫。" },
        { id: "pad_WallFortify", zone: 0, type: "wall", name: "城防", icon: "🧱", x: 700, y: 900, currency: "gold", baseCost: 110, costScale: 1.35, maxLevel: 50, desc: "神級要塞城防加固。" },
        { id: "pad_InnTop", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_dragon_golem_foundry", name: "聖殿金龍", icon: "🐉", x: 880, y: 720, towerX: 880, towerY: 670, currency: "gold", baseCost: 120, costScale: 1.38, maxLevel: 60, desc: "金龍魔像雙效殿。" },
        { id: "pad_InnBot", zone: 0, type: "tower", customizable: true, defaultBlueprint: "bp_star_cannon", name: "聖殿破甲", icon: "☄️", x: 880, y: 1080, towerX: 880, towerY: 1130, currency: "gold", baseCost: 120, costScale: 1.38, maxLevel: 60, desc: "星界破甲巨砲。" },
        { id: "pad_ExpandOutpost", zone: 0, type: "expand", unlocksZone: 1, name: "解鎖前線", icon: "🔒", x: 1350, y: 900, currency: "gold", baseCost: 950, costScale: 1.0, maxLevel: 1, desc: "解鎖星界前哨建地。" },
        { id: "pad_OutpostTop", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_void_obelisk", name: "前哨黑洞", icon: "🌀", x: 1750, y: 720, towerX: 1750, towerY: 670, currency: "gold", baseCost: 260, costScale: 1.38, maxLevel: 60, desc: "黑洞引力聚怪。" },
        { id: "pad_OutpostBot", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_cavalry_stable", name: "前哨聖騎", icon: "🏇", x: 1750, y: 1080, towerX: 1750, towerY: 1130, currency: "gold", baseCost: 260, costScale: 1.38, maxLevel: 60, desc: "重騎兵巡邏衝鋒。" },
        { id: "pad_GateOutTop", zone: 1, type: "tower", customizable: true, defaultBlueprint: "bp_guard_barracks", name: "天門鐵衛", icon: "🛡️", x: 2100, y: 720, towerX: 2100, towerY: 670, currency: "gold", baseCost: 300, costScale: 1.38, maxLevel: 60, desc: "星界天門防線。" },
        { id: "pad_Shrine", zone: 1, type: "shrine", name: "天罰神龕", icon: "🌋", x: 2500, y: 650, currency: "mana", baseCost: 60, costScale: 1.15, maxLevel: 99, desc: "毀天滅地天罰流星雨。" }
      ]
    }
  },

  // Helper method to retrieve stage configuration
  getStageConfig: function(realmId) {
    var id = realmId || 1;
    return this.realmMapConfigs[id] || this.realmMapConfigs[1];
  },

  // 5 Ancient Realms Meta
  realms: [
    {
      id: 1,
      name: "第一章：古林紀元",
      sub: "Magic Epoch Forest",
      desc: "單門單牆古道要塞！哥布林與骷髏沿單道直衝東城門。",
      groundColor: "#4d8c40",
      grassDark: "#3e7533",
      pathColor: "#b58952",
      pathBorder: "#8c6536",
      cliffColor: "#35632b",
      wallColor: "#78847b",
      wallTopColor: "#a3b0a4",
      enemyMult: 1.15,
      rewardMult: 1.0,
      wavesToClear: 50,
      bossName: "巨魔督軍・格魯爾",
      bossColor: "#22c55e"
    },
    {
      id: 2,
      name: "第二章：荒漠長道",
      sub: "Sun-Canyon Highway",
      desc: "一線天長道大峽谷！設有三重關卡阻擊狂暴獸人與毒蠍潮。",
      groundColor: "#d6a165",
      grassDark: "#bd884d",
      pathColor: "#9c6d3e",
      pathBorder: "#785027",
      cliffColor: "#8b542b",
      wallColor: "#b8834b",
      wallTopColor: "#d9a771",
      enemyMult: 4.2,
      rewardMult: 3.2,
      wavesToClear: 50,
      bossName: "法老巨神・阿努比斯",
      bossColor: "#f59e0b"
    },
    {
      id: 3,
      name: "第三章：四方要塞",
      sub: "Obsidian Cross Bastion",
      desc: "四方十字要塞！東南西北四面大門同時遭受魔物圍攻。",
      groundColor: "#3b3355",
      grassDark: "#2d2642",
      pathColor: "#26203a",
      pathBorder: "#191429",
      cliffColor: "#1b162b",
      wallColor: "#584d7d",
      wallTopColor: "#7c70a8",
      enemyMult: 15.5,
      rewardMult: 10.5,
      wavesToClear: 50,
      bossName: "紫晶巫妖・瑪爾扎克",
      bossColor: "#a855f7"
    },
    {
      id: 4,
      name: "第四章：雙子王城",
      sub: "Twin-Hall Frostkeep",
      desc: "前線前哨大廳＋守護大本營雙核心！前哨失守後敵軍將直逼主城。",
      groundColor: "#7faac4",
      grassDark: "#6994b0",
      pathColor: "#547c96",
      pathBorder: "#3e6178",
      cliffColor: "#3b617a",
      wallColor: "#89aec7",
      wallTopColor: "#bfd9eb",
      enemyMult: 58.0,
      rewardMult: 36.0,
      wavesToClear: 50,
      bossName: "冰霜巨獸・弗羅斯",
      bossColor: "#38bdf8"
    },
    {
      id: 5,
      name: "第五章：星界神殿",
      sub: "Astral Apex Caldera",
      desc: "終極滅世戰場！雙層城牆與前哨要塞迎戰時空魔神克羅諾斯。",
      groundColor: "#4a2527",
      grassDark: "#381a1c",
      pathColor: "#2e1416",
      pathBorder: "#1f0c0d",
      cliffColor: "#240d0e",
      wallColor: "#7a4440",
      wallTopColor: "#995a55",
      enemyMult: 220.0,
      rewardMult: 130.0,
      wavesToClear: 50,
      bossName: "時空魔神・克羅諾斯",
      bossColor: "#fde047"
    }
  ],

  // 4 Heroes
  heroClasses: [
    {
      id: "archmage",
      name: "大魔導",
      title: "Archmage",
      icon: "🧙‍♂️",
      color: "#38bdf8",
      capeColor: "#1d4ed8",
      hatColor: "#2563eb",
      desc: "法杖射出連鎖奧術飛彈，技能冷卻縮短 25%。",
      baseDmg: 30,
      atkRate: 0.45,
      range: 260,
      moveSpeed: 240,
      magnetBonus: 1.3,
      projType: "arcane_chain"
    },
    {
      id: "runeblade",
      name: "聖劍士",
      title: "Runeblade",
      icon: "⚔️",
      color: "#38bdf8",
      capeColor: "#0284c7",
      hatColor: "#0369a1",
      desc: "長劍劍氣直線穿透，近戰攻守兼備。",
      baseDmg: 28,
      atkRate: 0.38,
      range: 180,
      moveSpeed: 255,
      magnetBonus: 1.15,
      projType: "sword_wave"
    },
    {
      id: "paladin",
      name: "聖騎士",
      title: "Paladin",
      icon: "🛡️",
      color: "#fbbf24",
      capeColor: "#dc2626",
      hatColor: "#cbd5e1",
      desc: "攻擊附帶神聖之錘，每秒持續自愈城防。",
      baseDmg: 28,
      atkRate: 0.45,
      range: 190,
      moveSpeed: 230,
      magnetBonus: 1.2,
      projType: "holy_hammer"
    },
    {
      id: "hunter",
      name: "遊俠",
      title: "Ranger",
      icon: "🏹",
      color: "#22c55e",
      capeColor: "#15803d",
      hatColor: "#166534",
      desc: "敏捷投擲三枚翠綠飛輪，超大金幣拾取範圍。",
      baseDmg: 22,
      atkRate: 0.28,
      range: 250,
      moveSpeed: 290,
      magnetBonus: 1.7,
      projType: "multi_chakram"
    }
  ],

  // Skill Tree Branches Metadata
  talentBranches: [
    {
      id: "combat",
      name: "戰術主宰樹",
      engName: "Combat Mastery Tree",
      icon: "⚔️",
      color: "#f87171",
      accent: "#ef4444",
      summary: "強化英雄法杖、十塔共鳴、攻速暴擊與兵營軍團，終極奧義【弒神威壓】專門碾壓巨像與首領。"
    },
    {
      id: "economy",
      name: "煉金經濟樹",
      engName: "Alchemy & Economy Tree",
      icon: "🪙",
      color: "#fbbf24",
      accent: "#f59e0b",
      summary: "提升殺怪賞金、金庫魔晶產量、全圖磁吸與建造折扣，終極奧義【時空聚寶盆】大幅倍增通關與離線收益。"
    },
    {
      id: "bastion",
      name: "要塞神工樹",
      engName: "Bastion Architecture Tree",
      icon: "🏰",
      color: "#38bdf8",
      accent: "#0284c7",
      summary: "構築不朽城垣、生機自愈、雷霆反傷與極速踏陣，終極奧義【皇族遺產】提供豐厚開局資金與主城強化。"
    }
  ],

  // 4-Tier Hierarchical Skill Tree
  talents: [
    // COMBAT
    { id: "t_hero_dmg", branch: "combat", tier: 1, col: 1, reqId: null, reqLv: 0, name: "魔導法杖", roleTag: "第 1 階 · 核心根基", icon: "🧙‍♂️", maxLv: 25, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "英雄傷害提升 +20% / 級。升至 Lv.3 解鎖下階分支。", effectPerLv: 0.20 },
    { id: "t_tower_dmg", branch: "combat", tier: 2, col: 0, reqId: "t_hero_dmg", reqLv: 3, name: "十塔共鳴", roleTag: "第 2 階 · 左翼魔塔系", icon: "🏰", maxLv: 25, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "全地圖防禦塔傷害提升 +18% / 級。升至 Lv.3 解鎖【軍團戰歌】。", effectPerLv: 0.18 },
    { id: "t_atk_spd", branch: "combat", tier: 2, col: 2, reqId: "t_hero_dmg", reqLv: 3, name: "極速迴路", roleTag: "第 2 階 · 右翼敏捷系", icon: "⚡", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "全軍攻速提升 +6% / 級。升至 Lv.3 解鎖【弱點魔眼】。", effectPerLv: 0.06 },
    { id: "t_summon_pow", branch: "combat", tier: 3, col: 0, reqId: "t_tower_dmg", reqLv: 3, name: "軍團戰歌", roleTag: "第 3 階 · 派兵專精", icon: "🛡️", maxLv: 20, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "召喚部隊生命與攻擊 +25% / 級。升至 Lv.3 解鎖終極奧義。", effectPerLv: 0.25 },
    { id: "t_crit_chance", branch: "combat", tier: 3, col: 2, reqId: "t_atk_spd", reqLv: 3, name: "弱點魔眼", roleTag: "第 3 階 · 暴擊專精", icon: "🎯", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "暴擊率 +3%，暴擊傷害 +15% / 級。升至 Lv.3 解鎖終極奧義。", effectPerLv: 0.03 },
    { id: "t_boss_slayer", branch: "combat", tier: 4, col: 1, reqId: "t_summon_pow", reqIdAlt: "t_crit_chance", reqLv: 3, name: "弒神威壓", roleTag: "第 4 階 · 終極戰術奧義", icon: "👑", maxLv: 20, baseCost: 3, costCurrency: "soul", unitSuffix: "%", desc: "【終極奧義】對領域首領與巨像造成額外 +25% / 級 毀滅傷害！", effectPerLv: 0.25 },

    // ECONOMY
    { id: "t_gold_drop", branch: "economy", tier: 1, col: 1, reqId: null, reqLv: 0, name: "黃金煉金", roleTag: "第 1 階 · 核心根基", icon: "🪙", maxLv: 25, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "擊殺怪物金幣掉落 +20% / 級。升至 Lv.3 解鎖下階分支。", effectPerLv: 0.20 },
    { id: "t_mine_yield", branch: "economy", tier: 2, col: 0, reqId: "t_gold_drop", reqLv: 3, name: "晶礦增幅", roleTag: "第 2 階 · 左翼礦脈系", icon: "⛏️", maxLv: 20, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "金庫與晶礦產量 +25% / 級。升至 Lv.3 解鎖【紫晶萃取】。", effectPerLv: 0.25 },
    { id: "t_magnet_rad", branch: "economy", tier: 2, col: 2, reqId: "t_gold_drop", reqLv: 3, name: "引力光環", roleTag: "第 2 階 · 右翼後勤系", icon: "🧲", maxLv: 15, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "金幣磁吸範圍擴大 +15% / 級。升至 Lv.3 解鎖【節能銘文】。", effectPerLv: 0.15 },
    { id: "t_mana_drop", branch: "economy", tier: 3, col: 0, reqId: "t_mine_yield", reqLv: 3, name: "紫晶萃取", roleTag: "第 3 階 · 魔晶專精", icon: "💎", maxLv: 20, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "怪物掉落魔力水晶機率 +15% / 級。升至 Lv.3 解鎖終極奧義。", effectPerLv: 0.15 },
    { id: "t_pad_discount", branch: "economy", tier: 3, col: 2, reqId: "t_magnet_rad", reqLv: 3, name: "節能銘文", roleTag: "第 3 階 · 營建專精", icon: "📉", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "所有建築建造升級費用 -3% / 級（最高 -45%）。", effectPerLv: 0.03 },
    { id: "t_offline_gain", branch: "economy", tier: 4, col: 1, reqId: "t_mana_drop", reqIdAlt: "t_pad_discount", reqLv: 3, name: "時空聚寶盆", roleTag: "第 4 階 · 終極財富奧義", icon: "⏳", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "【終極奧義】離線掛機收益與每波通關賞金 +20% / 級！", effectPerLv: 0.20 },

    // BASTION
    { id: "t_wall_hp", branch: "bastion", tier: 1, col: 1, reqId: null, reqLv: 0, name: "不朽城垣", roleTag: "第 1 階 · 核心根基", icon: "🧱", maxLv: 25, baseCost: 1, costCurrency: "soul", unitSuffix: "%", desc: "全線城牆與大本營耐久 +25% / 級。升至 Lv.3 解鎖下階分支。", effectPerLv: 0.25 },
    { id: "t_wall_regen", branch: "bastion", tier: 2, col: 0, reqId: "t_wall_hp", reqLv: 3, name: "生機修復", roleTag: "第 2 階 · 左翼守禦系", icon: "🌿", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "城牆與大本營每秒自愈 0.5% / 級。升至 Lv.3 解鎖【雷霆城垛】。", effectPerLv: 0.005 },
    { id: "t_step_speed", branch: "bastion", tier: 2, col: 2, reqId: "t_wall_hp", reqLv: 3, name: "瞬發踏陣", roleTag: "第 2 階 · 右翼神工系", icon: "🏃", maxLv: 10, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "踏陣升級資源注入速度 +25% / 級。升至 Lv.3 解鎖【秘典減卻】。", effectPerLv: 0.25 },
    { id: "t_wall_thorns", branch: "bastion", tier: 3, col: 0, reqId: "t_wall_regen", reqLv: 3, name: "雷霆城垛", roleTag: "第 3 階 · 反傷專精", icon: "⚡", maxLv: 20, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "城牆受擊時反彈相當於英雄攻擊 50% / 級的雷電反傷！", effectPerLv: 0.50 },
    { id: "t_skill_cd", branch: "bastion", tier: 3, col: 2, reqId: "t_step_speed", reqLv: 3, name: "秘典減卻", roleTag: "第 3 階 · 奧術專精", icon: "📖", maxLv: 15, baseCost: 2, costCurrency: "soul", unitSuffix: "%", desc: "三大主動神技冷卻縮短 3% / 級。升至 Lv.3 解鎖終極奧義。", effectPerLv: 0.03 },
    { id: "t_start_gold", branch: "bastion", tier: 4, col: 1, reqId: "t_wall_thorns", reqIdAlt: "t_skill_cd", reqLv: 3, name: "皇族遺產", roleTag: "第 4 階 · 終極神工奧義", icon: "🏆", maxLv: 15, baseCost: 3, costCurrency: "soul", unitSuffix: "金", desc: "【終極奧義】轉生或前往新章節時，初始開局金幣 +200 / 級！", effectPerLv: 200 }
  ],

  // Equipment Rarities
  rarities: [
    { tier: 0, name: "普通", color: "#94a3b8", mult: 1.0 },
    { tier: 1, name: "精良", color: "#22c55e", mult: 1.6 },
    { tier: 2, name: "稀有", color: "#38bdf8", mult: 2.6 },
    { tier: 3, name: "史詩", color: "#a855f7", mult: 4.5 },
    { tier: 4, name: "傳說", color: "#fbbf24", mult: 8.5 },
    { tier: 5, name: "太古", color: "#f43f5e", mult: 18.0 }
  ],

  equipTemplates: {
    weapon: [
      { name: "蒼藍魔杖", icon: "🦯", statType: "heroDmg", baseVal: 0.25 },
      { name: "雷霆聖劍", icon: "🗡️", statType: "heroDmg", baseVal: 0.35 },
      { name: "泰坦戰錘", icon: "🔨", statType: "heroDmg", baseVal: 0.45 },
      { name: "創世神杖", icon: "✨", statType: "heroDmg", baseVal: 0.65 }
    ],
    armor: [
      { name: "星辰巫師服", icon: "👘", statType: "wallHp", baseVal: 0.30 },
      { name: "秘銀胸甲", icon: "🛡️", statType: "wallHp", baseVal: 0.42 },
      { name: "聖殿重鎧", icon: "🦺", statType: "wallHp", baseVal: 0.55 },
      { name: "大魔導袍", icon: "👑", statType: "wallHp", baseVal: 0.80 }
    ],
    ring: [
      { name: "黃金指環", icon: "💍", statType: "goldBonus", baseVal: 0.25 },
      { name: "奧術寶戒", icon: "💎", statType: "towerDmg", baseVal: 0.30 },
      { name: "雷神魔戒", icon: "⚡", statType: "towerDmg", baseVal: 0.45 },
      { name: "所羅門戒", icon: "🧿", statType: "goldBonus", baseVal: 0.65 }
    ],
    relic: [
      { name: "發光魔晶", icon: "🔮", statType: "allMult", baseVal: 0.20 },
      { name: "時空沙漏", icon: "⏳", statType: "allMult", baseVal: 0.32 },
      { name: "不死鳥羽", icon: "🪶", statType: "allMult", baseVal: 0.48 },
      { name: "創世聖典", icon: "📘", statType: "allMult", baseVal: 0.75 }
    ]
  },

  // 11 Enemies
  bestiary: [
    { id: "cultist", name: "哥布林", icon: "👺", hpMult: 1.1, spd: 68, gold: 5, tags: ["swarm", "melee"], counterBp: "bp_arcane_spire", desc: "綠皮短匕小怪，成群湧來，建議奧術塔或雷霆像清理。" },
    { id: "skeleton_warrior", name: "骷髏兵", icon: "💀", hpMult: 1.6, spd: 56, gold: 7, tags: ["swarm", "undead"], counterBp: "bp_flame_mage", desc: "持盾白骨戰士，懼怕烈焰台持續火海與鐵衛營攔截。" },
    { id: "shadow_imp", name: "小惡魔", icon: "😈", hpMult: 2.0, spd: 74, gold: 9, tags: ["fast", "flying"], counterBp: "bp_archer_lodge", desc: "行動敏捷的小惡魔，建議弓手營遠程風箏擊殺。" },
    { id: "orc_warrior", name: "狂暴獸人", icon: "👹", hpMult: 3.2, spd: 48, gold: 12, tags: ["armored", "melee"], counterBp: "bp_guard_barracks", desc: "手持雙手重斧，攻擊力高，以鐵衛營與烈焰台削弱。" },
    { id: "scorpion", name: "毒尾魔蠍", icon: "🦂", hpMult: 1.8, spd: 88, gold: 8, tags: ["fast", "swarm"], counterBp: "bp_arcane_spire", desc: "極速毒蠍，必須依靠奧術塔減速或兵營提前阻截。" },
    { id: "dark_mage", name: "暗影術士", icon: "🧙", hpMult: 2.5, spd: 50, gold: 14, tags: ["mage", "line"], counterBp: "bp_blade_altar", desc: "遠程黑魔法師，劍聖壇直線穿透劍氣可直接斬殺。" },
    { id: "stone_golem", name: "石巨像", icon: "🗿", hpMult: 7.5, spd: 32, gold: 30, tags: ["armored", "golem"], counterBp: "bp_star_cannon", desc: "重裝攻城巨石像，對城防威脅極大，必備星隕砲！" },
    { id: "frost_wolf", name: "霜凍魔狼", icon: "🐺", hpMult: 2.8, spd: 96, gold: 16, tags: ["fast", "melee"], counterBp: "bp_cavalry_stable", desc: "成群疾馳的雪原狼，聖騎營重騎兵可正面攔下。" },
    { id: "flame_demon", name: "煉獄炎魔", icon: "🔥", hpMult: 9.5, spd: 42, gold: 40, tags: ["armored", "boss"], counterBp: "bp_void_obelisk", desc: "高階火魔，黑洞碑聚怪並造成最大生命百分比傷害。" },
    { id: "void_reaver", name: "虛空掠奪者", icon: "👾", hpMult: 16.0, spd: 58, gold: 70, tags: ["boss", "fast"], counterBp: "bp_dragon_golem_foundry", desc: "時空裂隙生物，需金龍殿泰坦魔像與重砲合力消滅。" },
    { id: "realm_boss", name: "領域首領", icon: "🐲", hpMult: 55.0, spd: 28, gold: 300, tags: ["boss", "golem"], counterBp: "bp_star_cannon", desc: "每 5 波降臨的滅世魔王！破壞力驚人，務必全員迎戰！" }
  ],

  // Quests
  quests: [
    { id: 1, title: "在城內建造第一座防禦塔", type: "any_tower_built", goal: 1, rewardGold: 80, rewardMana: 10, rewardSoul: 1 },
    { id: 2, title: "踏上陣位升級魔塔至 Lv.3", type: "any_tower_lv", goal: 3, rewardGold: 120, rewardMana: 15, rewardSoul: 1 },
    { id: 3, title: "在科技藍圖解鎖第 3 種建築", type: "unlock_bp_count", goal: 3, rewardGold: 150, rewardMana: 18, rewardSoul: 2 },
    { id: 4, title: "成功擊退第 3 波魔物大軍", type: "wave", goal: 3, rewardGold: 200, rewardMana: 22, rewardSoul: 2 },
    { id: 5, title: "踏上擴建解鎖城外古道防區", type: "zone", goal: 1, rewardGold: 280, rewardMana: 30, rewardSoul: 2 },
    { id: 6, title: "建造鐵衛營或弓手營出城迎戰", type: "any_troop_built", goal: 1, rewardGold: 360, rewardMana: 35, rewardSoul: 3 },
    { id: 7, title: "踏上鐵匠神爐鍛造聖物裝備", type: "forge_equip", goal: 1, rewardGold: 420, rewardMana: 40, rewardSoul: 3 },
    { id: 8, title: "將任意防禦塔升級至 Lv.7", type: "any_tower_lv", goal: 7, rewardGold: 600, rewardMana: 50, rewardSoul: 3 },
    { id: 9, title: "擊破第 10 波領域首領 Boss", type: "wave", goal: 10, rewardGold: 1800, rewardMana: 120, rewardSoul: 6 },
    { id: 10, title: "解鎖全部 10 種魔塔與兵營", type: "unlock_bp_count", goal: 10, rewardGold: 5000, rewardMana: 280, rewardSoul: 12 },
    { id: 11, title: "征服第一章前往第二章荒漠長道", type: "wave", goal: 50, rewardGold: 60000, rewardMana: 2500, rewardSoul: 50 }
  ]
};

// Initial default groundPads reference
window.GAME_DATA.groundPads = window.GAME_DATA.realmMapConfigs[1].groundPads;
window.GAME_DATA.mapConfig = window.GAME_DATA.realmMapConfigs[1];
