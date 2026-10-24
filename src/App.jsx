import React, { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipForward, SkipBack, X, Plus, Trash2,
  Pencil, ArrowLeft, Sparkles, GripVertical,
} from "lucide-react";
import { say, warmVoice } from "./voice.js";

const KEY = "rutinas_limpieza_v2";

const uid = () => Math.random().toString(36).slice(2, 9);

const SEED = {
  routines: [
    {
      id: uid(),
      name: "Habitación",
      items: [
        { id: uid(), name: "Ordenar y poner a lavar la ropa", sec: 180 },
        { id: uid(), name: "Tender la cama", sec: 120 },
        { id: uid(), name: "Despejar mesa y mueble", sec: 120 },
        { id: uid(), name: "Limpiar superficies (cómoda, mesita, estante, escritorio)", sec: 240 },
        { id: uid(), name: "Aspirar el piso", sec: 180 },
        { id: uid(), name: "Limpiar el piso", sec: 180 },
        { id: uid(), name: "Limpiar ventanas", sec: 180 },
        { id: uid(), name: "Cambiar sábanas", sec: 120 },
      ],
    },
    {
      id: uid(),
      name: "Baño",
      items: [
        { id: uid(), name: "Ponerle CIF al inodoro", sec: 30 },
        { id: uid(), name: "Limpiar la ducha", sec: 180 },
        { id: uid(), name: "Limpiar el lavamanos", sec: 120 },
        { id: uid(), name: "Limpiar la taza", sec: 120 },
        { id: uid(), name: "Aromatizar", sec: 20 },
        { id: uid(), name: "Limpiar el piso", sec: 180 },
      ],
    },
  ],
};

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.routines) && s.routines.length) return s;
  } catch {}
  return SEED;
}

const fmt = (s) => {
  s = Math.max(0, Math.round(s));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
};

function speakDur(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  const parts = [];
  if (m > 0) parts.push(m === 1 ? "un minuto" : `${m} minutos`);
  if (r > 0) parts.push(r === 1 ? "un segundo" : `${r} segundos`);
  if (!parts.length) return "cero segundos";
  return parts.join(" y ");
}

export default function App() {
  const [data, setData] = useState(load);
  const [screen, setScreen] = useState("list");
  const [editId, setEditId] = useState(null);
  const [runId, setRunId] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  const update = (fn) => setData((d) => ({ ...d, routines: fn(d.routines) }));

  const addRoutine = () => {
    const r = { id: uid(), name: "Nueva rutina", items: [] };
    update((rs) => [...rs, r]);
    setEditId(r.id);
    setScreen("edit");
  };
  const openEdit = (id) => { setEditId(id); setScreen("edit"); };
  const startRun = (id) => { warmVoice(); setRunId(id); setScreen("run"); };
  const routine = (id) => data.routines.find((r) => r.id === id);

  return (
    <div style={S.app}>
      {screen === "list" && (
        <RoutineList routines={data.routines} onPlay={startRun}
          onEdit={openEdit} onAdd={addRoutine} />
      )}
      {screen === "edit" && (
        <Editor
          routine={routine(editId)}
          onChange={(nr) => update((rs) => rs.map((r) => (r.id === nr.id ? nr : r)))}
          onDelete={() => { update((rs) => rs.filter((r) => r.id !== editId)); setScreen("list"); }}
          onPlay={() => startRun(editId)}
          onBack={() => setScreen("list")}
        />
      )}
      {screen === "run" && (
        <Runner routine={routine(runId)} onExit={() => setScreen("list")} />
      )}
    </div>
  );
}

