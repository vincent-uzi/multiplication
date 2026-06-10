import { useState, useEffect, useRef } from "react";

const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const TIME_LIMIT = 15;

const EASY = new Set([2, 5, 10]);
function baseDifficulty(a, b) {
  return (EASY.has(a) || EASY.has(b)) ? 1 : Math.max(a, b);
}

function buildPool(tables) {
  const pool = [];
  for (const a of tables) {
    for (const b of tables) {
      const w = baseDifficulty(a, b);
      for (let i = 0; i < w; i++) pool.push([a, b]);
    }
  }
  return pool;
}

const errorBoost = new Map();

function recordError(a, b) {
  const key = `${Math.min(a,b)},${Math.max(a,b)}`;
  errorBoost.set(key, (errorBoost.get(key) ?? 0) + 1);
}

function getRandomQ(pool) {
  const extended = [...pool];
  for (const [key, count] of errorBoost.entries()) {
    const [a, b] = key.split(",").map(Number);
    for (let i = 0; i < count * 3; i++) extended.push([a, b]);
  }
  const [a, b] = extended[Math.floor(Math.random() * extended.length)];
  return { a, b, answer: a * b };
}

const stars = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${6 + Math.random() * 10}px`,
  delay: `${Math.random() * 3}s`,
  dur: `${2 + Math.random() * 2}s`,
}));

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["⌫", "0", "✅"],
];

function loadSavedTables() {
  try {
    const saved = JSON.parse(localStorage.getItem("tables"));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch {}
  return ALL_TABLES;
}

export default function App() {
  const [selectedTables, setSelectedTables] = useState(loadSavedTables);
  const [pool, setPool] = useState(() => buildPool(loadSavedTables()));
  const [showSettings, setShowSettings] = useState(false);
  const [question, setQuestion] = useState(() => getRandomQ(buildPool(loadSavedTables())));
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('best') || '0', 10));
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [particles, setParticles] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef(null);

  useEffect(() => {
    if (showSettings || status !== null) return;
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [question, status === null ? null : "paused", showSettings]);

  function handleTimeout() {
    setStatus("timeout");
    setShake(true);
    setStreak(0);
    setTimeout(() => {
      setShake(false);
      setStatus(null);
      setInput("");
      setQuestion(getRandomQ(pool));
    }, 1400);
  }

  function spawnParticles() {
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      emoji: ["⭐", "🎉", "✨", "🌟", "💫"][Math.floor(Math.random() * 5)],
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      dx: (Math.random() - 0.5) * 140,
      dy: -50 - Math.random() * 80,
    }));
    setParticles(items);
    setTimeout(() => setParticles([]), 900);
  }

  function validate() {
    if (status !== null) return;
    const val = parseInt(input, 10);
    if (isNaN(val)) return;
    clearInterval(timerRef.current);

    if (val === question.answer) {
      setStatus("correct");
      setBounce(true);
      spawnParticles();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) {
        setBest(newStreak);
        localStorage.setItem('best', newStreak);
      }
      setTimeout(() => {
        setBounce(false);
        setStatus(null);
        setInput("");
        setQuestion(getRandomQ(pool));
      }, 1000);
    } else {
      recordError(question.a, question.b);
      setStatus("wrong");
      setShake(true);
      setStreak(0);
      setTimeout(() => { setShake(false); setStatus(null); setInput(""); }, 900);
    }
  }

  function pressKey(key) {
    if (status !== null) return;
    if (key === "✅") { validate(); return; }
    if (key === "⌫") { setInput(p => p.slice(0, -1)); return; }
    if (input.length >= 3) return;
    setInput(p => p + key);
  }

  function openSettings() {
    clearInterval(timerRef.current);
    setShowSettings(true);
  }

  function saveSettings(tables) {
    localStorage.setItem("tables", JSON.stringify(tables));
    const newPool = buildPool(tables);
    setPool(newPool);
    setSelectedTables(tables);
    setShowSettings(false);
    setStatus(null);
    setInput("");
    setQuestion(getRandomQ(newPool));
  }

  const streakColor =
    streak >= 10 ? "#ff6b35" :
    streak >= 5  ? "#f7c59f" :
    streak >= 3  ? "#ffe082" : "#ffffff";

  const timerColor =
    timeLeft <= 3  ? "#ff4444" :
    timeLeft <= 7  ? "#ff9800" : "#69ff9c";

  const timerPct = (timeLeft / TIME_LIMIT) * 100;
  const isError = status === "wrong" || status === "timeout";

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800&display=swap');
    @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
    @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
    @keyframes bounce { 0%,100%{transform:scale(1)} 30%{transform:scale(1.08)} 60%{transform:scale(0.97)} }
    @keyframes pop { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes timerPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
    @keyframes fadeIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    * { -webkit-tap-highlight-color: transparent; }
  `;

  const bgStyle = {
    minHeight: "100dvh",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    fontFamily: "'Fredoka One', cursive",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  if (showSettings) {
    return (
      <SettingsScreen
        globalStyle={globalStyle}
        bgStyle={bgStyle}
        stars={stars}
        selectedTables={selectedTables}
        onSave={saveSettings}
      />
    );
  }

  return (
    <div style={{
      ...bgStyle,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px 16px",
    }}>
      <style>{globalStyle}</style>

      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "white", opacity: 0.25,
          animation: `twinkle ${s.dur} ${s.delay} infinite ease-in-out`,
          pointerEvents: "none",
        }} />
      ))}

      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          fontSize: "24px",
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`,
          animation: "pop 0.9s ease-out forwards",
          pointerEvents: "none", zIndex: 99,
        }}>{p.emoji}</div>
      ))}

      {/* TOP */}
      <div style={{ width: "100%", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <h1 style={{
            color: "#ffe082", fontSize: "clamp(18px, 5vw, 26px)",
            margin: 0, textShadow: "0 2px 10px rgba(255,200,50,.5)",
            letterSpacing: "1px", flex: 1, textAlign: "center",
          }}>🧮 Tables de Multiplication</h1>
          <button
            onPointerDown={e => { e.preventDefault(); openSettings(); }}
            style={{
              background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
              borderRadius: "12px", width: "40px", height: "40px",
              fontSize: "20px", cursor: "pointer", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, backdropFilter: "blur(8px)",
            }}
          >⚙️</button>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "10px" }}>
          {[
            { label: "Série", value: `${streak}${streak >= 5 ? " 🔥" : streak >= 3 ? " ⭐" : ""}`, color: streakColor },
            { label: "Record", value: `${best}${best >= 10 ? " 🏆" : best >= 5 ? " 🥇" : ""}`, color: "#f7c59f" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: 1, maxWidth: "140px",
              background: "rgba(255,255,255,.1)", borderRadius: "14px",
              padding: "8px 12px", textAlign: "center", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,.15)",
            }}>
              <div style={{ color: "rgba(255,255,255,.55)", fontSize: "10px", fontFamily: "'Nunito', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
              <div style={{ color, fontSize: "26px", fontWeight: 800, lineHeight: 1.1, fontFamily: "'Nunito', sans-serif" }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ width: "100%", marginBottom: "4px" }}>
          <div style={{ width: "100%", height: "7px", background: "rgba(255,255,255,.1)", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${timerPct}%`,
              background: timerColor, borderRadius: "999px",
              transition: "width 1s linear, background .3s",
            }} />
          </div>
          <div style={{
            textAlign: "right", fontSize: "16px", color: timerColor,
            marginTop: "2px", transition: "color .3s",
            animation: timeLeft <= 3 ? "timerPulse .5s infinite" : "none",
          }}>{timeLeft}s ⏱</div>
        </div>
      </div>

      {/* MILIEU */}
      <div style={{
        width: "100%", maxWidth: "360px", zIndex: 1,
        background: status === "correct" ? "rgba(100,255,150,.12)" : isError ? "rgba(255,80,80,.12)" : "rgba(255,255,255,.08)",
        backdropFilter: "blur(16px)",
        border: `2px solid ${status === "correct" ? "rgba(100,255,150,.4)" : isError ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.15)"}`,
        borderRadius: "24px",
        padding: "18px 20px",
        textAlign: "center",
        animation: shake ? "shake .4s ease" : bounce ? "bounce .4s ease" : "slideIn .3s ease",
        transition: "background .3s, border-color .3s",
      }}>
        <div style={{ fontSize: "clamp(42px, 14vw, 64px)", color: "white", lineHeight: 1, marginBottom: "14px", textShadow: "0 4px 20px rgba(0,0,0,.3)" }}>
          {question.a} × {question.b} = ?
        </div>
        <div style={{
          minHeight: "60px",
          background: "rgba(255,255,255,.08)",
          border: `2px solid ${status === "correct" ? "rgba(100,255,150,.5)" : isError ? "rgba(255,100,100,.5)" : "rgba(255,255,255,.2)"}`,
          borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "38px", color: input ? "white" : "rgba(255,255,255,.3)",
          transition: "border-color .3s", letterSpacing: "4px",
        }}>
          {input || "—"}
        </div>
        {status && (
          <div style={{
            marginTop: "10px", fontSize: "20px",
            fontFamily: "'Nunito', sans-serif", fontWeight: 800,
            color: status === "correct" ? "#69ff9c" : "#ff7070",
            animation: "slideIn .2s ease",
          }}>
            {status === "correct"
              ? ["Super ! 🎉", "Bravo ! ⭐", "Excellent ! 🌟", "Parfait ! 🏆"][streak % 4]
              : status === "timeout"
              ? `Trop lent ! C'était ${question.answer} ⏱`
              : `Raté ! C'était ${question.answer} 💪`}
          </div>
        )}
      </div>

      {/* BAS : clavier */}
      <div style={{ width: "100%", maxWidth: "360px", zIndex: 1 }}>
        {KEYS.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: "10px", marginBottom: ri < 3 ? "10px" : "0" }}>
            {row.map(key => {
              const isValidate = key === "✅";
              const isDelete = key === "⌫";
              return (
                <button
                  key={key}
                  onPointerDown={e => { e.preventDefault(); pressKey(key); }}
                  style={{
                    flex: 1, height: "64px",
                    fontSize: isValidate ? "24px" : isDelete ? "22px" : "28px",
                    fontFamily: "'Fredoka One', cursive",
                    background: isValidate ? "linear-gradient(135deg, #ffe082, #ff9800)" : isDelete ? "rgba(255,100,100,.25)" : "rgba(255,255,255,.12)",
                    color: isValidate ? "#2d1b00" : "white",
                    border: isValidate ? "none" : `1px solid ${isDelete ? "rgba(255,100,100,.3)" : "rgba(255,255,255,.2)"}`,
                    borderRadius: "16px", cursor: "pointer",
                    backdropFilter: "blur(8px)",
                    boxShadow: isValidate ? "0 4px 15px rgba(255,160,0,.35)" : "0 2px 8px rgba(0,0,0,.2)",
                    transition: "transform .08s, opacity .08s",
                    userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation",
                  }}
                  onPointerEnter={e => e.currentTarget.style.opacity = ".85"}
                  onPointerLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsScreen({ globalStyle, bgStyle, stars, selectedTables, onSave }) {
  const [draft, setDraft] = useState(new Set(selectedTables));

  function toggle(t) {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(t) && next.size === 1) return prev; // au moins une table
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  function selectAll() { setDraft(new Set(ALL_TABLES)); }
  function selectHard() { setDraft(new Set([6, 7, 8, 9])); }

  return (
    <div style={{
      ...bgStyle,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
    }}>
      <style>{globalStyle}</style>

      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "white", opacity: 0.25,
          animation: `twinkle ${s.dur} ${s.delay} infinite ease-in-out`,
          pointerEvents: "none",
        }} />
      ))}

      <div style={{
        width: "100%", maxWidth: "360px", zIndex: 1,
        background: "rgba(255,255,255,.08)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,.15)",
        borderRadius: "28px", padding: "28px 24px",
        animation: "fadeIn .25s ease",
      }}>
        <h2 style={{ color: "#ffe082", margin: "0 0 6px", fontSize: "26px", textAlign: "center" }}>
          ⚙️ Tables à travailler
        </h2>
        <p style={{ color: "rgba(255,255,255,.5)", margin: "0 0 20px", textAlign: "center", fontSize: "14px", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
          Sélectionne les tables que Clément doit réviser
        </p>

        {/* Shortcuts */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {[
            { label: "Toutes", action: selectAll },
            { label: "Difficiles (6→9)", action: selectHard },
          ].map(({ label, action }) => (
            <button key={label} onPointerDown={e => { e.preventDefault(); action(); }} style={{
              flex: 1, padding: "8px", fontSize: "13px",
              fontFamily: "'Nunito', sans-serif", fontWeight: 800,
              background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.8)",
              border: "1px solid rgba(255,255,255,.2)", borderRadius: "10px",
              cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {/* Grille de tables */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
          {ALL_TABLES.map(t => {
            const on = draft.has(t);
            return (
              <button
                key={t}
                onPointerDown={e => { e.preventDefault(); toggle(t); }}
                style={{
                  height: "60px", fontSize: "22px",
                  fontFamily: "'Fredoka One', cursive",
                  background: on ? "linear-gradient(135deg, #ffe082, #ff9800)" : "rgba(255,255,255,.08)",
                  color: on ? "#2d1b00" : "rgba(255,255,255,.5)",
                  border: on ? "none" : "1px solid rgba(255,255,255,.15)",
                  borderRadius: "14px", cursor: "pointer",
                  boxShadow: on ? "0 4px 14px rgba(255,160,0,.4)" : "none",
                  transition: "all .15s",
                  transform: on ? "scale(1.04)" : "scale(1)",
                }}
              >
                ×{t}
              </button>
            );
          })}
        </div>

        {/* Bouton Jouer */}
        <button
          onPointerDown={e => { e.preventDefault(); onSave([...draft].sort((a, b) => a - b)); }}
          style={{
            width: "100%", padding: "16px", fontSize: "22px",
            fontFamily: "'Fredoka One', cursive",
            background: "linear-gradient(135deg, #ffe082, #ff9800)",
            color: "#2d1b00", border: "none", borderRadius: "16px",
            cursor: "pointer", boxShadow: "0 4px 15px rgba(255,160,0,.4)",
          }}
        >
          ▶ Jouer ({draft.size} table{draft.size > 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}
