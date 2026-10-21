/* ==========================================================================
   Ancient Arcane Bastion (古域魔陣：守護神殿) - Mobile UI, Modals & Skill Tree
   v1.5.0:
   - Step-On & Modal Building Selection:
     1) Select by Type First (⚡ 元素魔塔 / ☄️ 破甲重塔 / 🛡️ 派兵兵營)
     2) Show Towers of Selected Type
     3) Dynamic 簡介 (Description & Stats Inspector) for Selected Type / Tower / Building
   - Redesigned 4-Tier Hierarchical Skill Tree / Tech Tree:
     1) 3 Branch Trees (⚔️ 戰術主宰樹 / 🪙 煉金經濟樹 / 🏰 要塞神工樹)
     2) Visual SVG Tree Connector Lines (Root -> Left/Right Branches -> Keystone Ultimate)
     3) Parent-Child Prerequisite Logic (Requires Parent Lv.3+) & Node 簡介 Inspector
   - Dual Defense Status (城防耐久 + 守護大本營 HP Bars) & Live 3-Road Threat Radar
   ========================================================================== */

window.GameUI = {
  activeModal: null,
  uiTimer: 0,

  // Step-On Context Card Selection State
  lastContextPadId: null,
  selectedStepTypeId: "type_elemental",
  selectedStepBpId: null,
  stepIntroMode: "tower", // "type" or "tower"

  // Modal Selection State (Pads & Blueprints Modal)
  modalSelectedTypeId: "type_elemental",
  modalSelectedBpId: "bp_arcane_spire",
  modalIntroMode: "tower", // "type", "tower", or "pad"
  modalSelectedPadId: null,

  // Skill Tree Selection State
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

  // ================= SKILL TREE PREREQUISITE HELPER =================
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

  // ================= TOP HUD UPDATER =================
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

    // 2. Realm and Wave
    var realm = eng.getCurrentRealm();
    var elRealm = document.getElementById("hud-realm-name");
    var elWave = document.getElementById("hud-wave-num");
    if (elRealm) elRealm.textContent = realm.name;
    if (elWave) elWave.textContent = "第 " + st.wave + " / " + realm.wavesToClear + " 波";

    // 3. Dual Defense Status Bars: Wall & Town Hall
    var elWallText = document.getElementById("hud-wall-text");
    var elWallBar = document.getElementById("hud-wall-bar");
    if (elWallText && eng.wall) {
      elWallText.textContent = Math.ceil(eng.wall.hp) + "/" + eng.wall.maxHp;
    }
    if (elWallBar && eng.wall && eng.wall.maxHp > 0) {
      var wPct = Math.max(0, Math.min(100, Math.round((eng.wall.hp / eng.wall.maxHp) * 100)));
      elWallBar.style.width = wPct + "%";
      if (wPct < 30) {
        elWallBar.style.background = "linear-gradient(90deg, #ef4444, #f87171)";
      } else if (wPct < 60) {
        elWallBar.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
      } else {
        elWallBar.style.background = "linear-gradient(90deg, #0284c7, #38bdf8)";
      }
    }

    var elHallText = document.getElementById("hud-hall-text");
    var elHallBar = document.getElementById("hud-hall-bar");
    if (elHallText && eng.townHall) {
      elHallText.textContent = Math.ceil(eng.townHall.hp) + "/" + eng.townHall.maxHp;
    }
    if (elHallBar && eng.townHall && eng.townHall.maxHp > 0) {
      var hPct = Math.max(0, Math.min(100, Math.round((eng.townHall.hp / eng.townHall.maxHp) * 100)));
      elHallBar.style.width = hPct + "%";
      if (hPct < 30) {
        elHallBar.style.background = "linear-gradient(90deg, #ef4444, #f43f5e)";
      } else if (hPct < 60) {
        elHallBar.style.background = "linear-gradient(90deg, #f59e0b, #fbbf24)";
      } else {
        elHallBar.style.background = "linear-gradient(90deg, #059669, #22c55e)";
      }
    }

    // 4. Live 3-Road Threat Radar
    var elRadarText = document.getElementById("hud-radar-text");
    var elRadarDot = document.getElementById("hud-radar-dot");
    if (elRadarText) {
      var nCt = 0, cCt = 0, sCt = 0;
      eng.enemies.forEach(function(e) {
        if (e.roadId === "road_north") nCt++;
        else if (e.roadId === "road_south") sCt++;
        else cCt++;
      });
      var totalEnemies = nCt + cCt + sCt;
      var gateStatus = eng.wall.hp <= 0 ? " ⚠️ 城門失守!" : "";
      elRadarText.textContent = "⚔️ 軍情：北路 " + nCt + " | 中路 " + cCt + " | 南路 " + sCt + gateStatus;
      if (elRadarDot) {
        elRadarDot.style.background = totalEnemies > 10 || eng.wall.hp <= 0 ? "#ef4444" : "#22c55e";
      }
    }

    // 5. Quest Banner
    var q = window.GAME_DATA.quests[st.questIndex];
    var elQuest = document.getElementById("hud-quest-text");
    if (elQuest) {
      if (q) {
        elQuest.textContent = "🎯 主線 #" + q.id + "：" + q.title;
      } else {
        elQuest.textContent = "👑 已完成全部引導主線！挑戰五章古域與無盡深淵";
      }
    }

    // 6. Arcane Tactical Advisor Banner
    var adv = eng.getTacticalAdvice();
    var elAdv = document.getElementById("hud-advisor-text");
    if (elAdv && adv) {
      elAdv.textContent = "🧙‍♂️ 軍師建議：" + adv.title;
    }

    var dotTalent = document.getElementById("dot-talent");
    if (dotTalent) {
      dotTalent.style.display = st.souls >= 1 ? "block" : "none";
    }

    // 7. Defeat check
    if (eng.townHall && eng.townHall.hp <= 0 && this.activeModal !== "defeat") {
      this.openModal("defeat");
    }
  },

  // ==========================================================================
  // STEP-ON CONTEXT CARD:
  // 1) Select by Type First (#pad-type-tabs)
  // 2) Show Towers of Selected Type (#pad-tower-picker)
  // 3) Show Dynamic 簡介 for Selected Type / Tower / Building (#pad-selection-intro)
  // ==========================================================================
  updateContextCard: function() {
    var card = document.getElementById("pad-context-card");
    if (!card) return;
    var eng = window.GameEngine;
    var padId = eng.hero.activePadId;
    if (!padId) {
      card.classList.add("hidden");
      this.lastContextPadId = null;
      return;
    }
    var pad = window.GAME_DATA.groundPads.find(function(p) { return p.id === padId; });
    if (!pad) {
      card.classList.add("hidden");
      return;
    }

    card.classList.remove("hidden");
    var st = eng.state.pads[pad.id] || { level: 0, invested: 0 };
    var rem = eng.getPadRemaining(pad);
    var curIcon = pad.currency === "mana" ? "💎" : "🪙";
    var stationedBp = pad.customizable ? eng.getPadBlueprint(pad) : null;

    // When stepping onto a new pad, initialize default type & selected tower to the stationed blueprint
    if (this.lastContextPadId !== pad.id) {
      this.lastContextPadId = pad.id;
      if (pad.customizable && stationedBp) {
        this.selectedStepTypeId = stationedBp.typeId || "type_elemental";
        this.selectedStepBpId = stationedBp.id;
        this.stepIntroMode = "tower";
      } else {
        this.stepIntroMode = "building";
      }
      this.renderStepOnSelectorUI(pad);
    }

    // Update top header bar of the context card (live remaining cost & level)
    var titleEl = document.getElementById("pad-context-title");
    var subEl = document.getElementById("pad-context-sub");
    if (titleEl) {
      var dispName = stationedBp ? ( pad.name + " · 駐守【" + stationedBp.icon + stationedBp.name + "】") : (pad.icon + " " + pad.name);
      titleEl.textContent = dispName + (pad.type === "expand" ? "" : " Lv." + st.level);
    }
    if (subEl) {
      if (st.level >= pad.maxLevel) {
        subEl.textContent = "✨ 已達最高等級 MAX";
      } else {
        subEl.textContent = "⬆️ 踏陣升級還需 " + curIcon + rem;
      }
    }

    // If non-customizable building, keep live stats refreshed
    if (!pad.customizable) {
      this.renderStepOnIntroBox(pad);
    }
  },

  renderStepOnSelectorUI: function(pad) {
    var typeTabsEl = document.getElementById("pad-type-tabs");
    var pickerEl = document.getElementById("pad-tower-picker");
    if (!typeTabsEl || !pickerEl) return;

    if (!pad.customizable) {
      typeTabsEl.style.display = "none";
      pickerEl.style.display = "none";
      this.renderStepOnIntroBox(pad);
      return;
    }

    typeTabsEl.style.display = "flex";
    pickerEl.style.display = "flex";

    var eng = window.GameEngine;
    var st = eng.state.pads[pad.id] || {};
    var stationedBpId = st.blueprintId || pad.defaultBlueprint || "bp_arcane_spire";
    var stationedBp = eng.getBlueprintById(stationedBpId);
    var self = this;

    // 1. Render Step 1: Type Tabs (元素魔塔 / 破甲重塔 / 派兵兵營)
    var tabsHtml = "";
    (window.GAME_DATA.towerTypes || []).forEach(function(tType) {
      var isTypeActive = self.selectedStepTypeId === tType.id;
      var hasStationedHere = stationedBp && stationedBp.typeId === tType.id;
      var cls = "type-tab-btn" + (isTypeActive ? " active-type-tab" : "");
      tabsHtml += '<button class="' + cls + '" onclick="window.uiSelectStepType(\'' + pad.id + '\', \'' + tType.id + '\')">';
      tabsHtml += '<span>' + tType.icon + ' ' + tType.name + '</span>';
      if (hasStationedHere) {
        tabsHtml += '<span style="color:#4ade80;font-size:0.65rem;">●駐</span>';
      }
      tabsHtml += '</button>';
    });
    typeTabsEl.innerHTML = tabsHtml;

    // 2. Render Step 2: Towers of the Selected Type
    var towersOfType = window.GAME_DATA.towerBlueprints.filter(function(bp) {
      return bp.typeId === self.selectedStepTypeId;
    });

    var chipsHtml = "";
    var adv = eng.getTacticalAdvice();
    towersOfType.forEach(function(bp) {
      var unlocked = eng.isBlueprintUnlocked(bp.id);
      var isStationed = stationedBpId === bp.id;
      var isSelectedPreview = (self.stepIntroMode === "tower" && self.selectedStepBpId === bp.id);
      var isRec = adv && adv.recBpId === bp.id;
      var cIcon = bp.unlockCurrency === "mana" ? "💎" : "🪙";

      var chipCls = "tower-chip" +
        (isSelectedPreview ? " selected-preview-chip" : "") +
        (isStationed ? " stationed-chip" : "") +
        (!unlocked ? " locked-chip" : "");

      chipsHtml += '<button class="' + chipCls + '" onclick="window.uiSelectStepTower(\'' + pad.id + '\', \'' + bp.id + '\')">';
      chipsHtml += '<span>' + bp.icon + ' ' + bp.name + '</span>';
      if (isStationed) {
        chipsHtml += '<span style="color:#4ade80;font-size:0.68rem;">✓駐守</span>';
      } else if (!unlocked) {
        chipsHtml += '<span style="color:#fde047;font-size:0.68rem;">🔒' + cIcon + bp.unlockCost + '</span>';
      } else if (isRec) {
        chipsHtml += '<span style="color:#38bdf8;font-size:0.68rem;">★推薦</span>';
      } else {
        chipsHtml += '<span style="color:#cbd5e1;font-size:0.66rem;">可選</span>';
      }
      chipsHtml += '</button>';
    });
    pickerEl.innerHTML = chipsHtml;

    // 3. Render Step 3: Dynamic 簡介 Box for the Selected Type or Selected Tower
    this.renderStepOnIntroBox(pad);
  },

  renderStepOnIntroBox: function(pad) {
    var introEl = document.getElementById("pad-selection-intro");
    if (!introEl || !pad) return;
    var eng = window.GameEngine;
    var st = eng.state.pads[pad.id] || { level: 0, invested: 0 };

    // Case A: Non-Customizable Functional Building Pad (Town Hall, Wall Fortify, Gold Vault, Mana Well, Forge, Shrine, Portal, Expand)
    if (!pad.customizable) {
      var htmlB = '<div class="intro-header-row">';
      htmlB += '<span style="font-weight:900;font-size:0.78rem;color:#fde047;">📖 建築簡介：' + pad.icon + ' ' + pad.name + '</span>';
      htmlB += '<span style="font-size:0.68rem;color:#4ade80;font-weight:800;">' + (pad.type === "expand" ? "領地擴張陣" : "當前 Lv." + st.level + "/" + pad.maxLevel) + '</span>';
      htmlB += '</div>';
      htmlB += '<div style="font-size:0.72rem;color:#e2e8f0;line-height:1.38;">' + pad.desc + '</div>';

      if (pad.type === "town_hall") {
        htmlB += '<div class="intro-stats-row"><span>🏛️ 當前大本營生命：' + Math.ceil(eng.townHall.hp) + '/' + eng.townHall.maxHp + '</span><span>🏹 自衛重弩傷害：' + Math.round(eng.getHeroDamage() * 1.4) + '</span></div>';
      } else if (pad.type === "wall") {
        htmlB += '<div class="intro-stats-row"><span>🏰 當前城防耐久：' + Math.ceil(eng.wall.hp) + '/' + eng.wall.maxHp + '</span><span>⚡ 升級立即修復 50% 城防</span></div>';
      } else if (pad.type === "mine") {
        var yieldMult = (1 + eng.getTalentVal("t_mine_yield")) * eng.getDivinityMult();
        var gps = (st.level * 4.2 * yieldMult * eng.getCurrentRealm().rewardMult).toFixed(1);
        htmlB += '<div class="intro-stats-row"><span>🪙 當前產金：+' + gps + ' / 秒</span><span>🧚 派駐採集精靈：' + Math.min(5, 1 + Math.floor(st.level / 5)) + ' 隻</span></div>';
      } else if (pad.type === "mana_well") {
        var mps = (st.level * 0.55 * (1 + eng.getTalentVal("t_mine_yield")) * eng.getDivinityMult()).toFixed(2);
        htmlB += '<div class="intro-stats-row"><span>💎 當前魔晶產量：+' + mps + ' / 秒</span><span>📖 技能冷卻加速：+' + Math.round(st.level * 1.5) + '%</span></div>';
      }
      introEl.innerHTML = htmlB;
      return;
    }

    // Case B: User clicked a Type Tab and is viewing the Type Summary
    var self = this;
    var curType = (window.GAME_DATA.towerTypes || []).find(function(t) { return t.id === self.selectedStepTypeId; }) || window.GAME_DATA.towerTypes[0];

    if (this.stepIntroMode === "type" && curType) {
      var htmlT = '<div class="intro-header-row">';
      htmlT += '<span style="font-weight:900;font-size:0.78rem;color:' + curType.color + ';">📖 類別簡介：' + curType.icon + ' ' + curType.name + ' (' + curType.roleDesc + ')</span>';
      htmlT += '<span style="font-size:0.68rem;color:#fde047;font-weight:800;">👆 請點擊上方該類別魔塔查看詳情與駐守</span>';
      htmlT += '</div>';
      htmlT += '<div style="font-size:0.72rem;color:#e2e8f0;line-height:1.38;">' + curType.summary + '</div>';
      introEl.innerHTML = htmlT;
      return;
    }

    // Case C: Viewing a Specific Selected Tower / Barracks Blueprint 簡介
    var bp = eng.getBlueprintById(this.selectedStepBpId || st.blueprintId || pad.defaultBlueprint);
    if (!bp) return;

    var unlocked = eng.isBlueprintUnlocked(bp.id);
    var stationedBpId = st.blueprintId || pad.defaultBlueprint;
    var isStationed = stationedBpId === bp.id;
    var cIcon = bp.unlockCurrency === "mana" ? "💎" : "🪙";
    var lvForCalc = Math.max(1, st.level);
    var calcDmg = eng.getTowerDamage(pad, lvForCalc);

    var html = '<div class="intro-header-row">';
    html += '<div>';
    html += '<span style="font-weight:900;font-size:0.8rem;color:' + bp.color + ';">📖 簡介：' + bp.icon + ' ' + bp.name + '</span> ';
    html += '<span style="font-size:0.68rem;background:rgba(30,41,59,0.9);color:#fde047;padding:1px 6px;border-radius:5px;font-weight:800;">' + (curType ? curType.shortName : "") + ' · ' + bp.roleTag + '</span>';
    html += '</div>';

    // Action Button right in the 簡介 header so the player can station or unlock the selected tower
    if (isStationed) {
      html += '<span style="font-size:0.7rem;color:#4ade80;font-weight:900;">✅ 當前駐守中 (踏陣自動升級)</span>';
    } else if (unlocked) {
      html += '<button class="btn-emerald" style="padding:3px 9px;font-size:0.7rem;" onclick="window.uiConfirmStationTower(\'' + pad.id + '\', \'' + bp.id + '\')">🏰 駐守此陣位</button>';
    } else {
      html += '<button class="btn-action" style="padding:3px 9px;font-size:0.7rem;" onclick="window.uiConfirmStationTower(\'' + pad.id + '\', \'' + bp.id + '\')">🔓 解鎖並駐守 (' + cIcon + bp.unlockCost + ')</button>';
    }
    html += '</div>';

    // Detailed Description
    html += '<div style="font-size:0.72rem;color:#e2e8f0;line-height:1.36;">' + bp.desc + '</div>';

    // Combat Stats Bar
    html += '<div class="intro-stats-row">';
    if (bp.category === "barracks") {
      html += '<span>🛡️ 兵種生命：' + bp.troopHp + '</span>';
      html += '<span>⚔️ 兵種傷害：' + bp.troopDmg + '</span>';
      html += '<span>⏱️ 派兵間隔：' + bp.spawnInterval + 's</span>';
    } else {
      html += '<span>💥 預估傷害：' + calcDmg + ' (基礎 ' + bp.baseDmg + ')</span>';
      html += '<span>⚡ 攻速：' + bp.atkRate + 's</span>';
      html += '<span>🎯 射程：' + bp.range + '</span>';
    }
    html += '<span style="color:#fde047;">💡 ' + bp.adviceTag + '</span>';
    html += '</div>';

    introEl.innerHTML = html;
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
      var labels = ["🤖 AI: 手動控制", "🤖 AI: 巡邏撿幣", "🤖 AI: 全自動踏陣"];
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
    }, 2650);
  },

  showDefeatModal: function() {
    this.openModal("defeat");
  },

  // ================= MODAL DRAWER RENDERING =================
  openModal: function(tabName) {
    this.activeModal = tabName;
    var backdrop = document.getElementById("modal-backdrop");
    var titleEl = document.getElementById("modal-title");
    var bodyEl = document.getElementById("modal-body");
    if (!backdrop || !titleEl || !bodyEl) return;

    backdrop.classList.remove("hidden");

    if (tabName === "pads") {
      titleEl.innerHTML = "🏰 建築分類選單 & 陣位配置總覽 (先選類型 ➔ 再選魔塔與查看簡介)";
      this.renderPadsModal(bodyEl);
    } else if (tabName === "townhall") {
      titleEl.innerHTML = "🏛️ 守護大本營 (Citadel Hall) — 要塞防線中樞";
      this.renderTownHallModal(bodyEl);
    } else if (tabName === "hero") {
      titleEl.innerHTML = "⚔️ 英雄職業與遠古聖物鍛造";
      this.renderHeroModal(bodyEl);
    } else if (tabName === "talents") {
      titleEl.innerHTML = "🌟 太古星盤技能科技樹 (4 階前置解鎖樹狀圖)";
      this.renderTalentsModal(bodyEl);
    } else if (tabName === "realms") {
      titleEl.innerHTML = "🗺️ 古域五章領域與古神轉生";
      this.renderRealmsModal(bodyEl);
    } else if (tabName === "codex") {
      titleEl.innerHTML = "📖 戰役任務與魔物圖鑑 (10小時長線進度)";
      this.renderCodexModal(bodyEl);
    } else if (tabName === "defeat") {
      titleEl.innerHTML = "⚠️ 要塞淪陷 — 守護大本營被毀";
      this.renderDefeatModal(bodyEl);
    }
  },

  closeModal: function() {
    this.activeModal = null;
    var backdrop = document.getElementById("modal-backdrop");
    if (backdrop) backdrop.classList.add("hidden");
  },

  // ==========================================================================
  // 1. PADS & BUILDINGS MODAL:
  //    Step 1: Select Type Tab (⚡ 元素魔塔 / ☄️ 破甲重塔 / 🛡️ 派兵兵營)
  //    Step 2: Select Tower of that Type
  //    Step 3: Detailed 簡介 Inspector & Quick Stationing on Any Plot
  // ==========================================================================
  renderPadsModal: function(container) {
    var eng = window.GameEngine;
    var self = this;

    var html = '';

    // Step 1: Select Building Type First
    html += '<div style="font-weight:900;color:#fde047;font-size:0.88rem;">① 第一步：選擇建築類型 (Select Building Type)</div>';
    html += '<div class="skill-branch-tabs">';
    (window.GAME_DATA.towerTypes || []).forEach(function(tType) {
      var isAct = self.modalSelectedTypeId === tType.id;
      html += '<button class="skill-branch-btn ' + (isAct ? 'active-branch' : '') + '" onclick="window.uiSelectModalTowerType(\'' + tType.id + '\')">';
      html += '<span style="font-size:1.05rem;">' + tType.icon + ' ' + tType.name + '</span>';
      html += '<span style="font-size:0.68rem;color:#cbd5e1;">' + tType.roleDesc + '</span>';
      html += '</button>';
    });
    html += '</div>';

    // Step 2: Show Towers of Selected Type
    var curTypeObj = (window.GAME_DATA.towerTypes || []).find(function(t) { return t.id === self.modalSelectedTypeId; }) || window.GAME_DATA.towerTypes[0];
    var filteredTowers = window.GAME_DATA.towerBlueprints.filter(function(bp) {
      return bp.typeId === self.modalSelectedTypeId;
    });

    html += '<div style="font-weight:900;color:#38bdf8;font-size:0.88rem;margin-top:4px;">② 第二步：選擇【' + curTypeObj.name + '】旗下的建築查看簡介</div>';
    html += '<div class="card-grid">';
    filteredTowers.forEach(function(bp) {
      var unlocked = eng.isBlueprintUnlocked(bp.id);
      var isSel = (self.modalIntroMode === "tower" && self.modalSelectedBpId === bp.id);
      var cIcon = bp.unlockCurrency === "mana" ? "💎" : "🪙";

      html += '<div class="rpg-card ' + (unlocked ? 'unlocked ' : '') + (isSel ? 'selected-card' : '') + '" style="cursor:pointer;" onclick="window.uiSelectModalTowerBp(\'' + bp.id + '\')">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
      html += '<span style="font-weight:900;font-size:0.9rem;color:' + bp.color + ';">' + bp.icon + ' ' + bp.name + '</span>';
      html += '<span style="font-size:0.7rem;color:' + (unlocked ? '#4ade80' : '#fde047') + ';font-weight:800;">' + (unlocked ? '✅ 已解鎖' : '🔒 ' + cIcon + bp.unlockCost) + '</span>';
      html += '</div>';
      html += '<div style="font-size:0.73rem;color:#fde047;font-weight:700;">定位：' + bp.roleTag + '</div>';
      html += '<div style="font-size:0.72rem;color:#cbd5e1;">點擊查看完整【簡介】與部署陣位 ▸</div>';
      html += '</div>';
    });
    html += '</div>';

    // Step 3: Dynamic 簡介 Box for the Selected Type or Selected Tower
    html += '<div class="skill-inspector-card">';
    if (this.modalIntroMode === "type" && curTypeObj) {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
      html += '<div style="font-weight:900;font-size:0.96rem;color:' + curTypeObj.color + ';">📖 所選類型簡介：' + curTypeObj.icon + ' ' + curTypeObj.name + '</div>';
      html += '<span style="font-size:0.75rem;color:#fde047;font-weight:800;">請點擊上方任一建築卡片檢視詳細數據</span>';
      html += '</div>';
      html += '<div style="font-size:0.8rem;color:#f8fafc;line-height:1.5;">' + curTypeObj.summary + '</div>';
    } else {
      var selBp = eng.getBlueprintById(this.modalSelectedBpId);
      var isUnl = eng.isBlueprintUnlocked(selBp.id);
      var curIc = selBp.unlockCurrency === "mana" ? "💎" : "🪙";

      html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
      html += '<div>';
      html += '<div style="font-weight:900;font-size:1rem;color:' + selBp.color + ';">📖 所選建築詳細簡介：' + selBp.icon + ' ' + selBp.name + ' (' + selBp.engName + ')</div>';
      html += '<div style="font-size:0.75rem;color:#fde047;font-weight:800;margin-top:2px;">所屬類別：' + curTypeObj.icon + ' ' + curTypeObj.name + ' ｜ 戰術定位：' + selBp.roleTag + ' ｜ ' + selBp.adviceTag + '</div>';
      html += '</div>';
      if (!isUnl) {
        html += '<button class="btn-action" onclick="window.uiUnlockBlueprint(\'' + selBp.id + '\')">🔓 立即解鎖此藍圖 (' + curIc + selBp.unlockCost + ')</button>';
      } else {
        html += '<span style="background:rgba(34,197,94,0.2);border:1px solid #4ade80;color:#4ade80;padding:4px 10px;border-radius:8px;font-size:0.75rem;font-weight:800;">✅ 藍圖已解鎖・可隨時駐守</span>';
      }
      html += '</div>';

      html += '<div style="font-size:0.8rem;color:#f8fafc;line-height:1.48;background:rgba(15,23,42,0.75);padding:8px 10px;border-radius:8px;border-left:3px solid ' + selBp.color + ';">';
      html += '<b>【建築簡介】</b>' + selBp.desc + '<br/>';
      html += '<span style="color:#93c5fd;"><b>【軍師使用時機】</b>' + selBp.adviceWhen + '</span>';
      html += '</div>';

      // Detailed Stats
      html += '<div class="intro-stats-row" style="font-size:0.76rem;">';
      if (selBp.category === "barracks") {
        html += '<span>🛡️ 基礎兵種生命：<b>' + selBp.troopHp + '</b></span>';
        html += '<span>⚔️ 基礎兵種攻擊：<b>' + selBp.troopDmg + '</b></span>';
        html += '<span>⏱️ 出兵間隔：<b>' + selBp.spawnInterval + ' 秒</b></span>';
        html += '<span>🪙 初始建造費：<b>' + selBp.buildCostGold + ' 金</b></span>';
      } else {
        html += '<span>💥 基礎傷害：<b>' + selBp.baseDmg + '</b></span>';
        html += '<span>⚡ 攻擊間隔：<b>' + selBp.atkRate + ' 秒</b></span>';
        html += '<span>🎯 攻擊射程：<b>' + selBp.range + '</b></span>';
        html += '<span>🪙 初始建造費：<b>' + selBp.buildCostGold + ' 金</b></span>';
      }
      html += '</div>';
    }
    html += '</div>';

    // Section C: All Map Plots across 4 Zones (Can directly deploy the selected tower onto any unlocked customizable plot!)
    var selBpForDeploy = eng.getBlueprintById(this.modalSelectedBpId);
    html += '<div style="font-weight:900;color:#fde047;font-size:0.88rem;margin-top:6px;">③ 全地圖陣位與功能建築總覽（可一鍵將【' + selBpForDeploy.icon + selBpForDeploy.name + '】指派至陣位或導航前往）</div>';

    var zoneNames = [
      "🏛️ 核心聖殿區 (初始解鎖 — 含大本營、城防與內城陣位)",
      "⚡ 北境古林防線 (擴建 #1 — 含北道前哨、魔晶井與鐵匠神爐)",
      "☄️ 中路王道防線 (擴建 #2 — 含中路雙陣位與天罰流星神龕)",
      "🐉 南境密林防線 (擴建 #3 — 含南路雙陣位與魔王召喚陣)"
    ];

    for (var z = 0; z < 4; z++) {
      var isZoneUnl = eng.state.unlockedZones.indexOf(z) !== -1;
      html += '<div style="margin-top:8px;font-weight:800;color:' + (isZoneUnl ? '#38bdf8' : '#94a3b8') + ';font-size:0.84rem;">' + zoneNames[z] + (isZoneUnl ? ' ✅' : ' 🔒 (需先踏上擴建陣位)') + '</div>';
      html += '<div class="card-grid">';

      window.GAME_DATA.groundPads.filter(function(p) { return p.zone === z; }).forEach(function(pad) {
        var st = eng.state.pads[pad.id] || { level: 0, invested: 0 };
        var rem = eng.getPadRemaining(pad);
        var cIcon = pad.currency === "mana" ? "💎" : "🪙";
        var isMax = st.level >= pad.maxLevel;
        var bp = pad.customizable ? eng.getPadBlueprint(pad) : null;

        html += '<div class="rpg-card ' + (st.level > 0 ? 'unlocked' : '') + '">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
        html += '<span style="font-weight:800;font-size:0.84rem;color:#f8fafc;">' + (bp ? bp.icon : pad.icon) + ' ' + pad.name + '</span>';
        html += '<span style="font-size:0.72rem;color:#38bdf8;font-weight:700;">' + (pad.type === "expand" ? (st.level > 0 ? "已擴建" : "未擴建") : "Lv." + st.level + "/" + pad.maxLevel) + '</span>';
        html += '</div>';

        if (pad.customizable && bp) {
          html += '<div style="font-size:0.73rem;color:#fde047;font-weight:700;">駐守：' + bp.icon + ' ' + bp.name + ' (' + bp.roleTag + ')</div>';
          html += '<div style="font-size:0.7rem;color:#cbd5e1;">' + bp.desc + '</div>';
          if (isZoneUnl && bp.id !== selBpForDeploy.id) {
            html += '<button class="btn-emerald" style="margin-top:2px;" onclick="window.uiChooseTowerOnPad(\'' + pad.id + '\', \'' + selBpForDeploy.id + '\')">🏰 改派【' + selBpForDeploy.name + '】駐守</button>';
          }
        } else {
          html += '<div style="font-size:0.72rem;color:#cbd5e1;min-height:28px;"><b>簡介：</b>' + pad.desc + '</div>';
        }

        if (isZoneUnl && !isMax) {
          html += '<button class="btn-secondary" style="margin-top:3px;" onclick="window.uiNavigateToPad(\'' + pad.id + '\')">📍 導航踏陣 (' + cIcon + rem + ')</button>';
        } else if (isMax) {
          html += '<div style="font-size:0.73rem;color:#22c55e;font-weight:800;margin-top:3px;">✨ 已達最高等級</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    container.innerHTML = html;
  },

  // ==========================================================================
  // 2. REDESIGNED 4-TIER HIERARCHICAL SKILL TREE / TECH TREE MODAL
  //    - 3 Branch Tabs (戰術主宰樹 / 煉金經濟樹 / 要塞神工樹)
  //    - Visual 4-Tier Tree Diagram with SVG Connector Lines
  //    - Parent -> Child -> Keystone Prerequisite System & Node 簡介 Inspector
  // ==========================================================================
  renderTalentsModal: function(container) {
    var eng = window.GameEngine;
    var st = eng.state;
    var self = this;

    var branches = window.GAME_DATA.talentBranches || [];
    var curBranchObj = branches.find(function(b) { return b.id === self.activeSkillBranch; }) || branches[0];
    var branchTalents = window.GAME_DATA.talents.filter(function(t) { return t.branch === self.activeSkillBranch; });

    // Ensure selectedTalentId belongs to current branch
    var selTal = branchTalents.find(function(t) { return t.id === self.selectedTalentId; });
    if (!selTal) {
      selTal = branchTalents[0];
      this.selectedTalentId = selTal ? selTal.id : "t_hero_dmg";
    }

    var html = '';

    // Top Resource & Instruction Bar
    html += '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;background:rgba(30,23,56,0.95);padding:8px 12px;border-radius:12px;border:1.5px solid rgba(168,85,247,0.5);">';
    html += '<span style="font-weight:900;color:#fde047;font-size:0.86rem;">🔮 可用靈魂結晶：' + Math.floor(st.souls) + '</span>';
    html += '<span style="font-size:0.73rem;color:#e9d5ff;">💡 樹狀解鎖規則：上階父節點升至 <b>Lv.3</b> 即可向下點亮子節點與終極奧義！</span>';
    html += '</div>';

    // 1. Branch Selector Tabs
    html += '<div class="skill-branch-tabs">';
    branches.forEach(function(b) {
      var isAct = self.activeSkillBranch === b.id;
      // Sum total levels invested in this branch
      var sumLv = 0;
      window.GAME_DATA.talents.filter(function(t) { return t.branch === b.id; }).forEach(function(t) {
        sumLv += (st.talents[t.id] || 0);
      });
      html += '<button class="skill-branch-btn ' + (isAct ? 'active-branch' : '') + '" onclick="window.uiSelectSkillBranch(\'' + b.id + '\')">';
      html += '<span>' + b.icon + ' ' + b.name + '</span>';
      html += '<span style="font-size:0.68rem;color:#38bdf8;">已投入 ' + sumLv + ' 級</span>';
      html += '</button>';
    });
    html += '</div>';

    // Identify the 6 nodes of the current branch by Tier and Column
    var nRoot = branchTalents.find(function(t) { return t.tier === 1; });
    var nT2L  = branchTalents.find(function(t) { return t.tier === 2 && t.col === 0; });
    var nT2R  = branchTalents.find(function(t) { return t.tier === 2 && t.col === 2; });
    var nT3L  = branchTalents.find(function(t) { return t.tier === 3 && t.col === 0; });
    var nT3R  = branchTalents.find(function(t) { return t.tier === 3 && t.col === 2; });
    var nKey  = branchTalents.find(function(t) { return t.tier === 4; });

    var rootLv = nRoot ? (st.talents[nRoot.id] || 0) : 0;
    var t2LLv  = nT2L ? (st.talents[nT2L.id] || 0) : 0;
    var t2RLv  = nT2R ? (st.talents[nT2R.id] || 0) : 0;
    var t3LLv  = nT3L ? (st.talents[nT3L.id] || 0) : 0;
    var t3RLv  = nT3R ? (st.talents[nT3R.id] || 0) : 0;

    var lineT1toT2 = rootLv >= 3;
    var lineT2LtoT3L = t2LLv >= 3;
    var lineT2RtoT3R = t2RLv >= 3;
    var lineT3LtoKey = t3LLv >= 3;
    var lineT3RtoKey = t3RLv >= 3;

    // 2. Visual 4-Tier Skill Tree Viewport with SVG Connector Lines
    html += '<div class="skill-tree-viewport">';

    // SVG Connector Lines (ViewBox 600 x 360)
    html += '<svg class="skill-tree-svg" viewBox="0 0 600 360" preserveAspectRatio="none">';
    var strokeAct = curBranchObj ? curBranchObj.color : "#fbbf24";
    var strokeDim = "rgba(100, 116, 139, 0.45)";

    // Root (300, 42) -> T2 Left (105, 132) & T2 Right (495, 132)
    html += '<path d="M 300 45 L 300 85 L 105 85 L 105 132" fill="none" stroke="' + (lineT1toT2 ? strokeAct : strokeDim) + '" stroke-width="' + (lineT1toT2 ? '4' : '2.5') + '" ' + (lineT1toT2 ? '' : 'stroke-dasharray="6,5"') + ' />';
    html += '<path d="M 300 45 L 300 85 L 495 85 L 495 132" fill="none" stroke="' + (lineT1toT2 ? strokeAct : strokeDim) + '" stroke-width="' + (lineT1toT2 ? '4' : '2.5') + '" ' + (lineT1toT2 ? '' : 'stroke-dasharray="6,5"') + ' />';

    // T2 Left (105, 145) -> T3 Left (105, 235)
    html += '<line x1="105" y1="145" x2="105" y2="235" stroke="' + (lineT2LtoT3L ? strokeAct : strokeDim) + '" stroke-width="' + (lineT2LtoT3L ? '4' : '2.5') + '" ' + (lineT2LtoT3L ? '' : 'stroke-dasharray="6,5"') + ' />';

    // T2 Right (495, 145) -> T3 Right (495, 235)
    html += '<line x1="495" y1="145" x2="495" y2="235" stroke="' + (lineT2RtoT3R ? strokeAct : strokeDim) + '" stroke-width="' + (lineT2RtoT3R ? '4' : '2.5') + '" ' + (lineT2RtoT3R ? '' : 'stroke-dasharray="6,5"') + ' />';

    // T3 Left (105, 245) -> Keystone (300, 325)
    html += '<path d="M 105 245 L 105 288 L 300 288 L 300 325" fill="none" stroke="' + (lineT3LtoKey ? strokeAct : strokeDim) + '" stroke-width="' + (lineT3LtoKey ? '4' : '2.5') + '" ' + (lineT3LtoKey ? '' : 'stroke-dasharray="6,5"') + ' />';

    // T3 Right (495, 245) -> Keystone (300, 325)
    html += '<path d="M 495 245 L 495 288 L 300 288 L 300 325" fill="none" stroke="' + (lineT3RtoKey ? strokeAct : strokeDim) + '" stroke-width="' + (lineT3RtoKey ? '4' : '2.5') + '" ' + (lineT3RtoKey ? '' : 'stroke-dasharray="6,5"') + ' />';
    html += '</svg>';

    // Helper to render an individual Skill Node card
    var renderNode = function(tal, isKeystone) {
      if (!tal) return '<div></div>';
      var lv = st.talents[tal.id] || 0;
      var unl = self.isTalentUnlocked(tal);
      var isSel = self.selectedTalentId === tal.id;
      var cls = "skill-node" +
        (isKeystone ? " node-keystone" : "") +
        (unl ? " node-unlocked" : " node-locked") +
        (lv > 0 ? " node-active-lv" : "") +
        (isSel ? " node-selected" : "");

      var statusBadge = "";
      if (!unl) {
        statusBadge = '<span class="node-lv-pill" style="color:#f87171;border-color:rgba(248,113,113,0.4);">🔒 需前置 Lv.' + (tal.reqLv || 3) + '</span>';
      } else if (lv >= tal.maxLv) {
        statusBadge = '<span class="node-lv-pill" style="color:#4ade80;border-color:#4ade80;">✨ MAX (' + lv + '/' + tal.maxLv + ')</span>';
      } else {
        statusBadge = '<span class="node-lv-pill">Lv.' + lv + ' / ' + tal.maxLv + '</span>';
      }

      var out = '<div class="' + cls + '" onclick="window.uiSelectTalentNode(\'' + tal.id + '\')">';
      out += '<div class="node-tier-tag">' + tal.roleTag + '</div>';
      out += '<div class="node-icon-circle">' + tal.icon + '</div>';
      out += '<div class="node-title">' + tal.name + '</div>';
      out += statusBadge;
      out += '</div>';
      return out;
    };

    // Tier 1 Row (Center Root)
    html += '<div class="skill-tier-row">';
    html += '<div></div>';
    html += renderNode(nRoot, false);
    html += '<div></div>';
    html += '</div>';

    // Tier 2 Row (Left & Right Branches)
    html += '<div class="skill-tier-row">';
    html += renderNode(nT2L, false);
    html += '<div style="font-size:0.68rem;color:' + (lineT1toT2 ? '#4ade80' : '#94a3b8') + ';font-weight:800;text-align:center;background:rgba(15,23,42,0.85);padding:3px 8px;border-radius:8px;">' + (lineT1toT2 ? '⚡ 分支已連通' : '🔒 根基 Lv.3 解鎖') + '</div>';
    html += renderNode(nT2R, false);
    html += '</div>';

    // Tier 3 Row (Left & Right Specializations)
    html += '<div class="skill-tier-row">';
    html += renderNode(nT3L, false);
    html += '<div style="font-size:0.68rem;color:#cbd5e1;font-weight:800;text-align:center;background:rgba(15,23,42,0.85);padding:3px 8px;border-radius:8px;">第 3 階進階專精</div>';
    html += renderNode(nT3R, false);
    html += '</div>';

    // Tier 4 Row (Center Keystone Ultimate)
    html += '<div class="skill-tier-row">';
    html += '<div></div>';
    html += renderNode(nKey, true);
    html += '<div></div>';
    html += '</div>';

    html += '</div>'; // End .skill-tree-viewport

    // 3. Selected Skill Node 簡介 & Upgrade Inspector Panel
    if (selTal) {
      var sLv = st.talents[selTal.id] || 0;
      var sMax = sLv >= selTal.maxLv;
      var sCost = selTal.baseCost + Math.floor(sLv / 4);
      var prereqInfo = this.getTalentPrerequisiteText(selTal);
      var canUpgrade = prereqInfo.unlocked && !sMax && st.souls >= sCost;

      var curBonusVal = selTal.unitSuffix === "金" ? (sLv * selTal.effectPerLv) : Math.round(sLv * selTal.effectPerLv * 100);
      var nextBonusVal = selTal.unitSuffix === "金" ? ((sLv + 1) * selTal.effectPerLv) : Math.round((sLv + 1) * selTal.effectPerLv * 100);

      html += '<div class="skill-inspector-card">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
      html += '<div>';
      html += '<div style="font-weight:900;font-size:0.98rem;color:#fde047;">' + selTal.icon + ' 【' + selTal.name + '】 — ' + selTal.roleTag + ' (Lv.' + sLv + '/' + selTal.maxLv + ')</div>';
      html += '<div style="font-size:0.74rem;color:' + (prereqInfo.unlocked ? '#4ade80' : '#f87171') + ';font-weight:800;margin-top:2px;">' + prereqInfo.text + '</div>';
      html += '</div>';

      if (sMax) {
        html += '<button class="btn-action" disabled>✨ 已修煉至滿級 MAX</button>';
      } else if (!prereqInfo.unlocked) {
        html += '<button class="btn-action" disabled>🔒 尚未滿足前置條件</button>';
      } else {
        html += '<button class="btn-action" ' + (canUpgrade ? '' : 'disabled') + ' onclick="window.uiUpgradeTalent(\'' + selTal.id + '\')">🔮 升級技能 (消耗 🔮' + sCost + ')</button>';
      }
      html += '</div>';

      html += '<div style="font-size:0.79rem;color:#f8fafc;line-height:1.45;background:rgba(15,23,42,0.75);padding:8px 10px;border-radius:8px;border-left:3px solid #38bdf8;">';
      html += '<b>【技能簡介】</b>' + selTal.desc;
      html += '</div>';

      html += '<div class="intro-stats-row" style="font-size:0.75rem;">';
      html += '<span>📊 當前累計加成：<b style="color:#4ade80;">+' + curBonusVal + selTal.unitSuffix + '</b></span>';
      if (!sMax) {
        html += '<span>🚀 下一級 (Lv.' + (sLv + 1) + ') 加成：<b style="color:#fde047;">+' + nextBonusVal + selTal.unitSuffix + '</b></span>';
      }
      html += '</div>';
      html += '</div>';
    }

    container.innerHTML = html;
  },

  // 3. Town Hall & Citadel Defense Hub Modal
  renderTownHallModal: function(container) {
    var eng = window.GameEngine;
    var st = eng.state;
    var hall = eng.townHall;
    var wall = eng.wall;
    var hallLv = (st.pads["pad_TownHall"] && st.pads["pad_TownHall"].level) || 1;

    var gateStatusText = wall.hp > 0 ? "🛡️ 堅固守護中 (魔物無法穿過城牆與城門)" : "💥 城門已被擊破！魔物正突入大本營！";
    var gateStatusColor = wall.hp > 0 ? "#4ade80" : "#ef4444";

    var html = '<div style="background:linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.92));border:2px solid #fbbf24;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px;">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<div style="font-weight:900;font-size:1.05rem;color:#fde047;">🏛️ 守護大本營 Lv.' + hallLv + ' (Citadel Core)</div>';
    html += '<div style="font-size:0.8rem;color:#38bdf8;font-weight:800;">生命值：' + Math.ceil(hall.hp) + ' / ' + hall.maxHp + '</div>';
    html += '</div>';

    html += '<div>';
    html += '<div style="display:flex;justify-content:space-between;font-size:0.74rem;color:#cbd5e1;margin-bottom:3px;"><span>大本營生命</span><span>' + Math.ceil(hall.hp) + '/' + hall.maxHp + '</span></div>';
    html += '<div class="hp-bar-track" style="height:10px;"><div class="hp-bar-fill hall-fill" style="width:' + Math.round((hall.hp / hall.maxHp) * 100) + '%;"></div></div>';
    html += '</div>';

    html += '<div>';
    html += '<div style="display:flex;justify-content:space-between;font-size:0.74rem;color:#cbd5e1;margin-bottom:3px;"><span>城防城門耐久</span><span>' + Math.ceil(wall.hp) + '/' + wall.maxHp + '</span></div>';
    html += '<div class="hp-bar-track" style="height:10px;"><div class="hp-bar-fill wall-fill" style="width:' + Math.round((wall.hp / wall.maxHp) * 100) + '%;"></div></div>';
    html += '</div>';

    html += '<div style="font-size:0.78rem;color:' + gateStatusColor + ';font-weight:800;background:rgba(15,15,30,0.6);padding:6px 10px;border-radius:8px;">' + gateStatusText + '</div>';

    html += '<div style="font-size:0.76rem;color:#cbd5e1;line-height:1.45;">';
    html += '• <b>主城弩砲防禦</b>：大本營自帶遠古重裝弩砲，每秒向 650 射程內最近魔物射出貫穿重矢。<br/>';
    html += '• <b>防守規則</b>：只要南北雙城門與實體石牆耐久 > 0，怪物絕無法穿牆入城；城門若被擊破，魔物將長驅直入圍攻大本營！<br/>';
    html += '• <b>大本營淪陷</b>：若大本營生命歸零，城池宣告陷落，需施展太古轉生或祈禱聖光復原。';
    html += '</div>';

    html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">';
    html += '<button class="btn-action" onclick="window.uiNavigateToPad(\'pad_TownHall\')">📍 導航前往【大本營】升級</button>';
    html += '<button class="btn-secondary" onclick="window.uiNavigateToPad(\'pad_WallFortify\')">🧱 導航前往【城防要塞】修復</button>';
    html += '<button class="btn-emerald" onclick="window.uiCastSkill(1)">🛡️ 施放【聖光壁壘】修補城防</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  // 4. Defeat / Citadel Breach Recovery Modal
  renderDefeatModal: function(container) {
    var eng = window.GameEngine;
    var pendingSouls = Math.max(2, Math.floor(eng.state.wave * 0.6 * eng.state.realmId));

    var html = '<div style="background:linear-gradient(135deg,rgba(88,28,40,0.95),rgba(32,15,25,0.98));border:2px solid #ef4444;border-radius:14px;padding:16px;text-align:center;display:flex;flex-direction:column;gap:12px;">';
    html += '<div style="font-size:2.2rem;">💀</div>';
    html += '<div style="font-weight:900;font-size:1.15rem;color:#fca5a5;">城池淪陷！守護大本營已被魔物攻陷</div>';
    html += '<div style="font-size:0.78rem;color:#fecdd3;line-height:1.5;">魔物大軍突破南北城門，守護大本營核心已遭摧毀！你可以選擇施展【聖堂守護重振】原地滿血復原並震退全場魔物，或者進行【太古神殿轉生】獲取靈魂結晶永久提升技能樹！</div>';

    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:6px;">';
    html += '<button class="btn-action" style="padding:10px 18px;font-size:0.86rem;" onclick="window.uiReviveCitadel()">✨ 聖堂重振：滿血修復大本營與城防</button>';
    html += '<button class="btn-secondary" style="padding:10px 18px;font-size:0.86rem;" onclick="window.uiTriggerRebirth()">🔥 古神轉生 (+🔮' + pendingSouls + ' 結晶)</button>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
  },

  // 5. Hero Classes & Equipment Forge Modal
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
