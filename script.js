:root{
  --bg:#0b0f1a;
  --card: rgba(255,255,255,0.06);
  --stroke: rgba(255,255,255,0.12);
  --text: rgba(255,255,255,0.92);
  --muted: rgba(255,255,255,0.68);
  --accent:#60a5fa;
  --good:#22c55e;
  --warn:#f59e0b;
}

*{ box-sizing:border-box }

body{
  margin:0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  background: radial-gradient(1200px 600px at 20% 10%, rgba(96,165,250,0.25), transparent),
              radial-gradient(900px 500px at 90% 30%, rgba(245,158,11,0.18), transparent),
              var(--bg);
  color: var(--text);
  min-height:100vh;
  padding:28px;
}

header{
  max-width:1200px;
  margin:0 auto 18px;
  display:flex;
  gap:16px;
  align-items:flex-end;
  justify-content:space-between;
  flex-wrap:wrap;
}

h1{ margin:0; font-size:28px; }
.sub{ color:var(--muted); font-size:14px; margin-top:6px; }

.pill{
  border:1px solid var(--stroke);
  background:rgba(0,0,0,0.22);
  padding:10px 12px;
  border-radius:999px;
  display:flex;
  gap:10px;
  align-items:center;
}

.pill input{
  background:transparent;
  border:none;
  outline:none;
  color:var(--text);
  width:360px;
}

.wrap{
  max-width:1200px;
  margin:0 auto;
  display:grid;
  gap:14px;
}

.card{
  border:1px solid var(--stroke);
  background:linear-gradient(180deg, rgba(255,255,255,0.07), rgba(0,0,0,0.12));
  border-radius:18px;
  padding:16px;
  box-shadow:0 22px 70px rgba(0,0,0,0.35);
}

.row{
  display:grid;
  grid-template-columns:220px 1fr;
  gap:14px;
}

@media (max-width:860px){
  .row{ grid-template-columns:1fr; }
}

.meta h2{ margin:0 0 6px; font-size:18px; }
.meta .desc{ font-size:13px; color:var(--muted); }

.tags{ display:flex; gap:8px; flex-wrap:wrap; }
.tag{
  font-size:12px;
  padding:6px 10px;
  border-radius:999px;
  border:1px solid var(--stroke);
  background:rgba(0,0,0,0.18);
  color:var(--muted);
}

.form{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}

@media (max-width:860px){
  .form{ grid-template-columns:1fr; }
}

.field{
  border:1px solid var(--stroke);
  background:rgba(0,0,0,0.18);
  border-radius:14px;
  padding:10px 12px;
}

.field label{
  font-size:12px;
  color:var(--muted);
  margin-bottom:6px;
  display:block;
}

.field input{
  width:100%;
  border:none;
  outline:none;
  background:transparent;
  color:var(--text);
}

.actions{
  display:flex;
  flex-wrap:wrap;
  gap:10px;
  justify-content:space-between;
  margin-top:10px;
}

button{
  border:1px solid var(--stroke);
  background:rgba(0,0,0,0.22);
  color:var(--text);
  padding:10px 12px;
  border-radius:14px;
  cursor:pointer;
  font-weight:700;
}

button.primary{
  border-color:rgba(96,165,250,0.45);
  background:rgba(96,165,250,0.16);
}

button.good{
  border-color:rgba(34,197,94,0.45);
  background:rgba(34,197,94,0.14);
}

button.warn{
  border-color:rgba(245,158,11,0.55);
  background:rgba(245,158,11,0.14);
}

.out{
  margin-top:10px;
  border:1px dashed rgba(255,255,255,0.2);
  background:rgba(0,0,0,0.18);
  border-radius:14px;
  padding:12px;
}

.out .label{ font-size:12px; color:var(--muted); }
.out .url{ font-size:13px; word-break:break-all; }

.toast{
  position:fixed;
  left:50%;
  bottom:18px;
  transform:translateX(-50%);
  background:rgba(0,0,0,0.65);
  border:1px solid rgba(255,255,255,0.18);
  padding:10px 12px;
  border-radius:999px;
  opacity:0;
  transition:opacity .2s ease;
}

.toast.show{ opacity:1; }
