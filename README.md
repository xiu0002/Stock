# 股票交易紀錄系統

一個使用 Next.js App Router、Tailwind CSS 與 Supabase 建立的股票投資紀錄工具。介面採用簡約黑色風格，支援一般交易、定期定額與股息紀錄三種資料管理。

## 功能

- 一般交易紀錄 CRUD：新增、讀取、編輯、刪除買進/賣出紀錄。
- 定期定額紀錄 CRUD：管理扣款日、股票代號、扣款金額與買入股數。
- 股息紀錄 CRUD：管理除息日、持有股數、每股配息、預扣稅金與實領金額。
- 一般交易儀表板：
  - 總投入資金：所有買進交易總額加總。
  - 總收回資金：所有賣出交易總額加總。
  - 淨現金流：總收回資金 - 總投入資金。
- 交易總額邏輯：
  - 買進：`股數 * 單價 + 手續費 + 交易稅`
  - 賣出：`股數 * 單價 - 手續費 - 交易稅`
- 頂部導覽列：
  - 一般交易：`/`
  - 定期定額：`/dca`
  - 股息紀錄：`/dividends`

## 技術棧

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- Vercel

## 本機開發

安裝套件：

```bash
npm install
```

建立 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mffapixmykypyxcclxyp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

啟動開發伺服器：

```bash
npm run dev
```

開啟：

```text
http://localhost:3000
```

## Supabase 資料表

請到 Supabase 後台的 SQL Editor 執行下列檔案內容：

```text
supabase/trades.sql
supabase/dca_dividends.sql
```

這兩份 SQL 會建立：

- `trades`
- `dca_records`
- `dividends`

並啟用 Row Level Security 與匿名 CRUD policy。

## Vercel 部署

在 Vercel Project Settings 的 Environment Variables 加入：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mffapixmykypyxcclxyp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

新增或修改環境變數後，請重新部署：

```text
Deployments -> Redeploy
```

## 常用指令

```bash
npm run lint
npm run build
```

## 專案結構

```text
app/
  page.tsx              一般交易頁
  dca/page.tsx          定期定額頁
  dividends/page.tsx    股息紀錄頁
  layout.tsx            全域 layout 與 Navbar
lib/
  supabase.ts           Supabase client
supabase/
  trades.sql            一般交易資料表 SQL
  dca_dividends.sql     定期定額與股息資料表 SQL
```
