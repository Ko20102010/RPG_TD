# 🏰 古域魔陣：守護神殿 (Ancient Arcane Bastion) v1.5.0
## Ancient Arcane Bastion — GitHub Pages Repository Package (v1.5.0)

一款結合**「踏上陣位：先選類型 ➔ 再選魔塔 ➔ 即時查看簡介」**直覺操作與**「4 階樹狀星盤技能科技樹 + 古代魔法 RPG 長線養成」**的 HTML5 守城遊戲，專為手機全螢幕 (PWA / WebApp) 及電腦瀏覽器打造。

---

## ✨ v1.5.0 核心系統升級亮點

1. **踏陣三段式分類選塔 & 即時【簡介】檢視器 (Type-First Selection & Live Inspector)**：
   - **第一步（按類型選擇）**：踏上陣位或開啟建築選單時，可先切換 **⚡ 元素魔塔**、**☄️ 破甲重塔**、**🛡️ 派兵兵營** 三大戰術類型。
   - **第二步（顯示該類型旗下建築）**：自動篩選並展示該類別專屬魔塔或兵營。
   - **第三步（即時動態簡介面板）**：點擊任意類型或建築，下方【簡介】區塊即時顯示所選項目的詳細定位、技能說明、攻擊/射程/兵種生命等完整數據，並支援一鍵解鎖或駐守。
2. **4 階樹狀「星盤技能科技樹」重製 (4-Tier Hierarchical Skill Tree)**：
   - 三大專精分支：**⚔️ 戰術主宰樹**、**🪙 煉金經濟樹**、**🏰 要塞神工樹**。
   - 具備真實 **SVG 能量導管連線** 與 **上下階前置解鎖條件**（第 1 階根基升至 Lv.3 解鎖第 2 階左右分支 ➔ 第 3 階進階專精 ➔ 第 4 階終極奧義 Keystone）。
   - 點擊任意技能節點即可在下方檢視器查看前置狀態、技能簡介與下一級成長預覽。
3. **守護大本營與雙重血量防線 (Citadel Town Hall & Dual HP Bars)**：
   - 內城矗立【守護大本營】，內建遠古重裝弩砲；頂部 HUD 即時顯示【城防耐久】與【守護大本營】雙動態血量條，以及三路即時軍情雷達。
4. **全角色與 11 種魔物具象化 2.5D 立體繪製 (Procedural Character & Monster Figures)**：
   - 所有英雄、友軍部隊與 11 種魔物均採用多部件立體造型與行走動畫繪製，完全告別單調圓圈。

---

## 🚀 GitHub Pages 快速部署指南

1. **上傳至 GitHub 倉庫**：
   - 將 `ancient_arcane_bastion_v1.5.0_github.zip` 解壓縮後的所有檔案（`index.html`, `css/`, `js/`, `assets/`, `manifest.json`, `.nojekyll`, `README.md`, `DEVELOPMENT_PLAN_v1.5.0.md`）上傳至 GitHub Repository 根目錄。
2. **開啟 GitHub Pages**：
   - 前往 **Settings** ➔ **Pages**，在 **Build and deployment** 選擇 `Deploy from a branch`，分支選擇 `main` / `/(root)` 並點擊 **Save**。
3. **手機與電腦暢玩**：
   - 部署完成後開啟 `https://<你的帳號>.github.io/<倉庫名稱>/`，手機瀏覽器可點擊「加入主畫面」全螢幕遊玩！
