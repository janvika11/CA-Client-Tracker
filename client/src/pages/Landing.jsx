import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  FileText,
  Flag,
  Grid3X3,
  Layers,
  Menu,
  Upload,
  X,
  PieChart,
  Sparkles,
} from 'lucide-react';

const BRAND_GREEN = '#059669';
const HERO_NAVY = '#0f172a';

function LogoBox({ size = 34, rounded = 'rounded-[7px]', className = '' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold tracking-tight text-white ${rounded} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35, backgroundColor: BRAND_GREEN }}
      aria-hidden
    >
      CA
    </div>
  );
}

function MatrixCell({ type }) {
  const base =
    'h-[18px] w-6 shrink-0 rounded-[3px]';
  if (type === 'paid') return <div className={base} style={{ backgroundColor: '#059669' }} />;
  if (type === 'partial') return <div className={base} style={{ backgroundColor: '#d97706' }} />;
  if (type === 'overdue') return <div className={base} style={{ backgroundColor: '#dc2626' }} />;
  return (
    <div
      className={`${base} border border-solid`}
      style={{ backgroundColor: '#1e3a5f', borderColor: '#334155' }}
    />
  );
}

const MATRIX_ROWS = [
  {
    name: 'Acme Mfg Ltd',
    cells: ['paid', 'paid', 'paid', 'paid', 'paid', 'partial', 'pending', 'pending', 'pending'],
    amt: '₹0',
    amtColor: '#059669',
  },
  {
    name: 'TechStart Pvt',
    cells: ['paid', 'paid', 'partial', 'overdue', 'overdue', 'overdue', 'pending', 'pending', 'pending'],
    amt: '₹18,500',
    amtColor: '#dc2626',
  },
  {
    name: 'Retail Hub',
    cells: ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'pending'],
    amt: '₹0',
    amtColor: '#059669',
  },
  {
    name: 'Green Energy',
    cells: ['paid', 'partial', 'overdue', 'overdue', 'overdue', 'overdue', 'pending', 'pending', 'pending'],
    amt: '₹54,000',
    amtColor: '#dc2626',
  },
  {
    name: 'Apex Healthcare',
    cells: ['paid', 'paid', 'paid', 'paid', 'partial', 'pending', 'pending', 'pending', 'pending'],
    amt: '₹6,000',
    amtColor: '#d97706',
  },
];

