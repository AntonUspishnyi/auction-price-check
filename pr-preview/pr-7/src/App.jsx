const { useEffect, useMemo, useState } = React;

// Total(€) = (Lot¥ + Delivery¥) * EffTax / Rate + Fixprice€
// Reverse:  Lot¥ = (Budget€ - Fixprice€) * Rate / EffTax - Delivery¥

const DELIVERY = [
  { label: "9 m³", yen: 365000 },
  { label: "10 m³", yen: 395000 },
  { label: "11 m³", yen: 420000 },
  { label: "12 m³", yen: 450000 },
  { label: "13 m³", yen: 480000 },
  { label: "14 m³", yen: 510000 },
  { label: "15 m³", yen: 540000 },
  { label: "16 m³", yen: 570000 },
  { label: "17 m³", yen: 600000 },
  { label: "18 m³", yen: 630000 },
];

const C = {
  bg: "#060E1C",
  panel: "#0B1729",
  panelSoft: "#0E1D33",
  border: "#1C3052",
  blue: "#0057B7",
  yellow: "#FFD700",
  yellowSoft: "#FFE873",
  text: "#EAF2FF",
  dim: "#8DA2C0",
  faint: "#566C8C",
  danger: "#FF7A7A",
};

const fmt = (n, d = 0) =>
  Number.isFinite(n)
    ? n.toLocaleString("uk-UA", { minimumFractionDigits: d, maximumFractionDigits: d })
    : "—";

const parseNum = (raw) => {
  if (raw == null) return 0;
  let s = String(raw).trim().toLowerCase().replace(/\s/g, "").replace(",", ".");
  let mult = 1;
  if (/[kк]$/.test(s)) {
    mult = 1e3;
    s = s.slice(0, -1);
  } else if (/[mм]$/.test(s)) {
    mult = 1e6;
    s = s.slice(0, -1);
  }
  const v = parseFloat(s);
  return Number.isFinite(v) ? v * mult : 0;
};

