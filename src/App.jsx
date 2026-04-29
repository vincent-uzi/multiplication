import { useState, useEffect, useRef } from "react";

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getRandomQ() {
  const a = TABLES[Math.floor(Math.random() * TABLES.length)];
  const b = TABLES[Math.floor(Math.random() * TABLES.length)];
  return { a, b, answer: a * b };
}

const stars = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${8 + Math.random() * 14}px`,
  delay: `${Math.random() * 3}s`,
  dur: `${2 + Math.random() * 2}s`,
}));

export default function App() {
  const [question, setQuestion] = useState(getRandomQ);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState(null); // null | "correct" | "wrong"
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [particles, setParticles] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, [question]);

  function spawnParticles() {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      emoji: ["⭐", "🎉", "✨", "🌟", "💫"][Math.floor(Math.random() * 5)],
      x: 40 + Math.random() * 20,
      y: 40 + Math.random() * 20,
      dx: (Math.random() - 0.5) * 160,
      dy: -60 - Math.random() * 100,
    }));
    setParticles(items);
    setTimeout(() => setParticles([]), 900);
  }

  function validate() {
    const val = parseInt(input, 10);
    if (isNaN(val)) return;

    if (val === question.answer) {
      setStatus("correct");
      setBounce(true);
      spawnParticles();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > best) setBest(newStreak);
      setTimeout(() => {
        setBounce(false);
        setStatus(null);
        setInput("");
        setQuestion(getRandomQ());
      }, 1100);
    } else {
      setStatus("wrong");
      setShake(true);
      setTimeout(() => { setShake(false); setStatus(null); setInput(""); }, 800);
      setStreak(0);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") validate();
  }

  const streakColor =
    streak >= 10 ? "#ff6b35" :
    streak >= 5  ? "#f7c59f" :
    streak >= 3  ? "#ffe082" : "#ffffff";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      fontFamily: "'Fredoka One', 'Comic Sans MS', cursive",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;700;800&display=swap');
        @keyframes twinkle { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-10px)} 40%,80%{transform:translateX(10px)} }
        @keyframes bounce { 0%,100%{transform:scale(1)} 30%{transform:scale(1.15)} 60%{transform:scale(0.95)} }
        @keyframes pop { 0%{opacity:1;transform:translate(0,0) scale(1)} 100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,200,50,.4)} 50%{box-shadow:0 0 0 14px rgba(255,200,50,0)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes correctFlash { 0%{background:rgba(100,255,150,.2)} 100%{background:transparent} }
        .input-field:focus { outline:none; }
      `}</style>

      {/* Stars background */}
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute", left: s.left, top: s.top,
          width: s.size, height: s.size, borderRadius: "50%",
          background: "white", opacity: 0.3,
          animation: `twinkle ${s.dur} ${s.delay} infinite ease-in-out`,
          pointerEvents: "none",
        }} />
      ))}

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`, top: `${p.y}%`,
          fontSize: "28px",
          "--dx": `${p.dx}px`, "--dy": `${p.dy}px`,
          animation: "pop 0.9s ease-out forwards",
          pointerEvents: "none", zIndex: 99,
        }}>{p.emoji}</div>
      ))}

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "32px", animation: "slideIn .5s ease" }}>
        <div style={{ fontSize: "44px", marginBottom: "4px" }}>🧮</div>
        <h1 style={{
          color: "#ffe082", fontSize: "clamp(28px, 6vw, 42px)",
          margin: 0, textShadow: "0 2px 10px rgba(255,200,50,.5)",
          fontFamily: "'Fredoka One', cursive",
          letterSpacing: "1px",
        }}>Les Tables de Multiplication</h1>
      </div>

      {/* Streak */}
      <div style={{
        display: "flex", gap: "16px", marginBottom: "28px",
        fontFamily: "'Nunito', sans-serif",
      }}>
        <div style={{
          background: "rgba(255,255,255,.1)", borderRadius: "16px",
          padding: "10px 22px", textAlign: "center", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.15)",
        }}>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Série</div>
          <div style={{ color: streakColor, fontSize: "32px", fontWeight: 800, lineHeight: 1, transition: "color .3s" }}>
            {streak} {streak >= 5 ? "🔥" : streak >= 3 ? "⭐" : ""}
          </div>
        </div>
        <div style={{
          background: "rgba(255,255,255,.1)", borderRadius: "16px",
          padding: "10px 22px", textAlign: "center", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,.15)",
        }}>
          <div style={{ color: "rgba(255,255,255,.6)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Record</div>
          <div style={{ color: "#f7c59f", fontSize: "32px", fontWeight: 800, lineHeight: 1 }}>
            {best} {best >= 10 ? "🏆" : best >= 5 ? "🥇" : ""}
          </div>
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: status === "correct"
          ? "rgba(100,255,150,.12)"
          : status === "wrong"
          ? "rgba(255,80,80,.12)"
          : "rgba(255,255,255,.08)",
        backdropFilter: "blur(16px)",
        border: `2px solid ${status === "correct" ? "rgba(100,255,150,.4)" : status === "wrong" ? "rgba(255,80,80,.4)" : "rgba(255,255,255,.15)"}`,
        borderRadius: "28px",
        padding: "40px 48px",
        textAlign: "center",
        maxWidth: "380px", width: "100%",
        animation: shake ? "shake .4s ease" : bounce ? "bounce .5s ease" : "slideIn .4s ease",
        transition: "background .3s, border-color .3s",
        position: "relative",
      }}>

        {/* Question */}
        <div style={{
          fontSize: "clamp(48px, 12vw, 72px)",
          color: "white",
          fontFamily: "'Fredoka One', cursive",
          marginBottom: "28px",
          textShadow: "0 4px 20px rgba(0,0,0,.3)",
          lineHeight: 1,
        }}>
          {question.a} × {question.b} = ?
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          className="input-field"
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="?"
          style={{
            width: "100%",
            fontSize: "36px",
            fontFamily: "'Fredoka One', cursive",
            textAlign: "center",
            background: "rgba(255,255,255,.1)",
            border: `2px solid ${status === "correct" ? "rgba(100,255,150,.6)" : status === "wrong" ? "rgba(255,100,100,.6)" : "rgba(255,255,255,.25)"}`,
            borderRadius: "16px",
            padding: "14px",
            color: "white",
            marginBottom: "20px",
            boxSizing: "border-box",
            transition: "border-color .3s",
            caretColor: "#ffe082",
          }}
        />

        {/* Button */}
        <button
          onClick={validate}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #ffe082, #ff9800)",
            border: "none",
            borderRadius: "14px",
            padding: "16px",
            fontSize: "22px",
            fontFamily: "'Fredoka One', cursive",
            color: "#2d1b00",
            cursor: "pointer",
            transition: "transform .1s, box-shadow .1s",
            boxShadow: "0 4px 15px rgba(255,160,0,.4)",
            animation: status === null && streak > 0 ? "pulse 2s infinite" : "none",
          }}
          onMouseDown={e => e.currentTarget.style.transform = "scale(.97)"}
          onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
        >
          ✅ Valider
        </button>

        {/* Feedback */}
        {status && (
          <div style={{
            marginTop: "18px",
            fontSize: "26px",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            color: status === "correct" ? "#69ff9c" : "#ff7070",
            animation: "slideIn .2s ease",
          }}>
            {status === "correct"
              ? ["Super ! 🎉", "Bravo ! ⭐", "Excellent ! 🌟", "Parfait ! 🏆"][streak % 4]
              : "Réessaie ! 💪"}
          </div>
        )}
      </div>

      {/* Encouragement */}
      {streak >= 3 && (
        <div style={{
          marginTop: "20px",
          color: "rgba(255,255,255,.7)",
          fontSize: "16px",
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700,
          animation: "slideIn .4s ease",
        }}>
          {streak >= 10 ? "🔥 Tu es inarrêtable !" :
           streak >= 7  ? "🌟 Incroyable, continue !" :
           streak >= 5  ? "⭐ Tu es en feu !" :
                          "👏 C'est parti, continue !"}
        </div>
      )}

      <div style={{
        marginTop: "24px",
        color: "rgba(255,255,255,.3)",
        fontSize: "13px",
        fontFamily: "'Nunito', sans-serif",
      }}>Appuie sur Entrée ou clique Valider</div>
    </div>
  );
}
