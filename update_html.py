html = '''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#0f0c1b" />
  <title>古域魔陣：守護神殿 (Ancient Arcane Bastion v1.6.0) - 古代魔法RPG守城WebApp</title>
  <link rel="stylesheet" href="./css/style.css" />
</head>
<body>
<div id="app-root">
  <!-- Interactive 2.5D Battlefield Canvas -->
  <canvas id="game-canvas"></canvas>

  <!-- Toast Notification Layer -->
  <div id="toast-container"></div>

  <!-- Ultra-Compact Top HUD Bar (2 Sleek Rows designed for Mobile iPhone) -->
  <header class="hud-top">
    <!-- Row 1: Resources & System Toggles -->
    <div class="hud-row hud-row-main">
      <div class="resource-bar">
        <div class="res-pill gold-pill" title="古域金幣">
          <span class="res-icon gold-icon">🪙</span>
          <span id="hud-gold">220</span>
        </div>
        <div class="res-pill mana-pill" title="魔力水晶">
          <span class="res-icon mana-icon">💎</span>
          <span id="hud-mana">45</span>
        </div>
        <div class="res-pill soul-pill" title="靈魂結晶">
          <span class="res-icon soul-icon">🔮</span>
          <span id="hud-soul">4</span>
        </div>
      </div>

      <div class="hud-actions">
        <button id="btn-ai-toggle" class="hud-btn" onclick="window.uiToggleAiMode()">🤖 AI: 手動</button>
        <button id="btn-zoom-toggle" class="hud-btn" onclick="window.uiToggleZoom()">🔍 視角</button>
        <button id="btn-speed-toggle" class="hud-btn" onclick="window.uiToggleSpeed()">⏩ 1x</button>
        <button id="btn-audio-toggle" class="hud-btn" onclick="window.uiToggleAudio()">🔊 音效</button>
      </div>
    </div>

    <!-- Row 2: Defense Health Bars & Single-Line Chapter/Radar Ticker -->
    <div class="hud-row hud-row-defense">
      <div class="defense-bars-cluster">
        <div class="defense-pill wall-pill" title="城防耐久">
          <span class="defense-icon">🏰</span>
          <div class="defense-info">
            <div class="defense-label-row">
              <span id="hud-wall-lbl">城防耐久</span>
              <span id="hud-wall-text">850/850</span>
            </div>
            <div class="hp-bar-track">
              <div id="hud-wall-bar" class="hp-bar-fill wall-fill" style="width: 100%;"></div>
            </div>
          </div>
        </div>

        <div class="defense-pill hall-pill" title="守護大本營核心生命">
          <span class="defense-icon">🏛️</span>
          <div class="defense-info">
            <div class="defense-label-row">
              <span id="hud-hall-lbl">大本營</span>
              <span id="hud-hall-text">1800/1800</span>
            </div>
            <div class="hp-bar-track">
              <div id="hud-hall-bar" class="hp-bar-fill hall-fill" style="width: 100%;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Single-Line Interactive Ticker: Chapter, Wave & Threat Status -->
      <div id="hud-ticker-badge" class="radar-ticker-pill" onclick="window.uiOpenModal('codex')" title="點擊查看主線任務與戰術軍情">
        <span id="hud-radar-dot" class="radar-dot pulse-dot"></span>
        <span id="hud-ticker-text">第一章 · 第 1/50 波 | ⚔️ 0 敵</span>
      </div>
    </div>
  </header>

  <!-- Bottom Mobile Action Dock: Clean Step-On Card, Spells & 6 RPG Menus -->
  <footer class="hud-bottom">
    <div class="combat-controls-row">
      <!-- Contextual Card when standing on a Pad (Clean Upgrade view or Type-First Build view) -->
      <div id="pad-context-card" class="pad-context-card hidden">
        <!-- Rendered dynamically by window.GameUI.updateContextCard() -->
      </div>

      <!-- 3 Active Hero Spells -->
      <div class="skills-cluster">
        <button class="skill-btn" onclick="window.uiCastSkill(0)" title="符文風暴 + 全屏吸金">
          <span class="skill-emoji">🌪️</span>
          <span class="skill-lbl">風暴吸金</span>
          <div id="skill-cd-0" class="skill-cd-overlay" style="display:none;"></div>
        </button>
        <button class="skill-btn" onclick="window.uiCastSkill(1)" title="聖光壁壘：修復城牆 + 神像極速">
          <span class="skill-emoji">🛡️</span>
          <span class="skill-lbl">聖光壁壘</span>
          <div id="skill-cd-1" class="skill-cd-overlay" style="display:none;"></div>
        </button>
        <button class="skill-btn" onclick="window.uiCastSkill(2)" title="太古天隕：全屏流星火雨">
          <span class="skill-emoji">☄️</span>
          <span class="skill-lbl">太古天隕</span>
          <div id="skill-cd-2" class="skill-cd-overlay" style="display:none;"></div>
        </button>
      </div>
    </div>

    <!-- 6 RPG System Navigation Buttons -->
    <nav class="nav-dock">
      <button class="dock-btn" onclick="window.uiOpenModal('pads')">
        <span class="dock-icon">🏰</span>
        <span>防線陣位</span>
      </button>
      <button class="dock-btn" onclick="window.uiOpenModal('townhall')">
        <span class="dock-icon">🏛️</span>
        <span>大本營</span>
      </button>
      <button class="dock-btn" onclick="window.uiOpenModal('hero')">
        <span class="dock-icon">⚔️</span>
        <span>英雄聖物</span>
      </button>
      <button class="dock-btn" onclick="window.uiOpenModal('talents')">
        <span id="dot-talent" class="badge-dot"></span>
        <span class="dock-icon">🌟</span>
        <span>技能科技樹</span>
      </button>
      <button class="dock-btn" onclick="window.uiOpenModal('realms')">
        <span class="dock-icon">🗺️</span>
        <span>古域章節</span>
      </button>
      <button class="dock-btn" onclick="window.uiOpenModal('codex')">
        <span class="dock-icon">📖</span>
        <span>軍情任務</span>
      </button>
    </nav>
  </footer>

  <!-- Universal RPG Modal Drawer -->
  <div id="modal-backdrop" class="modal-backdrop hidden">
    <div class="modal-window">
      <div class="modal-header">
        <div id="modal-title" class="modal-title">🔮 古域魔陣</div>
        <button class="modal-close" onclick="window.uiCloseModal()">✕</button>
      </div>
      <!-- Banner Strip inside Modal -->
      <div style="position:relative;height:68px;overflow:hidden;border-bottom:1px solid rgba(251,191,36,0.3);flex-shrink:0;">
        <img src="./assets/banner.jpg" alt="Ancient Arcane Bastion Banner" style="width:100%;height:100%;object-fit:cover;object-position:center 40%;filter:brightness(0.75);" />
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(17,13,34,0.88) 0%,transparent 50%,rgba(17,13,34,0.88) 100%);display:flex;align-items:center;justify-content:space-between;padding:0 16px;">
          <div>
            <div style="font-weight:900;font-size:0.92rem;color:#fde047;text-shadow:0 2px 6px #000;">《古域魔陣：守護神殿》Ancient Arcane Bastion v1.6.0</div>
            <div style="font-size:0.72rem;color:#e2e8f0;">多章節大地圖 · 建造鎖定升級 · 四階技能樹 · 守護大本營</div>
          </div>
        </div>
      </div>
      <div id="modal-body" class="modal-body"></div>
    </div>
  </div>
</div>

<script src="./js/data.js"></script>
<script src="./js/audio.js"></script>
<script src="./js/engine.js"></script>
<script src="./js/ui.js"></script>
<script>
  window.addEventListener("load", function() {
    window.GameEngine.init();
    window.GameUI.init();
  });
</script>
</body>
</html>
'''

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("index.html updated successfully!")
