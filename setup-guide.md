# Pokopia 部署說明

## 步驟一：建立 Google Sheets

1. 開啟 [Google Sheets](https://sheets.google.com) 新增一個試算表
2. 命名為 `Pokopia 資料`（或任意名稱）

---

## 步驟二：設定 Apps Script

1. 在試算表上方點選 **延伸功能 > Apps Script**
2. 刪除預設的 `myFunction` 程式碼
3. 把 `apps-script.gs` 的內容全部貼上
4. 點選上方選單 **執行 > 執行函式 > setupSheets**
   - 第一次執行會要求授權，點「允許」
   - 執行完成後，試算表會自動建立 `items` 和 `pokemon` 兩個工作表

---

## 步驟三：匯入初始資料

### pokemon 工作表（第1列是標題，從第2列開始填）

| name | types | colors |
|------|-------|--------|
| 伊布 | 一般 | #a0a0a0 |
| 吉利蛋 | 一般 | #a0a0a0 |
| 呆殼獸 | 水,岩石 | #0094e5,#a07850 |
| 夢妖 | 超能力,妖精 | #dc78c8,#ff7eb8 |
| 小福蛋 | 一般 | #a0a0a0 |
| 差不多娃娃 | 一般 | #a0a0a0 |
| 快拳郎 | 格鬥 | #c85500 |
| 水箭龜 | 水 | #0094e5 |
| 沙奈朵 | 超能力,妖精 | #dc78c8,#ff7eb8 |
| 波皇子 | 水,毒 | #0094e5,#be78be |
| 米立龍 | 龍 | #3c64c8 |
| 索羅亞克 | 惡 | #646464 |
| 蒼炎刃鬼 | 火,鋼 | #ff3700,#96b4dc |
| 麻花犬 | 一般 | #a0a0a0 |
| 黏美龍 | 毒,龍 | #be78be,#3c64c8 |

### items 工作表欄位說明

| 欄位 | 說明 | 範例 |
|------|------|------|
| id | 唯一編號（數字） | 1 |
| name | 物品名稱 | 灑水器 |
| base | 基本價（無則留空） | 200 |
| kind | 種類（見下方） | 遺失物 |
| craftable | 可製作？ | 是 / 否 |
| mat | 製作材料 | 棉花 |
| prices_json | 特殊交易價格（JSON格式） | {"伊布":300,"水箭龜":300} |

**種類選項：** 基礎素材、掉落物、休憩家具、工具、食物、地塊、遺失物、活動限定、其他

> prices_json 只需填有**加成**的寶可夢，格式為 `{"寶可夢名":價格}` — 例如原價200但伊布願意付300，就填 `{"伊布":300}`。無加成的寶可夢留空即可。

---

## 步驟四：部署 Apps Script 為網頁應用程式

1. 在 Apps Script 頁面點選右上角 **部署 > 新增部署**
2. 設定如下：
   - 類型：**網頁應用程式**
   - 執行身份：**我（你的 Google 帳號）**
   - 誰可以存取：**所有人**
3. 點「部署」，複製產生的 **網頁應用程式 URL**

---

## 步驟五：填入 URL 到 HTML

打開 `index.html`，找到這一行：

```javascript
const API_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

把 `YOUR_APPS_SCRIPT_URL_HERE` 換成你剛複製的 URL。

---

## 步驟六：部署到靜態網站

### GitHub Pages
1. 建立一個 GitHub repo
2. 把 `index.html` 推上去
3. Settings > Pages > Source 選 `main` branch
4. 幾分鐘後即可用 `https://你的帳號.github.io/repo名稱/` 存取

### Netlify
1. 登入 [Netlify](https://netlify.com)
2. 把包含 `index.html` 的資料夾拖進去即可
3. 自動產生網址

---

## 使用說明

| 功能 | 網址 |
|------|------|
| 查詢頁面（一般使用者） | `https://你的網址/` |
| 管理員模式 | `https://你的網址/?admin` |

- 進入 `?admin` 後會彈出密碼輸入框
- 密碼預設為 `admin123`，可在 `apps-script.gs` 第4行修改
- 管理員可新增、編輯、刪除物品和寶可夢，資料直接同步到 Google Sheets

---

## 更新資料後注意事項

- Apps Script 程式碼有修改 → 需要重新部署（部署 > 管理部署 > 編輯 > 版本選「新版本」）
- Google Sheets 資料直接修改 → 不需重新部署，頁面重新整理即可看到
