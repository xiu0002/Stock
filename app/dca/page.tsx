"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type DcaRecord = {
  id: string;
  date: string;
  ticker: string;
  amount: number;
  shares: number;
  created_at: string;
};

type DcaForm = {
  date: string;
  ticker: string;
  amount: string;
  shares: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): DcaForm => ({
  date: today(),
  ticker: "",
  amount: "",
  shares: "",
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

export default function DcaPage() {
  const [records, setRecords] = useState<DcaRecord[]>([]);
  const [form, setForm] = useState<DcaForm>(() => emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const summary = useMemo(() => {
    return records.reduce(
      (current, record) => {
        current.count += 1;
        current.amount += record.amount;
        current.shares += record.shares;
        return current;
      },
      { count: 0, amount: 0, shares: 0 },
    );
  }, [records]);

  async function fetchRecords() {
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from("dca_records")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(`讀取失敗：${error.message}`);
      setLoading(false);
      return;
    }

    setRecords((data ?? []) as DcaRecord[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchRecords();
  }, []);

  function updateField<K extends keyof DcaForm>(key: K, value: DcaForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function buildPayload() {
    return {
      date: form.date,
      ticker: form.ticker.trim().toUpperCase(),
      amount: toNumber(form.amount),
      shares: toNumber(form.shares),
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

    if (!payload.ticker || payload.amount < 0 || payload.shares <= 0) {
      setMessage("請確認股票代號、扣款金額與買入股數皆已正確填寫。");
      setSaving(false);
      return;
    }

    const request = editingId
      ? supabase.from("dca_records").update(payload).eq("id", editingId)
      : supabase.from("dca_records").insert(payload);

    const { error } = await request;

    if (error) {
      setMessage(`儲存失敗：${error.message}`);
      setSaving(false);
      return;
    }

    setMessage(editingId ? "定期定額紀錄已更新。" : "定期定額紀錄已新增。");
    resetForm();
    setSaving(false);
    await fetchRecords();
  }

  function handleEdit(record: DcaRecord) {
    setEditingId(record.id);
    setForm({
      date: record.date,
      ticker: record.ticker,
      amount: String(record.amount),
      shares: String(record.shares),
    });
    setMessage("正在編輯所選紀錄。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("確定要刪除這筆定期定額紀錄嗎？");

    if (!confirmed) return;

    const { error } = await supabase.from("dca_records").delete().eq("id", id);

    if (error) {
      setMessage(`刪除失敗：${error.message}`);
      return;
    }

    setRecords((current) => current.filter((record) => record.id !== id));
    setMessage("定期定額紀錄已刪除。");
  }

  return (
    <main className="min-h-screen bg-[#050608] px-4 py-6 text-[#f5f5f0] sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[#25272d] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#9ca3af]">Dollar Cost Averaging</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#f7f3e8]">定期定額紀錄</h1>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[520px]">
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3">
              <p className="text-xs text-[#8b93a1]">筆數</p>
              <p className="mt-1 text-2xl font-semibold">{summary.count}</p>
            </div>
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3">
              <p className="text-xs text-[#8b93a1]">扣款加總</p>
              <p className="mt-1 text-2xl font-semibold">{moneyFormatter.format(summary.amount)}</p>
            </div>
            <div className="border border-[#2a2d34] bg-[#101216] px-4 py-3">
              <p className="text-xs text-[#8b93a1]">股數加總</p>
              <p className="mt-1 text-2xl font-semibold">{shareFormatter.format(summary.shares)}</p>
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
                扣款日
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
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
                扣款金額
                <input
                  type="number"
                  min="0"
                  step="0.000001"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  required
                  className="h-10 border border-[#333741] bg-[#07080b] px-3 text-[#f7f3e8] outline-none transition focus:border-[#c8aa6e] focus:ring-2 focus:ring-[#c8aa6e]/25"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-[#d6d9df]">
                買入股數
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
                <p className="mt-1 text-sm text-[#8b93a1]">依扣款日與建立時間由新到舊排列</p>
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
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#111419] text-xs uppercase text-[#8b93a1]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">扣款日</th>
                    <th className="px-4 py-3 font-semibold">股票代號</th>
                    <th className="px-4 py-3 text-right font-semibold">扣款金額</th>
                    <th className="px-4 py-3 text-right font-semibold">買入股數</th>
                    <th className="px-4 py-3 text-right font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={5}>
                        載入中...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#8b93a1]" colSpan={5}>
                        尚無定期定額紀錄
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-t border-[#25272d] text-[#d6d9df] transition hover:bg-[#111419]"
                      >
                        <td className="whitespace-nowrap px-4 py-3">{record.date}</td>
                        <td className="px-4 py-3 font-semibold text-[#f7f3e8]">{record.ticker}</td>
                        <td className="px-4 py-3 text-right">
                          {moneyFormatter.format(record.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {shareFormatter.format(record.shares)}
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
