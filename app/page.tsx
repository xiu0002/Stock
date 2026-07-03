"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type TradeAction = "買進" | "賣出";

type Trade = {
  id: string;
  trade_date: string;
  ticker: string;
  action: TradeAction;
  shares: number;
  price: number;
  fee: number;
  tax: number;
  created_at: string;
};

type TradeForm = {
  trade_date: string;
  ticker: string;
  action: TradeAction;
  shares: string;
  price: string;
  fee: string;
  tax: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): TradeForm => ({
  trade_date: today(),
  ticker: "",
  action: "買進",
  shares: "",
  price: "",
  fee: "0",
  tax: "0",
});

const numberFormatter = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 6,
});

function toNumber(value: string) {
  return Number(value || 0);
}

function totalAmount(trade: Pick<Trade, "shares" | "price" | "fee" | "tax">) {
  return trade.shares * trade.price + trade.fee + trade.tax;
}

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState<TradeForm>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const portfolioSummary = useMemo(() => {
    return trades.reduce(
      (summary, trade) => {
        summary.count += 1;
        summary.total += totalAmount(trade);
        return summary;
      },
      { count: 0, total: 0 },
    );
  }, [trades]);

  async function fetchTrades() {
    if (!isSupabaseConfigured) {
      setMessage("尚未設定 Supabase 環境變數，請在 Vercel 加入 Project URL 與 Publishable key。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`讀取失敗：${error.message}`);
      setLoading(false);
      return;
    }

    setTrades((data ?? []) as Trade[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchTrades();
  }, []);

  function updateField<K extends keyof TradeForm>(key: K, value: TradeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload() {
    return {
      trade_date: form.trade_date,
      ticker: form.ticker.trim().toUpperCase(),
      action: form.action,
      shares: toNumber(form.shares),
      price: toNumber(form.price),
      fee: toNumber(form.fee),
      tax: toNumber(form.tax),
    };
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setMessage("尚未設定 Supabase 環境變數，無法儲存交易紀錄。");
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = buildPayload();

    if (!payload.ticker || payload.shares <= 0 || payload.price < 0) {
      setMessage("請確認股票代號、股數與成交單價皆已正確填寫。");
      setSaving(false);
      return;
    }

    const request = editingId
      ? supabase.from("trades").update(payload).eq("id", editingId)
      : supabase.from("trades").insert(payload);

    const { error } = await request;

    if (error) {
      setMessage(`儲存失敗：${error.message}`);
      setSaving(false);
      return;
    }

    setMessage(editingId ? "交易紀錄已更新。" : "交易紀錄已新增。");
    resetForm();
    setSaving(false);
    await fetchTrades();
  }

  function handleEdit(trade: Trade) {
    setEditingId(trade.id);
    setForm({
      trade_date: trade.trade_date,
      ticker: trade.ticker,
      action: trade.action,
      shares: String(trade.shares),
      price: String(trade.price),
      fee: String(trade.fee),
      tax: String(trade.tax),
    });
    setMessage("正在編輯所選紀錄。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured) {
      setMessage("尚未設定 Supabase 環境變數，無法刪除交易紀錄。");
      return;
    }

    const confirmed = window.confirm("確定要刪除這筆交易紀錄嗎？");

    if (!confirmed) return;

    setMessage(null);
    const { error } = await supabase.from("trades").delete().eq("id", id);

    if (error) {
      setMessage(`刪除失敗：${error.message}`);
      return;
    }

    setTrades((current) => current.filter((trade) => trade.id !== id));
    setMessage("交易紀錄已刪除。");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-4 py-6 text-[#f5f5f0] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[#25272d] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#9ca3af]">Stock Trade Journal</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#f7f3e8]">
              股票交易紀錄系統
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-80">
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3 shadow-[0_14px_45px_rgba(0,0,0,0.28)]">
              <p className="text-xs text-[#8b93a1]">紀錄筆數</p>
              <p className="mt-1 text-2xl font-semibold text-[#f7f3e8]">
                {portfolioSummary.count}
              </p>
            </div>
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3 shadow-[0_14px_45px_rgba(0,0,0,0.28)]">
              <p className="text-xs text-[#8b93a1]">總額加總</p>
              <p className="mt-1 text-2xl font-semibold text-[#f7f3e8]">
                {numberFormatter.format(portfolioSummary.total)}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="h-fit border border-[#2a2d34] bg-[#0d0f13] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)]"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#f7f3e8]">
                {editingId ? "修改交易" : "新增交易"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  title="取消編輯"
                  className="inline-flex h-9 w-9 items-center justify-center border border-[#333741] text-[#b8bec8] transition hover:border-[#f7f3e8] hover:text-[#f7f3e8]"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                交易日期
                <input
                  type="date"
                  value={form.trade_date}
                  onChange={(event) => updateField("trade_date", event.target.value)}
                  required
                  className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                股票代號
                <input
                  type="text"
                  value={form.ticker}
                  onChange={(event) => updateField("ticker", event.target.value)}
                  required
                  className="h-10 border border-[#333741] bg-[#07080b] px-3 uppercase text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                買進/賣出
                <select
                  value={form.action}
                  onChange={(event) => updateField("action", event.target.value as TradeAction)}
                  className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                >
                  <option value="買進">買進</option>
                  <option value="賣出">賣出</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  股數
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.shares}
                    onChange={(event) => updateField("shares", event.target.value)}
                    required
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  成交單價
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.price}
                    onChange={(event) => updateField("price", event.target.value)}
                    required
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  手續費
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.fee}
                    onChange={(event) => updateField("fee", event.target.value)}
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>

                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  交易稅
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.tax}
                    onChange={(event) => updateField("tax", event.target.value)}
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
              </div>

              <div className="border border-[#333741] bg-[#111419] px-3 py-2 text-sm">
                <span className="text-[#9ca3af]">本筆總額：</span>
                <span className="font-semibold text-[#f7f3e8]">
                  {numberFormatter.format(
                    totalAmount({
                      shares: toNumber(form.shares),
                      price: toNumber(form.price),
                      fee: toNumber(form.fee),
                      tax: toNumber(form.tax),
                    }),
                  )}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 bg-[#f7f3e8] px-4 font-semibold text-[#07080b] transition hover:bg-[#c8aa6e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {editingId ? <Check size={18} /> : <Plus size={18} />}
                {saving ? "儲存中" : editingId ? "更新紀錄" : "新增紀錄"}
              </button>
            </div>

            {message && (
              <p className="mt-4 border border-[#333741] bg-[#111419] px-3 py-2 text-sm text-[#d6d9df]">
                {message}
              </p>
            )}
          </form>

          <section className="border border-[#2a2d34] bg-[#0d0f13] shadow-[0_24px_80px_rgba(0,0,0,0.36)]">
            <div className="flex flex-col gap-3 border-b border-[#25272d] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#f7f3e8]">歷史交易紀錄</h2>
                <p className="mt-1 text-sm text-[#8b93a1]">依交易日期與建立時間由新到舊排列</p>
              </div>
              <button
                type="button"
                onClick={fetchTrades}
                title="重新整理"
                className="inline-flex h-10 items-center justify-center gap-2 border border-[#333741] px-3 text-sm font-medium text-[#d6d9df] transition hover:border-[#f7f3e8] hover:text-[#f7f3e8]"
              >
                <RefreshCw size={16} />
                重新整理
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-[#111419] text-xs uppercase text-[#8b93a1]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">交易日期</th>
                    <th className="px-4 py-3 font-semibold">股票代號</th>
                    <th className="px-4 py-3 font-semibold">動作</th>
                    <th className="px-4 py-3 text-right font-semibold">股數</th>
                    <th className="px-4 py-3 text-right font-semibold">單價</th>
                    <th className="px-4 py-3 text-right font-semibold">手續費</th>
                    <th className="px-4 py-3 text-right font-semibold">交易稅</th>
                    <th className="px-4 py-3 text-right font-semibold">總額</th>
                    <th className="px-4 py-3 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={9}>
                        載入中...
                      </td>
                    </tr>
                  ) : trades.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={9}>
                        尚無交易紀錄
                      </td>
                    </tr>
                  ) : (
                    trades.map((trade) => (
                      <tr
                        key={trade.id}
                        className="border-t border-[#25272d] text-[#d6d9df] transition hover:bg-[#111419]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">{trade.trade_date}</td>
                        <td className="px-4 py-3 font-semibold text-[#f7f3e8]">{trade.ticker}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              trade.action === "買進"
                                ? "inline-flex min-w-12 justify-center border border-[#1f8a5b]/35 bg-[#10241c] px-2 py-1 text-xs font-medium text-[#74d3a2]"
                                : "inline-flex min-w-12 justify-center border border-[#c8aa6e]/35 bg-[#2a2112] px-2 py-1 text-xs font-medium text-[#e6c983]"
                            }
                          >
                            {trade.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {compactNumberFormatter.format(trade.shares)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {numberFormatter.format(trade.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {numberFormatter.format(trade.fee)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {numberFormatter.format(trade.tax)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#f7f3e8]">
                          {numberFormatter.format(totalAmount(trade))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(trade)}
                              title="編輯/修改"
                              className="inline-flex h-9 items-center justify-center gap-1 border border-[#333741] px-2.5 text-sm text-[#d6d9df] transition hover:border-[#f7f3e8] hover:text-[#f7f3e8]"
                            >
                              <Pencil size={15} />
                              編輯
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(trade.id)}
                              title="刪除"
                              className="inline-flex h-9 items-center justify-center gap-1 border border-[#6f2b35] px-2.5 text-sm text-[#f08a98] transition hover:border-[#ffb4be] hover:text-[#ffb4be]"
                            >
                              <Trash2 size={15} />
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