function Lbl({ children, hint, dot }) {
  return (
    <div className="label-row">
      <span>{dot && <i className="stale-dot" aria-hidden="true" />}{children}</span>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function TextField({ label, suffix, value, onChange, hint, dot }) {
  const parsed = parseNum(value);
  const showParsed = /[kкmм]/i.test(value || "");
  return (
    <label className="field-block">
      <Lbl hint={hint} dot={dot}>{label}</Lbl>
      <div className="ua-field">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span>{suffix}</span>
      </div>
      {showParsed && <div className="parsed-value">= {fmt(parsed)}</div>}
    </label>
  );
}

function Seg({ options, value, onChange, activeBg, activeColor }) {
  return (
    <div className="segmented-control">
      {options.map(([v, t]) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={on ? { background: activeBg, color: activeColor } : { color: C.dim, background: "transparent" }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("budget");
  const [budget, setBudget] = useState("30000");
  const [lot, setLot] = useState("3000k");
  const [rate, setRate] = useState("184.19");
  const [deliveryIdx, setDeliveryIdx] = useState(3);
  const [origin, setOrigin] = useState("jp");
  const [baseTax, setBaseTax] = useState("1.19");
  const [fix, setFix] = useState("1.3k");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    tg.ready();
    tg.expand();
    tg.setHeaderColor(C.bg);
    tg.setBackgroundColor(C.bg);
  }, []);

  const R = parseNum(rate);
  const D = DELIVERY[deliveryIdx].yen;
  const F = parseNum(fix);
  const baseT = parseNum(baseTax);
  const effT = baseT * (origin === "jp" ? 1 : 1.1);

  const calc = useMemo(() => {
    if (mode === "budget") {
      const B = parseNum(budget);
      const raw = ((B - F) * R) / effT - D;
      return { lotYen: Math.max(0, raw), rawLotYen: raw };
    }

    const Lp = parseNum(lot);
    return { lotYen: Lp, rawLotYen: Lp };
  }, [mode, budget, lot, R, D, F, effT]);

  const L = calc.lotYen;
  const lotE = L / R;
  const delE = D / R;
  const taxE = ((L + D) * (effT - 1)) / R;
  const grandTotal = ((L + D) * effT) / R + F;

  return (
    <main className="app-shell">
      <section className="calculator-card" aria-label="Japan auction bid calculator">
        <header className="header">
          <div className="flag" aria-hidden="true">
            <div className="flag-blue" />
            <div className="flag-yellow" />
          </div>
          <h1>Japan Auction · Bid Calc</h1>
        </header>
        <div className="accent-line" />
        <p className="formula">(Лот + доставка) × податок ÷ курс + розмитнення</p>

        <div className="section-space">
          <Seg
            options={[["budget", "Бюджет → ставка"], ["lot", "Ставка → вартість"]]}
            value={mode}
            onChange={setMode}
            activeBg={C.yellow}
            activeColor="#10203A"
          />
        </div>

        <div className="section-space compact">
          {mode === "budget" ? (
            <TextField label="Макс. бюджет" suffix="€" value={budget} onChange={setBudget} hint="скільки готовий витратити" />
          ) : (
            <TextField label="Ціна лоту" suffix="¥" value={lot} onChange={setLot} hint="можна 1775k" />
          )}
        </div>

        <div className="result-card">
          {mode === "budget" ? (
            <>
              <div className="result-label">Макс. ставка на лот</div>
              <div className="result-value" key={`bid-${Math.round(L)}`}>¥{fmt(L)}</div>
              <div className="result-subtitle">≈ €{fmt(lotE)} за курсом</div>
              {calc.rawLotYen < 0 && (
                <div className="danger">Бюджету не вистачає на доставку + розмитнення</div>
              )}
            </>
          ) : (
            <>
              <div className="result-label">Загальна вартість «під ключ»</div>
              <div className="result-value" key={`tot-${Math.round(grandTotal)}`}>€{fmt(grandTotal)}</div>
              <div className="result-subtitle">лот ¥{fmt(L)} + усі витрати</div>
            </>
          )}
        </div>

        <div className="eyebrow">Походження авто</div>
        <div className="section-space compact">
          <Seg
            options={[["jp", `Японська ×${fmt(baseT, 2)}`], ["other", `Не японська ×${fmt(baseT * 1.1, 3)}`]]}
            value={origin}
            onChange={setOrigin}
            activeBg={C.blue}
            activeColor="#FFFFFF"
          />
        </div>

        <div className="eyebrow">Параметри</div>
        <div className="parameter-grid">
          <TextField label="Курс EUR/JPY" suffix="¥/€" value={rate} onChange={setRate} hint="онови перед ставкою" dot />
          <TextField label="Податок (база)" suffix="×" value={baseTax} onChange={setBaseTax} hint={`ефект. ×${fmt(effT, 3)}`} />
          <TextField label="Розмитнення" suffix="€" value={fix} onChange={setFix} />
          <label className="field-block">
            <Lbl hint="об'єм">Доставка</Lbl>
            <div className="ua-field">
              <select
                className="ua-select"
                value={deliveryIdx}
                onChange={(e) => setDeliveryIdx(Number(e.target.value))}
              >
                {DELIVERY.map((d, i) => (
                  <option key={d.label} value={i}>{d.label} · {fmt(d.yen)}</option>
                ))}
              </select>
              <span>¥</span>
            </div>
            <div className="parsed-value">= ¥{fmt(D)}</div>
          </label>
        </div>

        <div className="breakdown">
          <div className="breakdown-title">Розклад (€)</div>
          {[
            ["Лот", lotE],
            [`Доставка · ${DELIVERY[deliveryIdx].label}`, delE],
            [`Податок (+${fmt((effT - 1) * 100, 1)}%)`, taxE],
            ["Розмитнення", F],
          ].map(([k, v]) => (
            <div key={k} className="breakdown-row">
              <span>{k}</span>
              <strong>€{fmt(v)}</strong>
            </div>
          ))}
          <div className="breakdown-row total">
            <span>Разом</span>
            <strong>€{fmt(grandTotal)}</strong>
          </div>
        </div>

        <p className="note">
          Поля приймають k / m (1775k = 1 775 000). Курс ¥/€ онови перед кожною ставкою.
          Розрахунок «під ключ»; реальні комісії залежать від брокера.
        </p>

        <footer className="footer">
          Made with <span>💛</span> by{" "}
          <a href="https://t.me/Anton_Uspishnyi" target="_blank" rel="noopener noreferrer">
            @Anton_Uspishnyi
          </a>
        </footer>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
