// Polyfill for CanvasRenderingContext2D.roundRect on older mobile browsers
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
   Ancient Arcane Bastion (古域魔陣：守護神殿) - Core 2.5D Battlefield & RPG Engine
   Includes Ground Logo coin-streaming, Pedestal Statues, Territory Expansion,
   Swarming Monster Waves, Equipment Drops, Friendly Summons, and Mobile Controls
   ========================================================================== */

window.GameEngine = {
  canvas: null,
  ctx: null,
  width: 1200,
  height: 850,
  camera: { x: 0, y: 0, zoom: 1 },
  lastTime: 0,
  running: false,
  gameSpeed: 1,
  aiMode: 0, // 0 = Manual, 1 = Auto-Loot & Fight, 2 = Full Auto-Step & Upgrade

  // Persistent Player State
  state: {
    gold: 110,
    mana: 20,
    souls: 3,
    divinity: 0,
    rebirthCount: 0,
    realmId: 1,
    wave: 1,
    maxWaveReached: 1,
    endlessMode: false,
    heroClassId: "runeblade",
    heroLevel: 1,
    heroXp: 0,
    heroWeaponForgeLv: 0,
    unlockedZones: [0],
    pads: {}, // padId -> { level, invested, cooldown }
    talents: {}, // talentId -> level
    equipped: { weapon: null, armor: null, ring: null, relic: null },
    inventory: [],
    questIndex: 0,
    totalKills: 0,
    totalGoldEarned: 110,
    playSeconds: 0,
    lastSaveTimestamp: Date.now()
  },

  // Live Battlefield Entities
  hero: {
    x: 410,
    y: 440,
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

  wall: {
    hp: 600,
    maxHp: 600,
    x1: 225,
    y1: 790,
    x2: 865,
    y2: 245
  },

  waveState: {
    spawned: 0,
    toSpawn: 12,
    spawnTimer: 0,
    waveClearTimer: 0,
    bossActive: false
  },

  skills: [
    { id: "nova", name: "符文風暴", cd: 0, maxCd: 10 },
    { id: "aegis", name: "聖光壁壘", cd: 0, maxCd: 16, buffTimer: 0 },
    { id: "meteor", name: "太古天隕", cd: 0, maxCd: 24 }
  ],

  enemies: [],
  allies: [], // Friendly skeletons, paladin mercenaries, and rune carrier sprites
  projectiles: [],
  lootDrops: [], // Dropped gold coins, mana crystals, and equipment chests on ground
  flyingCoins: [], // Parabolic coins arcing from Hero into Ground Logo Pads!
  particles: [],
  floatingTexts: [],
  burnZones: [],
  scenery: [],

  // Touch & Keyboard Input State
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

    this.initDefaultPads();
    this.loadSave();
    this.generateScenery();
    this.recalcWallStats(true);
    this.setupWave(this.state.wave);
    this.bindInputs();
    this.handleResize();

    var self = this;
    window.addEventListener("resize", function() { self.handleResize(); });

    // Auto-save every 10 seconds
    setInterval(function() {
      self.saveGame();
    }, 10000);

    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(function(ts) { self.loop(ts); });
  },

  initDefaultPads: function() {
    var self = this;
    window.GAME_DATA.groundPads.forEach(function(p) {
      if (!self.state.pads[p.id]) {
        self.state.pads[p.id] = { level: 0, invested: 0, cooldown: 0 };
      }
    });
    // Pre-build Lv.1 Golden Hammer Statue or give player enough gold to step right on it like the ad!
    window.GAME_DATA.talents.forEach(function(t) {
      if (typeof self.state.talents[t.id] !== "number") {
        self.state.talents[t.id] = 0;
      }
    });
  },

  generateScenery: function() {
    this.scenery = [
      { x: 560, y: 110, kind: "cactus" },
      { x: 960, y: 390, kind: "cactus" },
      { x: 140, y: 740, kind: "pillar" },
      { x: 840, y: 155, kind: "pillar" },
      { x: 1050, y: 540, kind: "ruin" },
      { x: 740, y: 780, kind: "ruin" }
    ];
  },

  handleResize: function() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  // ================= STAT & MULTIPLIER CALCULATIONS =================
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
    var base = 16 * Math.pow(1.28, level - 1);
    if (padDef.towerKind === "hammer") base *= 1.45;
    if (padDef.towerKind === "sword") base *= 1.65;
    if (padDef.towerKind === "ballista") base *= 2.4;
    if (padDef.towerKind === "dragon") base *= 3.2;
    if (padDef.towerKind === "void") base *= 1.9;
    var tMult = 1 + this.getTalentVal("t_tower_dmg");
    var eqMult = 1 + this.getEquipStat("towerDmg");
    return Math.round(base * tMult * eqMult * this.getDivinityMult());
  },

  getPadCost: function(padDef) {
    var st = this.state.pads[padDef.id] || { level: 0 };
    var discount = Math.min(0.45, this.getTalentVal("t_pad_discount"));
    var raw = padDef.baseCost * Math.pow(padDef.costScale, st.level);
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
    var padLv = (this.state.pads["pad_WallFortify"] && this.state.pads["pad_WallFortify"].level) || 0;
    var base = 600 + padLv * 260 + (this.state.realmId - 1) * 800;
    var mult = (1 + this.getTalentVal("t_wall_hp")) * (1 + this.getEquipStat("wallHp"));
    var newMax = Math.round(base * mult);
    var ratio = this.wall.maxHp > 0 ? this.wall.hp / this.wall.maxHp : 1;
    this.wall.maxHp = newMax;
    this.wall.hp = healFull ? newMax : Math.min(newMax, Math.max(1, Math.round(newMax * ratio)));
  },

  // ================= WAVE & MONSTER SPAWNING =================
  setupWave: function(waveNum) {
    this.state.wave = waveNum;
    if (waveNum > this.state.maxWaveReached) {
      this.state.maxWaveReached = waveNum;
    }
    this.waveState.spawned = 0;
    this.waveState.toSpawn = 10 + Math.min(35, Math.floor(waveNum * 1.6));
    this.waveState.spawnTimer = 0.5;
    this.waveState.bossActive = (waveNum % 5 === 0);
    if (window.GameUI) window.GameUI.updateHUD();
  },

  spawnEnemy: function(forceBoss) {
    var realm = this.getCurrentRealm();
    var w = this.state.wave;
    var scale = realm.enemyMult * Math.pow(1.13, w - 1);

    // Choose archetype based on wave & realm
    var pool = ["cultist", "cultist", "scorpion"];
    if (w >= 2) pool.push("orc_warrior");
    if (w >= 4 || realm.id >= 2) pool.push("dark_mage");
    if (w >= 6 || realm.id >= 2) pool.push("stone_golem");
    if (realm.id >= 3 || w >= 12) pool.push("frost_wolf");
    if (realm.id >= 4 || w >= 18) pool.push("flame_demon");
    if (realm.id >= 5 || w >= 25) pool.push("void_reaver");

    var archId = forceBoss ? "realm_boss" : pool[Math.floor(Math.random() * pool.length)];
    var arch = window.GAME_DATA.bestiary.find(function(b) { return b.id === archId; }) || window.GAME_DATA.bestiary[0];

    // Spawn from the right / bottom-right canyon road (matching reference ad!)
    var laneSpread = (Math.random() - 0.5) * 260;
    var spawnX = 1040 + Math.random() * 110;
    var spawnY = 580 + laneSpread;

    var hp = Math.round(38 * arch.hpMult * scale);
    var goldReward = Math.max(2, Math.round(arch.gold * realm.rewardMult * (1 + w * 0.12)));

    this.enemies.push({
      id: "en_" + Date.now() + "_" + Math.random(),
      archId: arch.id,
      name: forceBoss ? realm.bossName : arch.name,
      icon: arch.icon,
      isBoss: !!forceBoss,
      x: spawnX,
      y: Math.max(320, Math.min(810, spawnY)),
      hp: hp,
      maxHp: hp,
      speed: arch.spd * (0.9 + Math.random() * 0.2),
      radius: forceBoss ? 34 : (arch.id === "orc_warrior" || arch.id === "stone_golem" ? 20 : 14),
      gold: goldReward,
      atkTimer: 0,
      slowTimer: 0,
      stunTimer: 0,
      flashTimer: 0
    });
  },

  // ================= MAIN GAME LOOP =================
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
    // Passive Gold Mine & Mana Well generation
    var mineLv = (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 0;
    var wellLv = (this.state.pads["pad_ManaWell"] && this.state.pads["pad_ManaWell"].level) || 0;
    var yieldMult = (1 + this.getTalentVal("t_mine_yield")) * this.getDivinityMult();

    if (mineLv > 0) {
      var goldPerSec = mineLv * 3.5 * yieldMult * this.getCurrentRealm().rewardMult;
      this.state.gold += goldPerSec * dt;
      this.state.totalGoldEarned += goldPerSec * dt;
    }
    if (wellLv > 0) {
      var manaPerSec = wellLv * 0.45 * yieldMult;
      this.state.mana += manaPerSec * dt;
    }

    // Wall regeneration (Paladin passive + Talent)
    var regenRate = this.getTalentVal("t_wall_regen");
    if (this.state.heroClassId === "paladin") regenRate += 0.008;
    if (regenRate > 0 && this.wall.hp < this.wall.maxHp) {
      this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + this.wall.maxHp * regenRate * dt);
    }

    // Active Skill Cooldowns
    var cdMult = 1 + (this.state.heroClassId === "archmage" ? 0.25 : 0) + this.getTalentVal("t_skill_cd") + wellLv * 0.015;
    for (var i = 0; i < this.skills.length; i++) {
      var sk = this.skills[i];
      if (sk.cd > 0) sk.cd = Math.max(0, sk.cd - dt * cdMult);
      if (sk.buffTimer && sk.buffTimer > 0) sk.buffTimer = Math.max(0, sk.buffTimer - dt);
    }

    // Burn zones on ground
    for (var b = this.burnZones.length - 1; b >= 0; b--) {
      this.burnZones[b].life -= dt;
      if (this.burnZones[b].life <= 0) this.burnZones.splice(b, 1);
    }
  },

  updateHeroMovement: function(dt) {
    var cls = this.getCurrentHeroClass();
    var speed = cls.moveSpeed;
    var dx = 0;
    var dy = 0;

    // 1. Check Keyboard WASD / Arrows
    var k = this.input.keys;
    if (k["KeyW"] || k["ArrowUp"]) dy -= 1;
    if (k["KeyS"] || k["ArrowDown"]) dy += 1;
    if (k["KeyA"] || k["ArrowLeft"]) dx -= 1;
    if (k["KeyD"] || k["ArrowRight"]) dx += 1;

    // 2. Check Virtual Touch Joystick
    if (this.input.joyActive && (Math.abs(this.input.joyDx) > 0.05 || Math.abs(this.input.joyDy) > 0.05)) {
      dx = this.input.joyDx;
      dy = this.input.joyDy;
      this.hero.targetX = null;
      this.hero.targetY = null;
    }

    // Manual input overrides waypoint
    if (dx !== 0 || dy !== 0) {
      var len = Math.hypot(dx, dy);
      if (len > 1) { dx /= len; dy /= len; }
      this.hero.x += dx * speed * dt;
      this.hero.y += dy * speed * dt;
      if (Math.abs(dx) > 0.05) this.hero.facing = dx > 0 ? 1 : -1;
      this.clampHeroPosition();
      return;
    }

    // 3. Check AI Auto-Pilot if no manual input
    if (this.aiMode > 0 && this.hero.targetX === null) {
      this.computeAiTarget();
    }

    // 4. Move toward waypoint (Tap-to-Move or AI target)
    if (this.hero.targetX !== null && this.hero.targetY !== null) {
      var tx = this.hero.targetX - this.hero.x;
      var ty = this.hero.targetY - this.hero.y;
      var dist = Math.hypot(tx, ty);
      if (dist > 6) {
        this.hero.x += (tx / dist) * speed * dt;
        this.hero.y += (ty / dist) * speed * dt;
        if (Math.abs(tx) > 2) this.hero.facing = tx > 0 ? 1 : -1;
      } else {
        this.hero.targetX = null;
        this.hero.targetY = null;
      }
    }

    this.clampHeroPosition();
  },

  clampHeroPosition: function() {
    this.hero.x = Math.max(60, Math.min(this.width - 60, this.hero.x));
    this.hero.y = Math.max(95, Math.min(this.height - 75, this.hero.y));
  },

  computeAiTarget: function() {
    var self = this;
    // Mode 2 (Full Auto-Step & Upgrade): First check if any unlocked Ground Logo is affordable!
    if (this.aiMode === 2) {
      var bestPad = null;
      var bestScore = Infinity;
      window.GAME_DATA.groundPads.forEach(function(p) {
        if (self.state.unlockedZones.indexOf(p.zone) === -1) return;
        var st = self.state.pads[p.id];
        if (!st || st.level >= p.maxLevel) return;
        if (st.cooldown && st.cooldown > 0) return;
        var rem = self.getPadRemaining(p);
        var avail = p.currency === "mana" ? self.state.mana : self.state.gold;
        if (avail >= rem) {
          // Prioritize Expand pads and unbuilt towers!
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

    // Next: Pick up any nearby loot drops on the ground
    if (this.lootDrops.length > 0) {
      var drop = this.lootDrops[0];
      this.hero.targetX = drop.x;
      this.hero.targetY = drop.y;
      return;
    }

    // Otherwise patrol along the inner fortress wall near enemies
    if (this.enemies.length > 0) {
      var en = this.enemies[0];
      this.hero.targetX = Math.max(200, Math.min(780, en.x - 110));
      this.hero.targetY = Math.max(200, Math.min(720, en.y - 60));
    }
  },

  // ================= GROUND LOGO STEPPING & RESOURCE STREAMING =================
  updateGroundLogoInteraction: function(dt) {
    var self = this;
    var activePad = null;

    window.GAME_DATA.groundPads.forEach(function(pad) {
      if (self.state.unlockedZones.indexOf(pad.zone) === -1) return;
      var st = self.state.pads[pad.id];
      if (st.cooldown && st.cooldown > 0) {
        st.cooldown = Math.max(0, st.cooldown - dt);
      }

      var dist = Math.hypot(self.hero.x - pad.x, self.hero.y - pad.y);
      if (dist < 48) {
        activePad = pad;
        if (st.level < pad.maxLevel && (!st.cooldown || st.cooldown <= 0)) {
          var cost = self.getPadCost(pad);
          var needed = cost - st.invested;
          var avail = pad.currency === "mana" ? self.state.mana : self.state.gold;

          if (avail >= 0.5 && needed > 0) {
            // Stream resources rapidly into the Ground Logo!
            var speedMult = 1 + self.getTalentVal("t_step_speed");
            var transferRate = Math.max(25, cost * 1.35 * speedMult);
            var stepAmt = Math.min(avail, needed, transferRate * dt);

            if (stepAmt > 0) {
              if (pad.currency === "mana") {
                self.state.mana -= stepAmt;
              } else {
                self.state.gold -= stepAmt;
              }
              st.invested += stepAmt;

              // Spawn visual flying coin/mana arc from Hero to Ground Logo (Just like the Ad!)
              if (Math.random() < 0.65) {
                self.spawnFlyingCoin(self.hero.x, self.hero.y - 16, pad.x, pad.y - 24, pad.currency);
                window.SoundEngine.playCoinFeed();
              }

              // Check if Ground Logo upgrade/action completed!
              if (st.invested >= cost - 0.01) {
                st.invested = 0;
                st.level += 1;
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
      speed: 2.8 + Math.random() * 0.8,
      arcHeight: 45 + Math.random() * 28,
      currency: currency
    });
  },

  executePadActivation: function(pad, st) {
    // Golden level-up pillar & particles
    this.spawnBurstParticles(pad.x, pad.y, pad.currency === "mana" ? "#38bdf8" : "#fbbf24", 26);

    if (pad.type === "expand") {
      window.SoundEngine.playExpand();
      if (this.state.unlockedZones.indexOf(pad.unlocksZone) === -1) {
        this.state.unlockedZones.push(pad.unlocksZone);
      }
      this.addFloatingText(pad.x, pad.y - 40, "🗺️ 領地擴張解鎖！", "#fde047", 20);
      if (window.GameUI) window.GameUI.showToast("✨ 成功擴建領地：" + pad.name + "！");
    } else if (pad.type === "wall") {
      window.SoundEngine.playUpgradeComplete();
      this.recalcWallStats(false);
      this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + Math.round(this.wall.maxHp * 0.45));
      this.addFloatingText(pad.x, pad.y - 35, "🛡️ 城牆強化 Lv." + st.level + " (+45%修復)", "#22c55e", 16);
    } else if (pad.type === "forge") {
      window.SoundEngine.playUpgradeComplete();
      this.state.heroWeaponForgeLv += 1;
      // Drop an RPG Equipment Chest right near the forge!
      this.spawnLootDrop(pad.x + (Math.random() - 0.5) * 55, pad.y + 35, "chest", 1);
      this.addFloatingText(pad.x, pad.y - 35, "⚒️ 神爐鍛造成功！掉落裝備寶箱", "#f43f5e", 16);
    } else if (pad.type === "shrine") {
      window.SoundEngine.playSkill();
      st.cooldown = 12;
      this.triggerCataclysm(true);
      this.addFloatingText(pad.x, pad.y - 40, "🌋 天罰神龕引爆：太古流星雨！", "#f97316", 18);
    } else if (pad.type === "portal") {
      window.SoundEngine.playExpand();
      st.cooldown = 15;
      this.spawnEnemy(true);
      this.addFloatingText(pad.x, pad.y - 40, "⛩️ 遠古深淵魔王降臨！", "#a855f7", 18);
      if (window.GameUI) window.GameUI.showToast("🐲 時空傳送門開啟：遠古首領已降臨戰場！");
    } else {
      window.SoundEngine.playUpgradeComplete();
      var label = st.level === 1 ? "✨ 建造完成！" : "⬆️ 升級 Lv." + st.level + "！";
      this.addFloatingText(pad.x, pad.y - 35, pad.name + " " + label, "#fde047", 16);
    }

    this.checkQuestProgress();
    if (window.GameUI) window.GameUI.updateHUD();
  },

  // ================= HERO & PEDESTAL STATUES COMBAT =================
  updateHeroAndTowersCombat: function(dt) {
    var self = this;
    var cls = this.getCurrentHeroClass();
    var atkSpdMult = (1 + this.getTalentVal("t_atk_spd")) * (this.skills[1].buffTimer > 0 ? 1.8 : 1.0);

    // 1. Hero Auto-Attack
    this.hero.atkTimer -= dt * atkSpdMult;
    if (this.hero.atkTimer <= 0 && this.enemies.length > 0) {
      var target = this.findNearestEnemy(this.hero.x, this.hero.y, cls.range + 40);
      if (target) {
        this.hero.atkTimer = cls.atkRate;
        this.hero.facing = target.x >= this.hero.x ? 1 : -1;
        var dmg = this.getHeroDamage();
        this.fireProjectile(this.hero.x, this.hero.y - 12, target, cls.projType, dmg, cls.color);
      }
    }

    // 2. Pedestal Statues / Towers Auto-Attack
    window.GAME_DATA.groundPads.forEach(function(pad) {
      if (pad.type !== "tower" && pad.type !== "barracks" && pad.type !== "mercenary" && pad.type !== "mine") return;
      var st = self.state.pads[pad.id];
      if (!st || st.level <= 0) return;

      st.atkTimer = (st.atkTimer || 0) - dt * atkSpdMult;
      if (st.atkTimer <= 0) {
        if (pad.type === "tower") {
          var range = pad.towerKind === "sword" || pad.towerKind === "ballista" ? 680 : 460;
          var tEnemy = self.findNearestEnemy(pad.x, pad.y, range);
          if (tEnemy) {
            var rate = pad.towerKind === "hammer" ? 1.15 : (pad.towerKind === "ballista" ? 1.35 : 0.72);
            st.atkTimer = rate;
            var tDmg = self.getTowerDamage(pad, st.level);
            self.fireProjectile(pad.x, pad.y - 26, tEnemy, pad.towerKind, tDmg, self.getTowerColor(pad.towerKind));
          }
        } else if (pad.type === "barracks") {
          // Spawn friendly skeleton guardian
          st.atkTimer = 5.5;
          self.spawnAlly("skeleton", pad.x, pad.y, st.level);
        } else if (pad.type === "mercenary") {
          // Spawn friendly solar paladin mercenary
          st.atkTimer = 6.5;
          self.spawnAlly("paladin_merc", pad.x, pad.y, st.level);
        } else if (pad.type === "mine") {
          // Spawn rune carrier sprite to collect distant gold coins
          st.atkTimer = 4.5;
          var desiredSprites = Math.min(5, 1 + Math.floor(st.level / 5));
          var curSprites = self.allies.filter(function(a) { return a.kind === "sprite"; }).length;
          if (curSprites < desiredSprites) {
            self.spawnAlly("sprite", pad.x, pad.y, st.level);
          }
        }
      }
    });
  },

  getTowerColor: function(kind) {
    var map = {
      frost: "#38bdf8",
      hammer: "#fbbf24",
      flame: "#ef4444",
      sword: "#c084fc",
      ballista: "#22d3ee",
      dragon: "#f59e0b",
      void: "#a855f7"
    };
    return map[kind] || "#fde047";
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

  fireProjectile: function(sx, sy, target, kind, dmg, color) {
    var angle = Math.atan2(target.y - sy, target.x - sx);
    var count = kind === "multi_chakram" ? 3 : 1;
    for (var c = 0; c < count; c++) {
      var spread = count > 1 ? (c - 1) * 0.22 : 0;
      var a = angle + spread;
      this.projectiles.push({
        x: sx,
        y: sy,
        vx: Math.cos(a) * 480,
        vy: Math.sin(a) * 480,
        kind: kind,
        dmg: dmg,
        color: color,
        life: 1.6,
        pierce: (kind === "sword" || kind === "ballista" || kind === "sword_wave") ? 4 : 1,
        hitIds: {}
      });
    }
  },

  // ================= FRIENDLY SUMMONS & MERCENARIES =================
  spawnAlly: function(kind, x, y, level) {
    var maxAllies = 14;
    if (this.allies.length >= maxAllies && kind !== "sprite") return;
    var powMult = (1 + this.getTalentVal("t_summon_pow")) * this.getDivinityMult();
    var hp = Math.round((kind === "paladin_merc" ? 260 : 140) * Math.pow(1.22, level - 1) * powMult);
    var dmg = Math.round((kind === "paladin_merc" ? 28 : 16) * Math.pow(1.22, level - 1) * powMult);

    this.allies.push({
      kind: kind,
      x: x + (Math.random() - 0.5) * 24,
      y: y + (Math.random() - 0.5) * 24,
      hp: hp,
      maxHp: hp,
      dmg: dmg,
      speed: kind === "sprite" ? 240 : (kind === "paladin_merc" ? 135 : 105),
      atkTimer: 0,
      life: kind === "sprite" ? 999 : 28
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

      // Rune Carrier Sprite collects distant coins/gems!
      if (al.kind === "sprite") {
        if (this.lootDrops.length > 0) {
          var drop = this.lootDrops[0];
          var dx = drop.x - al.x;
          var dy = drop.y - al.y;
          var d = Math.hypot(dx, dy);
          if (d > 12) {
            al.x += (dx / d) * al.speed * dt;
            al.y += (dy / d) * al.speed * dt;
          } else {
            this.collectLootDrop(0);
          }
        } else {
          // Hover near Gold Mine
          var hx = 210 - al.x;
          var hy = 300 - al.y;
          var hd = Math.hypot(hx, hy);
          if (hd > 30) {
            al.x += (hx / hd) * al.speed * 0.6 * dt;
            al.y += (hy / hd) * al.speed * 0.6 * dt;
          }
        }
        continue;
      }

      // Combat allies (Skeletons & Royal Mercenaries)
      // Mercenaries also magnet-collect nearby loot!
      if (al.kind === "paladin_merc") {
        for (var l = this.lootDrops.length - 1; l >= 0; l--) {
          if (Math.hypot(this.lootDrops[l].x - al.x, this.lootDrops[l].y - al.y) < 48) {
            this.collectLootDrop(l);
          }
        }
      }

      var target = this.findNearestEnemy(al.x, al.y, 900);
      if (target) {
        var ex = target.x - al.x;
        var ey = target.y - al.y;
        var ed = Math.hypot(ex, ey);
        if (ed > target.radius + 16) {
          al.x += (ex / ed) * al.speed * dt;
          al.y += (ey / ed) * al.speed * dt;
        } else {
          al.atkTimer -= dt;
          if (al.atkTimer <= 0) {
            al.atkTimer = 0.65;
            this.damageEnemy(target, al.dmg, "#fde047", false);
          }
        }
      }
    }
  },

  // ================= ENEMIES & WAVE PROGRESSION =================
  updateEnemies: function(dt) {
    // Spawn wave monsters
    if (this.waveState.spawned < this.waveState.toSpawn) {
      this.waveState.spawnTimer -= dt;
      if (this.waveState.spawnTimer <= 0) {
        var isLastAndBoss = (this.waveState.spawned === this.waveState.toSpawn - 1) && this.waveState.bossActive;
        this.spawnEnemy(isLastAndBoss);
        this.waveState.spawned++;
        this.waveState.spawnTimer = Math.max(0.22, 0.75 - this.state.wave * 0.01);
      }
    } else if (this.enemies.length === 0) {
      // Wave cleared!
      this.waveState.waveClearTimer += dt;
      if (this.waveState.waveClearTimer >= 1.2) {
        this.waveState.waveClearTimer = 0;
        var clearBonus = Math.round(25 * this.getCurrentRealm().rewardMult * (1 + this.state.wave * 0.25));
        this.state.gold += clearBonus;
        this.state.totalGoldEarned += clearBonus;
        this.addFloatingText(600, 320, "🎉 第 " + this.state.wave + " 波擊退！賞金 +" + clearBonus, "#fde047", 20);
        this.checkQuestProgress();
        this.setupWave(this.state.wave + 1);
      }
    }

    // Update each enemy
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      var e = this.enemies[i];
      if (e.flashTimer > 0) e.flashTimer -= dt;
      if (e.stunTimer > 0) {
        e.stunTimer -= dt;
        continue;
      }
      var spdMult = e.slowTimer > 0 ? 0.45 : 1.0;
      if (e.slowTimer > 0) e.slowTimer -= dt;

      // Burn zones damage
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

      // Closest point on diagonal fortress wall segment (x1,y1)-(x2,y2)
      var wx = this.wall.x2 - this.wall.x1;
      var wy = this.wall.y2 - this.wall.y1;
      var wLen2 = wx * wx + wy * wy;
      var t = Math.max(0.08, Math.min(0.92, ((e.x - this.wall.x1) * wx + (e.y - this.wall.y1) * wy) / wLen2));
      var targetWallX = this.wall.x1 + t * wx;
      var targetWallY = this.wall.y1 + t * wy;

      var dx = targetWallX - e.x;
      var dy = targetWallY - e.y;
      var distToWall = Math.hypot(dx, dy);

      if (distToWall > e.radius + 22) {
        e.x += (dx / distToWall) * e.speed * spdMult * dt;
        e.y += (dy / distToWall) * e.speed * spdMult * dt;
      } else {
        // Attack Fortress Wall!
        e.atkTimer -= dt;
        if (e.atkTimer <= 0) {
          e.atkTimer = 1.1;
          var eDmg = Math.max(4, Math.round(8 * this.getCurrentRealm().enemyMult * Math.pow(1.08, this.state.wave - 1)));
          this.wall.hp = Math.max(0, this.wall.hp - eDmg);

          // Thorns reflection damage
          var thornsRatio = this.getTalentVal("t_wall_thorns") + ((this.state.pads["pad_WallFortify"] && this.state.pads["pad_WallFortify"].level) || 0) * 0.15;
          if (thornsRatio > 0) {
            this.damageEnemy(e, Math.round(this.getHeroDamage() * thornsRatio), "#38bdf8", false);
          }

          // If wall breaches, emergency Arcane Phoenix rebuilds wall and pushes wave back
          if (this.wall.hp <= 0) {
            this.wall.hp = this.wall.maxHp;
            this.enemies.forEach(function(en) {
              en.x += 180;
              en.y += 110;
              en.stunTimer = 1.5;
            });
            if (window.GameUI) window.GameUI.showToast("🛡️ 聖殿守護結界觸發！震退魔物並恢復城牆！");
          }
        }
      }
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
      enemy.y - enemy.radius - 6,
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
    this.state.heroXp += e.isBoss ? 35 : 5;
    var xpNeeded = this.state.heroLevel * 45;
    if (this.state.heroXp >= xpNeeded) {
      this.state.heroXp -= xpNeeded;
      this.state.heroLevel++;
      this.addFloatingText(this.hero.x, this.hero.y - 40, "🎉 英雄升級 Lv." + this.state.heroLevel + "！", "#38bdf8", 18);
      window.SoundEngine.playUpgradeComplete();
    }

    // Burst into shiny Gold Coins on the ground (just like the reference ad!)
    var goldMult = (1 + this.getTalentVal("t_gold_drop")) * (1 + this.getEquipStat("goldBonus")) * this.getDivinityMult();
    var totalGold = Math.max(2, Math.round(e.gold * goldMult));
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

    // Chance to drop Mana Crystal 💎
    var manaChance = 0.22 + this.getTalentVal("t_mana_drop") * 0.5;
    if (e.isBoss || Math.random() < manaChance) {
      var manaAmt = Math.max(1, Math.round((e.isBoss ? 15 : 2) * (1 + this.getTalentVal("t_mana_drop"))));
      this.spawnLootDrop(e.x + (Math.random() - 0.5) * 28, e.y + (Math.random() - 0.5) * 28, "mana", manaAmt);
    }

    // Boss or Elite drops Soul Shards 🔮 & Equipment Chest 🎁
    if (e.isBoss || Math.random() < 0.045) {
      if (e.isBoss) {
        var soulGain = Math.max(1, Math.round(2 * this.getCurrentRealm().id));
        this.state.souls += soulGain;
        this.addFloatingText(e.x, e.y - 24, "🔮 靈魂結晶 +" + soulGain, "#d8b4fe", 16);
      }
      this.spawnLootDrop(e.x, e.y, "chest", 1);
    }

    this.spawnBurstParticles(e.x, e.y, "#fbbf24", e.isBoss ? 22 : 8);
  },

  // ================= PROJECTILES & ELEMENTAL EFFECTS =================
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
        if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + 14) {
          p.hitIds[e.id] = true;
          p.pierce--;
          window.SoundEngine.playHit(p.kind);

          // Special Tower / Class elemental effects
          if (p.kind === "frost") {
            e.slowTimer = 2.8;
            this.damageEnemy(e, p.dmg, "#7dd3fc", true);
          } else if (p.kind === "hammer" || p.kind === "holy_hammer") {
            // AoE shockwave + stun
            this.spawnBurstParticles(e.x, e.y, "#fde047", 12);
            for (var k = 0; k < this.enemies.length; k++) {
              var sub = this.enemies[k];
              if (Math.hypot(sub.x - e.x, sub.y - e.y) < 85) {
                sub.stunTimer = Math.max(sub.stunTimer, 0.55);
                this.damageEnemy(sub, Math.round(p.dmg * 0.85), "#fbbf24", true);
              }
            }
          } else if (p.kind === "flame" || p.kind === "dragon") {
            this.burnZones.push({ x: e.x, y: e.y, radius: 65, dps: p.dmg * 0.45, life: 3.2 });
            this.spawnBurstParticles(e.x, e.y, "#ef4444", 12);
            this.damageEnemy(e, p.dmg, "#f87171", true);
          } else if (p.kind === "void") {
            // Pull nearby enemies into singularity vortex
            for (var v = 0; v < this.enemies.length; v++) {
              var ve = this.enemies[v];
              var vDist = Math.hypot(ve.x - e.x, ve.y - e.y);
              if (vDist < 130 && vDist > 5) {
                ve.x += ((e.x - ve.x) / vDist) * 35;
                ve.y += ((e.y - ve.y) / vDist) * 35;
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

  // ================= LOOT PICKUP & PARABOLIC FLYING COINS =================
  spawnLootDrop: function(x, y, kind, amount) {
    if (this.lootDrops.length > 90 && kind === "gold") {
      // Merge into first drop so screen stays fast
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
    var magnetRange = 95 * cls.magnetBonus * (1 + this.getTalentVal("t_magnet_rad"));

    for (var i = this.lootDrops.length - 1; i >= 0; i--) {
      var d = this.lootDrops[i];
      d.age += dt;
      var dist = Math.hypot(this.hero.x - d.x, this.hero.y - d.y);
      // Auto-magnet after 6 seconds or when within Hero's magnetic aura!
      if (dist < magnetRange || d.age > 6.5) {
        var pullSpeed = d.age > 6.5 ? 520 : 380;
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

    // Update parabolic flying coins arcing from Hero to Ground Logo
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

  // ================= EQUIPMENT FORGING & MERGING =================
  rollRandomEquipment: function(minRarity) {
    var slots = ["weapon", "armor", "ring", "relic"];
    var slot = slots[Math.floor(Math.random() * slots.length)];
    var templates = window.GAME_DATA.equipTemplates[slot];
    var tmpl = templates[Math.floor(Math.random() * templates.length)];

    // Rarity roll weighted by Realm & Wave
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
      name: "【" + rDef.name.split(" ")[0] + "】" + tmpl.name,
      icon: tmpl.icon,
      tier: tier,
      color: rDef.color,
      statType: tmpl.statType,
      val: Number((tmpl.baseVal * rDef.mult).toFixed(2))
    };

    // Auto-equip if slot is empty or strictly stronger
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
    // Combine 3 items of same tier into 1 item of tier + 1!
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

  // ================= ACTIVE HERO SPELLS =================
  castSkill: function(index) {
    var sk = this.skills[index];
    if (!sk || sk.cd > 0) return;
    sk.cd = sk.maxCd;
    window.SoundEngine.playSkill();

    if (sk.id === "nova") {
      // Arcane Nova + Instant Full-Map Magnet
      this.spawnBurstParticles(this.hero.x, this.hero.y, "#38bdf8", 32);
      var dmg = this.getHeroDamage() * 4.5;
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        if (Math.hypot(this.enemies[i].x - this.hero.x, this.enemies[i].y - this.hero.y) < 320) {
          this.damageEnemy(this.enemies[i], dmg, "#38bdf8", true);
          if (this.enemies[i].hp <= 0) this.killEnemy(i);
        }
      }
      // Pull all loot drops immediately
      for (var l = 0; l < this.lootDrops.length; l++) {
        this.lootDrops[l].age = 99;
      }
      this.addFloatingText(this.hero.x, this.hero.y - 45, "🌪️ 符文風暴 + 全屏吸金！", "#38bdf8", 18);
    } else if (sk.id === "aegis") {
      sk.buffTimer = 8.0;
      this.wall.hp = Math.min(this.wall.maxHp, this.wall.hp + Math.round(this.wall.maxHp * 0.40));
      this.addFloatingText(this.hero.x, this.hero.y - 45, "🛡️ 聖光壁壘：全神像攻速 +80%！", "#fde047", 18);
    } else if (sk.id === "meteor") {
      this.triggerCataclysm(false);
    }
  },

  triggerCataclysm: function(fromShrine) {
    var dmg = this.getHeroDamage() * (fromShrine ? 9.0 : 6.5);
    for (var m = 0; m < 10; m++) {
      var mx = 480 + Math.random() * 620;
      var my = 260 + Math.random() * 520;
      this.spawnBurstParticles(mx, my, "#f97316", 18);
      this.burnZones.push({ x: mx, y: my, radius: 75, dps: dmg * 0.25, life: 4.0 });
    }
    for (var i = this.enemies.length - 1; i >= 0; i--) {
      this.enemies[i].stunTimer = 1.8;
      this.damageEnemy(this.enemies[i], dmg, "#fb923c", true);
      if (this.enemies[i].hp <= 0) this.killEnemy(i);
    }
  },

  // ================= QUESTS, REALMS & REBIRTH =================
  checkQuestProgress: function() {
    var q = window.GAME_DATA.quests[this.state.questIndex];
    if (!q) return;
    var done = false;
    if (q.type === "pad_lv") {
      var st = this.state.pads[q.targetId];
      if (st && st.level >= q.goal) done = true;
    } else if (q.type === "wave") {
      if (this.state.wave > q.goal) done = true;
    } else if (q.type === "zone") {
      if (this.state.unlockedZones.indexOf(q.goal) !== -1) done = true;
    } else if (q.type === "any_tower_lv") {
      var self = this;
      window.GAME_DATA.groundPads.forEach(function(p) {
        if (p.type === "tower" && self.state.pads[p.id] && self.state.pads[p.id].level >= q.goal) {
          done = true;
        }
      });
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
    var startGold = 110 + this.getTalentVal("t_start_gold");
    this.state.realmId = newRealmId;
    this.state.wave = 1;
    this.state.gold = startGold;
    this.state.unlockedZones = [0];
    var self = this;
    window.GAME_DATA.groundPads.forEach(function(p) {
      self.state.pads[p.id] = { level: 0, invested: 0, cooldown: 0 };
    });
    this.enemies = [];
    this.projectiles = [];
    this.lootDrops = [];
    this.allies = [];
    this.burnZones = [];
    this.hero.x = 410;
    this.hero.y = 440;
    this.recalcWallStats(true);
    this.setupWave(1);
    this.saveGame();
    if (window.GameUI) {
      window.GameUI.updateHUD();
      window.GameUI.showToast(isRebirth ? "✨ 古神轉生完成！神性倍率大幅提升！" : "🗺️ 已進入：" + this.getCurrentRealm().name);
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

  // ================= PARTICLES & FLOATING TEXTS =================
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

  // ================= SAVE / LOAD / OFFLINE REWARDS =================
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
        this.initDefaultPads();
        // Calculate Offline Earnings if away > 60 seconds
        var elapsedSec = Math.floor((Date.now() - (this.state.lastSaveTimestamp || Date.now())) / 1000);
        if (elapsedSec > 60) {
          var cappedSec = Math.min(elapsedSec, 36000); // Up to 10 hours offline reward!
          var mineLv = Math.max(1, (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 1);
          var offMult = (1 + this.getTalentVal("t_offline_gain")) * this.getDivinityMult();
          var offGold = Math.round(cappedSec * mineLv * 1.8 * offMult);
          var offMana = Math.round(cappedSec * 0.08 * offMult);
          this.state.gold += offGold;
          this.state.mana += offMana;
          setTimeout(function() {
            if (window.GameUI) {
              window.GameUI.showToast("⏳ 離線掛機收益 (" + Math.floor(cappedSec / 60) + " 分鐘)：🪙+" + offGold + " 💎+" + offMana);
            }
          }, 900);
        }
      }
    } catch (e) {}
  },

  exportSaveString: function() {
    try {
      this.saveGame();
      return btoa(encodeURIComponent(JSON.stringify(this.state)));
    } catch (e) {
      return "";
    }
  },

  importSaveString: function(str) {
    try {
      var json = decodeURIComponent(atob(str.trim()));
      var parsed = JSON.parse(json);
      if (parsed && typeof parsed.gold === "number") {
        this.state = parsed;
        this.initDefaultPads();
        this.recalcWallStats(true);
        this.setupWave(this.state.wave || 1);
        this.saveGame();
        return true;
      }
    } catch (e) {}
    return false;
  },

  // ================= TOUCH & KEYBOARD INPUT BINDINGS =================
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

      // Short tap -> Walk directly to tapped point or Ground Logo!
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

  // ================= 2.5D ISOMETRIC / TOP-DOWN RENDERER =================
  render: function() {
    var ctx = this.ctx;
    var cw = this.canvas.width;
    var ch = this.canvas.height;
    var realm = this.getCurrentRealm();

    // Compute responsive camera zoom & pan (smoothly follows Hero on portrait phones!)
    var scaleX = cw / this.width;
    var scaleY = ch / this.height;
    var baseZoom = Math.max(scaleX, scaleY);
    // On narrow mobile portrait screens, zoom in slightly so statues & ground logos look big and crisp like the ad
    if (cw < 650) {
      baseZoom = Math.max(baseZoom, 0.86);
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

    this.drawTerrainAndRoad(ctx, realm);
    this.drawTerritoryBoundaries(ctx);
    this.drawSanctuaryStructures(ctx);
    this.drawBurnZones(ctx);
    this.drawGroundLogosAndStatues(ctx);
    this.drawFortressWall(ctx, realm);
    this.drawLootDrops(ctx);
    this.drawAllies(ctx);
    this.drawEnemies(ctx);
    this.drawHero(ctx);
    this.drawProjectiles(ctx);
    this.drawFlyingCoins(ctx);
    this.drawParticlesAndTexts(ctx);

    ctx.restore();

    // Draw Virtual Touch Joystick overlay on screen space
    this.drawTouchJoystick(ctx);
  },

  drawTerrainAndRoad: function(ctx, realm) {
    // Subtle sandstone tiles / grid lines
    ctx.strokeStyle = "rgba(0, 0, 0, 0.07)";
    ctx.lineWidth = 2;
    for (var gx = 0; gx < this.width; gx += 80) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, this.height);
      ctx.stroke();
    }
    for (var gy = 0; gy < this.height; gy += 80) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(this.width, gy);
      ctx.stroke();
    }

    // Winding dark canyon path (Matches the dark curved dirt road in the Reference Ad!)
    ctx.save();
    ctx.strokeStyle = realm.pathColor;
    ctx.lineCap = "round";
    ctx.lineWidth = 115;
    ctx.beginPath();
    ctx.moveTo(220, 310);
    ctx.bezierCurveTo(450, 440, 760, 290, 960, 490);
    ctx.quadraticCurveTo(1060, 620, 740, 740);
    ctx.stroke();
    ctx.restore();

    // Top-right & top canyon cliff walls (Matches Reference Ad cliffs!)
    ctx.fillStyle = realm.cliffColor;
    ctx.beginPath();
    ctx.moveTo(460, 0);
    ctx.lineTo(1200, 0);
    ctx.lineTo(1200, 460);
    ctx.lineTo(1030, 410);
    ctx.lineTo(910, 220);
    ctx.lineTo(680, 140);
    ctx.lineTo(480, 110);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Scenery props (Cactus / Pillars)
    this.scenery.forEach(function(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.kind === "cactus") {
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(-6, -34, 12, 34);
        ctx.fillRect(-16, -24, 10, 8);
        ctx.fillRect(-16, -32, 6, 12);
        ctx.fillRect(6, -20, 10, 8);
        ctx.fillRect(10, -28, 6, 12);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.arc(0, 4, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#a8a29e";
        ctx.fillRect(-12, -26, 24, 28);
      }
      ctx.restore();
    });
  },

  drawTerritoryBoundaries: function(ctx) {
    // Show mystical fog border for locked Territory Zones
    var zones = [
      { id: 1, label: "🔒 北境劍聖高台 (踏上擴建魔陣解鎖)", x: 230, y: 95, w: 460, h: 140 },
      { id: 2, label: "🔒 東翼星辰防線 (踏上擴建魔陣解鎖)", x: 640, y: 150, w: 220, h: 210 },
      { id: 3, label: "🔒 深淵龍魂聖域 (踏上擴建魔陣解鎖)", x: 55, y: 360, w: 210, h: 380 }
    ];
    var self = this;
    zones.forEach(function(z) {
      if (self.state.unlockedZones.indexOf(z.id) === -1) {
        ctx.save();
        ctx.fillStyle = "rgba(15, 12, 28, 0.52)";
        ctx.strokeStyle = "rgba(168, 85, 247, 0.55)";
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.w, z.h, 18);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#e9d5ff";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(z.label, z.x + z.w / 2, z.y + z.h / 2);
        ctx.restore();
      }
    });
  },

  drawSanctuaryStructures: function(ctx) {
    // Top-left Sandstone Sanctuary & Blue-Awning Gold Tent (Directly inspired by top-left of Reference Ad!)
    var mineLv = (this.state.pads["pad_GoldMine"] && this.state.pads["pad_GoldMine"].level) || 0;
    ctx.save();
    ctx.translate(105, 240);
    // Sandstone stairs & base
    ctx.fillStyle = "#b47b44";
    ctx.fillRect(-55, -55, 110, 110);
    ctx.strokeStyle = "#5c3a1e";
    ctx.lineWidth = 3;
    ctx.strokeRect(-55, -55, 110, 110);
    // Blue royal awning (exact match to reference ad!)
    ctx.fillStyle = mineLv > 0 ? "#2563eb" : "#475569";
    ctx.beginPath();
    ctx.moveTo(-48, -45);
    ctx.lineTo(48, -45);
    ctx.lineTo(58, -10);
    ctx.lineTo(-58, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(mineLv > 0 ? "⛺ 聖殿金脈 Lv." + mineLv : "⛺ 待建造金脈", 0, -24);
    ctx.restore();
  },

  drawFortressWall: function(ctx, realm) {
    // Diagonal Sandstone Fortress Wall separating Inner Sanctum from Monster Swarm (Matches Reference Ad!)
    ctx.save();
    var x1 = this.wall.x1, y1 = this.wall.y1, x2 = this.wall.x2, y2 = this.wall.y2;

    // Wall shadow
    ctx.strokeStyle = "rgba(0,0,0,0.38)";
    ctx.lineWidth = 34;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1 + 8, y1 + 10);
    ctx.lineTo(x2 + 8, y2 + 10);
    ctx.stroke();

    // Main sandstone wall body
    var wallLv = (this.state.pads["pad_WallFortify"] && this.state.pads["pad_WallFortify"].level) || 0;
    ctx.strokeStyle = wallLv >= 10 ? "#eab308" : (wallLv >= 5 ? "#94a3b8" : realm.wallColor);
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Crenellations / stone blocks along the wall
    var steps = 14;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var bx = x1 + (x2 - x1) * t;
      var by = y1 + (y2 - y1) * t;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(bx, by - 4, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wall HP Bar floating on the center of the Wall
    var midX = (x1 + x2) * 0.5;
    var midY = (y1 + y2) * 0.5;
    var hpPct = Math.max(0, Math.min(1, this.wall.hp / this.wall.maxHp));
    ctx.fillStyle = "rgba(15, 12, 28, 0.85)";
    ctx.beginPath();
    ctx.roundRect(midX - 65, midY - 12, 130, 18, 9);
    ctx.fill();
    ctx.fillStyle = hpPct > 0.4 ? "#22c55e" : "#ef4444";
    ctx.beginPath();
    ctx.roundRect(midX - 63, midY - 10, 126 * hpPct, 14, 7);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏰 城牆 " + Math.ceil(this.wall.hp) + " / " + this.wall.maxHp, midX, midY + 1);
    ctx.restore();
  },

  drawGroundLogosAndStatues: function(ctx) {
    var self = this;
    var time = performance.now() * 0.003;

    window.GAME_DATA.groundPads.forEach(function(pad) {
      if (self.state.unlockedZones.indexOf(pad.zone) === -1) return;
      var st = self.state.pads[pad.id] || { level: 0, invested: 0, cooldown: 0 };
      var cost = self.getPadCost(pad);
      var rem = self.getPadRemaining(pad);
      var avail = pad.currency === "mana" ? self.state.mana : self.state.gold;
      var canAfford = avail >= rem;
      var isStanding = self.hero.activePadId === pad.id;

      ctx.save();
      ctx.translate(pad.x, pad.y);

      // 1. Glowing Rotating Ground Arcane Logo / Rune Circle
      var ringColor = pad.type === "expand" ? "#a855f7" : (pad.currency === "mana" ? "#38bdf8" : "#fbbf24");
      ctx.save();
      ctx.scale(1, 0.65); // 2.5D Isometric perspective ellipse!
      ctx.rotate(time * (isStanding ? 2.5 : 0.7));

      // Outer rune ring
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = isStanding ? 4.5 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.stroke();

      // Inner arcane hexagram / geometric seal
      ctx.strokeStyle = isStanding ? "#ffffff" : ringColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (var v = 0; v < 6; v++) {
        var a = (v * Math.PI) / 3;
        var rx = Math.cos(a) * 32;
        var ry = Math.sin(a) * 32;
        if (v === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Investment Progress Arc on Ground Logo
      if (st.invested > 0 && st.level < pad.maxLevel) {
        var prog = Math.min(1, st.invested / cost);
        ctx.save();
        ctx.scale(1, 0.65);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 43, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Pedestal & Statue / Structure Visual
      if (pad.type === "tower") {
        // Draw stone/golden pedestal base (just like the reference ad!)
        ctx.fillStyle = st.level >= 10 ? "#d97706" : (st.level > 0 ? "#64748b" : "rgba(51, 65, 85, 0.65)");
        ctx.fillRect(-24, -14, 48, 22);
        ctx.strokeStyle = "#1e293b";
        ctx.lineWidth = 2;
        ctx.strokeRect(-24, -14, 48, 22);

        if (st.level > 0) {
          self.drawPedestalStatue(ctx, pad.towerKind, st.level, time);
        } else {
          ctx.font = "22px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(pad.icon, 0, -2);
        }
      } else {
        // Functional Ground Logo icon
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pad.icon, 0, 4);
      }

      //Pad Name & Level tag below pad
      ctx.fillStyle = "rgba(10, 8, 20, 0.78)";
      ctx.beginPath();
      ctx.roundRect(-48, 18, 96, 17, 6);
      ctx.fill();
      ctx.fillStyle = st.level > 0 ? "#fde047" : "#e2e8f0";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.textAlign = "center";
      var lvText = pad.type === "expand" ? "領地擴建" : (st.level > 0 ? pad.name.slice(0, 4) + " Lv." + st.level : pad.name.slice(0, 5));
      ctx.fillText(lvText, 0, 30);

      // 3. Ad-Style Floating White Cost Speech Bubble Above Ground Logo!
      // Matches the exact white bubble with green checkmark + coin icon + number in image_5d7ac1.jpg
      if (st.level < pad.maxLevel) {
        var bubbleY = st.level > 0 ? -66 : -48;
        ctx.save();
        ctx.translate(0, bubbleY + Math.sin(time * 2 + pad.x) * 2.5);

        // White speech bubble body
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = canAfford ? "#16a34a" : "#94a3b8";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(-30, -14, 60, 24, 12);
        ctx.fill();
        ctx.stroke();

        // Speech bubble pointer triangle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-5, 10);
        ctx.lineTo(5, 10);
        ctx.lineTo(0, 16);
        ctx.closePath();
        ctx.fill();

        // Top green checkmark badge (when affordable, just like the ad!)
        if (canAfford && (!st.cooldown || st.cooldown <= 0)) {
          ctx.fillStyle = "#22c55e";
          ctx.beginPath();
          ctx.arc(0, -15, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("✓", 0, -12);
        }

        // Coin / Mana Icon inside bubble
        ctx.fillStyle = pad.currency === "mana" ? "#0284c7" : "#f59e0b";
        ctx.beginPath();
        ctx.arc(-15, -2, 7, 0, Math.PI * 2);
        ctx.fill();

        // Remaining cost number inside bubble
        ctx.fillStyle = canAfford ? "#16a34a" : "#334155";
        ctx.font = "900 12px Inter, sans-serif";
        ctx.textAlign = "center";
        var cdTxt = (st.cooldown && st.cooldown > 0) ? Math.ceil(st.cooldown) + "s" : (rem > 999 ? (rem / 1000).toFixed(1) + "k" : String(rem));
        ctx.fillText(cdTxt, 8, 2);

        ctx.restore();
      }

      ctx.restore();
    });
  },

  drawPedestalStatue: function(ctx, kind, level, time) {
    ctx.save();
    ctx.translate(0, -18 + Math.sin(time * 2.5) * 1.5);

    if (kind === "hammer") {
      // Iconic Golden Warhammer Titan Idol (Bottom-left of Reference Ad!)
      ctx.fillStyle = "#f59e0b";
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2;
      // Golden body & horned helmet
      ctx.beginPath();
      ctx.arc(0, -12, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Giant Golden Warhammer on right hand
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-24, -32, 16, 22);
      ctx.strokeRect(-24, -32, 16, 22);
      ctx.fillStyle = "#92400e";
      ctx.fillRect(-18, -10, 5, 18);
    } else if (kind === "frost") {
      // Iconic Silver Frost Statue (Middle of Reference Ad!)
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -14, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Glowing ice staff
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 2);
      ctx.lineTo(14, -28);
      ctx.stroke();
    } else if (kind === "flame") {
      // Iconic Crimson Horned Demon Statue (Top-center of Wall in Reference Ad!)
      ctx.fillStyle = "#991b1b";
      ctx.strokeStyle = "#450a0a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -14, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Golden horns
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-10, -24);
      ctx.lineTo(-18, -34);
      ctx.moveTo(10, -24);
      ctx.lineTo(18, -34);
      ctx.stroke();
    } else if (kind === "sword") {
      // Iconic Northern Cliff Purple-Haired Swordsman (Top of Reference Ad!)
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(-9, -14, 18, 16);
      ctx.fillStyle = "#6b21a8"; // Purple hair
      ctx.beginPath();
      ctx.arc(0, -22, 11, 0, Math.PI * 2);
      ctx.fill();
      // Katana blade extending left/right
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-32, -14);
      ctx.stroke();
    } else {
      // Advanced Mythic Towers (Ballista, Dragon, Void)
      ctx.fillStyle = this.getTowerColor(kind);
      ctx.beginPath();
      ctx.arc(0, -14, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(kind === "dragon" ? "🐉" : (kind === "void" ? "🌀" : "☄️"), 0, -8);
    }
    ctx.restore();
  },

  drawHero: function(ctx) {
    var cls = this.getCurrentHeroClass();
    var h = this.hero;
    ctx.save();
    ctx.translate(h.x, h.y);

    // 1. Glowing Cyan/Green Magic Aura Ring under Hero's feet (Exact match to Reference Ad!)
    ctx.save();
    ctx.scale(1, 0.62);
    var grad = ctx.createRadialGradient(0, 0, 8, 0, 0, 32);
    grad.addColorStop(0, "rgba(56, 189, 248, 0.45)");
    grad.addColorStop(0.75, "rgba(74, 222, 128, 0.65)");
    grad.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Waypoint line if walking to a tapped spot
    if (h.targetX !== null && h.targetY !== null) {
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(h.targetX - h.x, h.targetY - h.y);
      ctx.stroke();
      ctx.restore();
    }

    // Hero Character Sprite (Blue-haired/armored Chibi RPG Hero like Reference Ad!)
    var bob = Math.sin(h.animPhase) * 2.5;
    ctx.save();
    ctx.scale(h.facing, 1);
    // Cape
    ctx.fillStyle = cls.capeColor;
    ctx.beginPath();
    ctx.moveTo(-6, -18 + bob);
    ctx.lineTo(-18, 2 + bob);
    ctx.lineTo(-2, 4 + bob);
    ctx.closePath();
    ctx.fill();

    // Armor torso
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(-9, -18 + bob, 18, 16);

    // Head & bright cyan/class hair
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.arc(0, -25 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cls.color;
    ctx.beginPath();
    ctx.arc(0, -28 + bob, 9.5, Math.PI, Math.PI * 2);
    ctx.fill();

    // Glowing Runeblade / Weapon
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(8, -10 + bob);
    ctx.lineTo(24, -22 + bob);
    ctx.stroke();
    ctx.restore();

    // Hero Level badge
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(-24, -48 + bob, 48, 14, 6);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Lv." + this.state.heroLevel + " " + cls.icon, 0, -38 + bob);

    ctx.restore();
  },

  drawEnemies: function(ctx) {
    for (var i = 0; i < this.enemies.length; i++) {
      var e = this.enemies[i];
      ctx.save();
      ctx.translate(e.x, e.y);

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.65, e.radius * 0.85, e.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body (Red-hooded cultists & white-helmet warlords like Reference Ad!)
      if (e.flashTimer > 0) {
        ctx.fillStyle = "#ffffff";
      } else if (e.slowTimer > 0) {
        ctx.fillStyle = "#38bdf8";
      } else if (e.archId === "cultist") {
        ctx.fillStyle = "#dc2626"; // Red-hooded minions from the ad!
      } else if (e.archId === "orc_warrior") {
        ctx.fillStyle = "#f8fafc"; // White-horned warlords from the ad!
      } else {
        ctx.fillStyle = e.isBoss ? "#7c2d12" : "#b91c1c";
      }

      ctx.beginPath();
      ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (e.isBoss || e.radius >= 18) {
        ctx.font = (e.isBoss ? "24px" : "15px") + " sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(e.icon, 0, 6);
      } else {
        // Cute chibi eyes for red-hooded minion swarm
        ctx.fillStyle = "#fef08a";
        ctx.beginPath();
        ctx.arc(-4, -2, 2.2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // HP Bar
      if (e.hp < e.maxHp || e.isBoss) {
        var w = e.isBoss ? 64 : 28;
        var pct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(-w / 2, -e.radius - 10, w, 5);
        ctx.fillStyle = e.isBoss ? "#f43f5e" : "#ef4444";
        ctx.fillRect(-w / 2, -e.radius - 10, w * pct, 5);
      }

      ctx.restore();
    }
  },

  drawAllies: function(ctx) {
    for (var i = 0; i < this.allies.length; i++) {
      var al = this.allies[i];
      ctx.save();
      ctx.translate(al.x, al.y);
      ctx.fillStyle = al.kind === "sprite" ? "#38bdf8" : (al.kind === "paladin_merc" ? "#fbbf24" : "#cbd5e1");
      ctx.beginPath();
      ctx.arc(0, 0, al.kind === "sprite" ? 9 : 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(al.kind === "sprite" ? "🧚" : (al.kind === "paladin_merc" ? "🛡️" : "💀"), 0, 4);
      ctx.restore();
    }
  },

  drawLootDrops: function(ctx) {
    for (var i = 0; i < this.lootDrops.length; i++) {
      var d = this.lootDrops[i];
      ctx.save();
      ctx.translate(d.x, d.y);
      if (d.kind === "gold") {
        // Shiny gold coins scattered on the sand (Just like Reference Ad!)
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, 7, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (d.kind === "mana") {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🎁", 0, 6);
      }
      ctx.restore();
    }
  },

  drawFlyingCoins: function(ctx) {
    // Parabolic Golden Coins Arcing from Hero into Ground Logo Pad (Exact Reference Ad Signature Effect!)
    for (var i = 0; i < this.flyingCoins.length; i++) {
      var fc = this.flyingCoins[i];
      var t = fc.progress;
      var cx = fc.sx + (fc.tx - fc.sx) * t;
      var cy = fc.sy + (fc.ty - fc.sy) * t - Math.sin(t * Math.PI) * fc.arcHeight;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = fc.currency === "mana" ? "#38bdf8" : "#fde047";
      ctx.strokeStyle = fc.currency === "mana" ? "#0284c7" : "#d97706";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  },

  drawBurnZones: function(ctx) {
    for (var i = 0; i < this.burnZones.length; i++) {
      var bz = this.burnZones[i];
      ctx.save();
      ctx.fillStyle = "rgba(239, 68, 68, 0.26)";
      ctx.beginPath();
      ctx.arc(bz.x, bz.y, bz.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  drawProjectiles: function(ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      var p = this.projectiles[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },

  drawParticlesAndTexts: function(ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (var j = 0; j < this.floatingTexts.length; j++) {
      var ft = this.floatingTexts[j];
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
      ctx.font = "900 " + ft.size + "px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  },

  drawTouchJoystick: function(ctx) {
    if (!this.input.joyActive) return;
    ctx.save();
    ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
    ctx.fillStyle = "rgba(15, 12, 28, 0.35)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(this.input.joyStartX, this.input.joyStartY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    var knobX = this.input.joyStartX + this.input.joyDx * 48;
    var knobY = this.input.joyStartY + this.input.joyDy * 48;
    ctx.fillStyle = "rgba(251, 191, 36, 0.88)";
    ctx.beginPath();
    ctx.arc(knobX, knobY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};
