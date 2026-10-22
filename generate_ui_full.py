import re

with open("js/ui.js", "r", encoding="utf-8") as f:
    orig_ui = f.read()

# Extract renderTalentsModal, renderHeroModal, renderRealmsModal, renderCodexModal
idx_talents = orig_ui.find("renderTalentsModal: function")
idx_townhall = orig_ui.find("renderTownHallModal: function")
idx_hero = orig_ui.find("renderHeroModal: function")

# We can keep the rich modals and update HUD, contextCard, padsModal, and townHallModal
ui_script = '''/* ==========================================================================
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
        htmlU += '<button class="type-tab-btn ' + (isAct ? 'active-type-tab' : '') + '" onclick="window.uiSelectBuildType(\'' + pad.id + '\', \'' + tType.id + '\')">';
        htmlU += tType.icon + ' ' + tType.shortName;
        htmlU += '</button>';
      });
      htmlU += '</div>';

      // Step 2: Towers of that type
      htmlU += '<div class="tower-picker-strip">';
      towersOfType.forEach(function(b) {
        var isSel = activeBp.id === b.id;
        var unl = eng.isBlueprintUnlocked(b.id);
        htmlU += '<button class="tower-chip ' + (isSel ? 'selected-preview-chip' : '') + '" onclick="window.uiSelectBuildTower(\'' + pad.id + '\', \'' + b.id + '\')">';
        htmlU += '<span>' + b.icon + ' ' + b.name + '</span>';
        htmlU += '<span style="font-size:0.62rem;color:' + (unl ? '#4ade80' : '#fde047') + ';">' + (unl ? '🪙' + b.buildCostGold : '🔒解鎖') + '</span>';
        htmlU += '</button>';
      });
      htmlU += '</div>';

      // Step 3: Brief Description & Confirm Build Button
      htmlU += '<div class="pad-build-confirm-row">';
      htmlU += '<span class="pad-bp-summary">' + activeBp.icon + ' ' + activeBp.name + '：' + activeBp.roleTag + ' | ' + activeBp.adviceTag + '</span>';
      htmlU += '<button class="btn-build-confirm" onclick="window.uiBuildTower(\'' + pad.id + '\', \'' + activeBp.id + '\')">';
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
        html += '<button class="btn-secondary" style="margin-top:3px;" onclick="window.uiNavigateToPad(\'' + pad.id + '\')">📍 導航踏陣 (' + cIcon + rem + ')</button>';
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
        html += '<button class="btn-action" style="margin-top:3px;" onclick="window.uiUnlockBlueprint(\'' + b.id + '\')">🔓 解鎖藍圖 (' + cIc + b.unlockCost + ')</button>';
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
    html += '<button class="btn-action" onclick="window.uiNavigateToPad(\'pad_TownHall\')">📍 導航前往【大本營】</button>';
    html += '<button class="btn-secondary" onclick="window.uiNavigateToPad(\'pad_WallFortify\')">🧱 導航前往【城防要塞】</button>';
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

'''

# Extract talents, hero, realms, and codex modals from orig_ui
p_talents = orig_ui.find("renderTalentsModal: function")
p_end_talents = orig_ui.find("renderTownHallModal: function")
talents_block = orig_ui[p_talents:p_end_talents]

p_hero = orig_ui.find("renderHeroModal: function")
# The rest from renderHeroModal to end
hero_to_end = orig_ui[p_hero:]

# Replace window hooks with updated logic
full_ui = ui_script + talents_block + hero_to_end

# Let's add window.uiSelectBuildType and window.uiSelectBuildTower and window.uiBuildTower
window_hooks_addition = '''
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
'''

full_ui += window_hooks_addition

with open("js/ui.js", "w", encoding="utf-8") as f:
    f.write(full_ui)

print("ui.js successfully generated! Total size:", len(full_ui))