/* ---------------- Lista de rutinas ---------------- */
function RoutineList({ routines, onPlay, onEdit, onAdd }) {
  return (
    <>
      <header style={S.header}>
        <div style={S.brand}><Sparkles size={22} color={C.accent} /> <span>Limpieza</span></div>
      </header>
      <main style={S.main}>
        {routines.map((r) => {
          const tot = r.items.reduce((a, b) => a + b.sec, 0);
          return (
            <div key={r.id} style={S.card}>
              <button style={S.playRound} onClick={() => onPlay(r.id)} disabled={!r.items.length}>
                <Play size={24} fill="#fff" color="#fff" />
              </button>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => onEdit(r.id)}>
                <div style={S.cardTitle}>{r.name}</div>
                <div style={S.cardSub}>{r.items.length} pasos · {fmt(tot)}</div>
              </div>
              <button style={S.iconBtn} onClick={() => onEdit(r.id)}><Pencil size={18} /></button>
            </div>
          );
        })}
        <button style={S.addRoutine} onClick={onAdd}><Plus size={18} /> Nueva rutina</button>
      </main>
    </>
  );
}

/* ---------------- Editor ---------------- */
function Editor({ routine, onChange, onDelete, onPlay, onBack }) {
  const [name, setName] = useState(routine.name);
  const [newName, setNewName] = useState("");
  const [newMin, setNewMin] = useState("");
  const [dragIdx, setDragIdx] = useState(null);
  const listRef = useRef(null);

  const setItems = (items) => onChange({ ...routine, name, items });
  const saveName = (v) => { setName(v); onChange({ ...routine, name: v, items: routine.items }); };

  const addItem = () => {
    const nm = newName.trim();
    if (!nm) return;
    const m = parseFloat((newMin || "2").replace(",", "."));
    const sec = Math.round((isNaN(m) || m <= 0 ? 2 : m) * 60);
    setItems([...routine.items, { id: uid(), name: nm, sec }]);
    setNewName(""); setNewMin("");
  };
  const del = (i) => setItems(routine.items.filter((_, k) => k !== i));
  const editItem = (i) => {
    const v = prompt("Nombre del paso:", routine.items[i].name);
    if (v && v.trim()) {
      const it = [...routine.items]; it[i] = { ...it[i], name: v.trim() }; setItems(it);
    }
  };
  const editDur = (i) => {
    const v = prompt("Minutos (ej 2 o 1.5):", (routine.items[i].sec / 60).toString());
    if (v === null) return;
    const m = parseFloat(v.replace(",", "."));
    if (!isNaN(m) && m > 0) { const it = [...routine.items]; it[i] = { ...it[i], sec: Math.round(m * 60) }; setItems(it); }
  };

  // ---- drag para reordenar (pointer events) ----
  const startDrag = (i, e) => {
    e.preventDefault();
    setDragIdx(i);
    const move = (ev) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const row = el && el.closest("[data-row]");
      if (!row) return;
      const to = +row.getAttribute("data-row");
      setDragIdx((from) => {
        if (from === null || to === from) return from;
        const it = [...routine.items];
        const [moved] = it.splice(from, 1);
        it.splice(to, 0, moved);
        setItems(it);
        return to;
      });
    };
    const up = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      setDragIdx(null);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return (
    <>
      <header style={S.header}>
        <button style={S.iconBtn} onClick={onBack}><ArrowLeft size={20} /></button>
        <input style={S.nameInput} value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={(e) => saveName(e.target.value.trim() || "Sin nombre")} />
        <button style={S.iconBtn} onClick={() => { if (confirm("¿Borrar esta rutina?")) onDelete(); }}>
          <Trash2 size={18} />
        </button>
      </header>
      <main style={S.main} ref={listRef}>
        {routine.items.map((it, i) => (
          <div key={it.id} data-row={i} style={{ ...S.item, ...(dragIdx === i ? S.itemDragging : null) }}>
            <span style={S.grab} onPointerDown={(e) => startDrag(i, e)}><GripVertical size={18} /></span>
            <span style={S.itemName} onClick={() => editItem(i)}>{it.name}</span>
            <span style={S.itemDur} onClick={() => editDur(i)}>{fmt(it.sec)}</span>
            <button style={S.iconBtn} onClick={() => del(i)}><X size={18} /></button>
          </div>
        ))}
        <div style={S.addRow}>
          <input style={S.inpName} placeholder="Nuevo paso" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()} />
          <input style={S.inpDur} placeholder="min" inputMode="decimal" value={newMin}
            onChange={(e) => setNewMin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()} />
          <button style={S.addBtn} onClick={addItem}><Plus size={22} /></button>
        </div>
        <p style={S.hint}>Tocá el nombre o el tiempo para editar. Arrastrá ⠿ para reordenar.</p>
      </main>
      <footer style={S.footer}>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={onPlay} disabled={!routine.items.length}>
          <Play size={22} fill="#fff" color="#fff" /> &nbsp;Empezar rutina
        </button>
      </footer>
    </>
  );
}

