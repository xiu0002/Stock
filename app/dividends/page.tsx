"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DividendRecord = {
  id: string;
  ex_dividend_date: string;
  ticker: string;
  shares_owned: number;
  dividend_per_share: number;
  tax_withheld: number;
  net_amount: number;
  created_at: string;
};

type DividendForm = {
  ex_dividend_date: string;
  ticker: string;
  shares_owned: string;
  dividend_per_share: string;
  tax_withheld: string;
  net_amount: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): DividendForm => ({
  ex_dividend_date: today(),
  ticker: "",
  shares_owned: "",
  dividend_per_share: "",
  tax_withheld: "0",
  net_amount: "",
});

const moneyFormatter = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shareFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 6,
});

function toNumber(value: string) {
  return Number(value || 0);
}

function grossDividend(record: Pick<DividendRecord, "shares_owned" | "dividend_per_share">) {
  return record.shares_owned * record.dividend_per_share;
}

export default function DividendsPage() {
  const [records, setRecords] = useState<DividendRecord[]>([]);
  const [form, setForm] = useState<DividendForm>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const summary = useMemo(() => {
    return records.reduce(
      (current, record) => {
        current.count += 1;
        current.gross += grossDividend(record);
        current.tax += record.tax_withheld;
        current.net += record.net_amount;
        return current;
      },
      { count: 0, gross: 0, tax: 0, net: 0 },
    );
  }, [records]);

  async function fetchRecords() {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("dividends")
      .select("*")
      .order("ex_dividend_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`讀取失敗：${error.message}`);
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as DividendRecord[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  function updateField<K extends keyof DividendForm>(key: K, value: DividendForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload() {
    return {
      ex_dividend_date: form.ex_dividend_date,
      ticker: form.ticker.trim().toUpperCase(),
      shares_owned: toNumber(form.shares_owned),
      dividend_per_share: toNumber(form.dividend_per_share),
      tax_withheld: toNumber(form.tax_withheld),
      net_amount: toNumber(form.net_amount),
    };
  }

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = buildPayload();

    if (
      !payload.ticker ||
      payload.shares_owned <= 0 ||
      payload.dividend_per_share < 0 ||
      payload.tax_withheld < 0 ||
      payload.net_amount < 0
    ) {
      setMessage("請確認股票代號、持有股數、每股配息、預扣稅金與實領金額皆已正確填寫。");
      setSaving(false);
      return;
    }

    const request = editingId
      ? supabase.from("dividends").update(payload).eq("id", editingId)
      : supabase.from("dividends").insert(payload);

    const { error } = await request;

    if (error) {
      setMessage(`儲存失敗：${error.message}`);
      setSaving(false);
      return;
    }

    setMessage(editingId ? "股息紀錄已更新。" : "股息紀錄已新增。");
    resetForm();
    setSaving(false);
    await fetchRecords();
  }

  function handleEdit(record: DividendRecord) {
    setEditingId(record.id);
    setForm({
      ex_dividend_date: record.ex_dividend_date,
      ticker: record.ticker,
      shares_owned: String(record.shares_owned),
      dividend_per_share: String(record.dividend_per_share),
      tax_withheld: String(record.tax_withheld),
      net_amount: String(record.net_amount),
    });
    setMessage("正在編輯所選紀錄。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("確定要刪除這筆股息紀錄嗎？");

    if (!confirmed) return;

    const { error } = await supabase.from("dividends").delete().eq("id", id);

    if (error) {
      setMessage(`刪除失敗：${error.message}`);
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== id));
    setMessage("股息紀錄已刪除。");
  }

  const previewGross = toNumber(form.shares_owned) * toNumber(form.dividend_per_share);

  return (
    <main className="min-h-screen bg-[#050608] px-4 py-6 text-[#f5f5f0] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[#25272d] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#9ca3af]">Dividend Ledger</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#f7f3e8]">股息紀錄</h1>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[440px]">
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3">
              <p className="text-xs text-[#8b93a1]">筆數</p>
              <p className="mt-1 text-2xl font-semibold">{summary.count}</p>
            </div>
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3">
              <p className="text-xs text-[#8b93a1]">實領加總</p>
              <p className="mt-1 text-2xl font-semibold">{moneyFormatter.format(summary.net)}</p>
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
                {editingId ? "修改紀錄" : "新增紀錄"}
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
                除息日
                <input
                  type="date"
                  value={form.ex_dividend_date}
                  onChange={(event) => updateField("ex_dividend_date", event.target.value)}
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
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  持有股數
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.shares_owned}
                    onChange={(event) => updateField("shares_owned", event.target.value)}
                    required
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  每股配息
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.dividend_per_share}
                    onChange={(event) => updateField("dividend_per_share", event.target.value)}
                    required
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  預扣稅金
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.tax_withheld}
                    onChange={(event) => updateField("tax_withheld", event.target.value)}
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                  實領金額
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={form.net_amount}
                    onChange={(event) => updateField("net_amount", event.target.value)}
                    required
                    className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                  />
                </label>
              </div>
              <div className="border border-[#333741] bg-[#111419] px-3 py-2 text-sm">
                <span className="text-[#9ca3af]">稅前股利：</span>
                <span className="font-semibold text-[#f7f3e8]">
                  {moneyFormatter.format(previewGross)}
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
                <h2 className="text-lg font-semibold text-[#f7f3e8]">歷史紀錄</h2>
                <p className="mt-1 text-sm text-[#8b93a1]">依除息日與建立時間由新到舊排列</p>
              </div>
              <button
                type="button"
                onClick={fetchRecords}
                title="重新整理"
                className="inline-flex h-10 items-center justify-center gap-2 border border-[#333741] px-3 text-sm font-medium text-[#d6d9df] transition hover:border-[#f7f3e8] hover:text-[#f7f3e8]"
              >
                <RefreshCw size={16} />
                重新整理
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-[#111419] text-xs uppercase text-[#8b93a1]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">除息日</th>
                    <th className="px-4 py-3 font-semibold">股票代號</th>
                    <th className="px-4 py-3 text-right font-semibold">持有股數</th>
                    <th className="px-4 py-3 text-right font-semibold">每股配息</th>
                    <th className="px-4 py-3 text-right font-semibold">稅前股利</th>
                    <th className="px-4 py-3 text-right font-semibold">預扣稅金</th>
                    <th className="px-4 py-3 text-right font-semibold">實領金額</th>
                    <th className="px-4 py-3 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={8}>
                        載入中...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={8}>
                        尚無股息紀錄
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-[#25272d] text-[#d6d9df] transition hover:bg-[#111419]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">{record.ex_dividend_date}</td>
                        <td className="px-4 py-3 font-semibold text-[#f7f3e8]">{record.ticker}</td>
                        <td className="px-4 py-3 text-right">
                          {shareFormatter.format(record.shares_owned)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {moneyFormatter.format(record.dividend_per_share)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {moneyFormatter.format(grossDividend(record))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {moneyFormatter.format(record.tax_withheld)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#f7f3e8]">
                          {moneyFormatter.format(record.net_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(record)}
                              title="編輯/修改"
                              className="inline-flex h-9 items-center justify-center gap-1 border border-[#333741] px-2.5 text-sm text-[#d6d9df] transition hover:border-[#f7f3e8] hover:text-[#f7f3e8]"
                            >
                              <Pencil size={15} />
                              編輯
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
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
