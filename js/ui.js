/* ==========================================================================
   Ancient Arcane Bastion (古域魔陣：守護神殿) - Mobile UI, Modals & Defense Hub (v1.6.0)
   - Ultra-compact 2-Row Top HUD (Height <= 68px, perfect for iPhone)
   - Locked 3-Line Upgrade View for built towers (Dmg, Speed, Range, Pouring bar)
   - Type-First selection for empty plots (Type -> Towers -> Confirm Build)
   - Multi-hall & Multi-checkpoint status rendering
   - 4-Tier Hierarchical Skill Tree with SVG Connectors & Node Inspector
   ========================================================================== */

window.GameUI = {
  activeModal: null,
  uiTimer: 0,
  selectedBuildTypeId: "type_elemental",
  selectedBuildBpId: "bp_arcane_spire",
  activeSkillBranch: "combat",
  selectedTalentId: "t_hero_dmg",

  init: function() {
    this.updateHUD();
    this.updateTopButtons();
  },

  tickUI: function(dt) {
    this.uiTimer += dt;
    if (this.uiTimer >= 0.15) {
      this.uiTimer = 0;
      this.updateHUD();
      this.updateContextCard();
      this.updateSkillCooldowns();
    }
  },

  formatNum: function(n) {
    var v = Math.floor(n);
    if (v >= 1000000) return (v / 1000000).toFixed(2) + "M";
    if (v >= 10000) return (v / 1000).toFixed(1) + "K";
    return String(v);
  },

  isTalentUnlocked: function(tal) {
    if (!tal || !tal.reqId) return true;
    var st = window.GameEngine.state;
    var reqLv = tal.reqLv || 3;
    var p1Lv = st.talents[tal.reqId] || 0;
    if (p1Lv >= reqLv) return true;
    if (tal.reqIdAlt) {
      var p2Lv = st.talents[tal.reqIdAlt] || 0;
      if (p2Lv >= reqLv) return true;
    }
    return false;
  },

  getTalentPrerequisiteText: function(tal) {
    if (!tal || !tal.reqId) {
      return { unlocked: true, text: "✅ 第 1 階核心根基（初始已解鎖）" };
    }
    var st = window.GameEngine.state;
    var reqLv = tal.reqLv || 3;
    var p1 = window.GAME_DATA.talents.find(function(t) { return t.id === tal.reqId; });
    var p1Lv = st.talents[tal.reqId] || 0;
    var unlocked = this.isTalentUnlocked(tal);

    if (tal.reqIdAlt) {
      var p2 = window.GAME_DATA.talents.find(function(t) { return t.id === tal.reqIdAlt; });
      var p2Lv = st.talents[tal.reqIdAlt] || 0;
      var txt = (unlocked ? "✅ 前置已達成：" : "🔒 前置條件：需") +
        "【" + (p1 ? p1.name : "") + "】(Lv." + p1Lv + "/" + reqLv + ") 或 【" +
        (p2 ? p2.name : "") + "】(Lv." + p2Lv + "/" + reqLv + ") 達 Lv." + reqLv;
      return { unlocked: unlocked, text: txt };
    }

    var singleTxt = (unlocked ? "✅ 前置已達成：" : "🔒 前置條件：需先將") +
      "【" + (p1 ? p1.name : "") + "】升至 Lv." + reqLv + "（當前 Lv." + p1Lv + "/" + reqLv + "）";
    return { unlocked: unlocked, text: singleTxt };
  },

  // ================= ULTRA-COMPACT 2-ROW TOP HUD =================
  updateHUD: function() {
    var eng = window.GameEngine;
    if (!eng || !eng.state) return;
    var st = eng.state;

    // 1. Resources
    var elGold = document.getElementById("hud-gold");
    var elMana = document.getElementById("hud-mana");
    var elSoul = document.getElementById("hud-soul");
    if (elGold) elGold.textContent = this.formatNum(st.gold);
    if (elMana) elMana.textContent = this.formatNum(st.mana);
    if (elSoul) elSoul.textContent = this.formatNum(st.souls);

    // 2. Defense Status (Adapts to Stage Layout!)
    var elWallLbl = document.getElementById("hud-wall-lbl");
    var elWallText = document.getElementById("hud-wall-text");
    var elWallBar = document.getElementById("hud-wall-bar");

    if (eng.layoutType === "long_line_three_checkpoints" && eng.checkpoints && eng.checkpoints.length > 0) {
      // Find active checkpoint
      var activeCp = eng.checkpoints.find(function(c) { return !c.breached; }) || eng.checkpoints[2];
      if (elWallLbl) elWallLbl.textContent = "關卡 #" + activeCp.index;
      if (elWallText) elWallText.textContent = Math.ceil(activeCp.hp) + "/" + activeCp.maxHp;
      if (elWallBar && activeCp.maxHp > 0) {
        var cpPct = Math.max(0, Math.min(100, Math.round((activeCp.hp / activeCp.maxHp) * 100)));
        elWallBar.style.width = cpPct + "%";
        elWallBar.style.background = cpPct < 30 ? "#ef4444" : (cpPct < 60 ? "#f59e0b" : "#38bdf8");
      }
    } else if (eng.layoutType === "multiple_halls_outpost") {
      var outpost = (eng.halls || []).find(function(h) { return h.isOutpost; });
      if (outpost && outpost.hp > 0) {
        if (elWallLbl) elWallLbl.textContent = "前哨廳";
        if (elWallText) elWallText.textContent = Math.ceil(outpost.hp) + "/" + outpost.maxHp;
        if (elWallBar && outpost.maxHp > 0) {
          var oPct = Math.max(0, Math.min(100, Math.round((outpost.hp / outpost.maxHp) * 100)));
          elWallBar.style.width = oPct + "%";
          elWallBar.style.background = oPct < 30 ? "#ef4444" : "#f59e0b";
        }
      } else {
        if (elWallLbl) elWallLbl.textContent = "城防(已破)";
        if (elWallText) elWallText.textContent = "0/" + eng.wall.maxHp;
        if (elWallBar) elWallBar.style.width = "0%";
      }
    } else {
      if (elWallLbl) elWallLbl.textContent = "城防耐久";
      if (elWallText && eng.wall) elWallText.textContent = Math.ceil(eng.wall.hp) + "/" + eng.wall.maxHp;
      if (elWallBar && eng.wall && eng.wall.maxHp > 0) {
        var wPct = Math.max(0, Math.min(100, Math.round((eng.wall.hp / eng.wall.maxHp) * 100)));
        elWallBar.style.width = wPct + "%";
        elWallBar.style.background = wPct < 30 ? "#ef4444" : (wPct < 60 ? "#f59e0b" : "#38bdf8");
      }
    }

    // Town Hall Core
    var elHallText = document.getElementById("hud-hall-text");
    var elHallBar = document.getElementById("hud-hall-bar");
    if (elHallText && eng.townHall) elHallText.textContent = Math.ceil(eng.townHall.hp) + "/" + eng.townHall.maxHp;
    if (elHallBar && eng.townHall && eng.townHall.maxHp > 0) {
      var hPct = Math.max(0, Math.min(100, Math.round((eng.townHall.hp / eng.townHall.maxHp) * 100)));
      elHallBar.style.width = hPct + "%";
      elHallBar.style.background = hPct < 30 ? "#ef4444" : (hPct < 60 ? "#f59e0b" : "#22c55e");
    }

    // 3. Compact 1-Line Ticker (Clickable to open Codex/Advisor/Quest)
    var elTicker = document.getElementById("hud-ticker-text");
    var elRadarDot = document.getElementById("hud-radar-dot");
    var realm = eng.getCurrentRealm();
    var enemyCount = eng.enemies.length;

    if (elTicker) {
      elTicker.textContent = realm.name.split("：")[0] + " · 第 " + st.wave + " 波 | ⚔️ " + enemyCount + " 敵";
      if (elRadarDot) {
        elRadarDot.style.background = (enemyCount > 8 || eng.gateBreached) ? "#ef4444" : "#22c55e";
      }
    }

    var dotTalent = document.getElementById("dot-talent");
    if (dotTalent) {
      dotTalent.style.display = st.souls >= 1 ? "block" : "none";
    }

    if (eng.townHall && eng.townHall.hp <= 0 && this.activeModal !== "defeat") {
      this.openModal("defeat");
    }
  },

  // ================= STEP-ON CONTEXT CARD (CLEAN & NON-OBSTRUCTIVE) =================
  updateContextCard: function() {
    var card = document.getElementById("pad-context-card");
    if (!card) return;
    var eng = window.GameEngine;
    var padId = eng.hero.activePadId;

    if (!padId) {
      card.classList.add("hidden");
      return;
    }

    var pad = (window.GAME_DATA.groundPads || []).find(function(p) { return p.id === padId; });
    if (!pad) {
      card.classList.add("hidden");
      return;
    }

    card.classList.remove("hidden");
    var st = eng.state.pads[pad.id] || { level: 0, invested: 0 };
    var rem = eng.getPadRemaining(pad);
    var cost = eng.getPadCost(pad);
    var curIcon = pad.currency === "mana" ? "💎" : "🪙";
    var bp = pad.customizable ? eng.getPadBlueprint(pad) : null;
    var isBuilt = st.level >= 1;

    // CASE 1: Built Customizable Tower (LOCKED - CANNOT CHANGE TYPE AFTER BUILT!)
    if (pad.customizable && isBuilt && bp) {
      var calcDmg = eng.getTowerDamage(pad, st.level);
      var progPct = Math.min(100, Math.round((st.invested / cost) * 100));

      var html = '<div class="pad-built-view">';
      // Line 1: Tower Title, Level, Role & Upgrade Cost
      html += '<div class="pad-header-row">';
      html += '<span class="pad-title-text">' + bp.icon + ' ' + bp.name + ' Lv.' + st.level + ' (' + bp.roleTag + ')</span>';
      if (st.level >= pad.maxLevel) {
        html += '<span class="pad-cost-badge" style="color:#4ade80;">✨ 已達最高級</span>';
      } else {
        html += '<span class="pad-cost-badge">⬆️ 升級需 ' + curIcon + rem + '</span>';
      }
      html += '</div>';

      // Line 2: The 3 essential stats (Damage, Atk Rate, Range or Troop stats)
      html += '<div class="pad-stats-strip">';
      if (bp.category === "barracks") {
        html += '<span class="pad-stat-pill">🛡️ 兵命: ' + bp.troopHp + '</span>';
        html += '<span class="pad-stat-pill">⚔️ 兵攻: ' + bp.troopDmg + '</span>';
        html += '<span class="pad-stat-pill">⏱️ 出兵: ' + bp.spawnInterval + 's</span>';
      } else {
        html += '<span class="pad-stat-pill">💥 傷害: ' + calcDmg + '</span>';
        html += '<span class="pad-stat-pill">⚡ 攻速: ' + bp.atkRate + 's</span>';
        html += '<span class="pad-stat-pill">🎯 射程: ' + bp.range + '</span>';
      }
      html += '<span style="color:#94a3b8;font-size:0.65rem;margin-left:auto;">[類型已鎖定]</span>';
      html += '</div>';

      // Line 3: Thin Pouring Progress Bar
      if (st.level < pad.maxLevel) {
        html += '<div class="pad-progress-track"><div class="pad-progress-fill" style="width:' + progPct + '%;"></div></div>';
      }
      html += '</div>';

      card.innerHTML = html;
      return;
    }

    // CASE 2: Unbuilt Customizable Plot (st.level === 0) -> Select Type First -> Pick Tower -> Confirm Build!
    if (pad.customizable && !isBuilt) {
      var self = this;
      var curType = (window.GAME_DATA.towerTypes || []).find(function(t) { return t.id === self.selectedBuildTypeId; }) || window.GAME_DATA.towerTypes[0];
      var towersOfType = window.GAME_DATA.towerBlueprints.filter(function(b) { return b.typeId === self.selectedBuildTypeId; });
      var activeBp = eng.getBlueprintById(self.selectedBuildBpId || towersOfType[0].id);
      var canAfford = eng.state.gold >= activeBp.buildCostGold;

      var htmlU = '<div class="pad-unbuilt-view">';
      // Header
      htmlU += '<div class="pad-header-row">';
      htmlU += '<span class="pad-title-text" style="color:#38bdf8;">🔮 空置陣位 · 請先選類型</span>';
      htmlU += '<span style="font-size:0.64rem;color:#fde047;font-weight:700;">建造後即永久鎖定</span>';
      htmlU += '</div>';

      // Step 1: Type Tabs
      htmlU += '<div class="type-tabs-row">';
      (window.GAME_DATA.towerTypes || []).forEach(function(tType) {
        var isAct = self.selectedBuildTypeId === tType.id;
        htmlU += '<button class="type-tab-btn ' + (isAct ? 'active-type-tab' : '') + '" onclick="window.uiSelectBuildType(\'" + pad.id + "\', \'" + tType.id + "\')">';
        htmlU += tType.icon + ' ' + tType.shortName;
        htmlU += '</button>';
      });
      htmlU += '</div>';

      // Step 2: Towers of that type
      htmlU += '<div class="tower-picker-strip">';
      towersOfType.forEach(function(b) {
        var isSel = activeBp.id === b.id;
        var unl = eng.isBlueprintUnlocked(b.id);
        htmlU += '<button class="tower-chip ' + (isSel ? 'selected-preview-chip' : '') + '" onclick="window.uiSelectBuildTower(\'" + pad.id + "\', \'" + b.id + "\')">';
        htmlU += '<span>' + b.icon + ' ' + b.name + '</span>';
        htmlU += '<span style="font-size:0.62rem;color:' + (unl ? '#4ade80' : '#fde047') + ';">' + (unl ? '🪙' + b.buildCostGold : '🔒解鎖') + '</span>';
        htmlU += '</button>';
      });
      htmlU += '</div>';

      // Step 3: Brief Description & Confirm Build Button
      htmlU += '<div class="pad-build-confirm-row">';
      htmlU += '<span class="pad-bp-summary">' + activeBp.icon + ' ' + activeBp.name + '：' + activeBp.roleTag + ' | ' + activeBp.adviceTag + '</span>';
      htmlU += '<button class="btn-build-confirm" onclick="window.uiBuildTower(\'" + pad.id + "\', \'" + activeBp.id + "\')">';
      htmlU += '🔨 建造 (' + (activeBp.unlockCurrency === 'mana' ? '💎' : '🪙') + activeBp.buildCostGold + ')';
      htmlU += '</button>';
      htmlU += '</div>';

      htmlU += '</div>';
      card.innerHTML = htmlU;
      return;
    }

    // CASE 3: Non-Customizable Functional Building (Town Hall, Wall Fortify, Gold Mine, Mana Well, Forge, Shrine, Portal, Expand)
    var htmlF = '<div class="pad-built-view">';
    htmlF += '<div class="pad-header-row">';
    htmlF += '<span class="pad-title-text">' + pad.icon + ' ' + pad.name + (pad.type === 'expand' ? '' : ' Lv.' + st.level) + '</span>';
    if (st.level >= pad.maxLevel) {
      htmlF += '<span class="pad-cost-badge" style="color:#4ade80;">✨ 最高級</span>';
    } else {
      htmlF += '<span class="pad-cost-badge">⬆️ 踏陣需 ' + curIcon + rem + '</span>';
    }
    htmlF += '</div>';
    htmlF += '<div style="font-size:0.68rem;color:#cbd5e1;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + pad.desc + '</div>';
    if (st.level < pad.maxLevel && st.invested > 0) {
      var pPct = Math.min(100, Math.round((st.invested / cost) * 100));
      htmlF += '<div class="pad-progress-track"><div class="pad-progress-fill" style="width:' + pPct + '%;"></div></div>';
    }
    htmlF += '</div>';
    card.innerHTML = htmlF;
  },

  updateSkillCooldowns: function() {
    for (var i = 0; i < 3; i++) {
      var sk = window.GameEngine.skills[i];
      var cdEl = document.getElementById("skill-cd-" + i);
      if (cdEl && sk) {
        if (sk.cd > 0) {
          cdEl.style.display = "flex";
          cdEl.textContent = Math.ceil(sk.cd) + "s";
        } else {
          cdEl.style.display = "none";
        }
      }
    }
  },

  updateTopButtons: function() {
    var btnAi = document.getElementById("btn-ai-toggle");
    if (btnAi) {
      var labels = ["🤖 AI: 手動", "🤖 AI: 撿幣", "🤖 AI: 踏陣"];
      btnAi.textContent = labels[window.GameEngine.aiMode] || labels[0];
      if (window.GameEngine.aiMode > 0) {
        btnAi.classList.add("active-toggle");
      } else {
        btnAi.classList.remove("active-toggle");
      }
    }

    var btnSpd = document.getElementById("btn-speed-toggle");
    if (btnSpd) {
      btnSpd.textContent = "⏩ " + window.GameEngine.gameSpeed + "x";
    }

    var btnZoom = document.getElementById("btn-zoom-toggle");
    if (btnZoom) {
      var zm = window.GameEngine.camera.userZoomMult || 0.85;
      btnZoom.textContent = zm < 0.72 ? "🔍 全景" : (zm > 0.95 ? "🔍 近景" : "🔍 標準");
    }

    var btnAudio = document.getElementById("btn-audio-toggle");
    if (btnAudio) {
      btnAudio.textContent = window.SoundEngine.muted ? "🔇 靜音" : "🔊 音效";
    }
  },

  showToast: function(msg) {
    var container = document.getElementById("toast-container");
    if (!container) return;
    var div = document.createElement("div");
    div.className = "toast-msg";
    div.textContent = msg;
    container.appendChild(div);
    setTimeout(function() {
      if (div.parentNode) div.parentNode.removeChild(div);
    }, 2500);
  },

  openModal: function(tabName) {
    this.activeModal = tabName;
    var backdrop = document.getElementById("modal-backdrop");
    var titleEl = document.getElementById("modal-title");
    var bodyEl = document.getElementById("modal-body");
    if (!backdrop || !titleEl || !bodyEl) return;

    backdrop.classList.remove("hidden");

    if (tabName === "pads") {
      titleEl.innerHTML = "🏰 防線陣位與建築總覽";
      this.renderPadsModal(bodyEl);
    } else if (tabName === "townhall") {
      titleEl.innerHTML = "🏛️ 守護大本營與防線樞紐";
      this.renderTownHallModal(bodyEl);
    } else if (tabName === "hero") {
      titleEl.innerHTML = "⚔️ 英雄職業與聖物鍛造";
      this.renderHeroModal(bodyEl);
    } else if (tabName === "talents") {
      titleEl.innerHTML = "🌟 太古星盤技能科技樹";
      this.renderTalentsModal(bodyEl);
    } else if (tabName === "realms") {
      titleEl.innerHTML = "🗺️ 古域五大章節與古神轉生";
      this.renderRealmsModal(bodyEl);
    } else if (tabName === "codex") {
      titleEl.innerHTML = "📖 軍情戰役任務與魔物圖鑑";
      this.renderCodexModal(bodyEl);
    } else if (tabName === "defeat") {
      titleEl.innerHTML = "⚠️ 要塞淪陷 — 大本營被毀";
      this.renderDefeatModal(bodyEl);
    }
  },

  closeModal: function() {
    this.activeModal = null;
    var backdrop = document.getElementById("modal-backdrop");
    if (backdrop) backdrop.classList.add("hidden");
  },

  // Pads Modal: Lists all pads of active stage & 10 Blueprints
  renderPadsModal: function(container) {
    var eng = window.GameEngine;
    var self = this;
    var pads = window.GAME_DATA.groundPads || [];

    var html = '<div style="font-weight:900;color:#fde047;font-size:0.86rem;">🏰 當前古域防禦陣位（已建造防禦塔類型已正式鎖定，空置陣位可自由自選）</div>';
    html += '<div class="card-grid">';

    pads.forEach(function(pad) {
      var st = eng.state.pads[pad.id] || { level: 0, invested: 0 };
      var isBuilt = st.level >= 1;
      var bp = pad.customizable ? eng.getPadBlueprint(pad) : null;
      var isMax = st.level >= pad.maxLevel;
      var rem = eng.getPadRemaining(pad);
      var cIcon = pad.currency === "mana" ? "💎" : "🪙";

      html += '<div class="rpg-card ' + (isBuilt ? 'unlocked' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:800;font-size:0.84rem;color:#f8fafc;">' + (bp ? bp.icon : pad.icon) + ' ' + pad.name + '</span>';
      html += '<span style="font-size:0.7rem;color:#38bdf8;font-weight:800;">' + (isBuilt ? 'Lv.' + st.level + '/' + pad.maxLevel : '未建造') + '</span>';
      html += '</div>';

      if (pad.customizable && isBuilt && bp) {
        html += '<div style="font-size:0.72rem;color:#fde047;font-weight:700;">駐守：' + bp.icon + ' ' + bp.name + ' (' + bp.roleTag + ')</div>';
        html += '<div style="font-size:0.68rem;color:#94a3b8;">' + bp.desc + '</div>';
        html += '<div style="font-size:0.66rem;color:#4ade80;font-weight:800;margin-top:2px;">🔒 類型已鎖定</div>';
      } else if (pad.customizable && !isBuilt) {
        html += '<div style="font-size:0.72rem;color:#38bdf8;">🔮 空置陣位 · 踏上即可自選類型建造</div>';
      } else {
        html += '<div style="font-size:0.70rem;color:#cbd5e1;">' + pad.desc + '</div>';
      }

      if (!isMax) {
        html += '<button class="btn-secondary" style="margin-top:3px;" onclick="window.uiNavigateToPad(\'" + pad.id + "\')">📍 導航踏陣 (' + cIcon + rem + ')</button>';
      } else {
        html += '<div style="font-size:0.72rem;color:#4ade80;font-weight:800;margin-top:3px;">✨ 已達最高等級</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    // 10 Blueprints reference
    html += '<div style="font-weight:900;color:#38bdf8;font-size:0.86rem;margin-top:8px;">📜 10 大建築藍圖庫 (未解鎖藍圖可在此預覽與解鎖)</div>';
    html += '<div class="card-grid">';
    window.GAME_DATA.towerBlueprints.forEach(function(b) {
      var unl = eng.isBlueprintUnlocked(b.id);
      var cIc = b.unlockCurrency === "mana" ? "💎" : "🪙";
      html += '<div class="rpg-card ' + (unl ? 'unlocked' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:800;font-size:0.82rem;color:' + b.color + ';">' + b.icon + ' ' + b.name + '</span>';
      html += '<span style="font-size:0.68rem;color:' + (unl ? '#4ade80' : '#fde047') + ';font-weight:800;">' + (unl ? '✅已解鎖' : '🔒' + cIc + b.unlockCost) + '</span>';
      html += '</div>';
      html += '<div style="font-size:0.70rem;color:#fde047;">' + b.roleTag + ' · ' + b.adviceTag + '</div>';
      html += '<div style="font-size:0.68rem;color:#cbd5e1;">' + b.desc + '</div>';
      if (!unl) {
        html += '<button class="btn-action" style="margin-top:3px;" onclick="window.uiUnlockBlueprint(\'" + b.id + "\')">🔓 解鎖藍圖 (' + cIc + b.unlockCost + ')</button>';
      }
      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  },

  renderTownHallModal: function(container) {
    var eng = window.GameEngine;
    var hall = eng.townHall;
    var wall = eng.wall;
    var html = '<div style="background:rgba(15,23,42,0.92);border:1.5px solid #fbbf24;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;">';
    html += '<div style="font-weight:900;font-size:0.95rem;color:#fde047;">🏛️ 守護大本營核心</div>';

    // Show all halls of current stage (e.g. Outpost + Main Citadel)
    (eng.halls || []).forEach(function(h) {
      var pct = Math.round((h.hp / h.maxHp) * 100);
      html += '<div style="font-size:0.78rem;color:#e2e8f0;">' + (h.isOutpost ? "🛡️ 前哨要塞廳" : "🏛️ 守護大本營") + "：<b>" + Math.ceil(h.hp) + "/" + h.maxHp + "</b></div>";
      html += '<div class="hp-bar-track" style="height:7px;"><div class="hp-bar-fill hall-fill" style="width:' + pct + '%;"></div></div>';
    });

    html += '<div style="font-size:0.78rem;color:#38bdf8;margin-top:4px;">🏰 城防耐久：<b>' + Math.ceil(wall.hp) + "/" + wall.maxHp + '</b></div>';
    html += '<div class="hp-bar-track" style="height:7px;"><div class="hp-bar-fill wall-fill" style="width:' + Math.round((wall.hp / wall.maxHp) * 100) + '%;"></div></div>';

    html += '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">';
    html += '<button class="btn-action" onclick="window.uiNavigateToPad('pad_TownHall')">📍 導航前往【大本營】</button>';
    html += '<button class="btn-secondary" onclick="window.uiNavigateToPad('pad_WallFortify')">🧱 導航前往【城防要塞】</button>';
    html += '<button class="btn-emerald" onclick="window.uiCastSkill(1)">🛡️ 施放【聖光壁壘】修補城防</button>';
    html += '</div></div>';
    container.innerHTML = html;
  },

  renderDefeatModal: function(container) {
    var eng = window.GameEngine;
    var pendingSouls = Math.max(2, Math.floor(eng.state.wave * 0.6 * eng.state.realmId));
    var html = '<div style="background:rgba(88,28,40,0.95);border:2px solid #ef4444;border-radius:12px;padding:14px;text-align:center;display:flex;flex-direction:column;gap:10px;">';
    html += '<div style="font-size:2rem;">💀</div>';
    html += '<div style="font-weight:900;font-size:1.05rem;color:#fca5a5;">城池淪陷！守護大本營被攻陷</div>';
    html += '<div style="font-size:0.76rem;color:#fecdd3;">你可以原地滿血復原並震退全場魔物，或進行古神轉生獲取靈魂結晶強化技能樹！</div>';
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:4px;">';
    html += '<button class="btn-action" onclick="window.uiReviveCitadel()">✨ 聖堂重振：滿血復原</button>';
    html += '<button class="btn-secondary" onclick="window.uiTriggerRebirth()">🔥 古神轉生 (+🔮' + pendingSouls + ')</button>';
    html += '</div></div>';
    container.innerHTML = html;
  },

renderHeroModal: function(container) {
    var eng = window.GameEngine;
    var st = eng.state;
    var forgeCost = Math.round(120 * Math.pow(1.25, st.heroWeaponForgeLv));

    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;background:rgba(30,23,56,0.9);padding:10px 12px;border-radius:12px;border:1px solid rgba(251,191,36,0.35);">';
    html += '<div><div style="font-weight:800;color:#fde047;">🦸 英雄等級 Lv.' + st.heroLevel + ' | 基礎戰力傷害：' + eng.getHeroDamage() + '</div>';
    html += '<div style="font-size:0.76rem;color:#cbd5e1;">神爐強化等級：+' + st.heroWeaponForgeLv + ' | 神性傷害倍率：x' + eng.getDivinityMult().toFixed(2) + '</div></div>';
    html += '<div style="display:flex;gap:6px;">';
    html += '<button class="btn-action" onclick="window.uiForgeEquipment()">⚒️ 鍛造聖物 (🪙' + forgeCost + ')</button>';
    html += '<button class="btn-secondary" onclick="window.uiMergeInventory()">✨ 一鍵三合一升階</button>';
    html += '</div></div>';

    html += '<div style="font-weight:800;color:#38bdf8;font-size:0.88rem;margin-top:4px;">⚔️ 切換古域英雄職業 (隨時自由切換)</div>';
    html += '<div class="card-grid">';
    window.GAME_DATA.heroClasses.forEach(function(cls) {
      var active = st.heroClassId === cls.id;
      html += '<div class="rpg-card ' + (active ? 'unlocked' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:800;color:' + cls.color + ';">' + cls.icon + ' ' + cls.name + '</span>';
      html += '<span style="font-size:0.72rem;color:#cbd5e1;">' + cls.title + '</span></div>';
      html += '<div style="font-size:0.74rem;color:#cbd5e1;">' + cls.desc + '</div>';
      html += '<button class="btn-action" ' + (active ? 'disabled' : '') + ' onclick="window.uiSelectHeroClass(\'' + cls.id + '\')">' + (active ? '✅ 當前出戰中' : '切換出戰') + '</button>';
      html += '</div>';
    });
    html += '</div>';

    var slotLabels = { weapon: "🗡️ 武器", armor: "🛡️ 聖甲", ring: "💍 魔戒", relic: "🔮 古聖物" };
    var statLabels = { heroDmg: "英雄傷害", wallHp: "城防耐久", goldBonus: "金幣掉落", towerDmg: "魔塔傷害", allMult: "全屬性增幅" };
    html += '<div style="font-weight:800;color:#fde047;font-size:0.88rem;margin-top:6px;">👑 當前穿戴神裝 (自動穿戴最高階聖物)</div>';
    html += '<div class="card-grid">';
    ["weapon", "armor", "ring", "relic"].forEach(function(slot) {
      var item = st.equipped[slot];
      html += '<div class="rpg-card ' + (item && item.tier >= 4 ? 'mythic' : '') + '">';
      html += '<div style="font-size:0.75rem;color:#94a3b8;font-weight:700;">' + slotLabels[slot] + '</div>';
      if (item) {
        html += '<div style="font-weight:800;color:' + item.color + ';font-size:0.86rem;">' + item.icon + ' ' + item.name + '</div>';
        html += '<div style="font-size:0.76rem;color:#f8fafc;">' + statLabels[item.statType] + ' +' + Math.round(item.val * 100) + '%</div>';
      } else {
        html += '<div style="font-size:0.8rem;color:#64748b;">尚未穿戴 (踏上鐵匠神爐或打怪掉落)</div>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="font-weight:800;color:#cbd5e1;font-size:0.84rem;margin-top:4px;">🎒 聖物背包 (' + st.inventory.length + ' / 36) — 點擊裝備可手動穿戴，或點上方【一鍵三合一升階】</div>';
    if (st.inventory.length === 0) {
      html += '<div style="font-size:0.78rem;color:#64748b;padding:8px;">背包目前為空，擊敗首領或踏上北境【鐵匠神爐】即可獲得裝備！</div>';
    } else {
      html += '<div class="card-grid">';
      st.inventory.forEach(function(item, idx) {
        html += '<div class="rpg-card" style="padding:8px;">';
        html += '<div style="font-weight:800;color:' + item.color + ';font-size:0.8rem;">' + item.icon + ' ' + item.name + '</div>';
        html += '<div style="font-size:0.72rem;color:#cbd5e1;">' + statLabels[item.statType] + ' +' + Math.round(item.val * 100) + '%</div>';
        html += '<button class="btn-secondary" style="margin-top:4px;padding:4px 8px;font-size:0.72rem;" onclick="window.uiEquipFromBag(' + idx + ')">穿戴</button>';
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  },

  // 6. Realms & Ascension Rebirth Modal
  renderRealmsModal: function(container) {
    var eng = window.GameEngine;
    var st = eng.state;
    var pendingSouls = Math.max(2, Math.floor(st.wave * 0.6 * st.realmId));
    var pendingDivinity = Math.max(1, Math.floor(st.wave / 5) * st.realmId);

    var html = '<div style="background:linear-gradient(135deg,rgba(58,28,96,0.92),rgba(24,18,48,0.95));border:1.5px solid #c084fc;border-radius:14px;padding:12px;">';
    html += '<div style="font-weight:800;font-size:0.95rem;color:#fde047;">✨ 太古神殿轉生 (Ascension Rebirth) — 已轉生 ' + st.rebirthCount + ' 次</div>';
    html += '<div style="font-size:0.78rem;color:#e9d5ff;margin:4px 0 8px 0;">重置當前章節波數與建築等級，保留所有【已解鎖 10 大魔塔藍圖、英雄等級、穿戴神裝、星盤技能科技樹】，並立即獲得永久神性傷害與金幣倍率加成！</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;">';
    html += '<span style="font-size:0.8rem;font-weight:800;color:#38bdf8;">當前神性結晶：✨' + st.divinity + ' (全軍總倍率 x' + eng.getDivinityMult().toFixed(2) + ')</span>';
    html += '<button class="btn-action" ' + (st.wave >= 5 ? '' : 'disabled') + ' onclick="window.uiTriggerRebirth()">🔥 立即古神轉生 (+🔮' + pendingSouls + ' / +✨' + pendingDivinity + ')</button>';
    html += '</div></div>';

    html += '<div style="font-weight:800;color:#fde047;font-size:0.9rem;margin-top:6px;">🗺️ 五大古域戰役章節 (每章 50 波 + 領域首領 + 無盡深淵)</div>';
    html += '<div class="card-grid">';
    window.GAME_DATA.realms.forEach(function(r) {
      var isCur = st.realmId === r.id;
      html += '<div class="rpg-card ' + (isCur ? 'unlocked' : '') + '">';
      html += '<div style="font-weight:800;color:#fde047;font-size:0.88rem;">' + r.name + '</div>';
      html += '<div style="font-size:0.72rem;color:#38bdf8;">首領：' + r.bossName + '</div>';
      html += '<div style="font-size:0.73rem;color:#cbd5e1;">' + r.desc + '</div>';
      html += '<div style="font-size:0.73rem;color:#a7f3d0;">💰 金幣與戰利品倍率：x' + r.rewardMult + '</div>';
      html += '<button class="btn-secondary" ' + (isCur ? 'disabled' : '') + ' onclick="window.uiSelectRealm(' + r.id + ')">' + (isCur ? '📍 當前所在領域' : '🚀 傳送至此古域') + '</button>';
      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  },

  // 7. Quests & Bestiary Codex Modal
  renderCodexModal: function(container) {
    var eng = window.GameEngine;
    var st = eng.state;
    var playMin = Math.floor(st.playSeconds / 60);

    var html = '<div style="display:flex;flex-wrap:wrap;gap:12px;background:rgba(28,22,52,0.9);padding:10px 12px;border-radius:12px;border:1px solid rgba(56,189,248,0.4);">';
    html += '<div>🏆 累計擊殺魔物：<b>' + st.totalKills + '</b></div>';
    html += '<div>🪙 累計獲取金幣：<b>' + this.formatNum(st.totalGoldEarned) + '</b></div>';
    html += '<div>🌊 最高推進波數：<b>第 ' + st.maxWaveReached + ' 波</b></div>';
    html += '<div>🔓 已解鎖藍圖：<b>' + st.unlockedBlueprints.length + ' / 10</b></div>';
    html += '<div>⏱️ 遊玩時數：<b>' + playMin + ' 分鐘</b></div>';
    html += '</div>';

    html += '<div style="font-weight:800;color:#fde047;font-size:0.88rem;margin-top:4px;">🎯 戰役主線任務進度 (' + Math.min(st.questIndex, window.GAME_DATA.quests.length) + ' / ' + window.GAME_DATA.quests.length + ')</div>';
    html += '<div class="card-grid">';
    window.GAME_DATA.quests.forEach(function(q, idx) {
      var done = idx < st.questIndex;
      var isCur = idx === st.questIndex;
      html += '<div class="rpg-card ' + (done ? 'unlocked' : '') + '" style="opacity:' + (done ? '0.72' : '1') + ';">';
      html += '<div style="font-weight:800;font-size:0.82rem;color:' + (done ? '#22c55e' : (isCur ? '#fde047' : '#f8fafc')) + ';">' + (done ? '✅ ' : (isCur ? '🔥 ' : '⏳ ')) + '#' + q.id + ' ' + q.title + '</div>';
      html += '<div style="font-size:0.73rem;color:#cbd5e1;">獎勵：🪙' + q.rewardGold + ' | 💎' + q.rewardMana + ' | 🔮' + q.rewardSoul + '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div style="font-weight:800;color:#38bdf8;font-size:0.88rem;margin-top:6px;">👹 古域魔物圖鑑 (Bestiary Codex)</div>';
    html += '<div class="card-grid">';
    window.GAME_DATA.bestiary.forEach(function(b) {
      var counterBp = window.GameEngine.getBlueprintById(b.counterBp);
      html += '<div class="rpg-card">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:800;color:#f8fafc;">' + b.icon + ' ' + b.name + '</span>';
      if (counterBp) {
        html += '<span style="font-size:0.68rem;color:#4ade80;font-weight:800;">剋星：' + counterBp.name + '</span>';
      }
      html += '</div>';
      html += '<div style="font-size:0.72rem;color:#fde047;">生命倍率 x' + b.hpMult + ' | 移動速度 ' + b.spd + '</div>';
      html += '<div style="font-size:0.73rem;color:#cbd5e1;">' + b.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  }
};

// ================= GLOBAL HANDLERS FOR INLINE ONCLICK ATTRIBUTES =================
window.uiOpenModal = function(tab) {
  window.SoundEngine.init();
  window.GameUI.openModal(tab);
};

window.uiCloseModal = function() {
  window.GameUI.closeModal();
};

window.uiCastSkill = function(idx) {
  window.SoundEngine.init();
  window.GameEngine.castSkill(idx);
};

// Step-On Card: Step 1 -> Select Type Tab
window.uiSelectStepType = function(padId, typeId) {
  window.SoundEngine.init();
  var pad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
  if (!pad) return;
  window.GameUI.selectedStepTypeId = typeId;
  window.GameUI.stepIntroMode = "type"; // Show the selected Type's 簡介 first!
  window.GameUI.renderStepOnSelectorUI(pad);
};

// Step-On Card: Step 2 -> Select Tower of Type (Shows Tower's 簡介 & stations if unlocked)
window.uiSelectStepTower = function(padId, bpId) {
  window.SoundEngine.init();
  var pad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
  if (!pad) return;
  var bp = window.GameEngine.getBlueprintById(bpId);
  if (!bp) return;

  window.GameUI.selectedStepTypeId = bp.typeId || "type_elemental";
  window.GameUI.selectedStepBpId = bp.id;
  window.GameUI.stepIntroMode = "tower";

  // If the tower is already unlocked, station it immediately and show its 簡介;
  // If locked, preview its 簡介 and show the Unlock & Station button in the 簡介 box!
  if (window.GameEngine.isBlueprintUnlocked(bp.id)) {
    window.GameEngine.selectPadBlueprint(padId, bp.id);
    window.GameUI.showToast("🏰 已駐守【" + bp.icon + " " + bp.name + "】并顯示簡介！");
  }
  window.GameUI.renderStepOnSelectorUI(pad);
  window.GameUI.updateHUD();
};

// Step-On Card: Confirm Unlock & Station from the 簡介 Box
window.uiConfirmStationTower = function(padId, bpId) {
  window.SoundEngine.init();
  window.uiChooseTowerOnPad(padId, bpId);
  var pad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
  if (pad) {
    window.GameUI.selectedStepBpId = bpId;
    window.GameUI.stepIntroMode = "tower";
    window.GameUI.renderStepOnSelectorUI(pad);
  }
};

// Modal: Select Building Type Tab
window.uiSelectModalTowerType = function(typeId) {
  window.SoundEngine.init();
  window.GameUI.modalSelectedTypeId = typeId;
  var firstOfType = window.GAME_DATA.towerBlueprints.find(function(b) { return b.typeId === typeId; });
  if (firstOfType) {
    window.GameUI.modalSelectedBpId = firstOfType.id;
  }
  window.GameUI.modalIntroMode = "type"; // Display Type 簡介 upon clicking Type tab
  var bodyEl = document.getElementById("modal-body");
  if (bodyEl && window.GameUI.activeModal === "pads") {
    window.GameUI.renderPadsModal(bodyEl);
  }
};

// Modal: Select Specific Tower Blueprint Card to view its 簡介
window.uiSelectModalTowerBp = function(bpId) {
  window.SoundEngine.init();
  var bp = window.GameEngine.getBlueprintById(bpId);
  if (bp) {
    window.GameUI.modalSelectedTypeId = bp.typeId || "type_elemental";
    window.GameUI.modalSelectedBpId = bp.id;
    window.GameUI.modalIntroMode = "tower";
  }
  var bodyEl = document.getElementById("modal-body");
  if (bodyEl && window.GameUI.activeModal === "pads") {
    window.GameUI.renderPadsModal(bodyEl);
  }
};

// Skill Tree Modal: Switch Branch
window.uiSelectSkillBranch = function(branchId) {
  window.SoundEngine.init();
  window.GameUI.activeSkillBranch = branchId;
  var firstNode = window.GAME_DATA.talents.find(function(t) { return t.branch === branchId && t.tier === 1; });
  if (firstNode) {
    window.GameUI.selectedTalentId = firstNode.id;
  }
  var bodyEl = document.getElementById("modal-body");
  if (bodyEl && window.GameUI.activeModal === "talents") {
    window.GameUI.renderTalentsModal(bodyEl);
  }
};

// Skill Tree Modal: Select Node to inspect 簡介
window.uiSelectTalentNode = function(talId) {
  window.SoundEngine.init();
  window.GameUI.selectedTalentId = talId;
  var bodyEl = document.getElementById("modal-body");
  if (bodyEl && window.GameUI.activeModal === "talents") {
    window.GameUI.renderTalentsModal(bodyEl);
  }
};

window.uiToggleAiMode = function() {
  window.SoundEngine.init();
  window.GameEngine.aiMode = (window.GameEngine.aiMode + 1) % 3;
  window.GameUI.updateTopButtons();
  var msgs = [
    "🕹️ 已切換為【手動控制】：使用觸控搖桿或點擊地面移動",
    "🤖 已開啟【AI 巡邏撿幣】：英雄將自動拾取戰利品並協防城門",
    "⚡ 已開啟【AI 全自動踏陣】：英雄將自動經由城門前往各建地升級與擴建！"
  ];
  window.GameUI.showToast(msgs[window.GameEngine.aiMode]);
};

window.uiToggleSpeed = function() {
  window.SoundEngine.init();
  var cur = window.GameEngine.gameSpeed;
  window.GameEngine.gameSpeed = cur === 1 ? 2 : (cur === 2 ? 3 : 1);
  window.GameUI.updateTopButtons();
  window.GameUI.showToast("⏩ 遊戲戰鬥速度已設為 " + window.GameEngine.gameSpeed + "x");
};

window.uiToggleZoom = function() {
  window.SoundEngine.init();
  var cur = window.GameEngine.camera.userZoomMult || 0.85;
  var next = cur > 0.95 ? 0.62 : (cur < 0.72 ? 0.85 : 1.08);
  window.GameEngine.camera.userZoomMult = next;
  window.GameUI.updateTopButtons();
  window.GameUI.showToast(next < 0.72 ? "🔍 已切換為【全景視野】：可一覽三路敵軍與外圍建地" : (next > 0.95 ? "🔍 已切換為【近景視野】" : "🔍 已切換為【標準視野】"));
};

window.uiToggleAudio = function() {
  var muted = window.SoundEngine.toggleMute();
  window.GameUI.updateTopButtons();
  window.GameUI.showToast(muted ? "🔇 已關閉音效與背景音樂" : "🔊 已開啟古域魔陣音效與背景音樂");
};

window.uiNavigateToPad = function(padId) {
  var pad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
  if (pad) {
    window.GameEngine.hero.targetX = pad.x;
    window.GameEngine.hero.targetY = pad.y;
    window.GameUI.closeModal();
    window.GameUI.showToast("📍 英雄正經由城門前往【" + pad.name + "】！");
  }
};

window.uiFollowAdvisor = function() {
  window.SoundEngine.init();
  var adv = window.GameEngine.getTacticalAdvice();
  if (!adv) return;
  if (adv.recBpId && !window.GameEngine.isBlueprintUnlocked(adv.recBpId)) {
    window.GameEngine.unlockBlueprint(adv.recBpId);
  }
  if (adv.targetPadId && adv.recBpId) {
    var st = window.GameEngine.state.pads[adv.targetPadId];
    if (st && st.level === 0 && window.GameEngine.isBlueprintUnlocked(adv.recBpId)) {
      window.GameEngine.selectPadBlueprint(adv.targetPadId, adv.recBpId);
    }
  }
  if (adv.targetPadId) {
    window.uiNavigateToPad(adv.targetPadId);
  }
};

window.uiUnlockBlueprint = function(bpId) {
  window.SoundEngine.init();
  var bp = window.GameEngine.getBlueprintById(bpId);
  if (!bp) return;
  var ok = window.GameEngine.unlockBlueprint(bpId);
  if (ok) {
    window.GameUI.updateHUD();
    if (window.GameUI.activeModal === "pads") {
      window.GameUI.openModal("pads");
    }
    window.GameUI.showToast("🔓 成功解鎖藍圖【" + bp.icon + " " + bp.name + "】！踏上任意建地即可選用！");
  } else {
    var cIcon = bp.unlockCurrency === "mana" ? "💎" : "🪙";
    window.GameUI.showToast("⚠️ 資源不足！解鎖【" + bp.name + "】需要 " + cIcon + bp.unlockCost);
  }
};

window.uiChooseTowerOnPad = function(padId, bpId) {
  window.SoundEngine.init();
  var bp = window.GameEngine.getBlueprintById(bpId);
  if (!bp) return;
  var ok = window.GameEngine.selectPadBlueprint(padId, bpId);
  if (ok) {
    window.GameUI.selectedStepBpId = bp.id;
    window.GameUI.stepIntroMode = "tower";
    var activePad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
    if (activePad && window.GameEngine.hero.activePadId === padId) {
      window.GameUI.renderStepOnSelectorUI(activePad);
    }
    window.GameUI.updateHUD();
    if (window.GameUI.activeModal === "pads") {
      window.GameUI.openModal("pads");
    }
    window.GameUI.showToast("🏰 已將此建地配置為【" + bp.icon + " " + bp.name + "】！");
  } else {
    var cIcon = bp.unlockCurrency === "mana" ? "💎" : "🪙";
    window.GameUI.showToast("⚠️ 解鎖【" + bp.name + "】需要 " + cIcon + bp.unlockCost + "！");
  }
};

window.uiSelectHeroClass = function(clsId) {
  window.GameEngine.state.heroClassId = clsId;
  window.GameEngine.saveGame();
  window.GameUI.openModal("hero");
  window.GameUI.showToast("⚔️ 已切換英雄職業！");
};

window.uiForgeEquipment = function() {
  var st = window.GameEngine.state;
  var cost = Math.round(120 * Math.pow(1.25, st.heroWeaponForgeLv));
  if (st.gold < cost) {
    window.GameUI.showToast("⚠️ 金幣不足！需要 🪙" + cost);
    return;
  }
  st.gold -= cost;
  st.heroWeaponForgeLv += 1;
  var item = window.GameEngine.rollRandomEquipment();
  window.SoundEngine.playUpgradeComplete();
  window.GameUI.openModal("hero");
  window.GameUI.updateHUD();
  window.GameUI.showToast("⚒️ 鍛造成功！獲得 " + item.name);
};

window.uiMergeInventory = function() {
  var count = window.GameEngine.mergeAllInventory();
  if (count > 0) {
    window.SoundEngine.playUpgradeComplete();
    window.GameUI.openModal("hero");
    window.GameUI.showToast("✨ 成功合成升階 " + count + " 件高階聖物！");
  } else {
    window.GameUI.showToast("ℹ️ 需要背包內有 3 件同品階裝備才可合成升階");
  }
};

window.uiEquipFromBag = function(bagIndex) {
  var st = window.GameEngine.state;
  var item = st.inventory[bagIndex];
  if (!item) return;
  st.inventory.splice(bagIndex, 1);
  var prev = st.equipped[item.slot];
  if (prev) st.inventory.push(prev);
  st.equipped[item.slot] = item;
  window.GameEngine.recalcWallStats(false);
  window.GameUI.openModal("hero");
  window.GameUI.showToast("👑 已穿戴 " + item.name);
};

window.uiUpgradeTalent = function(talId) {
  var st = window.GameEngine.state;
  var tal = window.GAME_DATA.talents.find(function(t) { return t.id === talId; });
  if (!tal) return;
  if (!window.GameUI.isTalentUnlocked(tal)) {
    window.GameUI.showToast("🔒 請先將上階前置技能升至 Lv." + (tal.reqLv || 3) + "！");
    return;
  }
  var lv = st.talents[talId] || 0;
  var cost = tal.baseCost + Math.floor(lv / 4);
  if (lv >= tal.maxLv || st.souls < cost) return;
  st.souls -= cost;
  st.talents[talId] = lv + 1;
  window.GameUI.selectedTalentId = talId;
  window.GameEngine.recalcWallStats(false);
  window.GameEngine.saveGame();
  window.SoundEngine.playUpgradeComplete();
  window.GameUI.openModal("talents");
  window.GameUI.updateHUD();
  if (lv + 1 === 3) {
    window.GameUI.showToast("🌟 【" + tal.name + "】已達 Lv.3！下階子技能分支已解鎖！");
  } else {
    window.GameUI.showToast("🌟 【" + tal.name + "】升級至 Lv." + (lv + 1) + "！");
  }
};

window.uiSelectRealm = function(realmId) {
  window.GameEngine.changeRealm(realmId, false);
  window.GameUI.closeModal();
};

window.uiTriggerRebirth = function() {
  if (window.GameEngine.state.wave < 5) return;
  window.GameEngine.performRebirth();
  window.GameUI.closeModal();
};

window.uiReviveCitadel = function() {
  window.SoundEngine.init();
  window.GameEngine.reviveFromDefeat();
};

// Step-On Unbuilt Tower Picker Handlers
window.uiSelectBuildType = function(padId, typeId) {
  window.SoundEngine.init();
  window.GameUI.selectedBuildTypeId = typeId;
  var firstOf = window.GAME_DATA.towerBlueprints.find(function(b) { return b.typeId === typeId; });
  if (firstOf) {
    window.GameUI.selectedBuildBpId = firstOf.id;
  }
  window.GameUI.updateContextCard();
};

window.uiSelectBuildTower = function(padId, bpId) {
  window.SoundEngine.init();
  var bp = window.GameEngine.getBlueprintById(bpId);
  if (bp) {
    window.GameUI.selectedBuildTypeId = bp.typeId;
    window.GameUI.selectedBuildBpId = bp.id;
  }
  window.GameUI.updateContextCard();
};

window.uiBuildTower = function(padId, bpId) {
  window.SoundEngine.init();
  window.GameEngine.buildPadTower(padId, bpId);
};