/* ---------------- Runner ---------------- */
const R = 108;
const CIRC = 2 * Math.PI * R;

function Runner({ routine, onExit }) {
  const [idx, setIdx] = useState(0);
  const [remain, setRemain] = useState(routine.items[0]?.sec || 0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const flags = useRef({ half: false, quarter: false });
  const tickRef = useRef(null);
  const items = routine.items;
  const cur = items[idx];

  const loadStep = (i) => {
    flags.current = { half: false, quarter: false };
    setIdx(i); setRemain(items[i].sec); say(items[i].name);
  };

  useEffect(() => {
    say(items[0].name);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearInterval(tickRef.current);
    if (done || paused) return;
    tickRef.current = setInterval(() => {
      setRemain((r) => {
        const next = r - 1;
        const total = cur.sec;
        if (!flags.current.half && next <= total / 2 && next > 0) {
          flags.current.half = true; say("Mitad del tiempo");
        }
        if (!flags.current.quarter && next <= total / 4 && next > 0) {
          flags.current.quarter = true; say(`Falta ${speakDur(next)} para terminar`);
        }
        if (next <= 0) { advance(); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, paused, done]);

  const advance = () => {
    if (idx + 1 >= items.length) {
      clearInterval(tickRef.current); setDone(true); say("Listo. Terminaste la limpieza.");
    } else loadStep(idx + 1);
  };
  const prev = () => { if (idx > 0) loadStep(idx - 1); else loadStep(0); };
  const skip = () => advance();

  if (done) {
    return (
      <div style={S.runWrap}>
        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>¡Listo!</div>
          <div style={{ color: C.muted, marginTop: 8 }}>Rutina completada</div>
        </div>
        <footer style={S.footer}>
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={onExit}>Volver</button>
        </footer>
      </div>
    );
  }

  const frac = cur.sec ? Math.max(remain, 0) / cur.sec : 0;
  return (
    <div style={S.runWrap}>
      <div style={S.runBody}>
        <div style={S.stepName}>{cur.name}</div>
        <div style={S.stepPos}>Paso {idx + 1} de {items.length}</div>
        <div style={S.ring}>
          <svg width="240" height="240">
            <circle cx="120" cy="120" r={R} stroke={C.track} strokeWidth="14" fill="none" />
            <circle cx="120" cy="120" r={R} stroke={C.accent} strokeWidth="14" fill="none"
              strokeLinecap="round" transform="rotate(-90 120 120)"
              strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - frac)}
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={S.ringTime}>{fmt(remain)}</div>
        </div>
        <div style={S.nextUp}>{items[idx + 1] ? `Sigue: ${items[idx + 1].name}` : "Último paso"}</div>
      </div>
      <footer style={S.footer}>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={prev}><SkipBack size={22} /></button>
        <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setPaused((p) => !p)}>
          {paused ? <Play size={22} fill="#fff" color="#fff" /> : <Pause size={22} fill="#fff" color="#fff" />}
        </button>
        <button style={{ ...S.btn, ...S.btnGhost }} onClick={skip}><SkipForward size={22} /></button>
        <button style={{ ...S.btn, ...S.btnDanger }} onClick={onExit}><X size={22} /></button>
      </footer>
    </div>
  );
}

/* ---------------- paleta azul / modo claro ---------------- */
const C = {
  bgTop: "#d6e9ff", bgBot: "#9ec4f5",
  card: "rgba(255,255,255,0.82)", border: "#bcd7f5",
  text: "#0f2f5c", muted: "#4f6a93",
  accent: "#2563eb", accent2: "#38bdf8", accentSoft: "#cfe3ff", track: "#c3dcfb",
  danger: "#e2483c",
};

const S = {
  app: {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    background: `linear-gradient(170deg, ${C.bgTop} 0%, ${C.bgBot} 100%)`,
    backgroundAttachment: "fixed", color: C.text,
    fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    paddingTop: "env(safe-area-inset-top)",
  },
  header: {
    display: "flex", alignItems: "center", gap: 10, padding: "16px 16px 12px",
    background: "transparent",
  },
  brand: { display: "flex", alignItems: "center", gap: 8, fontSize: 20, fontWeight: 700 },
  main: { flex: 1, padding: "14px 14px 110px", overflowY: "auto" },
  card: {
    display: "flex", alignItems: "center", gap: 10, background: C.card,
    border: `1px solid ${C.border}`, borderRadius: 16, padding: 12, marginBottom: 10,
    boxShadow: "0 1px 3px rgba(19,41,75,0.06)",
  },
  cardTitle: { fontSize: 17, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cardSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  playRound: {
    width: 50, height: 50, borderRadius: 25, border: "none",
    background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`,
    boxShadow: "0 3px 8px rgba(37,99,235,0.35)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  iconBtn: { background: "none", border: "none", color: C.muted, padding: 6, display: "flex", alignItems: "center" },
  addRoutine: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: C.card, border: `1px dashed ${C.accent}`, color: C.accent,
    borderRadius: 16, padding: 14, fontSize: 15, marginTop: 4,
  },
  nameInput: {
    flex: 1, background: C.card, border: `1px solid ${C.border}`, color: C.text,
    borderRadius: 10, padding: "10px 12px", fontSize: 17, fontWeight: 600,
  },
  item: {
    display: "flex", alignItems: "center", gap: 8, background: C.card,
    border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 8px 10px 4px", marginBottom: 9,
    boxShadow: "0 1px 2px rgba(19,41,75,0.05)",
  },
  itemDragging: { opacity: 0.6, borderColor: C.accent, boxShadow: `0 0 0 2px ${C.accentSoft}` },
  grab: { color: "#9db0cc", padding: "4px 2px", touchAction: "none", cursor: "grab", display: "flex" },
  itemName: { flex: 1, fontSize: 15, minWidth: 0, lineHeight: 1.25 },
  itemDur: { fontSize: 15, color: C.accent, fontWeight: 600, fontVariantNumeric: "tabular-nums", minWidth: 52, textAlign: "right" },
  addRow: { display: "flex", gap: 8, marginTop: 6 },
  inpName: { flex: 1, minWidth: 0, background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 12, padding: 12, fontSize: 15 },
  inpDur: { width: 70, textAlign: "center", background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: 12, padding: 12, fontSize: 15 },
  addBtn: { background: C.accent, border: "none", color: "#fff", borderRadius: 12, padding: "0 16px", display: "flex", alignItems: "center" },
  hint: { color: C.muted, fontSize: 13, marginTop: 10, textAlign: "center" },
  runWrap: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  runBody: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 18px 140px", textAlign: "center" },
  stepName: { fontSize: 26, fontWeight: 700, lineHeight: 1.25, marginBottom: 6 },
  stepPos: { fontSize: 14, color: C.muted, marginBottom: 26 },
  ring: { position: "relative", width: 240, height: 240, marginBottom: 24 },
  ringTime: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  nextUp: { fontSize: 14, color: C.muted, minHeight: 20 },
  footer: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    padding: "14px 16px calc(14px + env(safe-area-inset-bottom))",
    display: "flex", gap: 10,
    background: `linear-gradient(to top,${C.bgBot} 72%,transparent)`,
  },
  btn: { flex: 1, border: "none", borderRadius: 16, padding: 16, fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" },
  btnPrimary: { background: `linear-gradient(135deg, ${C.accent2}, ${C.accent})`, color: "#fff", boxShadow: "0 3px 8px rgba(37,99,235,0.3)" },
  btnGhost: { background: C.card, color: C.text, border: `1px solid ${C.border}` },
  btnDanger: { background: C.card, color: C.danger, border: `1px solid #f0cfcc` },
};
