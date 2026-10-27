"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Reservation } from "@/lib/domain/reservation";
import { SITE, SOURCE_LABELS, STATUSES, TIERS, getTier } from "@/lib/config";
import type { Status } from "@/lib/config";
import { computeStats } from "@/lib/domain/stats";
import { nextStatuses } from "@/lib/domain/status";
import {
  formatHour, formatJalaliShort, formatSeats, formatTimeRange, formatToman, normalizeDigits, toPersianDigits,
} from "@/lib/format";
import { businessNow } from "@/lib/time";
import { isoAddDays } from "@/lib/time";
import AdminReservationForm from "./AdminReservationForm";

const statusLabel = (s: Status) => STATUSES.find((x) => x.id === s)?.label ?? s;
type FormState = null | { initial?: Reservation };

const CONFIRM: Partial<Record<Status, string>> = {
  cancelled: "این رزرو لغو شود؟ سیستم‌ها برای مشتریان دیگر آزاد می‌شوند.",
  no_show: "عدم حضور مشتری ثبت شود؟",
};

export default function AdminDashboard({ user, role }: { user: string; role: "admin" | "manager" }) {
  const [today] = useState(() => businessNow().date);
  const [date, setDate] = useState(today);
  const [scope, setScope] = useState<"day" | "all">("day");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>(null);
  const [reload, setReload] = useState(0);

  const toLogin = useCallback(() => {
    window.location.href = "/admin/login";
  }, []);
  const refresh = () => setReload((n) => n + 1);

  // Searching looks across all dates; otherwise the list is limited to the chosen day (or all dates).
  const searching = q.trim() !== "";
  const queryDate = scope === "day" && !searching ? date : "";

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/admin/reservations${queryDate ? `?date=${queryDate}` : ""}`, { signal: ctrl.signal })
      .then((r) => {
        if (r.status === 401) {
          toLogin();
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.error) setError(d.error);
        else {
          setList((d.reservations ?? []) as Reservation[]);
          setError("");
        }
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError("دریافت رزروها انجام نشد.");
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [queryDate, reload, toLogin]);

  const visible = useMemo(() => {
    const needle = normalizeDigits(q.trim()).toLowerCase();
    return list.filter(
      (r) =>
        (tierFilter === "all" || r.tier === tierFilter) &&
        (statusFilter === "all" || r.status === statusFilter) &&
        (!needle || r.name.toLowerCase().includes(needle) || r.phone.includes(needle) || r.serial.includes(needle))
    );
  }, [list, tierFilter, statusFilter, q]);

  const stats = useMemo(() => computeStats(visible, businessNow()), [visible]);

  async function call(url: string, init: RequestInit) {
    setError("");
    const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
    if (res.status === 401) return toLogin();
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setError(data.error ?? "عملیات انجام نشد.");
    refresh();
  }

  const setStatus = (r: Reservation, status: Status) => {
    const msg = CONFIRM[status];
    if (msg && !window.confirm(msg)) return;
    void call(`/api/admin/reservations/${r.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  };

  const remove = (r: Reservation) => {
    if (!window.confirm(`رزرو ${toPersianDigits(r.serial)} (${r.name}) برای همیشه حذف شود؟ این کار قابل بازگشت نیست. برای نگه‌داشتن سابقه، وضعیت را «لغو شده» بگذارید.`)) return;
    void call(`/api/admin/reservations/${r.id}`, { method: "DELETE" });
  };

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    toLogin();
  }

  const showDate = scope === "all" || searching;

  return (
    <div className="adm-page">
      <header className="adm-top">
        <div>
          <h1>مدیریت رزروها</h1>
          <p>
            {user} <span className={`adm-role ${role}`}>{role === "admin" ? "مدیر کل" : "مدیر سالن"}</span>
          </p>
        </div>
        <div className="adm-top-actions">
          <a className="adm-btn" href="/" target="_blank" rel="noreferrer">مشاهده سایت</a>
          <button className="adm-btn" onClick={logout}>خروج</button>
        </div>
      </header>

      <section className="adm-stats" aria-label="آمار لیست نمایش‌داده‌شده">
        <div><strong>{toPersianDigits(stats.total)}</strong><span>کل رزروها</span></div>
        <div><strong>{toPersianDigits(stats.upcoming)}</strong><span>در انتظار حضور</span></div>
        <div><strong>{toPersianDigits(stats.checkedIn)}</strong><span>حاضر شده</span></div>
        <div><strong>{toPersianDigits(stats.completed)}</strong><span>پایان‌یافته</span></div>
        <div><strong>{toPersianDigits(stats.cancelled)}</strong><span>لغو شده</span></div>
        <div><strong>{toPersianDigits(stats.noShow)}</strong><span>عدم حضور</span></div>
        <div className="wide"><strong>{formatToman(stats.expectedRevenue)}</strong><span>درآمد مورد انتظار (بدون لغو و عدم حضور)</span></div>
      </section>

      <section className="adm-toolbar">
        <div className="adm-date">
          <button className="adm-btn" onClick={() => { setScope("day"); setDate(isoAddDays(date, -1)); }} aria-label="روز قبل">→</button>
          <input type="date" value={date} onChange={(e) => { setScope("day"); setDate(e.target.value || today); }} aria-label="تاریخ" dir="ltr" />
          <button className="adm-btn" onClick={() => { setScope("day"); setDate(isoAddDays(date, 1)); }} aria-label="روز بعد">←</button>
          <button className="adm-btn" onClick={() => { setScope("day"); setDate(today); }} disabled={scope === "day" && date === today}>امروز</button>
          <button className={`adm-btn${scope === "all" ? " primary" : ""}`} onClick={() => setScope(scope === "all" ? "day" : "all")} aria-pressed={scope === "all"}>
            همه تاریخ‌ها
          </button>
        </div>
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} aria-label="نوع سیستم">
          <option value="all">همه سیستم‌ها</option>
          {TIERS.map((t) => (
            <option key={t.id} value={t.id}>{t.nameFa}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="وضعیت">
          <option value="all">همه وضعیت‌ها</option>
          {STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input className="adm-search" placeholder="جستجوی نام، تلفن یا کد رزرو" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
        <button className="adm-btn primary" onClick={() => setForm({})}>+ ثبت رزرو تلفنی</button>
      </section>

      {searching && <p className="adm-note-line">جستجو در همه تاریخ‌ها انجام می‌شود.</p>}
      {error && <p className="adm-error" role="alert">{error}</p>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>کد</th>
              <th>زمان</th>
              <th>سیستم</th>
              <th>مشتری</th>
              <th>منبع</th>
              <th>وضعیت</th>
              <th>مبلغ</th>
              <th aria-label="عملیات" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className={r.status === "cancelled" || r.status === "no_show" ? "dim" : ""}>
                <td><strong className="ltr adm-serial">{toPersianDigits(r.serial)}</strong></td>
                <td>
                  {showDate && <small className="adm-date-line">{formatJalaliShort(r.date)}</small>}
                  <strong>{formatTimeRange(r.startHour, r.hours)}</strong>
                  <small>{toPersianDigits(r.hours)} ساعت</small>
                </td>
                <td>
                  <strong><span className="ltr">{getTier(r.tier).nameEn}</span></strong>
                  <small>سیستم {formatSeats(r.seats)}</small>
                </td>
                <td>
                  <strong>{r.name}</strong>
                  {r.phone ? <a href={`tel:${r.phone}`} className="ltr">{r.phone}</a> : <small>بدون تلفن</small>}
                  {r.note && <small className="adm-note">{r.note}</small>}
                </td>
                <td>
                  <span className={`adm-chip ${r.source}`}>{SOURCE_LABELS[r.source]}</span>
                  {r.createdBy && <small>{r.createdBy}</small>}
                </td>
                <td>
                  <select className={`adm-status ${r.status}`} value={r.status} onChange={(e) => setStatus(r, e.target.value as Status)} aria-label={`وضعیت رزرو ${toPersianDigits(r.serial)}`}>
                    <option value={r.status}>{statusLabel(r.status)}</option>
                    {nextStatuses(r.status).map((s) => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </td>
                <td>
                  {formatToman(r.total)}
                  {r.pricingEstimated && <small>تخمینی (رزرو قدیمی)</small>}
                </td>
                <td className="adm-actions">
                  <button className="adm-btn" onClick={() => setForm({ initial: r })} disabled={r.status === "cancelled" || r.status === "completed" || r.status === "no_show"}>
                    ویرایش
                  </button>
                  {role === "admin" && <button className="adm-btn danger" onClick={() => remove(r)}>حذف</button>}
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={8} className="adm-empty">
                  {list.length === 0 ? "رزروی برای این بازه ثبت نشده است. وقتی مشتری تماس گرفت از «ثبت رزرو تلفنی» استفاده کنید." : "رزروی با این فیلترها پیدا نشد."}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="adm-empty">در حال بارگذاری…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="adm-foot">
        ساعات رزرو: {formatHour(SITE.openHour)} تا {formatHour(SITE.closeHour)}. رزرو لغو شده، عدم حضور و پایان‌یافته سیستم را آزاد می‌کند.
      </p>

      {form && (
        <AdminReservationForm
          initial={form.initial}
          defaultDate={date}
          onClose={() => setForm(null)}
          onUnauthorized={toLogin}
          onSaved={() => {
            setForm(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
