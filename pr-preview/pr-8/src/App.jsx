const { useEffect, useMemo, useState } = React;
const h = React.createElement;

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
  blue: "#0057B7",
  yellow: "#FFD700",
  dim: "#8DA2C0",
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
  return h(
    "div",
    { className: "label-row" },
    h("span", null, dot ? h("i", { className: "stale-dot", "aria-hidden": "true" }) : null, children),
    hint ? h("small", null, hint) : null,
  );
}

function TextField({ label, suffix, value, onChange, hint, dot }) {
  return h(
    "label",
    { className: "field-block" },
    h(Lbl, { hint, dot }, label),
    h(
      "div",
      { className: "ua-field" },
      h("input", {
        type: "text",
        inputMode: "decimal",
        value,
        onChange: (e) => onChange(e.target.value),
      }),
      h("span", null, suffix),
    ),
  );
}

function Seg({ options, value, onChange, activeBg, activeColor }) {
  return h(
    "div",
    { className: "segmented-control" },
    options.map(([v, t]) => {
      const on = value === v;
      return h(
        "button",
        {
          key: v,
          type: "button",
          onClick: () => onChange(v),
          style: on ? { background: activeBg, color: activeColor } : { color: C.dim, background: "transparent" },
        },
        t,
      );
    }),
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

  return h(
    "main",
    { className: "app-shell" },
    h(
      "section",
      { className: "calculator-card", "aria-label": "Japan auction bid calculator" },
      h(
        "header",
        { className: "header" },
        h("div", { className: "flag", "aria-hidden": "true" }, h("div", { className: "flag-blue" }), h("div", { className: "flag-yellow" })),
        h("h1", null, "Japan Auction · Bid Calc"),
      ),
      h("div", { className: "accent-line" }),
      h("p", { className: "formula" }, "(Лот + доставка) × податок ÷ курс + розмитнення"),
      h("div", { className: "section-space" }, h(Seg, { options: [["budget", "Бюджет → ставка"], ["lot", "Ставка → вартість"]], value: mode, onChange: setMode, activeBg: C.yellow, activeColor: "#10203A" })),
      h("div", { className: "section-space compact" }, mode === "budget"
        ? h(TextField, { label: "Макс. бюджет", suffix: "€", value: budget, onChange: setBudget, hint: "скільки готовий витратити" })
        : h(TextField, { label: "Ціна лоту", suffix: "¥", value: lot, onChange: setLot, hint: "можна 1775k" })),
      h(
        "div",
        { className: "result-card" },
        mode === "budget"
          ? [
              h("div", { className: "result-label", key: "label" }, "Макс. ставка на лот"),
              h("div", { className: "result-value", key: `bid-${Math.round(L)}` }, `¥${fmt(L)}`),
              h("div", { className: "result-subtitle", key: "subtitle" }, `≈ €${fmt(lotE)} за курсом`),
              calc.rawLotYen < 0 ? h("div", { className: "danger", key: "danger" }, "Бюджету не вистачає на доставку + розмитнення") : null,
            ]
          : [
              h("div", { className: "result-label", key: "label" }, "Загальна вартість «під ключ»"),
              h("div", { className: "result-value", key: `tot-${Math.round(grandTotal)}` }, `€${fmt(grandTotal)}`),
              h("div", { className: "result-subtitle", key: "subtitle" }, `лот ¥${fmt(L)} + усі витрати`),
            ],
      ),
      h("div", { className: "eyebrow" }, "Походження авто"),
      h("div", { className: "section-space compact" }, h(Seg, { options: [["jp", `Японська ×${fmt(baseT, 2)}`], ["other", `Не японська ×${fmt(baseT * 1.1, 3)}`]], value: origin, onChange: setOrigin, activeBg: C.blue, activeColor: "#FFFFFF" })),
      h("div", { className: "eyebrow" }, "Параметри"),
      h(
        "div",
        { className: "parameter-grid" },
        h(TextField, { label: "Курс EUR/JPY", suffix: "¥/€", value: rate, onChange: setRate, hint: "онови", dot: true }),
        h(TextField, { label: "Податок (база)", suffix: "×", value: baseTax, onChange: setBaseTax, hint: `ефект. ×${fmt(effT, 3)}` }),
        h(TextField, { label: "Розмитнення", suffix: "€", value: fix, onChange: setFix }),
        h(
          "label",
          { className: "field-block" },
          h(Lbl, { hint: "об'єм" }, "Доставка"),
          h(
            "div",
            { className: "ua-field" },
            h(
              "select",
              { className: "ua-select", value: deliveryIdx, onChange: (e) => setDeliveryIdx(Number(e.target.value)) },
              DELIVERY.map((d, i) => h("option", { key: d.label, value: i }, `${d.label} · ${fmt(d.yen)}`)),
            ),
            h("span", null, "¥"),
          ),
          h("div", { className: "parsed-value" }, `= ¥${fmt(D)}`),
        ),
      ),
      h(
        "div",
        { className: "breakdown" },
        h("div", { className: "breakdown-title" }, "Розклад (€)"),
        ...[
          ["Лот", lotE],
          [`Доставка · ${DELIVERY[deliveryIdx].label}`, delE],
          [`Податок (+${fmt((effT - 1) * 100, 1)}%)`, taxE],
          ["Розмитнення", F],
        ].map(([k, v]) => h("div", { key: k, className: "breakdown-row" }, h("span", null, k), h("strong", null, `€${fmt(v)}`))),
        h("div", { className: "breakdown-row total" }, h("span", null, "Разом"), h("strong", null, `€${fmt(grandTotal)}`)),
      ),
      h("p", { className: "note" }, "Поля приймають k / m (1775k = 1 775 000). Курс ¥/€ онови перед кожною ставкою. Розрахунок «під ключ»; реальні комісії залежать від брокера."),
      h("footer", { className: "footer" }, "Made with ", h("span", null, "💛"), " by ", h("a", { href: "https://t.me/Anton_Uspishnyi", target: "_blank", rel: "noopener noreferrer" }, "@Anton_Uspishnyi")),
    ),
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(h(App));
