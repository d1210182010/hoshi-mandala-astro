# Hoshi Mandala (星曼荼羅) - Technical Documentation

## 1. 專案概述 (Overview)
**Hoshi Mandala** 是一個結合宗教美學與天文科學的視覺化專案。它展示了日本密教「星曼荼羅」的兩種視角：
1.  **2D 曼荼羅視圖 (Mandala Mode)**：依據傳統密教經典佈局，呈現幾何對稱的星宿排列。
2.  **3D 天文視圖 (Cosmos Mode)**：依據真實天文算法，呈現星體在太陽系中的即時位置。

專案核心在於這兩種視圖之間的**平滑無縫切換**，以及高解析度的梵字渲染。

## 2. 技術堆疊 (Tech Stack)
*   **Framework**: React 18 + TypeScript
*   **Build Tool**: Vite
*   **3D Engine**: Three.js + @react-three/fiber
*   **3D Helpers**: @react-three/drei (OrbitControls, Billboard, Text, etc.)
*   **Astronomy Calculation**: `astronomy-engine` (計算行星與月球交點位置)
*   **Styling**: Tailwind CSS
*   **Animation**: Framer Motion (UI), Three.js lerp (3D transitions)

## 3. 專案結構 (Project Structure)

```
src/
├── components/
│   └── Glyph.tsx          # 星體圖示元件 (處理梵字SVG、圓框、標籤、高解析度縮放)
├── data/
│   └── bodies.ts          # 【核心資料】定義所有星體的靜態參數 (2D半徑、角度、顏色、ID)
├── utils/
│   └── astronomy.ts       # 天文計算封裝 (處理日心/地心座標轉換、羅睺計都計算)
├── views/
│   └── UnifiedView.tsx    # 【核心視圖】整合 3D Canvas、相機控制、模式切換邏輯
├── App.tsx                # 入口組件
└── types/                 # TypeScript 定義
```

## 4. 核心邏輯說明 (Core Logic)

### 4.1. 統一視圖與座標插值 (Unified View & Interpolation)
專案不再使用兩個分開的 Scene，而是使用單一 `UnifiedView`。
*   每個星體 (`Body3D`) 會根據當前的 `mode` ('mandala' | 'cosmos') 計算一個 **目標座標 (`targetPos`)**。
*   **Mandala Mode**: 根據 `bodies.ts` 中的 `mandala.angle` 和 `radius` 計算極座標位置。
*   **Cosmos Mode**: 呼叫 `astronomy.ts` 取得真實天文座標 (Heliocentric 或 Geocentric)。
*   使用 `useFrame` 進行 `Vector3.lerp` 插值，實現平滑過渡。

### 4.2. 一字金輪 (Ichiji Kinrin) 的特殊處理
一字金輪 (`c_kinrin`) 在兩種模式下有截然不同的行為：
*   **2D 模式**：作為曼荼羅的中心實體，位於 `(0,0,0)`。
*   **3D 模式**：
    *   `Body3D` 會停止渲染一字金輪 (避免干擾)。
    *   由獨立的 `<KinrinBackground />` 元件渲染一個巨大的、半透明的、靜態的梵字背景。
    *   此背景位於 Canvas 之外 (HTML Layer)，因此不受 3D 相機旋轉影響，且不可互動。

### 4.3. 高解析度渲染策略 (High-Res Pre-scaling)
為解決 3D 視圖中 Zoom In 導致 `Html` 文字與 SVG 模糊的問題：
*   定義了 `RES_SCALE = 4` (僅在 3D 模式啟用)。
*   `Glyph` 元件實際渲染尺寸放大 4 倍。
*   Three.js 的 `Html` 元件 `distanceFactor` 縮小 4 倍。
*   **結果**：視覺大小不變，但貼圖解析度提高 4 倍，近距離觀察依然清晰。

### 4.4. 天文計算細節
*   **太陽系行星**：使用日心座標 (Heliocentric)。
*   **月球**：使用地心座標，並疊加在地球位置上。
*   **羅睺/計都 (Rahu/Ketu)**：計算月球軌道升/降交點的黃經，並投射在地球周圍。
*   **二十八宿/十二宮**：投射在遙遠的天球上 (Radius 90~110)。

## 5. 參數調整指南 (Configuration)

### 5.1. 調整 2D 曼荼羅的半徑與佈局
修改檔案：`src/data/bodies.ts`
搜尋關鍵字 `radius:`。目前的定版參數：
*   **第 1 層 (北斗/九曜)**: `radius: 0.7`
*   **第 2 層 (十二宮)**: `radius: 1.25`
*   **第 3 層 (二十八宿)**: `radius: 1.8`

若要旋轉某一層的起始角度，請修改 `angle` 的計算公式 (例如 `circle(i, total, offset)` 中的 offset)。

### 5.2. 調整 3D 視圖的軌道半徑
修改檔案：`src/data/bodies.ts` (針對恆星背景) 與 `src/views/UnifiedView.tsx` (針對行星)
*   **十二宮 3D 半徑**: `astronomy: { r: 90 ... }` (`bodies.ts`)
*   **二十八宿 3D 半徑**: `astronomy: { r: 110 ... }` (`bodies.ts`)
*   **月球/羅睺軌道顯示半徑**: 在 `UnifiedView.tsx` 的 `getTargetPosition` 函式中調整 `scale` 或 `dist` 變數。

### 5.3. 調整圖示大小
修改檔案：`src/views/UnifiedView.tsx`
在 `Body3D` 元件中的 `Glyph` `size` 屬性邏輯：
```typescript
size={
  (body.mandala.layer === 0 ? 120 : // 中心
   body.mandala.layer === 1 ? 40 :  // 內圈
   body.mandala.layer === 3 ? 20 :  // 外圈 (點)
   50) * currentResScale
}
```

## 6. 部署指引 (GitHub Pages)

若要部署到 GitHub Pages，請執行以下步驟：

1.  **修改 `vite.config.ts`**:
    設定 `base` 路徑。
    *   如果是專案頁面 (`username.github.io/repo-name/`)：
        ```typescript
        export default defineConfig({
          base: '/hoshimandala/', // 替換為你的 repo 名稱
          // ...
        })
        ```
    *   如果是使用者頁面 (`username.github.io`)：
        ```typescript
        base: '/',
        ```

2.  **建立部署腳本**:
    專案根目錄已包含 (或應建立) `.github/workflows/deploy.yml` (若使用 GitHub Actions) 或使用 `gh-pages` 套件。

    **手動部署 (使用 gh-pages)**:
    ```bash
    npm install gh-pages --save-dev
    ```
    在 `package.json` 加入：
    ```json
    "scripts": {
      "predeploy": "npm run build",
      "deploy": "gh-pages -d dist"
    }
    ```
    執行部署：
    ```bash
    npm run deploy
    ```

## 7. 已知注意事項
*   **SVG 來源**：確保 `/public/glyphs/` 下的 SVG 檔案命名與 `bodies.ts` 中的 `sanskritKey` 對應。
*   **字體大小**：`Glyph` 元件內有針對高解析度渲染的字體縮放邏輯，若修改 `RES_SCALE`，需檢查字體是否過大或過小。
