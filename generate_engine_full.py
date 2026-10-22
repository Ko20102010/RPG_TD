import re

with open("js/engine.js", "r", encoding="utf-8") as f:
    orig = f.read()

# Locate drawHero to the end
idx_draw_hero = orig.find("drawHero: function")
tail_draw_code = orig[idx_draw_hero:]

engine_core = '''// Polyfill for CanvasRenderingContext2D.roundRect on older mobile browsers
if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    var rad = typeof r === "number" ? r : 6;
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

/* ==========================================================================
   Ancient Arcane Bastion (古域魔陣：守護神殿) - Core 2.5D Engine (v1.6.0)
   - Dynamic Stage Maps:
     1. Stage 1: Exactly 1 Wall, 1 Gate (East Gate), 1 Road, 1 Keep
     2. Stage 2: 1 Long Line Canyon Road with 3 Checkpoint Walls & Massive Hordes
     3. Stage 3: 4 Walls, 4 Gates (East, South, West, North - ESWT)
     4. Stage 4: Multiple Halls (Forward Outpost Keep + Main Citadel Keep)
     5. Stage 5: Grand Apex Astral Mega-Fortress
   - Tower Locking: Once built (level >= 1), tower type cannot be changed!
   - Ultra-compact mobile HUD support & safe-area rendering
   ========================================================================== */

window.GameEngine = {
  canvas: null,
  ctx: null,
  width: 2400,
  height: 1500,
  camera: { x: 0, y: 0, zoom: 1, userZoomMult: 0.85 },
  lastTime: 0,
  running: false,
  gameSpeed: 1,
  aiMode: 0, // 0 = Manual, 1 = Auto-Loot, 2 = Full Auto-Step
  isDefeated: false,
  gateBreached: false,
  roadEnemyCounts: { road_north: 0, road_center: 0, road_south: 0, road_main: 0, road_long: 0, road_east: 0, road_west: 0 },

  // Persistent Player State
  state: {
    gold: 220,
    mana: 45,
    souls: 4,
    divinity: 0,
    rebirthCount: 0,
    realmId: 1,
    wave: 1,
    maxWaveReached: 1,
    endlessMode: false,
    heroClassId: "archmage",
    heroLevel: 1,
    heroXp: 0,
    heroWeaponForgeLv: 0,
    townHallLevel: 1,
    unlockedZones: [0],
    unlockedBlueprints: ["bp_arcane_spire", "bp_knight_statue", "bp_flame_mage", "bp_guard_barracks"],
    pads: {},
    talents: {},
    equipped: { weapon: null, armor: null, ring: null, relic: null },
    inventory: [],
    questIndex: 0,
    totalKills: 0,
    totalGoldEarned: 220,
    playSeconds: 0,
    lastSaveTimestamp: Date.now()
  },

  hero: {
    x: 350,
    y: 750,
    vx: 0,
    vy: 0,
    radius: 20,
    facing: 1,
    atkTimer: 0,
    targetX: null,
    targetY: null,
    activePadId: null,
    animPhase: 0
  },

  halls: [],
  townHall: { x: 280, y: 750, hp: 1800, maxHp: 1800, radius: 46, flashTimer: 0, atkTimer: 0 },

  wall: {
    hp: 850,
    maxHp: 850
  },

  checkpoints: [],

  waveState: {
    spawned: 0,
    toSpawn: 15,
    spawnTimer: 0,
    waveClearTimer: 0,
    bossActive: false
  },

  skills: [
    { id: "nova", name: "風暴吸金", cd: 0, maxCd: 10 },
    { id: "aegis", name: "聖光壁壘", cd: 0, maxCd: 16, buffTimer: 0 },
    { id: "meteor", name: "太古天隕", cd: 0, maxCd: 24 }
  ],

  enemies: [],
  allies: [],
  projectiles: [],
  lightningArcs: [],
  lootDrops: [],
  flyingCoins: [],
  particles: [],
  floatingTexts: [],
  burnZones: [],
  scenery: [],
  wallSegments: [],
  bastionTurrets: [],
  roads: [],

  input: {
    keys: {},
    joyActive: false,
    joyStartX: 0,
    joyStartY: 0,
    joyCurX: 0,
    joyCurY: 0,
    joyDx: 0,
    joyDy: 0
  },

  init: function() {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");

    this.loadSave();
    this.loadRealmMap(this.state.realmId);
    this.initDefaultPads();
    this.setupWave(this.state.wave);
    this.bindInputs();
    this.handleResize();

    var self = this;
    window.addEventListener("resize", function() { self.handleResize(); });

    setInterval(function() {
      self.saveGame();
    }, 10000);

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(function(ts) { self.loop(ts); });
  },

  // Dynamic Map Loader for the Active Stage
  loadRealmMap: function(realmId) {
    var id = realmId || this.state.realmId || 1;
    var cfg = window.GAME_DATA.getStageConfig(id);

    this.width = cfg.width;
    this.height = cfg.height;
    this.layoutType = cfg.layoutType || "single_wall_single_gate";
    this.wallSegments = JSON.parse(JSON.stringify(cfg.wallSegments || []));
    this.bastionTurrets = cfg.bastionTurrets || [];
    this.roads = cfg.roads || [];
    window.GAME_DATA.groundPads = cfg.groundPads || [];
    window.GAME_DATA.mapConfig = cfg;

    // Load Halls
    this.halls = JSON.parse(JSON.stringify(cfg.halls || []));
    this.halls.forEach(function(h) {
      h.hp = h.baseHp || 1800;
      h.maxHp = h.baseHp || 1800;
      h.flashTimer = 0;
      h.atkTimer = 0;
    });
    this.townHall = this.halls[0] || { x: 280, y: 750, hp: 1800, maxHp: 1800, radius: 46 };

    // Initialize Checkpoints for Stage 2
    if (this.layoutType === "long_line_three_checkpoints") {
      this.checkpoints = [
        { index: 1, name: "第一道前哨關卡", hp: 1200, maxHp: 1200, breached: false, x: 2350 },
        { index: 2, name: "第二道要塞關卡", hp: 2200, maxHp: 2200, breached: false, x: 1500 },
        { index: 3, name: "第三道王城關卡", hp: 3500, maxHp: 3500, breached: false, x: 750 }
      ];
    } else {
      this.checkpoints = [];
    }

    this.recalcWallStats(true);
    this.generateScenery();

    // Position hero safely in the inner sanctuary near the main keep
    if (this.townHall) {
      this.hero.x = this.townHall.x + 85;
      this.hero.y = this.townHall.y;
    }
  },

  initDefaultPads: function() {
    var self = this;
    if (!Array.isArray(this.state.unlockedBlueprints)) {
      this.state.unlockedBlueprints = [];
    }
    window.GAME_DATA.towerBlueprints.forEach(function(bp) {
      if (bp.unlockedByDefault && self.state.unlockedBlueprints.indexOf(bp.id) === -1) {
        self.state.unlockedBlueprints.push(bp.id);
      }
    });

    (window.GAME_DATA.groundPads || []).forEach(function(p) {
      var existing = self.state.pads[p.id];
      var defaultBp = p.defaultBlueprint || "bp_arcane_spire";
      if (!existing) {
        var startLv = (p.id === "pad_TownHall" || p.id === "pad_GateInner" || p.id === "pad_FrostStatue") ? 1 : 0;
        self.state.pads[p.id] = {
          level: startLv,
          invested: 0,
          cooldown: 0,
          blueprintId: p.customizable ? (startLv > 0 ? defaultBp : null) : null,
          atkTimer: 0
        };
      }
    });

    window.GAME_DATA.talents.forEach(function(t) {
      if (typeof self.state.talents[t.id] !== "number") {
        self.state.talents[t.id] = 0;
      }
    });
  },

  generateScenery: function() {
    this.scenery = [];
    var count = Math.floor((this.width * this.height) / 140000);
    var kinds = ["tree", "rune_tree", "crystal_cluster"];
    for (var i = 0; i < count; i++) {
      var sx = 80 + Math.random() * (this.width - 160);
      var sy = 100 + Math.random() * (this.height - 200);
      // Avoid roads and townhall
      var distToHall = Math.hypot(sx - this.townHall.x, sy - this.townHall.y);
      if (distToHall > 130) {
        this.scenery.push({
          x: sx,
          y: sy,
          kind: kinds[Math.floor(Math.random() * kinds.length)],
          scale: 0.95 + Math.random() * 0.35,
          color: Math.random() < 0.5 ? "#38bdf8" : "#d946ef"
        });
      }
    }
  },

  handleResize: function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  getBlueprintById: function(bpId) {
    if (!bpId) return window.GAME_DATA.towerBlueprints[0];
    return window.GAME_DATA.towerBlueprints.find(function(b) { return b.id === bpId; }) || window.GAME_DATA.towerBlueprints[0];
  },

  getPadBlueprint: function(padDef) {
    if (!padDef || !padDef.customizable) return null;
    var st = this.state.pads[padDef.id];
    var bpId = (st && st.blueprintId) || padDef.defaultBlueprint || "bp_arcane_spire";
    return this.getBlueprintById(bpId);
  },

  isBlueprintUnlocked: function(bpId) {
    return this.state.unlockedBlueprints.indexOf(bpId) !== -1;
  },

  unlockBlueprint: function(bpId) {
    var bp = this.getBlueprintById(bpId);
    if (!bp) return false;
    if (this.isBlueprintUnlocked(bpId)) return true;
    var cost = bp.unlockCost || 0;
    var cur = bp.unlockCurrency || "gold";
    if (cur === "mana") {
      if (this.state.mana < cost) return false;
      this.state.mana -= cost;
    } else {
      if (this.state.gold < cost) return false;
      this.state.gold -= cost;
    }
    this.state.unlockedBlueprints.push(bpId);
    window.SoundEngine.playUpgradeComplete();
    this.saveGame();
    return true;
  },

  // TOWER LOCKING: Once built (level >= 1), tower type cannot be changed!
  selectPadBlueprint: function(padId, bpId) {
    var pad = (window.GAME_DATA.groundPads || []).find(function(p) { return p.id === padId; });
    if (!pad || !pad.customizable) return false;
    var st = this.state.pads[padId];
    if (!st) return false;

    // Hard constraint: If already built (level >= 1), type is locked!
    if (st.level >= 1) {
      if (window.GameUI) window.GameUI.showToast("⚠️ 此陣位防禦塔已建造完畢，類型已鎖定無法更改！");
      return false;
    }

    var bp = this.getBlueprintById(bpId);
    if (!bp) return false;

    if (!this.isBlueprintUnlocked(bp.id)) {
      var ok = this.unlockBlueprint(bp.id);
      if (!ok) return false;
    }

    st.blueprintId = bp.id;
    this.saveGame();
    return true;
  },

  // Confirm building the selected tower onto an empty plot (st.level = 0 -> 1)
  buildPadTower: function(padId, bpId) {
    var pad = (window.GAME_DATA.groundPads || []).find(function(p) { return p.id === padId; });
    if (!pad || !pad.customizable) return false;
    var st = this.state.pads[padId];
    if (!st || st.level >= 1) return false;

    var bp = this.getBlueprintById(bpId || st.blueprintId || pad.defaultBlueprint);
    if (!bp) return false;

    if (!this.isBlueprintUnlocked(bp.id)) {
      var unlOk = this.unlockBlueprint(bp.id);
      if (!unlOk) return false;
    }

    var cost = this.getPadCost(pad);
    if (this.state.gold < cost) {
      if (window.GameUI) window.GameUI.showToast("⚠️ 金幣不足！建造需要 🪙" + cost);
      return false;
    }

    this.state.gold -= cost;
    st.blueprintId = bp.id;
    st.level = 1;
    st.invested = 0;
    this.spawnBurstParticles(pad.x, pad.y, bp.color || "#fde047", 24);
    window.SoundEngine.playUpgradeComplete();
    this.checkQuestProgress();
    this.saveGame();

    if (window.GameUI) {
      window.GameUI.updateHUD();
      window.GameUI.updateContextCard();
      window.GameUI.showToast("🎉 成功建造【" + bp.icon + " " + bp.name + "】！類型已正式鎖定！");
    }
    return true;
  },

  getTacticalAdvice: function() {
    var st = this.state;
    var w = st.wave;

    // 1. Town Hall Under Attack
    if (this.townHall.hp < this.townHall.maxHp * 0.5) {
      return {
        urgency: "critical",
        icon: "🚨",
        title: "大本營告急！生命低於 50%！",
        reason: "魔物已突入內城！立即施放【聖光壁壘】修復大本營並回防！",
        targetPadId: "pad_TownHall",
        recBpId: null
      };
    }

    // 2. Checkpoint or Wall Breached
    if (this.gateBreached || this.wall.hp <= 0) {
      return {
        urgency: "critical",
        icon: "🚨",
        title: "城防關卡已被攻破！",
        reason: "城門洞開！踏上【城防要塞】或施放【聖光壁壘】緊急修補防線！",
        targetPadId: "pad_WallFortify",
        recBpId: null
      };
    }

    // 3. Boss Alert
    if (w % 5 === 0 || w % 5 === 4) {
      return {
        urgency: "boss",
        icon: "☄️",
        title: "預警：第 " + (w % 5 === 0 ? w : w + 1) + " 波巨型首領來襲！",
        reason: "強烈建議建造【星隕砲】重型破甲或升級主力輸出塔！",
        targetPadId: "pad_GateInner",
        recBpId: this.isBlueprintUnlocked("bp_star_cannon") ? "bp_star_cannon" : "bp_arcane_spire"
      };
    }

    return {
      urgency: "normal",
      icon: "⚔️",
      title: "防線巡邏中，迎擊魔物",
      reason: "可自由穿過城門出城迎敵，拾取金幣升級防線！",
      targetPadId: "pad_GateInner",
      recBpId: null
    };
  },

  getTalentVal: function(tid) {
    var lv = this.state.talents[tid] || 0;
    var def = window.GAME_DATA.talents.find(function(t) { return t.id === tid; });
    return def ? lv * def.effectPerLv : 0;
  },

  getEquipStat: function(statType) {
    var total = 0;
    var eq = this.state.equipped;
    ["weapon", "armor", "ring", "relic"].forEach(function(slot) {
      var item = eq[slot];
      if (item) {
        if (item.statType === statType) total += item.val;
        if (item.statType === "allMult") total += item.val;
      }
    });
    return total;
  },

  getDivinityMult: function() {
    return 1 + (this.state.divinity || 0) * 0.35;
  },

  getHeroDamage: function() {
    var cls = this.getCurrentHeroClass();
    var base = cls.baseDmg * (1 + (this.state.heroLevel - 1) * 0.22 + this.state.heroWeaponForgeLv * 0.18);
    var tMult = 1 + this.getTalentVal("t_hero_dmg");
    var eqMult = 1 + this.getEquipStat("heroDmg");
    return Math.round(base * tMult * eqMult * this.getDivinityMult());
  },

  getTowerDamage: function(padDef, level) {
    if (level <= 0) return 0;
    var bp = this.getPadBlueprint(padDef);
    var baseDmg = (bp && bp.baseDmg) ? bp.baseDmg : 26;
    var raw = baseDmg * Math.pow(1.28, level - 1);
    var tMult = 1 + this.getTalentVal("t_tower_dmg");
    var eqMult = 1 + this.getEquipStat("towerDmg");
    return Math.round(raw * tMult * eqMult * this.getDivinityMult());
  },

  getPadCost: function(padDef) {
    var st = this.state.pads[padDef.id] || { level: 0 };
    var discount = Math.min(0.45, this.getTalentVal("t_pad_discount"));
    var baseCost = padDef.baseCost || 40;
    var scale = padDef.costScale || 1.38;
    if (padDef.customizable) {
      var bp = this.getPadBlueprint(padDef);
      if (bp && bp.buildCostGold) baseCost = Math.max(baseCost, bp.buildCostGold);
    }
    var raw = baseCost * Math.pow(scale, st.level);
    return Math.max(5, Math.round(raw * (1 - discount)));
  },

  getPadRemaining: function(padDef) {
    var st = this.state.pads[padDef.id] || { level: 0, invested: 0 };
    return Math.max(0, this.getPadCost(padDef) - Math.floor(st.invested));
  },

  getCurrentHeroClass: function() {
    var id = this.state.heroClassId;
    return window.GAME_DATA.heroClasses.find(function(c) { return c.id === id; }) || window.GAME_DATA.heroClasses[0];
  },

  getCurrentRealm: function() {
    var id = this.state.realmId;
    return window.GAME_DATA.realms.find(function(r) { return r.id === id; }) || window.GAME_DATA.realms[0];
  },

  recalcWallStats: function(healFull) {
    var realmId = this.state.realmId || 1;
    var wallFortLv = (this.state.pads["pad_WallFortify"] && this.state.pads["pad_WallFortify"].level) || 0;
    var hallLv = (this.state.pads["pad_TownHall"] && this.state.pads["pad_TownHall"].level) || 1;
    this.state.townHallLevel = hallLv;

    var wallBase = 850 + wallFortLv * 320 + (realmId - 1) * 900;
    var wallMult = (1 + this.getTalentVal("t_wall_hp")) * (1 + this.getEquipStat("wallHp"));
    var newWallMax = Math.round(wallBase * wallMult);

    var wallRatio = this.wall.maxHp > 0 ? this.wall.hp / this.wall.maxHp : 1;
    this.wall.maxHp = newWallMax;
    this.wall.hp = healFull ? newWallMax : Math.min(newWallMax, Math.max(0, Math.round(newWallMax * wallRatio)));
    this.gateBreached = (this.wall.hp <= 0);

    // Recalculate checkpoints for Stage 2
    if (this.checkpoints && this.checkpoints.length > 0) {
      this.checkpoints.forEach(function(cp, idx) {
        var cpBase = 1200 + idx * 900 + wallFortLv * 250;
        cp.maxHp = Math.round(cpBase * wallMult);
        cp.hp = healFull ? cp.maxHp : Math.min(cp.maxHp, cp.hp);
        cp.breached = (cp.hp <= 0);
      });
    }

    // Recalculate Halls (Main Keep + Outpost)
    var self = this;
    if (this.halls && this.halls.length > 0) {
      this.halls.forEach(function(h) {
        var base = h.baseHp || 1800;
        var hMax = Math.round(base * (1 + (hallLv - 1) * 0.25) * wallMult);
        var curRatio = h.maxHp > 0 ? (h.hp / h.maxHp) : 1;
        h.maxHp = hMax;
        h.hp = healFull ? hMax : Math.min(hMax, Math.max(1, Math.round(hMax * curRatio)));
      });
      this.townHall = this.halls[0];
    }
  },

  isPointInsideFortress: function(x, y) {
    if (this.layoutType === "four_walls_four_gates") {
      return (x >= 750 && x <= 1650 && y >= 750 && y <= 1650);
    }
    // Default vertical wall partition
    var wallX = (this.wallSegments && this.wallSegments[0] && this.wallSegments[0].x1) || 950;
    return x < wallX;
  },

  getNearestGatePoint: function(x, y) {
    var gates = (this.wallSegments || []).filter(function(s) { return s.type === "gate" || s.isGate; });
    if (gates.length === 0) return { x: 950, y: 750 };
    var best = null;
    var bestDist = Infinity;
    for (var i = 0; i < gates.length; i++) {
      var gx = (gates[i].x1 + gates[i].x2) * 0.5;
      var gy = (gates[i].y1 + gates[i].y2) * 0.5;
      var d = Math.hypot(x - gx, y - gy);
      if (d < bestDist) {
        bestDist = d;
        best = { x: gx, y: gy };
      }
    }
    return best || { x: 950, y: 750 };
  },

  getSmartMovePoint: function(curX, curY, destX, destY) {
    var curInside = this.isPointInsideFortress(curX, curY);
    var destInside = this.isPointInsideFortress(destX, destY);
    if (curInside === destInside) {
      return { x: destX, y: destY };
    }
    var gate = this.getNearestGatePoint(curX, curY);
    var distToGate = Math.hypot(curX - gate.x, curY - gate.y);
    if (distToGate > 48) {
      return gate;
    }
    return { x: destX, y: destY };
  },

  resolveWallCollisions: function(entity, isHeroOrAlly) {
    var segments = this.wallSegments || [];
    var r = (entity.radius || 16) + 16;

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      // Hero & Allies pass gates freely
      if (isHeroOrAlly && (seg.type === "gate" || seg.isGate)) continue;

      // When gate or checkpoint is breached, monsters can pass through!
      if (!isHeroOrAlly && (seg.type === "gate" || seg.isGate)) {
        if (seg.cpIndex && this.checkpoints && this.checkpoints[seg.cpIndex - 1] && this.checkpoints[seg.cpIndex - 1].breached) {
          continue;
        }
        if (!seg.cpIndex && this.gateBreached) {
          continue;
        }
      }

      var sx = seg.x2 - seg.x1;
      var sy = seg.y2 - seg.y1;
      var len2 = sx * sx + sy * sy;
      if (len2 === 0) continue;

      var t = Math.max(0, Math.min(1, ((entity.x - seg.x1) * sx + (entity.y - seg.y1) * sy) / len2));
      var projX = seg.x1 + t * sx;
      var projY = seg.y1 + t * sy;
      var dx = entity.x - projX;
      var dy = entity.y - projY;
      var dist = Math.hypot(dx, dy);

      if (dist < r) {
        if (dist < 0.001) { dx = 1; dy = 0; dist = 1; }
        var overlap = r - dist;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
      }
    }
  },

  setupWave: function(waveNum) {
    this.state.wave = waveNum;
    if (waveNum > this.state.maxWaveReached) {
      this.state.maxWaveReached = waveNum;
    }
    this.waveState.spawned = 0;
    // Stage 2 (canyon highway) has extra monster swarms as requested!
    var extraHorde = (this.layoutType === "long_line_three_checkpoints") ? 14 : 0;
    this.waveState.toSpawn = 16 + extraHorde + Math.min(50, Math.floor(waveNum * 2.2));
    this.waveState.spawnTimer = 0.30;
    this.waveState.bossActive = (waveNum % 5 === 0);
    if (window.GameUI) window.GameUI.updateHUD();
  },

  spawnEnemy: function(forceBoss) {
    var realm = this.getCurrentRealm();
    var w = this.state.wave;
    var scale = realm.enemyMult * Math.pow(1.15, w - 1);

    var pool = ["cultist", "cultist", "skeleton_warrior", "shadow_imp"];
    if (w >= 3) pool.push("orc_warrior", "scorpion");
    if (w >= 5 || realm.id >= 2) pool.push("dark_mage");
    if (w >= 7 || realm.id >= 2) pool.push("stone_golem");
    if (realm.id >= 3 || w >= 12) pool.push("frost_wolf");
    if (realm.id >= 4 || w >= 18) pool.push("flame_demon");
    if (realm.id >= 5 || w >= 25) pool.push("void_reaver");

    var archId = forceBoss ? "realm_boss" : pool[Math.floor(Math.random() * pool.length)];
    var arch = window.GAME_DATA.bestiary.find(function(b) { return b.id === archId; }) || window.GAME_DATA.bestiary[0];

    var roads = this.roads || [];
    var road = roads[Math.floor(Math.random() * roads.length)] || roads[0];
    var startPt = (road && road.waypoints && road.waypoints[0]) ? road.waypoints[0] : { x: this.width - 100, y: this.height * 0.5 };

    var hp = Math.round(45 * arch.hpMult * scale);
    var goldReward = Math.max(5, Math.round(arch.gold * realm.rewardMult * (1 + w * 0.12)));

    this.enemies.push({
      id: "en_" + Date.now() + "_" + Math.random(),
      archId: arch.id,
      name: forceBoss ? realm.bossName : arch.name,
      icon: arch.icon,
      isBoss: !!forceBoss,
      roadId: road ? road.id : "road_main",
      waypoints: road ? road.waypoints : [startPt, { x: 280, y: 750 }],
      wpIndex: 1,
      laneOffset: (Math.random() - 0.5) * 32,
      x: startPt.x + (Math.random() - 0.5) * 35,
      y: startPt.y + (Math.random() - 0.5) * 35,
      hp: hp,
      maxHp: hp,
      speed: arch.spd * (0.95 + Math.random() * 0.10),
      radius: forceBoss ? 36 : (arch.id === "orc_warrior" || arch.id === "stone_golem" ? 22 : 16),
      gold: goldReward,
      atkTimer: 0,
      slowTimer: 0,
      stunTimer: 0,
      flashTimer: 0,
      walkPhase: Math.random() * Math.PI * 2
    });
  },

  loop: function(timestamp) {
    if (!this.running) return;
    var rawDt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;
    var dt = rawDt * this.gameSpeed;

    this.update(dt, rawDt);
    this.render();

    var self = this;
    requestAnimationFrame(function(ts) { self.loop(ts); });
  },

  update: function(dt, rawDt) {
    if (this.isDefeated) return;

    this.state.playSeconds += rawDt;
    this.hero.animPhase += dt * 6;

    this.updateResourcesAndBuffs(dt);
    this.updateHeroMovement(dt);
    this.updateGroundLogoInteraction(dt);
    this.updateHeroAndTowersCombat(dt);
    this.updateAllies(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateLootAndFlyingCoins(dt);
    this.updateParticlesAndTexts(dt);

    if (window.GameUI) {
      window.GameUI.tickUI(rawDt);
    }
  },

  updateResourcesAndBuffs: function(dt) {
    var mineLv = (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 0;
    var wellLv = (this.state.pads["pad_ManaWell"] && this.state.pads["pad_ManaWell"].level) || 0;
    var yieldMult = (1 + this.getTalentVal("t_mine_yield")) * this.getDivinityMult();

    if (mineLv > 0) {
      var goldPerSec = mineLv * 4.5 * yieldMult * this.getCurrentRealm().rewardMult;
      this.state.gold += goldPerSec * dt;
      this.state.totalGoldEarned += goldPerSec * dt;
    }
    if (wellLv > 0) {
      var manaPerSec = wellLv * 0.60 * yieldMult;
      this.state.mana += manaPerSec * dt;
    }

    var regenRate = this.getTalentVal("t_wall_regen");
    if (this.state.heroClassId === "paladin") regenRate += 0.008;
    if (regenRate > 0) {
      if (this.wall.hp < this.wall.maxHp && this.wall.hp > 0) {
        this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + this.wall.maxHp * regenRate * dt);
      }
      if (this.halls) {
        this.halls.forEach(function(h) {
          if (h.hp < h.maxHp && h.hp > 0) {
            h.hp = Math.min(h.maxHp, h.hp + h.maxHp * (regenRate * 0.7) * dt);
          }
        });
      }
    }

    if (this.townHall.flashTimer > 0) this.townHall.flashTimer -= dt;

    var cdMult = 1 + (this.state.heroClassId === "archmage" ? 0.25 : 0) + this.getTalentVal("t_skill_cd") + wellLv * 0.015;
    for (var i = 0; i < this.skills.length; i++) {
      var sk = this.skills[i];
      if (sk.cd > 0) sk.cd = Math.max(0, sk.cd - dt * cdMult);
      if (sk.buffTimer && sk.buffTimer > 0) sk.buffTimer = Math.max(0, sk.buffTimer - dt);
    }

    for (var b = this.burnZones.length - 1; b >= 0; b--) {
      this.burnZones[b].life -= dt;
      if (this.burnZones[b].life <= 0) this.burnZones.splice(b, 1);
    }

    for (var l = this.lightningArcs.length - 1; l >= 0; l--) {
      this.lightningArcs[l].life -= dt;
      if (this.lightningArcs[l].life <= 0) this.lightningArcs.splice(l, 1);
    }
  },

  updateHeroMovement: function(dt) {
    var cls = this.getCurrentHeroClass();
    var speed = cls.moveSpeed;
    var dx = 0;
    var dy = 0;

    var k = this.input.keys;
    if (k["KeyW"] || k["ArrowUp"]) dy -= 1;
    if (k["KeyS"] || k["ArrowDown"]) dy += 1;
    if (k["KeyA"] || k["ArrowLeft"]) dx -= 1;
    if (k["KeyD"] || k["ArrowRight"]) dx += 1;

    if (this.input.joyActive && (Math.abs(this.input.joyDx) > 0.05 || Math.abs(this.input.joyDy) > 0.05)) {
      dx = this.input.joyDx;
      dy = this.input.joyDy;
      this.hero.targetX = null;
      this.hero.targetY = null;
    }

    if (dx !== 0 || dy !== 0) {
      var len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this.hero.x += dx * speed * dt;
      this.hero.y += dy * speed * dt;
      if (Math.abs(dx) > 0.05) this.hero.facing = dx > 0 ? 1 : -1;
      this.resolveWallCollisions(this.hero, true);
      this.clampHeroPosition();
      return;
    }

    if (this.aiMode > 0 && this.hero.targetX === null) {
      this.computeAiTarget();
    }

    if (this.hero.targetX !== null && this.hero.targetY !== null) {
      var movePt = this.getSmartMovePoint(this.hero.x, this.hero.y, this.hero.targetX, this.hero.targetY);
      var tx = movePt.x - this.hero.x;
      var ty = movePt.y - this.hero.y;
      var dist = Math.hypot(tx, ty);
      var finalDist = Math.hypot(this.hero.targetX - this.hero.x, this.hero.targetY - this.hero.y);
      if (finalDist > 8 && dist > 4) {
        this.hero.x += (tx / dist) * speed * dt;
        this.hero.y += (ty / dist) * speed * dt;
        if (Math.abs(tx) > 2) this.hero.facing = tx > 0 ? 1 : -1;
      } else {
        this.hero.targetX = null;
        this.hero.targetY = null;
      }
    }

    this.resolveWallCollisions(this.hero, true);
    this.clampHeroPosition();
  },

  clampHeroPosition: function() {
    this.hero.x = Math.max(60, Math.min(this.width - 60, this.hero.x));
    this.hero.y = Math.max(90, Math.min(this.height - 75, this.hero.y));
  },

  computeAiTarget: function() {
    var self = this;
    if (this.aiMode === 2) {
      var bestPad = null;
      var bestScore = Infinity;
      (window.GAME_DATA.groundPads || []).forEach(function(p) {
        if (self.state.unlockedZones.indexOf(p.zone) === -1) return;
        var st = self.state.pads[p.id];
        if (!st || st.level >= p.maxLevel) return;
        if (st.cooldown && st.cooldown > 0) return;
        var rem = self.getPadRemaining(p);
        var avail = p.currency === "mana" ? self.state.mana : self.state.gold;
        if (avail >= rem) {
          var priority = (p.type === "expand" ? 0.1 : (st.level === 0 ? 0.3 : 1.0)) * rem;
          if (priority < bestScore) {
            bestScore = priority;
            bestPad = p;
          }
        }
      });
      if (bestPad) {
        this.hero.targetX = bestPad.x;
        this.hero.targetY = bestPad.y;
        return;
      }
    }

    if (this.lootDrops.length > 0) {
      var drop = this.lootDrops[0];
      this.hero.targetX = drop.x;
      this.hero.targetY = drop.y;
      return;
    }

    if (this.enemies.length > 0) {
      var en = this.enemies[0];
      this.hero.targetX = Math.max(250, Math.min(this.width - 250, en.x - 90));
      this.hero.targetY = Math.max(150, Math.min(this.height - 150, en.y));
    }
  },

  updateGroundLogoInteraction: function(dt) {
    var self = this;
    var activePad = null;

    (window.GAME_DATA.groundPads || []).forEach(function(pad) {
      if (self.state.unlockedZones.indexOf(pad.zone) === -1) return;
      var st = self.state.pads[pad.id];
      if (!st) return;
      if (st.cooldown && st.cooldown > 0) {
        st.cooldown = Math.max(0, st.cooldown - dt);
      }

      var dist = Math.hypot(self.hero.x - pad.x, self.hero.y - pad.y);
      if (dist < 56) {
        activePad = pad;
        // If pad is customizable and unbuilt (level == 0), hero stands on it to pour build coins
        // If already built (level >= 1), pours coins to upgrade!
        if (st.level < pad.maxLevel && (!st.cooldown || st.cooldown <= 0)) {
          var cost = self.getPadCost(pad);
          var needed = cost - st.invested;
          var avail = pad.currency === "mana" ? self.state.mana : self.state.gold;

          if (avail >= 0.5 && needed > 0) {
            var speedMult = 1 + self.getTalentVal("t_step_speed");
            var transferRate = Math.max(30, cost * 1.55 * speedMult);
            var stepAmt = Math.min(avail, needed, transferRate * dt);

            if (stepAmt > 0) {
              if (pad.currency === "mana") {
                self.state.mana -= stepAmt;
              } else {
                self.state.gold -= stepAmt;
              }
              st.invested += stepAmt;

              if (Math.random() < 0.65) {
                self.spawnFlyingCoin(self.hero.x, self.hero.y - 16, pad.x, pad.y - 10, pad.currency);
                window.SoundEngine.playCoinFeed();
              }

              if (st.invested >= cost - 0.01) {
                st.invested = 0;
                st.level += 1;
                // If it was Lv 0 customizable pad, lock its blueprint now!
                if (pad.customizable && !st.blueprintId) {
                  st.blueprintId = pad.defaultBlueprint || "bp_arcane_spire";
                }
                self.executePadActivation(pad, st);
              }
            }
          }
        }
      }
    });

    this.hero.activePadId = activePad ? activePad.id : null;
  },

  spawnFlyingCoin: function(sx, sy, tx, ty, currency) {
    this.flyingCoins.push({
      sx: sx + (Math.random() - 0.5) * 14,
      sy: sy,
      tx: tx + (Math.random() - 0.5) * 16,
      ty: ty,
      progress: 0,
      speed: 2.9 + Math.random() * 0.8,
      arcHeight: 46 + Math.random() * 26,
      currency: currency
    });
  },

  executePadActivation: function(pad, st) {
    this.spawnBurstParticles(pad.x, pad.y, pad.currency === "mana" ? "#38bdf8" : "#fbbf24", 28);

    if (pad.type === "town_hall") {
      window.SoundEngine.playUpgradeComplete();
      this.recalcWallStats(false);
      this.townHall.hp = Math.min(this.townHall.maxHp, this.townHall.hp + Math.round(this.townHall.maxHp * 0.45));
      this.addFloatingText(pad.x, pad.y - 45, "🏛️ 大本營升級 Lv." + st.level + "！", "#fde047", 18);
    } else if (pad.type === "expand") {
      window.SoundEngine.playExpand();
      if (this.state.unlockedZones.indexOf(pad.unlocksZone) === -1) {
        this.state.unlockedZones.push(pad.unlocksZone);
      }
      this.addFloatingText(pad.x, pad.y - 40, "🔓 領地擴建！", "#fde047", 20);
      if (window.GameUI) window.GameUI.showToast("✨ 成功解鎖防線：" + pad.name + "！");
    } else if (pad.type === "wall") {
      window.SoundEngine.playUpgradeComplete();
      this.recalcWallStats(false);
      this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + Math.round(this.wall.maxHp * 0.5));
      this.gateBreached = false;
      this.addFloatingText(pad.x, pad.y - 35, "🛡️ 城防要塞強化 Lv." + st.level, "#22c55e", 16);
    } else if (pad.type === "forge") {
      window.SoundEngine.playUpgradeComplete();
      this.state.heroWeaponForgeLv += 1;
      this.spawnLootDrop(pad.x + (Math.random() - 0.5) * 55, pad.y + 35, "chest", 1);
      this.addFloatingText(pad.x, pad.y - 35, "⚒️ 鍛造聖物寶箱！", "#f43f5e", 16);
    } else if (pad.type === "shrine") {
      window.SoundEngine.playSkill();
      st.cooldown = 12;
      this.triggerCataclysm(true);
      this.addFloatingText(pad.x, pad.y - 40, "🌋 天罰流星火雨！", "#f97316", 18);
    } else if (pad.type === "portal") {
      window.SoundEngine.playExpand();
      st.cooldown = 15;
      this.spawnEnemy(true);
      this.addFloatingText(pad.x, pad.y - 40, "⛩️ 遠古魔王降臨！", "#a855f7", 18);
    } else {
      window.SoundEngine.playUpgradeComplete();
      var bp = pad.customizable ? this.getPadBlueprint(pad) : null;
      var dispName = bp ? bp.name : pad.name;
      var label = st.level === 1 ? "✨ 建造完成！" : "⬆️ 升級 Lv." + st.level;
      this.addFloatingText(pad.x, pad.y - 35, dispName + " " + label, "#fde047", 16);
      if (bp && bp.category === "barracks" && st.level === 1) {
        this.spawnBarracksTroop(pad, bp, st.level);
      }
    }

    this.checkQuestProgress();
    if (window.GameUI) {
      window.GameUI.updateHUD();
      window.GameUI.updateContextCard();
    }
  },

  updateHeroAndTowersCombat: function(dt) {
    var self = this;
    var cls = this.getCurrentHeroClass();
    var atkSpdMult = (1 + this.getTalentVal("t_atk_spd")) * (this.skills[1].buffTimer > 0 ? 1.8 : 1.0);

    // Hero Auto-Attack
    this.hero.atkTimer -= dt * atkSpdMult;
    if (this.hero.atkTimer <= 0 && this.enemies.length > 0) {
      var target = this.findNearestEnemy(this.hero.x, this.hero.y, cls.range + 60);
      if (target) {
        this.hero.atkTimer = cls.atkRate;
        this.hero.facing = target.x >= this.hero.x ? 1 : -1;
        var dmg = this.getHeroDamage();
        this.fireProjectile(this.hero.x, this.hero.y - 16, target, cls.projType, dmg, cls.color);
      }
    }

    // All Active Halls (Main Citadel + Outpost) Fire Ballista
    if (this.halls) {
      this.halls.forEach(function(h) {
        if (h.hp > 0 && self.enemies.length > 0) {
          h.atkTimer = (h.atkTimer || 0) - dt;
          if (h.atkTimer <= 0) {
            var closeEnemy = self.findNearestEnemy(h.x, h.y, 620);
            if (closeEnemy) {
              h.atkTimer = 0.90;
              var ballistaDmg = Math.round(self.getHeroDamage() * 1.35);
              self.fireProjectile(h.x, h.y - 35, closeEnemy, "ballista", ballistaDmg, "#fde047");
            }
          }
        }
      });
    }

    // Customizable Built Towers & Barracks (Level >= 1)
    (window.GAME_DATA.groundPads || []).forEach(function(pad) {
      var st = self.state.pads[pad.id];
      if (!st || st.level <= 0) return;

      st.atkTimer = (st.atkTimer || 0) - dt * atkSpdMult;
      if (st.atkTimer > 0) return;

      var originX = pad.towerX || pad.x;
      var originY = (pad.towerY || pad.y) - 30;

      if (pad.customizable) {
        var bp = self.getPadBlueprint(pad);
        if (!bp) return;

        if (bp.category === "tower") {
          var range = bp.range || 540;
          var tEnemy = self.findNearestEnemy(originX, originY, range);
          if (tEnemy) {
            st.atkTimer = bp.atkRate || 0.75;
            var tDmg = self.getTowerDamage(pad, st.level);

            if (bp.projKind === "frost") {
              for (var m = -1; m <= 1; m++) {
                self.fireProjectile(originX + m * 8, originY - 22, tEnemy, "frost", Math.round(tDmg * 0.55), bp.color, m * 0.14);
              }
            } else if (bp.projKind === "hammer") {
              self.lightningArcs.push({ x1: originX + 18, y1: originY - 12, x2: tEnemy.x, y2: tEnemy.y, color: "#38bdf8", life: 0.22 });
              self.fireProjectile(originX + 18, originY - 12, tEnemy, "hammer", tDmg, bp.color);
            } else {
              self.fireProjectile(originX, originY, tEnemy, bp.projKind, tDmg, bp.color);
            }
          }
        } else if (bp.category === "barracks") {
          st.atkTimer = Math.max(2.5, (bp.spawnInterval || 5.0) * Math.pow(0.97, st.level - 1));
          self.spawnBarracksTroop(pad, bp, st.level);
        }
      } else if (pad.type === "mine") {
        st.atkTimer = 4.5;
        var desiredSprites = Math.min(5, 1 + Math.floor(st.level / 5));
        var curSprites = self.allies.filter(function(a) { return a.kind === "sprite"; }).length;
        if (curSprites < desiredSprites) {
          self.spawnAlly("sprite", pad.x, pad.y, st.level, null);
        }
      }
    });
  },

  spawnBarracksTroop: function(pad, bp, level) {
    var maxCombatAllies = 24;
    var curCombat = this.allies.filter(function(a) { return a.kind !== "sprite"; }).length;
    if (curCombat >= maxCombatAllies) return;

    var count = bp.troopCount || 1;
    var tx = pad.towerX || pad.x;
    var ty = pad.towerY || pad.y;
    for (var i = 0; i < count; i++) {
      this.spawnAlly(bp.troopType || "guard", tx, ty, level, bp);
    }
  },

  findNearestEnemy: function(x, y, maxRange) {
    var best = null;
    var bestDist = maxRange || 9999;
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      var d = Math.hypot(e.x - x, e.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  },

  fireProjectile: function(sx, sy, target, kind, dmg, color, angleOffset) {
    var angle = Math.atan2(target.y - sy, target.x - sx) + (angleOffset || 0);
    var count = kind === "multi_chakram" ? 3 : 1;
    for (var c = 0; c < count; c++) {
      var spread = count > 1 ? (c - 1) * 0.22 : 0;
      var a = angle + spread;
      this.projectiles.push({
        x: sx,
        y: sy,
        vx: Math.cos(a) * 540,
        vy: Math.sin(a) * 540,
        kind: kind,
        dmg: dmg,
        color: color,
        life: 1.8,
        pierce: (kind === "sword" || kind === "ballista" || kind === "sword_wave") ? 4 : 1,
        hitIds: {}
      });
    }
  },

  spawnAlly: function(kind, x, y, level, bp) {
    var powMult = (1 + this.getTalentVal("t_summon_pow")) * this.getDivinityMult();
    var baseHp = (bp && bp.troopHp) ? bp.troopHp : (kind === "cavalry" ? 380 : (kind === "golem" ? 750 : (kind === "archer" ? 160 : 220)));
    var baseDmg = (bp && bp.troopDmg) ? bp.troopDmg : (kind === "cavalry" ? 45 : (kind === "golem" ? 80 : (kind === "archer" ? 32 : 28)));
    var hp = Math.round(baseHp * Math.pow(1.22, level - 1) * powMult);
    var dmg = Math.round(baseDmg * Math.pow(1.22, level - 1) * powMult);

    this.allies.push({
      kind: kind,
      x: x + (Math.random() - 0.5) * 26,
      y: y + (Math.random() - 0.5) * 26,
      radius: kind === "golem" ? 22 : (kind === "cavalry" ? 18 : 14),
      hp: hp,
      maxHp: hp,
      dmg: dmg,
      attackRange: kind === "archer" ? 230 : 28,
      speed: kind === "sprite" ? 260 : (kind === "cavalry" ? 180 : (kind === "golem" ? 90 : 125)),
      atkTimer: 0,
      life: kind === "sprite" ? 999 : 35
    });
  },

  updateAllies: function(dt) {
    for (var i = this.allies.length - 1; i >= 0; i--) {
      var al = this.allies[i];
      al.life -= dt;
      if (al.hp <= 0 || al.life <= 0) {
        this.allies.splice(i, 1);
        continue;
      }

      if (al.kind === "sprite") {
        if (this.lootDrops.length > 0) {
          var drop = this.lootDrops[0];
          var dx = drop.x - al.x;
          var dy = drop.y - al.y;
          var d = Math.hypot(dx, dy);
          if (d > 14) {
            al.x += (dx / d) * al.speed * dt;
            al.y += (dy / d) * al.speed * dt;
          } else {
            this.collectLootDrop(0);
          }
        }
        continue;
      }

      if (al.kind === "cavalry") {
        for (var l = this.lootDrops.length - 1; l >= 0; l--) {
          if (Math.hypot(this.lootDrops[l].x - al.x, this.lootDrops[l].y - al.y) < 55) {
            this.collectLootDrop(l);
          }
        }
      }

      var target = this.findNearestEnemy(al.x, al.y, 1400);
      if (target) {
        var movePt = this.getSmartMovePoint(al.x, al.y, target.x, target.y);
        var ex = movePt.x - al.x;
        var ey = movePt.y - al.y;
        var ed = Math.hypot(ex, ey);
        var trueDist = Math.hypot(target.x - al.x, target.y - al.y);

        if (trueDist > target.radius + (al.attackRange || 24)) {
          if (ed > 1) {
            al.x += (ex / ed) * al.speed * dt;
            al.y += (ey / ed) * al.speed * dt;
          }
        } else {
          al.atkTimer -= dt;
          if (al.atkTimer <= 0) {
            al.atkTimer = al.kind === "archer" ? 0.55 : 0.70;
            if (al.kind === "archer") {
              this.fireProjectile(al.x, al.y - 10, target, "multi_chakram", al.dmg, "#22c55e");
            } else {
              this.damageEnemy(target, al.dmg, "#fde047", false);
              if (al.kind === "golem") {
                target.stunTimer = Math.max(target.stunTimer, 0.4);
              }
            }
          }
        }
      }

      this.resolveWallCollisions(al, true);
    }
  },

  // Monster movement and siege progression based on stage layout
  updateEnemies: function(dt) {
    if (this.waveState.spawned < this.waveState.toSpawn) {
      this.waveState.spawnTimer -= dt;
      if (this.waveState.spawnTimer <= 0) {
        var isLastAndBoss = (this.waveState.spawned === this.waveState.toSpawn - 1) && this.waveState.bossActive;
        this.spawnEnemy(isLastAndBoss);
        this.waveState.spawned++;
        this.waveState.spawnTimer = Math.max(0.22, 0.70 - this.state.wave * 0.012);
      }
    } else if (this.enemies.length === 0) {
      this.waveState.waveClearTimer += dt;
      if (this.waveState.waveClearTimer >= 1.2) {
        this.waveState.waveClearTimer = 0;
        var clearBonus = Math.round(35 * this.getCurrentRealm().rewardMult * (1 + this.state.wave * 0.25));
        this.state.gold += clearBonus;
        this.state.totalGoldEarned += clearBonus;
        this.addFloatingText(this.hero.x, this.hero.y - 50, "🎉 第 " + this.state.wave + " 波擊退！賞金 +" + clearBonus, "#fde047", 20);
        this.checkQuestProgress();
        this.setupWave(this.state.wave + 1);
      }
    }

    var counts = { road_north: 0, road_center: 0, road_south: 0, road_main: 0, road_long: 0, road_east: 0, road_west: 0 };
    for (var k = 0; k < this.enemies.length; k++) {
      var rId = this.enemies[k].roadId;
      if (counts[rId] !== undefined) counts[rId]++;
    }
    this.roadEnemyCounts = counts;

    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      e.walkPhase = (e.walkPhase || 0) + dt * 8;
      if (e.flashTimer > 0) e.flashTimer -= dt;
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }
      var spdMult = e.slowTimer > 0 ? 0.45 : 1.0;
      if (e.slowTimer > 0) e.slowTimer -= dt;

      for (var b = 0; b < this.burnZones.length; b++) {
        var bz = this.burnZones[b];
        if (Math.hypot(e.x - bz.x, e.y - bz.y) < bz.radius) {
          e.hp -= bz.dps * dt;
        }
      }

      if (e.hp <= 0) {
        this.killEnemy(i);
        continue;
      }

      // Check if intercepted by ally on the road
      var engagedAlly = null;
      for (var a = 0; a < this.allies.length; a++) {
        var al = this.allies[a];
        if (al.kind === "sprite") continue;
        if (Math.hypot(al.x - e.x, al.y - e.y) < e.radius + al.radius + 14) {
          engagedAlly = al;
          break;
        }
      }

      if (engagedAlly) {
        e.atkTimer -= dt;
        if (e.atkTimer <= 0) {
          e.atkTimer = 0.95;
          var aDmg = Math.max(6, Math.round(10 * this.getCurrentRealm().enemyMult * Math.pow(1.08, this.state.wave - 1)));
          engagedAlly.hp -= aDmg;
        }
        this.resolveWallCollisions(e, false);
        continue;
      }

      // Siege progression by stage layout:
      if (this.layoutType === "long_line_three_checkpoints") {
        // Stage 2: Long canyon road with 3 checkpoints
        var cp1 = this.checkpoints[0];
        var cp2 = this.checkpoints[1];
        var cp3 = this.checkpoints[2];
        var targetX = 260; // Town hall

        if (!cp1.breached) {
          targetX = cp1.x + e.radius + 18;
          if (e.x > targetX) {
            e.x -= e.speed * spdMult * dt;
          } else {
            // Attack Checkpoint 1
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 1.0;
              var dmg = Math.max(8, Math.round(15 * this.getCurrentRealm().enemyMult * (e.isBoss ? 3.5 : 1)));
              cp1.hp = Math.max(0, cp1.hp - dmg);
              if (cp1.hp <= 0) {
                cp1.breached = true;
                this.addFloatingText(e.x, e.y - 30, "💥 第一道關卡被攻破！", "#ef4444", 18);
              }
            }
          }
        } else if (!cp2.breached) {
          targetX = cp2.x + e.radius + 18;
          if (e.x > targetX) {
            e.x -= e.speed * spdMult * dt;
          } else {
            // Attack Checkpoint 2
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 1.0;
              var dmg2 = Math.max(10, Math.round(18 * this.getCurrentRealm().enemyMult * (e.isBoss ? 3.5 : 1)));
              cp2.hp = Math.max(0, cp2.hp - dmg2);
              if (cp2.hp <= 0) {
                cp2.breached = true;
                this.addFloatingText(e.x, e.y - 30, "💥 第二道關卡被攻破！", "#ef4444", 18);
              }
            }
          }
        } else if (!cp3.breached) {
          targetX = cp3.x + e.radius + 18;
          if (e.x > targetX) {
            e.x -= e.speed * spdMult * dt;
          } else {
            // Attack Checkpoint 3
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 1.0;
              var dmg3 = Math.max(12, Math.round(20 * this.getCurrentRealm().enemyMult * (e.isBoss ? 3.5 : 1)));
              cp3.hp = Math.max(0, cp3.hp - dmg3);
              if (cp3.hp <= 0) {
                cp3.breached = true;
                this.gateBreached = true;
                this.addFloatingText(e.x, e.y - 30, "🚨 王城內閘失守！魔物突入大本營！", "#ef4444", 20);
              }
            }
          }
        } else {
          // Checkpoints breached! Attack Town Hall!
          var hdist = Math.hypot(this.townHall.x - e.x, this.townHall.y - e.y);
          if (hdist > e.radius + this.townHall.radius + 10) {
            var hdx = this.townHall.x - e.x;
            var hdy = this.townHall.y - e.y;
            e.x += (hdx / hdist) * e.speed * spdMult * dt;
            e.y += (hdy / hdist) * e.speed * spdMult * dt;
          } else {
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 0.95;
              var hDmg = Math.max(14, Math.round(22 * this.getCurrentRealm().enemyMult * (e.isBoss ? 4 : 1)));
              this.townHall.hp = Math.max(0, this.townHall.hp - hDmg);
              this.townHall.flashTimer = 0.14;
              if (this.townHall.hp <= 0) {
                this.townHall.hp = 0;
                this.triggerDefeat();
                return;
              }
            }
          }
        }
      } else if (this.layoutType === "multiple_halls_outpost") {
        // Stage 4: Outpost Keep -> Main Citadel
        var outpost = this.halls.find(function(h) { return h.isOutpost; });
        var mainKeep = this.townHall;

        if (outpost && outpost.hp > 0) {
          // March toward outpost
          var odist = Math.hypot(outpost.x - e.x, outpost.y - e.y);
          if (odist > e.radius + outpost.radius + 10) {
            var odx = outpost.x - e.x;
            var ody = outpost.y - e.y;
            e.x += (odx / odist) * e.speed * spdMult * dt;
            e.y += (ody / odist) * e.speed * spdMult * dt;
          } else {
            // Attack Outpost!
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 0.95;
              var oDmg = Math.max(12, Math.round(18 * this.getCurrentRealm().enemyMult * (e.isBoss ? 3.5 : 1)));
              outpost.hp = Math.max(0, outpost.hp - oDmg);
              if (outpost.hp <= 0) {
                outpost.hp = 0;
                this.addFloatingText(outpost.x, outpost.y - 40, "💥 前哨要塞被攻陷！", "#ef4444", 20);
                if (window.GameUI) window.GameUI.showToast("🚨 前哨要塞失守！魔物正向王城主營推進！");
              }
            }
          }
        } else {
          // Outpost fallen: March toward Main Citadel Keep
          var mdist = Math.hypot(mainKeep.x - e.x, mainKeep.y - e.y);
          if (mdist > e.radius + mainKeep.radius + 10) {
            var mdx = mainKeep.x - e.x;
            var mdy = mainKeep.y - e.y;
            e.x += (mdx / mdist) * e.speed * spdMult * dt;
            e.y += (mdy / mdist) * e.speed * spdMult * dt;
          } else {
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 0.95;
              var mDmg = Math.max(15, Math.round(22 * this.getCurrentRealm().enemyMult * (e.isBoss ? 4 : 1)));
              mainKeep.hp = Math.max(0, mainKeep.hp - mDmg);
              mainKeep.flashTimer = 0.14;
              if (mainKeep.hp <= 0) {
                mainKeep.hp = 0;
                this.triggerDefeat();
                return;
              }
            }
          }
        }
      } else {
        // Stage 1 & 3: Standard Gate attack -> Town Hall invasion
        var wps = e.waypoints || [{ x: this.width - 100, y: 750 }, { x: 280, y: 750 }];
        var destX, destY;

        if (!this.gateBreached) {
          var wpIdx = Math.min(wps.length - 2, e.wpIndex || 0);
          var wp = wps[wpIdx];
          destX = wp.x;
          destY = wp.y + (wpIdx < wps.length - 2 ? (e.laneOffset || 0) : 0);

          var dx = destX - e.x;
          var dy = destY - e.y;
          var distToWp = Math.hypot(dx, dy);

          if (wpIdx < wps.length - 2 && distToWp < 42) {
            e.wpIndex = wpIdx + 1;
          }

          var gatePt = this.getNearestGatePoint(e.x, e.y);
          var distToGate = Math.hypot(e.x - gatePt.x, e.y - gatePt.y);

          if (distToGate > e.radius + 32) {
            if (distToWp > 1) {
              e.x += (dx / distToWp) * e.speed * spdMult * dt;
              e.y += (dy / distToWp) * e.speed * spdMult * dt;
            }
          } else {
            // Attacking Wall & Gate
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 1.0;
              var eDmg = Math.max(8, Math.round(14 * this.getCurrentRealm().enemyMult * Math.pow(1.09, this.state.wave - 1)));
              if (e.isBoss) eDmg *= 3.5;
              this.wall.hp = Math.max(0, this.wall.hp - eDmg);

              var thornsRatio = this.getTalentVal("t_wall_thorns");
              if (thornsRatio > 0) {
                this.damageEnemy(e, Math.round(this.getHeroDamage() * thornsRatio), "#38bdf8", false);
              }

              if (this.wall.hp <= 0) {
                this.wall.hp = 0;
                this.gateBreached = true;
                this.addFloatingText(e.x, e.y - 30, "🚨 城門失守！魔物突入大本營！", "#ef4444", 20);
                if (window.GameUI) window.GameUI.showToast("🚨 警報：城門被攻破！魔物突入大本營！");
              }
            }
          }
        } else {
          // Gate Breached: March to Town Hall
          destX = this.townHall.x;
          destY = this.townHall.y;

          var distToHall = Math.hypot(destX - e.x, destY - e.y);
          if (distToHall > e.radius + this.townHall.radius + 10) {
            var hdx = destX - e.x;
            var hdy = destY - e.y;
            e.x += (hdx / distToHall) * e.speed * spdMult * dt;
            e.y += (hdy / distToHall) * e.speed * spdMult * dt;
          } else {
            e.atkTimer -= dt;
            if (e.atkTimer <= 0) {
              e.atkTimer = 0.95;
              var hDmg = Math.max(12, Math.round(18 * this.getCurrentRealm().enemyMult * Math.pow(1.09, this.state.wave - 1)));
              if (e.isBoss) hDmg *= 4;
              this.townHall.hp = Math.max(0, this.townHall.hp - hDmg);
              this.townHall.flashTimer = 0.14;

              if (this.townHall.hp <= 0) {
                this.townHall.hp = 0;
                this.triggerDefeat();
                return;
              }
            }
          }
        }
      }

      this.resolveWallCollisions(e, false);
    }
  },

  triggerDefeat: function() {
    if (this.isDefeated) return;
    this.isDefeated = true;
    window.SoundEngine.playHit("hammer");
    if (window.GameUI) {
      window.GameUI.showDefeatModal();
    }
  },

  reviveFromDefeat: function() {
    this.isDefeated = false;
    this.recalcWallStats(true);
    var self = this;
    this.enemies.forEach(function(e) {
      e.x += 280;
      e.y += 140;
      e.stunTimer = 3.0;
    });
    this.spawnBurstParticles(this.townHall.x, this.townHall.y, "#fde047", 50);
    window.SoundEngine.playSkill();
    if (window.GameUI) {
      window.GameUI.closeModal();
      window.GameUI.showToast("✨ 聖光復甦！大本營與城防已完全修復！");
      window.GameUI.updateHUD();
    }
  },

  damageEnemy: function(enemy, rawDmg, color, canCrit) {
    var dmg = rawDmg;
    var isCrit = false;
    if (enemy.isBoss) {
      dmg = Math.round(dmg * (1 + this.getTalentVal("t_boss_slayer")));
    }
    if (canCrit !== false) {
      var critChance = 0.08 + this.getTalentVal("t_crit_chance");
      if (Math.random() < critChance) {
        isCrit = true;
        var critMult = 1.75 + (this.state.talents["t_crit_chance"] || 0) * 0.15;
        dmg = Math.round(dmg * critMult);
      }
    }
    enemy.hp -= dmg;
    enemy.flashTimer = 0.12;
    this.addFloatingText(
      enemy.x + (Math.random() - 0.5) * 16,
      enemy.y - enemy.radius - 8,
      (isCrit ? "💥" : "") + dmg,
      isCrit ? "#fde047" : (color || "#ffffff"),
      isCrit ? 15 : 12
    );
  },

  killEnemy: function(index) {
    var e = this.enemies[index];
    if (!e) return;
    this.enemies.splice(index, 1);

    this.state.totalKills++;
    this.state.heroXp += e.isBoss ? 45 : 6;
    var xpNeeded = this.state.heroLevel * 45;
    if (this.state.heroXp >= xpNeeded) {
      this.state.heroXp -= xpNeeded;
      this.state.heroLevel++;
      this.addFloatingText(this.hero.x, this.hero.y - 40, "🎉 英雄升級 Lv." + this.state.heroLevel + "！", "#38bdf8", 18);
      window.SoundEngine.playUpgradeComplete();
    }

    var goldMult = (1 + this.getTalentVal("t_gold_drop")) * (1 + this.getEquipStat("goldBonus")) * this.getDivinityMult();
    var totalGold = Math.max(3, Math.round(e.gold * goldMult));
    var coinPiles = e.isBoss ? 8 : (totalGold > 20 ? 3 : 2);
    var perCoin = Math.max(1, Math.round(totalGold / coinPiles));

    for (var c = 0; c < coinPiles; c++) {
      this.spawnLootDrop(
        e.x + (Math.random() - 0.5) * 38,
        e.y + (Math.random() - 0.5) * 32,
        "gold",
        perCoin
      );
    }

    var manaChance = 0.25 + this.getTalentVal("t_mana_drop") * 0.5;
    if (e.isBoss || Math.random() < manaChance) {
      var manaAmt = Math.max(1, Math.round((e.isBoss ? 15 : 2) * (1 + this.getTalentVal("t_mana_drop"))));
      this.spawnLootDrop(e.x + (Math.random() - 0.5) * 28, e.y + (Math.random() - 0.5) * 28, "mana", manaAmt);
    }

    if (e.isBoss || Math.random() < 0.05) {
      if (e.isBoss) {
        var soulGain = Math.max(1, Math.round(2 * this.getCurrentRealm().id));
        this.state.souls += soulGain;
        this.addFloatingText(e.x, e.y - 24, "🔮 靈魂結晶 +" + soulGain, "#d8b4fe", 16);
      }
      this.spawnLootDrop(e.x, e.y, "chest", 1);
    }

    this.spawnBurstParticles(e.x, e.y, "#38bdf8", e.isBoss ? 22 : 10);
  },

  updateProjectiles: function(dt) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      for (var j = this.enemies.length - 1; j >= 0; j--) {
        var e = this.enemies[j];
        if (p.hitIds[e.id]) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + 15) {
          p.hitIds[e.id] = true;
          p.pierce--;
          window.SoundEngine.playHit(p.kind);

          if (p.kind === "frost") {
            e.slowTimer = 2.8;
            this.spawnBurstParticles(e.x, e.y, "#38bdf8", 8);
            this.damageEnemy(e, p.dmg, "#7dd3fc", true);
          } else if (p.kind === "hammer" || p.kind === "holy_hammer" || p.kind === "arcane_chain") {
            this.spawnBurstParticles(e.x, e.y, "#60a5fa", 12);
            var jumps = 0;
            for (var k = 0; k < this.enemies.length; k++) {
              var sub = this.enemies[k];
              if (Math.hypot(sub.x - e.x, sub.y - e.y) < 105) {
                if (jumps < 3 && sub.id !== e.id) {
                  this.lightningArcs.push({ x1: e.x, y1: e.y, x2: sub.x, y2: sub.y, color: "#93c5fd", life: 0.18 });
                  jumps++;
                }
                sub.stunTimer = Math.max(sub.stunTimer, 0.45);
                this.damageEnemy(sub, Math.round(p.dmg * 0.85), "#60a5fa", true);
              }
            }
          } else if (p.kind === "flame" || p.kind === "dragon") {
            this.burnZones.push({ x: e.x, y: e.y, radius: 68, dps: p.dmg * 0.45, life: 3.2 });
            this.spawnBurstParticles(e.x, e.y, "#f97316", 12);
            this.damageEnemy(e, p.dmg, "#fb923c", true);
          } else if (p.kind === "void") {
            for (var v = 0; v < this.enemies.length; v++) {
              var ve = this.enemies[v];
              var vDist = Math.hypot(ve.x - e.x, ve.y - e.y);
              if (vDist < 140 && vDist > 5) {
                ve.x += ((e.x - ve.x) / vDist) * 38;
                ve.y += ((e.y - ve.y) / vDist) * 38;
              }
            }
            this.damageEnemy(e, p.dmg + Math.round(e.maxHp * 0.03), "#c084fc", true);
          } else {
            this.damageEnemy(e, p.dmg, p.color, true);
          }

          if (e.hp <= 0) {
            this.killEnemy(j);
          }
          if (p.pierce <= 0) {
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  },

  spawnLootDrop: function(x, y, kind, amount) {
    if (this.lootDrops.length > 90 && kind === "gold") {
      this.lootDrops[0].amount += amount;
      return;
    }
    this.lootDrops.push({
      x: Math.max(80, Math.min(this.width - 80, x)),
      y: Math.max(110, Math.min(this.height - 90, y)),
      kind: kind,
      amount: amount,
      age: 0
    });
  },

  updateLootAndFlyingCoins: function(dt) {
    var cls = this.getCurrentHeroClass();
    var magnetRange = 115 * cls.magnetBonus * (1 + this.getTalentVal("t_magnet_rad"));

    for (var i = this.lootDrops.length - 1; i >= 0; i--) {
      var d = this.lootDrops[i];
      d.age += dt;
      var dist = Math.hypot(this.hero.x - d.x, this.hero.y - d.y);
      if (dist < magnetRange || d.age > 6.5) {
        var pullSpeed = d.age > 6.5 ? 540 : 400;
        var dx = this.hero.x - d.x;
        var dy = this.hero.y - d.y;
        var len = Math.max(1, Math.hypot(dx, dy));
        d.x += (dx / len) * pullSpeed * dt;
        d.y += (dy / len) * pullSpeed * dt;
        if (len < 24) {
          this.collectLootDrop(i);
        }
      }
    }

    for (var f = this.flyingCoins.length - 1; f >= 0; f--) {
      var fc = this.flyingCoins[f];
      fc.progress += fc.speed * dt;
      if (fc.progress >= 1) {
        this.flyingCoins.splice(f, 1);
      }
    }
  },

  collectLootDrop: function(index) {
    var d = this.lootDrops[index];
    if (!d) return;
    this.lootDrops.splice(index, 1);

    if (d.kind === "gold") {
      this.state.gold += d.amount;
      this.state.totalGoldEarned += d.amount;
      window.SoundEngine.playCoinPickup();
    } else if (d.kind === "mana") {
      this.state.mana += d.amount;
      this.addFloatingText(this.hero.x, this.hero.y - 28, "💎 +" + d.amount, "#38bdf8", 13);
      window.SoundEngine.playCoinPickup();
    } else if (d.kind === "chest") {
      var item = this.rollRandomEquipment();
      this.addFloatingText(this.hero.x, this.hero.y - 34, "🎁 獲得：" + item.name, item.color, 15);
      window.SoundEngine.playUpgradeComplete();
    }
  },

  rollRandomEquipment: function(minRarity) {
    var slots = ["weapon", "armor", "ring", "relic"];
    var slot = slots[Math.floor(Math.random() * slots.length)];
    var templates = window.GAME_DATA.equipTemplates[slot];
    var tmpl = templates[Math.floor(Math.random() * templates.length)];

    var rRoll = Math.random() + (this.state.realmId - 1) * 0.08 + Math.min(0.25, this.state.wave * 0.004);
    var tier = minRarity || 0;
    if (rRoll > 1.18) tier = Math.max(tier, 5);
    else if (rRoll > 0.98) tier = Math.max(tier, 4);
    else if (rRoll > 0.80) tier = Math.max(tier, 3);
    else if (rRoll > 0.55) tier = Math.max(tier, 2);
    else if (rRoll > 0.28) tier = Math.max(tier, 1);

    var rDef = window.GAME_DATA.rarities[tier];
    var item = {
      id: "eq_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
      slot: slot,
      name: "【" + rDef.name + "】" + tmpl.name,
      icon: tmpl.icon,
      tier: tier,
      color: rDef.color,
      statType: tmpl.statType,
      val: Number((tmpl.baseVal * rDef.mult).toFixed(2))
    };

    var cur = this.state.equipped[slot];
    if (!cur || item.val > cur.val) {
      if (cur) this.state.inventory.push(cur);
      this.state.equipped[slot] = item;
      this.recalcWallStats(false);
    } else {
      this.state.inventory.push(item);
    }
    if (this.state.inventory.length > 36) {
      this.state.inventory.shift();
    }
    return item;
  },

  mergeAllInventory: function() {
    var mergedCount = 0;
    for (var t = 0; t < 5; t++) {
      var matching = this.state.inventory.filter(function(i) { return i.tier === t; });
      while (matching.length >= 3) {
        var toRemove = matching.splice(0, 3);
        var removeIds = toRemove.map(function(x) { return x.id; });
        this.state.inventory = this.state.inventory.filter(function(i) {
          return removeIds.indexOf(i.id) === -1;
        });
        this.rollRandomEquipment(t + 1);
        mergedCount++;
      }
    }
    return mergedCount;
  },

  castSkill: function(index) {
    var sk = this.skills[index];
    if (!sk || sk.cd > 0) return;
    sk.cd = sk.maxCd;
    window.SoundEngine.playSkill();

    if (sk.id === "nova") {
      this.spawnBurstParticles(this.hero.x, this.hero.y, "#38bdf8", 32);
      var dmg = this.getHeroDamage() * 4.5;
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        if (Math.hypot(this.enemies[i].x - this.hero.x, this.enemies[i].y - this.hero.y) < 380) {
          this.damageEnemy(this.enemies[i], dmg, "#38bdf8", true);
          if (this.enemies[i].hp <= 0) this.killEnemy(i);
        }
      }
      for (var l = 0; l < this.lootDrops.length; l++) {
        this.lootDrops[l].age = 99;
      }
      this.addFloatingText(this.hero.x, this.hero.y - 45, "🌪️ 風暴吸金！", "#38bdf8", 18);
    } else if (sk.id === "aegis") {
      sk.buffTimer = 8.0;
      this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + Math.round(this.wall.maxHp * 0.45));
      if (this.halls) {
        this.halls.forEach(function(h) {
          h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.40));
        });
      }
      this.gateBreached = false;
      this.addFloatingText(this.hero.x, this.hero.y - 45, "🛡️ 聖光壁壘：要塞修復！", "#fde047", 18);
    } else if (sk.id === "meteor") {
      this.triggerCataclysm(false);
    }
  },

  triggerCataclysm: function(fromShrine) {
    var dmg = this.getHeroDamage() * (fromShrine ? 9.0 : 6.5);
    for (var m = 0; m < 12; m++) {
      var mx = 450 + Math.random() * (this.width - 600);
      var my = 200 + Math.random() * (this.height - 400);
      this.spawnBurstParticles(mx, my, "#38bdf8", 18);
      this.burnZones.push({ x: mx, y: my, radius: 85, dps: dmg * 0.25, life: 4.0 });
    }
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].stunTimer = 1.8;
      this.damageEnemy(this.enemies[i], dmg, "#fb923c", true);
      if (this.enemies[i].hp <= 0) this.killEnemy(i);
    }
  },

  checkQuestProgress: function() {
    var q = window.GAME_DATA.quests[this.state.questIndex];
    if (!q) return;
    var done = false;
    var self = this;

    if (q.type === "any_tower_built") {
      (window.GAME_DATA.groundPads || []).forEach(function(p) {
        if (p.customizable && self.state.pads[p.id] && self.state.pads[p.id].level >= 1) done = true;
      });
    } else if (q.type === "wave") {
      if (this.state.wave > q.goal) done = true;
    } else if (q.type === "zone") {
      if (this.state.unlockedZones.indexOf(q.goal) !== -1) done = true;
    } else if (q.type === "any_tower_lv") {
      (window.GAME_DATA.groundPads || []).forEach(function(p) {
        if (p.customizable && self.state.pads[p.id] && self.state.pads[p.id].level >= q.goal) done = true;
      });
    } else if (q.type === "any_troop_built") {
      (window.GAME_DATA.groundPads || []).forEach(function(p) {
        if (p.customizable && self.state.pads[p.id] && self.state.pads[p.id].level >= q.goal) {
          var bp = self.getPadBlueprint(p);
          if (bp && bp.category === "barracks") done = true;
        }
      });
    } else if (q.type === "unlock_bp_count") {
      if (this.state.unlockedBlueprints.length >= q.goal) done = true;
    }

    if (done) {
      this.state.gold += q.rewardGold;
      this.state.mana += q.rewardMana;
      this.state.souls += q.rewardSoul;
      this.state.questIndex++;
      window.SoundEngine.playUpgradeComplete();
      if (window.GameUI) {
        window.GameUI.showToast("🏆 完成任務【" + q.title + "】！獲得 🪙" + q.rewardGold + " 💎" + q.rewardMana + " 🔮" + q.rewardSoul);
        window.GameUI.updateHUD();
      }
    }
  },

  changeRealm: function(newRealmId, isRebirth) {
    var startGold = 200 + this.getTalentVal("t_start_gold");
    this.state.realmId = newRealmId;
    this.state.wave = 1;
    this.state.gold = startGold;
    this.state.unlockedZones = [0];

    // Load new map configuration for this realm
    this.loadRealmMap(newRealmId);

    // Initialize pads for this realm
    var self = this;
    (window.GAME_DATA.groundPads || []).forEach(function(p) {
      var startLv = (p.id === "pad_TownHall" || p.id === "pad_GateInner" || p.id === "pad_FrostStatue") ? 1 : 0;
      var defaultBp = p.defaultBlueprint || "bp_arcane_spire";
      self.state.pads[p.id] = {
        level: startLv,
        invested: 0,
        cooldown: 0,
        blueprintId: p.customizable ? (startLv > 0 ? defaultBp : null) : null,
        atkTimer: 0
      };
    });

    this.enemies = [];
    this.projectiles = [];
    this.lootDrops = [];
    this.allies = [];
    this.burnZones = [];
    this.isDefeated = false;
    this.recalcWallStats(true);
    this.setupWave(1);
    this.saveGame();

    if (window.GameUI) {
      window.GameUI.updateHUD();
      window.GameUI.updateContextCard();
      window.GameUI.showToast(isRebirth ? "✨ 轉生成功！神性加成已提升！" : "🗺️ 已進入：" + this.getCurrentRealm().name);
    }
  },

  performRebirth: function() {
    var earnedSouls = Math.max(2, Math.floor(this.state.wave * 0.6 * this.state.realmId));
    var earnedDivinity = Math.max(1, Math.floor(this.state.wave / 5) * this.state.realmId);
    this.state.souls += earnedSouls;
    this.state.divinity += earnedDivinity;
    this.state.rebirthCount += 1;
    this.changeRealm(this.state.realmId, true);
  },

  spawnBurstParticles: function(x, y, color, count) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var spd = 40 + Math.random() * 140;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        color: color,
        size: 3 + Math.random() * 4,
        life: 0.45 + Math.random() * 0.35
      });
    }
  },

  addFloatingText: function(x, y, text, color, size) {
    if (this.floatingTexts.length > 35) this.floatingTexts.shift();
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color || "#ffffff",
      size: size || 14,
      life: 1.05
    });
  },

  updateParticlesAndTexts: function(dt) {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (var j = this.floatingTexts.length - 1; j >= 0; j--) {
      var ft = this.floatingTexts[j];
      ft.y -= 32 * dt;
      ft.life -= dt;
      if (ft.life <= 0) this.floatingTexts.splice(j, 1);
    }
  },

  saveGame: function() {
    try {
      this.state.lastSaveTimestamp = Date.now();
      localStorage.setItem("AAB_SAVE_V1", JSON.stringify(this.state));
    } catch (e) {}
  },

  loadSave: function() {
    try {
      var raw = localStorage.getItem("AAB_SAVE_V1");
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed.gold === "number") {
        for (var k in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, k)) {
            this.state[k] = parsed[k];
          }
        }
        var elapsedSec = Math.floor((Date.now() - (this.state.lastSaveTimestamp || Date.now())) / 1000);
        if (elapsedSec > 60) {
          var cappedSec = Math.min(elapsedSec, 36000);
          var mineLv = Math.max(1, (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 1);
          var offMult = (1 + this.getTalentVal("t_offline_gain")) * this.getDivinityMult();
          var offGold = Math.round(cappedSec * mineLv * 1.8 * offMult);
          var offMana = Math.round(cappedSec * 0.08 * offMult);
          this.state.gold += offGold;
          this.state.mana += offMana;
        }
      }
    } catch (e) {}
  },

  screenToWorld: function(clientX, clientY) {
    var rect = this.canvas.getBoundingClientRect();
    var sx = clientX - rect.left;
    var sy = clientY - rect.top;
    return {
      x: (sx - this.camera.x) / this.camera.zoom,
      y: (sy - this.camera.y) / this.camera.zoom
    };
  },

  bindInputs: function() {
    var self = this;
    window.addEventListener("keydown", function(e) {
      self.input.keys[e.code] = true;
    });
    window.addEventListener("keyup", function(e) {
      self.input.keys[e.code] = false;
    });

    this.canvas.addEventListener("wheel", function(e) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.08 : 0.08;
      self.camera.userZoomMult = Math.max(0.55, Math.min(1.25, (self.camera.userZoomMult || 0.85) + delta));
    }, { passive: false });

    var startPointer = function(clientX, clientY) {
      window.SoundEngine.init();
      self.input.joyActive = true;
      self.input.joyStartX = clientX;
      self.input.joyStartY = clientY;
      self.input.joyCurX = clientX;
      self.input.joyCurY = clientY;
      self.input.joyDx = 0;
      self.input.joyDy = 0;
    };

    var movePointer = function(clientX, clientY) {
      if (!self.input.joyActive) return;
      self.input.joyCurX = clientX;
      self.input.joyCurY = clientY;
      var dx = clientX - self.input.joyStartX;
      var dy = clientY - self.input.joyStartY;
      var dist = Math.hypot(dx, dy);
      var maxR = 50;
      if (dist > 6) {
        var clamped = Math.min(dist, maxR) / maxR;
        self.input.joyDx = (dx / dist) * clamped;
        self.input.joyDy = (dy / dist) * clamped;
      } else {
        self.input.joyDx = 0;
        self.input.joyDy = 0;
      }
    };

    var endPointer = function(clientX, clientY) {
      if (!self.input.joyActive) return;
      var moved = Math.hypot(clientX - self.input.joyStartX, clientY - self.input.joyStartY);
      self.input.joyActive = false;
      self.input.joyDx = 0;
      self.input.joyDy = 0;

      if (moved < 14) {
        var pt = self.screenToWorld(clientX, clientY);
        self.hero.targetX = pt.x;
        self.hero.targetY = pt.y;
      }
    };

    this.canvas.addEventListener("mousedown", function(e) {
      startPointer(e.clientX, e.clientY);
    });
    window.addEventListener("mousemove", function(e) {
      movePointer(e.clientX, e.clientY);
    });
    window.addEventListener("mouseup", function(e) {
      endPointer(e.clientX, e.clientY);
    });

    this.canvas.addEventListener("touchstart", function(e) {
      if (e.touches.length > 0) {
        startPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchmove", function(e) {
      if (self.input.joyActive && e.touches.length > 0) {
        movePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener("touchend", function(e) {
      var t = e.changedTouches && e.changedTouches[0];
      endPointer(t ? t.clientX : self.input.joyCurX, t ? t.clientY : self.input.joyCurY);
    }, { passive: true });
  },

  // ================= 2.5D CEL-SHADED RENDERER =================
  render: function() {
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var realm = this.getCurrentRealm();

    var scaleX = cw / 1400;
    var scaleY = ch / 950;
    var baseZoom = Math.max(scaleX, scaleY) * (this.camera.userZoomMult || 0.85);
    if (cw < 650) {
      baseZoom = Math.max(0.55, baseZoom);
    }
    this.camera.zoom = baseZoom;

    var targetCamX = cw * 0.5 - this.hero.x * baseZoom;
    var targetCamY = ch * 0.5 - this.hero.y * baseZoom;
    var minCamX = cw - this.width * baseZoom;
    var minCamY = ch - this.height * baseZoom;
    this.camera.x = Math.min(0, Math.max(minCamX, targetCamX));
    this.camera.y = Math.min(0, Math.max(minCamY, targetCamY));

    ctx.fillStyle = realm.groundColor;
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    this.drawForestCourtyardAndRoads(ctx, realm);
    this.drawTerritoryBoundaries(ctx);
    this.drawDungeonGateAndBraziers(ctx);
    this.drawBurnZones(ctx);
    this.drawWallsAndGates(ctx, realm);
    this.drawHalls(ctx);
    this.drawGroundLogosAndStatues(ctx);
    this.drawSceneryProps(ctx);
    this.drawLootDrops(ctx);
    this.drawAllies(ctx);
    this.drawEnemies(ctx);
    this.drawHero(ctx);
    this.drawProjectilesAndLightning(ctx);
    this.drawFlyingCoins(ctx);
    this.drawPointerHandOnQuestPad(ctx);
    this.drawParticlesAndTexts(ctx);

    ctx.restore();

    this.drawOffscreenThreatIndicators(ctx, cw, ch);
    this.drawTouchJoystick(ctx);
    if (this.isDefeated) {
      this.drawDefeatOverlay(ctx, cw, ch);
    }
  },

  drawForestCourtyardAndRoads: function(ctx, realm) {
    ctx.fillStyle = realm.grassDark || "#3e7533";
    for (var gx = 60; gx < this.width; gx += 140) {
      for (var gy = 80; gy < this.height; gy += 140) {
        ctx.beginPath();
        ctx.ellipse(gx + (gy % 280 === 0 ? 35 : 0), gy, 38, 18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Roads for active stage
    var roads = this.roads || [];
    roads.forEach(function(road) {
      var wps = road.waypoints;
      if (!wps || wps.length < 2) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle = realm.pathBorder || "#78532a";
      ctx.lineWidth = (road.width || 110) + 18;
      ctx.beginPath();
      ctx.moveTo(wps[0].x, wps[0].y);
      for (var i = 1; i < wps.length; i++) {
        ctx.lineTo(wps[i].x, wps[i].y);
      }
      ctx.stroke();

      ctx.strokeStyle = realm.pathColor || "#b58952";
      ctx.lineWidth = road.width || 110;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.setLineDash([18, 22]);
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.restore();
    });
  },

  drawDungeonGateAndBraziers: function(ctx) {
    var mineLv = (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 0;
    var time = performance.now() * 0.006;
    var padMine = (window.GAME_DATA.groundPads || []).find(function(p) { return p.type === "mine"; });
    if (!padMine) return;

    ctx.save();
    ctx.translate(padMine.x - 30, padMine.y - 70);

    ctx.fillStyle = "#68736b";
    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-60, -50, 120, 85, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(0, -5, 26, Math.PI, 0, false);
    ctx.lineTo(26, 35);
    ctx.lineTo(-26, 35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fde047";
    ctx.font = "900 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    var txt = mineLv > 0 ? "🔥 地下金庫 Lv." + mineLv : "🔥 地下金庫";
    ctx.strokeText(txt, 0, -35);
    ctx.fillText(txt, 0, -35);

    ctx.restore();
  },

  drawWallsAndGates: function(ctx, realm) {
    var wallLv = (this.state.pads["pad_WallFortify"] && this.state.pads["pad_WallFortify"].level) || 0;
    var hpPct = Math.max(0, Math.min(1, this.wall.hp / this.wall.maxHp));
    var segments = this.wallSegments || [];
    var turrets = this.bastionTurrets || [];
    var self = this;

    var wallBaseCol = wallLv >= 25 ? "#b45309" : (wallLv >= 10 ? "#334155" : "#4a544c");
    var wallTopCol = wallLv >= 25 ? "#fde047" : (wallLv >= 10 ? "#93c5fd" : (realm.wallTopColor || "#9ca898"));
    var trimCol = wallLv >= 25 ? "#fef08a" : (wallLv >= 10 ? "#38bdf8" : "#22c55e");

    segments.forEach(function(seg) {
      if (seg.type === "gate" || seg.isGate) {
        self.drawGatehouseArchway(ctx, seg, wallLv, hpPct);
      } else {
        self.drawSolidRampartSegment(ctx, seg, wallBaseCol, wallTopCol, trimCol, hpPct);
      }
    });

    turrets.forEach(function(t) {
      self.drawBastionTurret(ctx, t.x, t.y, wallLv, wallBaseCol, wallTopCol, trimCol);
    });
  },

  drawSolidRampartSegment: function(ctx, seg, baseCol, topCol, trimCol, hpPct) {
    var dx = seg.x2 - seg.x1;
    var dy = seg.y2 - seg.y1;
    var len = Math.hypot(dx, dy);
    var wallAng = Math.atan2(dy, dx);
    var steps = Math.max(3, Math.floor(len / 44));

    for (var s = 0; s <= steps; s++) {
      var t = s / steps;
      var bx = seg.x1 + dx * t;
      var by = seg.y1 + dy * t;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(wallAng);

      ctx.fillStyle = "rgba(0,0,0,0.40)";
      ctx.beginPath();
      ctx.roundRect(-26, -18, 52, 36, 6);
      ctx.fill();

      ctx.fillStyle = baseCol;
      ctx.strokeStyle = "#141416";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-24, -22, 48, 44, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = topCol;
      ctx.strokeStyle = "#141416";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-26, -28, 52, 20, 5);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  },

  drawGatehouseArchway: function(ctx, seg, wallLv, hpPct) {
    var midX = (seg.x1 + seg.x2) * 0.5;
    var midY = (seg.y1 + seg.y2) * 0.5;
    var dx = seg.x2 - seg.x1;
    var dy = seg.y2 - seg.y1;
    var gateLen = Math.hypot(dx, dy);
    var wallAng = Math.atan2(dy, dx);
    var time = performance.now() * 0.004;

    var isGateBreached = this.gateBreached;
    if (seg.cpIndex && this.checkpoints && this.checkpoints[seg.cpIndex - 1]) {
      isGateBreached = this.checkpoints[seg.cpIndex - 1].breached;
    }

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(wallAng);

    // Roadbed through gate
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(-gateLen * 0.5 - 6, -35, gateLen + 12, 70);

    var roadGrad = ctx.createLinearGradient(0, -35, 0, 35);
    roadGrad.addColorStop(0, "#a89f91");
    roadGrad.addColorStop(0.5, "#c4b5a0");
    roadGrad.addColorStop(1, "#8f8272");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(-gateLen * 0.5, -32, gateLen, 64);

    // Green passing arrows
    var arrowPhase = (time * 3) % 1;
    ctx.fillStyle = isGateBreached ? "rgba(239, 68, 68, 0.85)" : "rgba(34, 197, 94, 0.75)";
    ctx.strokeStyle = isGateBreached ? "#f87171" : "#4ade80";
    ctx.lineWidth = 2.5;

    for (var a = -2; a <= 2; a++) {
      var ax = a * 24;
      var ay = -12 + arrowPhase * 24;
      if (ay > -28 && ay < 28) {
        ctx.beginPath();
        ctx.moveTo(ax - 8, ay - 6);
        ctx.lineTo(ax, ay + 4);
        ctx.lineTo(ax + 8, ay - 6);
        ctx.stroke();
      }
    }

    // Archway & Portcullis
    ctx.fillStyle = "#8c968e";
    ctx.strokeStyle = "#141416";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-gateLen * 0.5 + 10, -56, gateLen - 20, 24, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    ctx.strokeStyle = isGateBreached ? "#ef4444" : "#22c55e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-65, -80, 130, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isGateBreached ? "#f87171" : "#4ade80";
    ctx.font = "900 10.5px Inter, sans-serif";
    ctx.textAlign = "center";
    var gateName = (seg.name || "城門") + (isGateBreached ? " (已破)" : " (通衢)");
    ctx.fillText(gateName, 0, -66);

    ctx.restore();
  },

  drawBastionTurret: function(ctx, x, y, wallLv, baseCol, topCol, trimCol) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = baseCol;
    ctx.strokeStyle = "#141416";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.roundRect(-26, -42, 52, 58, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = topCol;
    ctx.beginPath();
    ctx.roundRect(-30, -54, 60, 18, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = wallLv >= 25 ? "#b45309" : (wallLv >= 10 ? "#1e3a8a" : "#78350f");
    ctx.beginPath();
    ctx.moveTo(-24, -54);
    ctx.lineTo(0, -96);
    ctx.lineTo(24, -54);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  },

  // Draw All Halls (Main Citadel Keep + Outposts)
  drawHalls: function(ctx) {
    var self = this;
    (this.halls || []).forEach(function(h) {
      self.drawIndividualHall(ctx, h);
    });
  },

  drawIndividualHall: function(ctx, h) {
    var hallLv = (this.state.pads["pad_TownHall"] && this.state.pads["pad_TownHall"].level) || 1;
    var hpPct = Math.max(0, Math.min(1, h.hp / h.maxHp));
    var time = performance.now() * 0.005;

    ctx.save();
    ctx.translate(h.x, h.y);

    // Ground Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 22, h.radius * 1.5, h.radius * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plinth
    ctx.fillStyle = "#334155";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-h.radius * 1.3, -28, h.radius * 2.6, 56, 10);
    ctx.fill();
    ctx.stroke();

    // Body
    ctx.fillStyle = h.flashTimer > 0 ? "#ffffff" : (h.isOutpost ? "#57534e" : "#475569");
    ctx.beginPath();
    ctx.roundRect(-h.radius, -68, h.radius * 2, 70, 8);
    ctx.fill();
    ctx.stroke();

    // Spire
    ctx.fillStyle = h.isOutpost ? "#b45309" : "#1d4ed8";
    ctx.beginPath();
    ctx.moveTo(-h.radius * 0.5, -68);
    ctx.lineTo(0, -118);
    ctx.lineTo(h.radius * 0.5, -68);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Banner Flag
    var flagWave = Math.sin(time * 4) * 4;
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -118);
    ctx.lineTo(0, -145);
    ctx.stroke();

    ctx.fillStyle = h.isOutpost ? "#f59e0b" : "#dc2626";
    ctx.beginPath();
    ctx.moveTo(0, -145);
    ctx.lineTo(22 + flagWave, -137);
    ctx.lineTo(0, -129);
    ctx.closePath();
    ctx.fill();

    // Floating HP Bar & Title
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    ctx.strokeStyle = h.isOutpost ? "#f59e0b" : "#fbbf24";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-80, -170, 160, 22, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = hpPct > 0.4 ? (h.isOutpost ? "#f59e0b" : "#22c55e") : "#ef4444";
    ctx.beginPath();
    ctx.roundRect(-77, -167, 154 * hpPct, 16, 7);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 10.5px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    var hallText = (h.isOutpost ? "🛡️ " : "🏛️ ") + h.name + " (" + Math.ceil(h.hp) + "/" + h.maxHp + ")";
    ctx.strokeText(hallText, 0, -155);
    ctx.fillText(hallText, 0, -155);

    ctx.restore();
  },

  drawTerritoryBoundaries: function(ctx) {
    // Drawn if unlockedZones does not contain zone 1, 2, or 3
  },

  drawGroundLogosAndStatues: function(ctx) {
    var self = this;
    var time = performance.now() * 0.004;

    (window.GAME_DATA.groundPads || []).forEach(function(pad) {
      if (self.state.unlockedZones.indexOf(pad.zone) === -1) return;
      if (pad.type === "town_hall") return;

      var st = self.state.pads[pad.id] || { level: 0, invested: 0, cooldown: 0 };
      var cost = self.getPadCost(pad);
      var rem = self.getPadRemaining(pad);
      var avail = pad.currency === "mana" ? self.state.mana : self.state.gold;
      var canAfford = avail >= rem;
      var isStanding = self.hero.activePadId === pad.id;
      var isMax = st.level >= pad.maxLevel;
      var bp = pad.customizable ? self.getPadBlueprint(pad) : null;

      // Draw Tower / Barracks building
      if (pad.customizable && bp) {
        var tx = pad.towerX || pad.x;
        var ty = pad.towerY || (pad.y - 54);
        self.drawCelShadedTowerOrBarracks(ctx, pad, bp, st.level, tx, ty, time);
      }

      ctx.save();
      ctx.translate(pad.x, pad.y);

      if (isStanding || (canAfford && !isMax && st.level === 0)) {
        var pulse = 1 + Math.sin(time * 2.2) * 0.06;
        ctx.save();
        ctx.scale(pulse, pulse * 0.82);
        var haloGrad = ctx.createRadialGradient(0, 0, 34, 0, 0, 58);
        haloGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
        haloGrad.addColorStop(0.6, "rgba(34, 211, 238, 0.45)");
        haloGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.scale(1, 0.82);

      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 5, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isStanding ? "#cbd5e1" : "#8c968e";
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = pad.type === "expand" ? "#3b2d54" : (bp && bp.category === "barracks" ? "#1e3a2f" : "#2e2842");
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st.invested > 0 && !isMax) {
        var prog = Math.min(1, st.invested / cost);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(0, 0, 38, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      var rawLabel = (bp ? bp.name : pad.name);
      ctx.font = "900 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3.2;
      ctx.fillStyle = "#ffffff";
      ctx.strokeText(rawLabel, 0, -4);
      ctx.fillText(rawLabel, 0, -4);

      if (!isMax) {
        var costStr = (st.cooldown && st.cooldown > 0) ? Math.ceil(st.cooldown) + "s" : (rem > 999 ? (rem / 1000).toFixed(1) + "k" : String(rem));
        ctx.fillStyle = pad.currency === "mana" ? "#c084fc" : "#fbbf24";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-14, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = "900 11px Inter, sans-serif";
        ctx.fillStyle = canAfford ? "#fde047" : "#f87171";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(costStr, 5, 16);
        ctx.fillText(costStr, 5, 16);
      } else {
        ctx.font = "900 10px Inter, sans-serif";
        ctx.fillStyle = "#4ade80";
        ctx.strokeText("MAX", 0, 14);
        ctx.fillText("MAX", 0, 14);
      }

      ctx.restore();
    });
  },

  drawCelShadedTowerOrBarracks: function(ctx, pad, bp, level, tx, ty, time) {
    ctx.save();
    ctx.translate(tx, ty);

    var kind = bp.projKind;
    if (kind === "frost") {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      ctx.ellipse(0, 22, 38, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = level >= 15 ? "#fde047" : "#8c968e";
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(-28, -55, 56, 75, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = level > 0 ? "#38bdf8" : "#1e293b";
      ctx.beginPath();
      ctx.arc(0, -18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#2563eb";
      ctx.beginPath();
      ctx.moveTo(-26, -68);
      ctx.lineTo(0, -112);
      ctx.lineTo(26, -68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === "hammer") {
      ctx.fillStyle = "#78827a";
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.roundRect(-32, -8, 64, 32, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.beginPath();
      ctx.roundRect(-16, -46, 32, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -56, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(-4, -70, 9, Math.PI * 0.8, Math.PI * 2.1);
      ctx.fill();
      ctx.stroke();
    } else if (bp.category === "barracks" && level > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 36, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#475569";
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-28, -36, 56, 46, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bp.color || "#22c55e";
      ctx.beginPath();
      ctx.moveTo(-34, -34);
      ctx.lineTo(0, -62);
      ctx.lineTo(34, -34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bp.icon, 0, -38);
    } else if (level > 0) {
      ctx.save();
      ctx.translate(0, -28 + Math.sin(time * 2.5) * 2);
      ctx.fillStyle = bp.color || "#fde047";
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bp.icon, 0, 7);
      ctx.restore();
    }

    ctx.restore();
  },

  drawSceneryProps: function(ctx) {
    var time = performance.now() * 0.003;
    (this.scenery || []).forEach(function(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      var sc = s.scale || 1;
      ctx.scale(sc, sc);

      if (s.kind === "tree" || s.kind === "rune_tree") {
        ctx.fillStyle = "#78350f";
        ctx.strokeStyle = "#1c1917";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-12, -28, 24, 34, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#2e6f28";
        ctx.beginPath();
        ctx.arc(0, -52, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (s.kind === "crystal_cluster") {
        ctx.fillStyle = s.color || "#d946ef";
        ctx.beginPath();
        ctx.arc(0, -18, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  },

'''

# Append tail procedural draw code
full_code = engine_core + tail_draw_code

with open("js/engine.js", "w", encoding="utf-8") as f:
    f.write(full_code)

print("engine.js successfully generated! Total characters:", len(full_code))