const MONTHS_PREVIEW = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Landing() {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-[#0f172a] antialiased">
      {/* ——— NAVBAR ——— */}
      <header
        className="relative sticky top-0 z-10 border-b border-[#e2e8f0] bg-white"
        style={{ borderBottomWidth: '0.5px' }}
      >
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoBox size={34} rounded="rounded-[7px]" />
            <span className="text-base font-semibold" style={{ color: HERO_NAVY }}>
              CA Tracker
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-[13px] text-[#64748b] transition hover:text-[#0f172a]">
              Features
            </a>
            <a href="#how-it-works" className="text-[13px] text-[#64748b] transition hover:text-[#0f172a]">
              How it works
            </a>
            <a href="#for-cas" className="text-[13px] text-[#64748b] transition hover:text-[#0f172a]">
              For CAs
            </a>
          </nav>

          <div className="flex items-center gap-3 md:gap-4">
            <Link to="/login" className="hidden text-[13px] font-medium text-[#64748b] sm:inline sm:hover:text-[#0f172a]">
              Sign in
            </Link>
            <Link
              to="/login"
              className="hidden rounded-[7px] px-[18px] py-2 text-[13px] font-semibold text-white sm:inline-block"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              Get started free
            </Link>

            <button
              type="button"
              className="inline-flex rounded-lg p-2 text-[#0f172a] md:hidden"
              aria-expanded={mobileNav}
              aria-label="Open menu"
              onClick={() => setMobileNav(true)}
            >
              <Menu className="h-6 w-6" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {mobileNav ? (
          <div
            className="fixed inset-0 z-[100] bg-[#0f172a]/40 md:hidden"
            role="presentation"
            onClick={() => setMobileNav(false)}
          />
        ) : null}
        {mobileNav ? (
          <div className="absolute right-4 top-[60px] z-[101] flex w-[min(280px,calc(100vw-32px))] flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-xl md:hidden">
            <button
              type="button"
              className="absolute right-3 top-3 rounded-md p-1 text-[#64748b]"
              onClick={() => setMobileNav(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <a href="#features" className="py-3 text-[13px] text-[#64748b]" onClick={() => setMobileNav(false)}>
              Features
            </a>
            <a href="#how-it-works" className="py-3 text-[13px] text-[#64748b]" onClick={() => setMobileNav(false)}>
              How it works
            </a>
            <a href="#for-cas" className="py-3 text-[13px] text-[#64748b]" onClick={() => setMobileNav(false)}>
              For CAs
            </a>
            <hr className="my-2 border-[#e2e8f0]" />
            <Link to="/login" className="py-3 text-[13px] font-medium text-[#64748b]" onClick={() => setMobileNav(false)}>
              Sign in
            </Link>
            <Link
              to="/login"
              className="mt-1 rounded-[7px] py-2.5 text-center text-[13px] font-semibold text-white"
              style={{ backgroundColor: BRAND_GREEN }}
              onClick={() => setMobileNav(false)}
            >
              Get started free
            </Link>
          </div>
        ) : null}
      </header>

      {/* ——— HERO ——— */}
      <section
        className="relative overflow-hidden pb-16 pt-14 sm:pt-16 sm:pb-20"
        style={{
          backgroundColor: HERO_NAVY,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      >
        <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center px-4 text-center sm:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-[20px] border px-[14px] py-[5px] text-[13px] font-medium"
            style={{
              backgroundColor: 'rgba(5,150,105,0.15)',
              color: '#34d399',
              borderColor: 'rgba(52,211,153,0.3)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#34d399' }} />
            CA Practice Management Platform
          </div>

          <h1 className="mt-8 text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[34px] md:text-[36px]">
            Know what every client owes,
            <br />
            <span style={{ color: '#34d399' }}>every month.</span>
          </h1>

          <p className="mt-5 max-w-[420px] text-[14px] leading-relaxed text-[#94a3b8] sm:text-[15px]">
            One workspace for FY billing matrices, FIFO payments, and PDF-ready statements — built around the April–March
            year every Indian CA follows.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg px-8 py-3 text-[14px] font-semibold text-white"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              Get started free →
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-lg border px-8 py-3 text-[14px] font-semibold text-white transition hover:bg-white/5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.15)',
              }}
            >
              See how it works
            </a>
          </div>

          <div
            className="mx-auto mt-12 flex max-w-xl flex-col divide-y divide-[rgba(255,255,255,0.1)] overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] px-6 py-5 sm:max-w-3xl sm:flex-row sm:divide-x sm:divide-y-0 md:justify-between"
            style={{ borderWidth: '0.5px' }}
          >
            {[
              ['Auto', 'Billing generation'],
              ['FY', 'Matrix view'],
              ['PDF', 'Statements'],
              ['FIFO', 'Payments'],
            ].map(([a, b]) => (
              <div key={b} className="flex flex-1 flex-col items-center justify-center py-5 text-center first:pt-5 sm:flex-none sm:py-6 sm:last:pb-6">
                <span className="text-[14px] font-bold leading-none sm:text-[15px]" style={{ color: '#34d399' }}>
                  {a}
                </span>
                <span className="mt-2 text-[12px] sm:text-[13px]" style={{ color: '#64748b' }}>
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FY MATRIX PREVIEW (overlap) ——— */}
      <div
        id="how-it-works"
        className="relative z-[2] mx-4 mb-0 -mt-7 rounded-xl border px-4 py-4 sm:mx-8 sm:p-4"
        style={{
          marginTop: '-28px',
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          borderWidth: '0.5px',
          borderRadius: '12px',
        }}
      >
        <div className="mx-auto max-w-[900px] overflow-x-auto pb-2">
          <div className="flex min-w-[620px] items-center justify-between gap-4 px-1">
            <p className="text-[12px]" style={{ color: '#94a3b8' }}>
              FY Billing Matrix — live preview
            </p>
            <span
              className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399' }}
            >
              FY 2025-26
            </span>
          </div>

          <div className="mt-3 min-w-[620px] pr-2">
            <div className="flex border-b pb-2" style={{ borderColor: '#334155' }}>
              <div className="w-[86px] shrink-0" />
              {MONTHS_PREVIEW.map((m) => (
                <div key={m} className="w-6 shrink-0 text-center text-[9px] uppercase" style={{ color: '#475569' }}>
                  {m}
                </div>
              ))}
              <div className="w-[72px] shrink-0 text-right text-[9px] uppercase" style={{ color: '#475569' }}>
                Out.
              </div>
            </div>

            {MATRIX_ROWS.map((row) => (
              <div key={row.name} className="flex items-center gap-1 border-b py-1.5" style={{ borderColor: '#334155' }}>
                <div
                  className="w-[86px] shrink-0 truncate pr-2 text-[10px] font-medium text-[#e2e8f0] sm:text-[11px]"
                  title={row.name}
                >
                  {row.name}
                </div>
                <div className="flex shrink-0 gap-1">
                  {row.cells.map((c, idx) => (
                    <MatrixCell key={`${row.name}-${idx}`} type={c} />
                  ))}
                </div>
                <div className="w-[72px] shrink-0 text-right text-[11px] font-semibold tabular-nums" style={{ color: row.amtColor }}>
                  {row.amt}
                </div>
              </div>
            ))}

            <div className="mt-4 flex flex-wrap gap-4 px-1 text-[10px]" style={{ color: '#94a3b8' }}>
              <span className="inline-flex items-center gap-2">
                <MatrixCell type="paid" />
                Paid
              </span>
              <span className="inline-flex items-center gap-2">
                <MatrixCell type="partial" />
                Partial
              </span>
              <span className="inline-flex items-center gap-2">
                <MatrixCell type="overdue" />
                Overdue
              </span>
              <span className="inline-flex items-center gap-2">
                <MatrixCell type="pending" />
                Pending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ——— PAIN POINTS ——— */}
      <section className="bg-[#f8fafc] px-4 sm:px-8" style={{ paddingTop: '56px', paddingBottom: '56px' }}>
        <div className="mx-auto max-w-6xl px-2 text-center md:px-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: BRAND_GREEN }}>
            The problem
          </p>
          <h2 className="mt-2 text-[24px] font-bold tracking-tight sm:text-[26px]" style={{ color: HERO_NAVY }}>
            Sound familiar?
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px]" style={{ color: '#475569' }}>
            Every CA practice faces these same billing headaches
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {[
              [
                '01',
                "Can't see who owes what",
                'Each service sits in its own sheet. Cross-referencing GST, TDS, ITR every month wastes hours.',
              ],
              [
                '02',
                'Carry-forwards go invisible',
                "April's unpaid fee is forgotten by July. Old dues quietly accumulate until you happen to look.",
              ],
              [
                '03',
                'Custom pricing forgotten',
                'Client A pays ₹1,500, Client B pays ₹3,500. You rely on memory and old emails to invoice correctly.',
              ],
              [
                '04',
                'No view of the full year',
                "Can't answer “How is FY 25–26 tracking vs last year?” without spending an hour in Excel.",
              ],
            ].map(([num, title, desc]) => (
              <div
                key={num}
                className="rounded-xl border bg-white p-5 text-left"
                style={{
                  borderColor: '#e2e8f0',
                  borderWidth: '0.5px',
                  borderRadius: '12px',
                  borderLeftWidth: '3px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: '#fca5a5',
                }}
              >
                <span className="text-[13px] font-bold text-red-500">{num}</span>
                <h3 className="mt-3 text-[16px] font-semibold text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#475569]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— FEATURES ——— */}
      <section id="features" className="bg-white px-4 py-14 sm:px-8 md:py-14" style={{ paddingTop: '56px', paddingBottom: '56px' }}>
        <div className="mx-auto max-w-6xl px-2 text-center md:px-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: BRAND_GREEN }}>
            Features
          </p>
          <h2 className="mt-2 text-[26px] font-bold tracking-tight text-[#0f172a]">Everything your practice needs</h2>
          <p className="mt-2 text-[15px]" style={{ color: '#64748b' }}>
            All the tools to manage billing from one place
          </p>

          <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-5 text-left md:grid-cols-3">
            {[
              ['#ecfdf5', Grid3X3, 'FY billing matrix', 'Color-coded client × month grid. See paid, partial, overdue, pending at a glance.'],
              ['#eff6ff', Sparkles, 'Auto period generation', 'Billing entries auto-create on the 1st of every month for all active services.'],
              ['#fdf4ff', Layers, 'FIFO payments', 'Record full or partial payments. Oldest dues settle first automatically.'],
              ['#fff7ed', FileText, 'PDF statements', 'Generate outstanding statements per client. Share directly on WhatsApp.'],
              ['#f0fdf4', Upload, 'Bulk import', 'Upload all your existing clients and service mappings from Excel in one go.'],
              ['#fef2f2', PieChart, 'Aging reports', '0–30, 31–60, 61–90, 90+ day buckets. Know exactly where your money is.'],
            ].map(([bg, Icon, title, desc]) => (
              <div
                key={title}
                className="rounded-xl border bg-white p-5"
                style={{ borderColor: '#e2e8f0', borderWidth: '0.5px', borderRadius: '12px' }}
              >
                <div className="inline-flex rounded-lg p-2.5" style={{ backgroundColor: bg }}>
                  <Icon className="h-[18px] w-[18px] text-[#0f172a]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-[15px] font-semibold text-[#0f172a]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: '#475569' }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ——— INDIA ——— */}
      <section id="for-cas" className="px-4 py-12 text-center sm:px-8" style={{ backgroundColor: HERO_NAVY, paddingTop: '48px', paddingBottom: '48px' }}>
        <div className="mx-auto max-w-5xl px-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#34d399]">Built for India</p>
          <h2 className="mt-2 text-[22px] font-bold text-white sm:text-[24px]">Made for Indian CA practices</h2>
          <p className="mx-auto mt-2 max-w-lg text-[14px]" style={{ color: '#64748b' }}>
            Every detail designed around how Indian CAs work
          </p>

          <div className="mx-auto mt-10 grid max-w-[900px] grid-cols-1 gap-4 md:grid-cols-3">
            <div className="mx-auto flex w-full max-w-[260px] flex-col items-center rounded-[10px] border border-solid p-4 text-center md:max-w-none" style={{ backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: '0.5px' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e293b] text-[#fca5a5] ring-1 ring-white/10">
                <Flag className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <p className="mt-3 text-[15px] font-semibold text-[#e2e8f0]">Apr–Mar FY</p>
              <p className="mt-2 text-[13px] leading-snug" style={{ color: '#64748b' }}>
                Indian financial year built in
              </p>
            </div>
            <div className="mx-auto flex w-full max-w-[260px] flex-col items-center rounded-[10px] border border-solid p-4 text-center md:max-w-none" style={{ backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: '0.5px' }}>
              <span className="flex h-9 w-9 items-center justify-center text-lg font-bold text-[#34d399]" aria-hidden>
                ₹
              </span>
              <p className="mt-1 text-[15px] font-semibold text-[#e2e8f0]">Indian numbering</p>
              <p className="mt-2 text-[13px] leading-snug" style={{ color: '#64748b' }}>
                ₹1,00,000 not ₹100,000
              </p>
            </div>
            <div className="mx-auto flex w-full max-w-[260px] flex-col items-center rounded-[10px] border border-solid p-4 text-center md:max-w-none" style={{ backgroundColor: '#1e293b', borderColor: '#334155', borderWidth: '0.5px' }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-[#34d399]">
                <Check className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </div>
              <p className="mt-3 text-[15px] font-semibold text-[#e2e8f0]">GSTIN + PAN</p>
              <p className="mt-2 text-[13px] leading-snug" style={{ color: '#64748b' }}>
                Regex validated on entry
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ——— CTA ——— */}
      <section className="px-4 py-16 text-center sm:px-8" style={{ backgroundColor: '#f0fdf4', paddingTop: '64px', paddingBottom: '64px' }}>
        <span
          className="inline-block rounded-[20px] border px-[14px] py-1 text-[12px] font-semibold"
          style={{ backgroundColor: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
        >
          No spreadsheets. No chaos.
        </span>
        <h2 className="mt-5 text-[24px] font-bold tracking-tight text-[#0f172a] sm:text-[28px]">Ready to replace your spreadsheets?</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed" style={{ color: '#64748b' }}>
          Join CA practices across India already using CA Tracker to manage their billing.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center justify-center rounded-lg px-[28px] py-[13px] text-[15px] font-semibold text-white transition hover:opacity-95"
          style={{ backgroundColor: BRAND_GREEN }}
        >
          Start tracking now →
        </Link>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="flex flex-col items-center justify-between gap-6 px-4 py-6 sm:flex-row sm:px-8 sm:py-6" style={{ backgroundColor: HERO_NAVY }}>
        <div className="flex items-center gap-2">
          <LogoBox size={34} rounded="rounded-[7px]" />
          <span className="text-[15px] font-semibold text-white">CA Tracker</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#features" className="text-[13px] text-[#475569] hover:text-[#94a3b8]">
            Features
          </a>
          <Link to="/login" className="text-[13px] text-[#475569] hover:text-[#94a3b8]">
            Sign in
          </Link>
        </div>
        <p className="text-center text-[12px] text-[#475569]">Made for Indian CAs · Apr–Mar FY</p>
      </footer>
    </div>
  );
}
