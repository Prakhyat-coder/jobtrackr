import { useState, useEffect, useMemo } from "react";
import {
  Briefcase, Plus, X, Edit3, Trash2, ExternalLink, Search,
  LayoutGrid, List, ChevronUp, ChevronDown, TrendingUp,
  CheckCircle, XCircle, Clock, Award, Flame, Filter,
  BarChart2, Calendar, Globe, FileText, ChevronRight, Star
} from "lucide-react";

const STATUSES = {
  Applied:     { color: "#60a5fa", bg: "rgba(96,165,250,0.15)",  border: "rgba(96,165,250,0.4)",  dot: "#60a5fa"  },
  Interviewing:{ color: "#a78bfa", bg: "rgba(167,139,250,0.15)", border: "rgba(167,139,250,0.4)", dot: "#a78bfa" },
  Offer:       { color: "#34d399", bg: "rgba(52,211,153,0.15)",  border: "rgba(52,211,153,0.4)",  dot: "#34d399"  },
  Rejected:    { color: "#f87171", bg: "rgba(248,113,113,0.15)", border: "rgba(248,113,113,0.4)", dot: "#f87171"  },
  Withdrawn:   { color: "#fbbf24", bg: "rgba(251,191,36,0.15)",  border: "rgba(251,191,36,0.4)",  dot: "#fbbf24"  },
};

const KANBAN_ORDER = ["Applied","Interviewing","Offer","Rejected","Withdrawn"];

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── Flask API hook ────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";
const API = `${API_BASE.replace(/\/$/, "")}/api/applications`;

function useApplications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(setApps)
      .catch(err => console.error("Failed to fetch applications:", err));
  }, []);

  const add = async (form) => {
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to create application: ${errData.error || res.statusText}`);
        return false;
      }
      const newApp = await res.json();
      setApps(prev => [newApp, ...prev]);
      return true;
    } catch (err) {
      alert("Network error: Unable to reach backend server. Please ensure python app.py is running.");
      console.error(err);
      return false;
    }
  };

  const update = async (id, form) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to update application: ${errData.error || res.statusText}`);
        return false;
      }
      const updated = await res.json();
      setApps(prev => prev.map(a => a.id === id ? updated : a));
      return true;
    } catch (err) {
      alert("Network error: Unable to reach backend server.");
      console.error(err);
      return false;
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApps(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete application:", err);
    }
  };

  return { apps, add, update, remove };
}
// ──────────────────────────────────────────────────────────────────────────

function StatusBadge({ status, small }) {
  const s = STATUSES[status] || STATUSES.Applied;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap: small?"4px":"6px",
      padding: small?"2px 8px":"4px 12px",
      borderRadius:"999px",
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      fontSize: small?"10px":"12px",
      fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase",
      whiteSpace:"nowrap"
    }}>
      <span style={{ width:small?5:6, height:small?5:6, borderRadius:"50%", background:s.dot, flexShrink:0 }} />
      {status}
    </span>
  );
}

const EMPTY_FORM = { company:"", title:"", date:today(), status:"Applied", url:"", notes:"" };

function Modal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const valid = form.company.trim() && form.title.trim() && form.date;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:"16px"
    }} onClick={onClose}>
      <div style={{
        background:"#0f1117", border:"1px solid rgba(255,255,255,0.1)",
        borderRadius:"20px", padding:"32px", width:"100%", maxWidth:"520px",
        boxShadow:"0 40px 80px rgba(0,0,0,0.6)",
        animation:"modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)"
      }} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"28px"}}>
          <h2 style={{margin:0,fontSize:"20px",fontWeight:700,color:"#f1f5f9",fontFamily:"'Syne',sans-serif"}}>
            {initial?.id ? "Edit Application" : "New Application"}
          </h2>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:"8px", color:"#94a3b8", cursor:"pointer", padding:"6px",
            display:"flex", alignItems:"center", justifyContent:"center"
          }}><X size={16}/></button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
          {[
            {k:"company",label:"Company",placeholder:"e.g. Stripe",col:"span 1"},
            {k:"title",label:"Job Title",placeholder:"e.g. Senior Engineer",col:"span 1"},
            {k:"date",label:"Application Date",type:"date",col:"span 1"},
            {k:"url",label:"Job URL",placeholder:"https://...",col:"span 1"},
            {k:"notes",label:"Notes",placeholder:"Any notes...",textarea:true,col:"1 / -1"},
          ].map(({k,label,placeholder,type,textarea,col})=>(
            <div key={k} style={{gridColumn:col}}>
              <label style={{display:"block",marginBottom:"6px",fontSize:"11px",fontWeight:600,
                color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</label>
              {textarea ? (
                <textarea value={form[k]} onChange={e=>set(k,e.target.value)}
                  placeholder={placeholder} rows={3}
                  style={{...inputStyle, resize:"vertical", minHeight:"72px"}}/>
              ) : (
                <input type={type||"text"} value={form[k]} onChange={e=>set(k,e.target.value)}
                  placeholder={placeholder} style={inputStyle}/>
              )}
            </div>
          ))}
          <div style={{gridColumn:"1 / -1"}}>
            <label style={{display:"block",marginBottom:"8px",fontSize:"11px",fontWeight:600,
              color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase"}}>Status</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {Object.keys(STATUSES).map(s=>(
                <button key={s} onClick={()=>set("status",s)} style={{
                  padding:"6px 14px", borderRadius:"999px", cursor:"pointer", fontWeight:600,
                  fontSize:"12px", border:`1.5px solid ${form.status===s?STATUSES[s].border:"rgba(255,255,255,0.08)"}`,
                  background: form.status===s ? STATUSES[s].bg : "transparent",
                  color: form.status===s ? STATUSES[s].color : "#64748b",
                  transition:"all 0.15s"
                }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"flex",gap:"12px",marginTop:"28px",justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{...btnSecondary}}>Cancel</button>
          <button onClick={()=>valid&&onSave(form)} style={{
            ...btnPrimary, opacity:valid?1:0.4, cursor:valid?"pointer":"not-allowed"
          }}>
            {initial?.id ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width:"100%", boxSizing:"border-box",
  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)",
  borderRadius:"10px", padding:"10px 14px", color:"#e2e8f0", fontSize:"14px",
  outline:"none", fontFamily:"inherit", transition:"border 0.15s"
};
const btnPrimary = {
  background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
  color:"#fff", border:"none", borderRadius:"10px", padding:"10px 22px",
  fontWeight:700, fontSize:"14px", cursor:"pointer", fontFamily:"inherit",
  boxShadow:"0 4px 20px rgba(99,102,241,0.4)", transition:"all 0.15s"
};
const btnSecondary = {
  background:"rgba(255,255,255,0.05)", color:"#94a3b8",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px",
  padding:"10px 22px", fontWeight:600, fontSize:"14px",
  cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s"
};

function DonutChart({ data }) {
  const total = data.reduce((a,b)=>a+b.value,0);
  if (!total) return <div style={{color:"#475569",textAlign:"center",fontSize:"13px",padding:"20px"}}>No data yet</div>;
  let offset = 0;
  const r = 54, cx=70, cy=70, stroke=14;
  const circ = 2*Math.PI*r;
  const slices = data.filter(d=>d.value>0).map(d=>{
    const pct = d.value/total;
    const s = { ...d, dasharray:`${pct*circ} ${circ}`, dashoffset:-offset*circ, pct };
    offset += pct;
    return s;
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:"24px",flexWrap:"wrap"}}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke}/>
        {slices.map((s,i)=>(
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={stroke} strokeDasharray={s.dasharray} strokeDashoffset={s.dashoffset}
            style={{transition:"all 0.5s ease",transformOrigin:"center",transform:"rotate(-90deg)"}}/>
        ))}
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {data.map((d,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",fontSize:"12px"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:d.color,flexShrink:0}}/>
            <span style={{color:"#94a3b8",minWidth:"90px"}}>{d.label}</span>
            <span style={{fontWeight:700,color:"#f1f5f9"}}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ app, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{
        background: hov?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)",
        border:"1px solid rgba(255,255,255,0.08)",
        borderRadius:"14px", padding:"16px",
        transition:"all 0.2s", cursor:"default",
        transform: hov?"translateY(-2px)":"none",
        boxShadow: hov?"0 8px 30px rgba(0,0,0,0.3)":"none"
      }}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,color:"#f1f5f9",fontSize:"13px",marginBottom:"3px",
            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.company}</div>
          <div style={{color:"#64748b",fontSize:"11px",overflow:"hidden",textOverflow:"ellipsis",
            whiteSpace:"nowrap"}}>{app.title}</div>
        </div>
        <div style={{display:"flex",gap:"4px",flexShrink:0}}>
          <button onClick={()=>onEdit(app)} style={{...iconBtn}}><Edit3 size={12}/></button>
          <button onClick={()=>onDelete(app.id)} style={{...iconBtn,color:"#f87171"}}><Trash2 size={12}/></button>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:"12px"}}>
        <span style={{color:"#475569",fontSize:"10px",display:"flex",alignItems:"center",gap:"4px"}}>
          <Calendar size={9}/>{app.date}
        </span>
        {app.url && (
          <a href={app.url} target="_blank" rel="noreferrer" style={{color:"#6366f1",display:"flex"}}>
            <ExternalLink size={10}/>
          </a>
        )}
      </div>
      {app.notes && (
        <div style={{marginTop:"8px",fontSize:"11px",color:"#475569",
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{app.notes}</div>
      )}
    </div>
  );
}

const iconBtn = {
  background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:"6px", color:"#64748b", cursor:"pointer", padding:"5px",
  display:"flex",alignItems:"center",justifyContent:"center", transition:"all 0.15s"
};

export default function App() {
  const { apps, add, update, remove } = useApplications();

  const [view, setView] = useState("list");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sort, setSort] = useState({key:"date",dir:"desc"});
  const [confirmDel, setConfirmDel] = useState(null);

  const stats = useMemo(()=>{
    const total = apps.length;
    const interviewing = apps.filter(a=>a.status==="Interviewing").length;
    const offers = apps.filter(a=>a.status==="Offer").length;
    const rejected = apps.filter(a=>a.status==="Rejected").length;
    const rate = total ? Math.round((rejected/total)*100) : 0;
    const thisMonth = apps.filter(a=>{
      const d = new Date(a.date), now = new Date();
      return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    }).length;
    return {total,interviewing,offers,rejected,rate,thisMonth};
  },[apps]);

  const donutData = useMemo(()=>[
    {label:"Applied",     value:apps.filter(a=>a.status==="Applied").length,      color:"#60a5fa"},
    {label:"Interviewing",value:apps.filter(a=>a.status==="Interviewing").length, color:"#a78bfa"},
    {label:"Offer",       value:apps.filter(a=>a.status==="Offer").length,        color:"#34d399"},
    {label:"Rejected",    value:apps.filter(a=>a.status==="Rejected").length,     color:"#f87171"},
    {label:"Withdrawn",   value:apps.filter(a=>a.status==="Withdrawn").length,    color:"#fbbf24"},
  ],[apps]);

  const filtered = useMemo(()=>{
    let r = apps.filter(a=>{
      const q = search.toLowerCase();
      const matchQ = !q || a.company.toLowerCase().includes(q)||a.title.toLowerCase().includes(q)||a.notes?.toLowerCase().includes(q);
      const matchS = filterStatus==="All"||a.status===filterStatus;
      return matchQ&&matchS;
    });
    r = [...r].sort((a,b)=>{
      let va=a[sort.key]||"", vb=b[sort.key]||"";
      if(sort.dir==="asc") return va>vb?1:-1;
      return va<vb?1:-1;
    });
    return r;
  },[apps,search,filterStatus,sort]);

  const handleSort = k => {
    setSort(s=>s.key===k ? {...s,dir:s.dir==="asc"?"desc":"asc"} : {key:k,dir:"asc"});
  };

  const handleSave = async (form) => {
    let ok = false;
    if (modal?.id) {
      ok = await update(modal.id, form);
    } else {
      ok = await add(form);
    }
    if (ok) {
      setModal(null);
    }
  };

  const handleDelete = async (id) => {
    await remove(id);
    setConfirmDel(null);
  };

  const motivational = () => {
    if(stats.offers>0) return ` ${stats.offers} offer${stats.offers>1?"s":""} in the pipeline — you're crushing it!`;
    if(stats.interviewing>0) return ` ${stats.interviewing} interview${stats.interviewing>1?"s":""} scheduled — keep the momentum!`;
    if(stats.thisMonth>=5) return ` ${stats.thisMonth} applications this month — outstanding hustle!`;
    if(stats.total>0) return ` ${stats.total} application${stats.total>1?"s":""} tracked — every step counts!`;
    return " Start tracking your job search journey!";
  };

  const SortIcon = ({k}) => sort.key===k
    ? (sort.dir==="asc"?<ChevronUp size={12}/>:<ChevronDown size={12}/>)
    : <ChevronDown size={12} style={{opacity:0.3}}/>;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#07090e; color:#cbd5e1; font-family:'Plus Jakarta Sans',sans-serif; min-height:100vh; }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      <div style={{maxWidth:"1280px",margin:"0 auto",padding:"32px 24px 80px"}}>

        {/* ── HEADER ── */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"36px",flexWrap:"wrap",gap:"16px"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"4px"}}>
              <div style={{width:36,height:36,borderRadius:"10px",background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(99,102,241,0.4)"}}>
                <Briefcase size={18} color="#fff"/>
              </div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"26px",fontWeight:800,color:"#f8fafc",letterSpacing:"-0.02em"}}>
                JobTrackr
              </h1>
            </div>
            <p style={{fontSize:"13px",color:"#64748b",margin:0}}>
              {motivational()}
            </p>
          </div>

          <button onClick={()=>setModal("add")} style={{
            ...btnPrimary, display:"flex",alignItems:"center",gap:"8px"
          }}>
            <Plus size={16}/> Add Application
          </button>
        </header>

        {/* ── STATS ROW ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"32px"}}
          className="fade-up">
          {[
            {label:"Total Applications",val:stats.total,icon:Briefcase,color:"#6366f1",bg:"rgba(99,102,241,0.12)"},
            {label:"Interviewing",val:stats.interviewing,icon:Clock,color:"#a78bfa",bg:"rgba(167,139,250,0.12)"},
            {label:"Offers Received",val:stats.offers,icon:Award,color:"#34d399",bg:"rgba(52,211,153,0.12)"},
            {label:"Rejection Rate",val:`${stats.rate}%`,icon:TrendingUp,color:"#f87171",bg:"rgba(248,113,113,0.12)"},
          ].map((c,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:"16px",padding:"20px",display:"flex",alignItems:"center",gap:"16px"}}>
              <div style={{width:44,height:44,borderRadius:"12px",background:c.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <c.icon size={20} color={c.color}/>
              </div>
              <div>
                <div style={{fontSize:"22px",fontWeight:800,color:"#f8fafc",lineHeight:1.1}}>{c.val}</div>
                <div style={{fontSize:"12px",color:"#64748b",marginTop:"3px"}}>{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ANALYTICS ROW ── */}
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:"20px",padding:"24px",marginBottom:"32px"}} className="fade-up">
          <h3 style={{fontSize:"14px",fontWeight:700,color:"#94a3b8",letterSpacing:"0.06em",
            textTransform:"uppercase",marginBottom:"20px",display:"flex",alignItems:"center",gap:"8px"}}>
            <BarChart2 size={16} color="#6366f1"/> Pipeline Breakdown
          </h3>
          <DonutChart data={donutData}/>
        </div>

        {/* ── CONTROLS / TOOLBAR ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px",flexWrap:"wrap",gap:"14px"}}
          className="fade-up">
          <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",flex:1,minWidth:"280px"}}>
            {/* Search */}
            <div style={{position:"relative",flex:1,maxWidth:"320px"}}>
              <Search size={15} style={{position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#475569"}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search company, title..."
                style={{...inputStyle,paddingLeft:"36px",fontSize:"13px"}}/>
              {search && (
                <button onClick={()=>setSearch("")} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",color:"#64748b",cursor:"pointer"}}><X size={13}/></button>
              )}
            </div>

            {/* Filter pills */}
            <div style={{display:"flex",gap:"6px",overflowX:"auto",paddingBottom:"2px"}}>
              {["All",...KANBAN_ORDER].map(s=>(
                <button key={s} onClick={()=>setFilterStatus(s)} style={{
                  padding:"6px 12px", borderRadius:"999px", cursor:"pointer", fontSize:"12px", fontWeight:600,
                  border: filterStatus===s ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  background: filterStatus===s ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                  color: filterStatus===s ? "#a5b4fc" : "#64748b", transition:"all 0.15s", whiteSpace:"nowrap"
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"4px"}}>
            {[
              {v:"list",icon:List,label:"List"},
              {v:"kanban",icon:LayoutGrid,label:"Board"}
            ].map(({v,icon:Icon,label})=>(
              <button key={v} onClick={()=>setView(v)} style={{
                display:"flex",alignItems:"center",gap:"6px",padding:"6px 14px",borderRadius:"7px",
                border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,
                background: view===v ? "rgba(99,102,241,0.3)" : "transparent",
                color: view===v ? "#fff" : "#64748b", transition:"all 0.15s"
              }}>
                <Icon size={14}/> {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:"20px",overflow:"hidden"}} className="fade-up">
            {filtered.length === 0 ? (
              <div style={{padding:"60px 20px",textAlign:"center",color:"#475569"}}>
                <Briefcase size={36} style={{marginBottom:"12px",opacity:0.3}}/>
                <div style={{fontSize:"15px",fontWeight:600}}>No applications found</div>
                <div style={{fontSize:"13px",marginTop:"4px"}}>Try adjusting your search or filters</div>
              </div>
            ) : (
              <table style={{width:"100%",borderCollapse:"collapse",textAlign:"left",fontSize:"13px"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid rgba(255,255,255,0.06)",color:"#475569",fontSize:"11px",
                    textTransform:"uppercase",letterSpacing:"0.08em"}}>
                    <th style={{padding:"14px 20px",cursor:"pointer"}} onClick={()=>handleSort("company")}>
                      Company <SortIcon k="company"/>
                    </th>
                    <th style={{padding:"14px 20px",cursor:"pointer"}} onClick={()=>handleSort("title")}>
                      Job Title <SortIcon k="title"/>
                    </th>
                    <th style={{padding:"14px 20px",cursor:"pointer"}} onClick={()=>handleSort("date")}>
                      Date <SortIcon k="date"/>
                    </th>
                    <th style={{padding:"14px 20px"}}>Status</th>
                    <th style={{padding:"14px 20px"}}>Notes</th>
                    <th style={{padding:"14px 20px",textAlign:"right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app=>(
                    <tr key={app.id} style={{borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <td style={{padding:"14px 20px",fontWeight:700,color:"#f1f5f9"}}>
                        {app.company}
                        {app.url && (
                          <a href={app.url} target="_blank" rel="noreferrer"
                            style={{marginLeft:"8px",color:"#6366f1",display:"inline-flex",alignItems:"center"}}>
                            <ExternalLink size={11}/>
                          </a>
                        )}
                      </td>
                      <td style={{padding:"14px 20px",color:"#94a3b8"}}>{app.title}</td>
                      <td style={{padding:"14px 20px",color:"#64748b",fontVariantNumeric:"tabular-nums"}}>{app.date}</td>
                      <td style={{padding:"14px 20px"}}><StatusBadge status={app.status}/></td>
                      <td style={{padding:"14px 20px",color:"#475569",maxWidth:"220px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {app.notes || "—"}
                      </td>
                      <td style={{padding:"14px 20px",textAlign:"right"}}>
                        <div style={{display:"inline-flex",gap:"6px"}}>
                          <button onClick={()=>setModal(app)} style={iconBtn}><Edit3 size={13}/></button>
                          <button onClick={()=>setConfirmDel(app.id)} style={{...iconBtn,color:"#f87171"}}><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── KANBAN VIEW ── */}
        {view === "kanban" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:"16px"}}
            className="fade-up">
            {KANBAN_ORDER.map(status=>{
              const cols = filtered.filter(a=>a.status===status);
              const s = STATUSES[status];
              return (
                <div key={status} style={{background:"rgba(255,255,255,0.02)",
                  border:"1px solid rgba(255,255,255,0.06)",borderTop:`2px solid ${s.dot}`,
                  borderRadius:"14px",padding:"16px",minHeight:"200px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
                    <span style={{fontSize:"11px",fontWeight:700,color:s.color,textTransform:"uppercase",
                      letterSpacing:"0.08em"}}>{status}</span>
                    <span style={{background:s.bg,color:s.color,border:`1px solid ${s.border}`,
                      borderRadius:"999px",padding:"2px 8px",fontSize:"11px",fontWeight:700}}>{cols.length}</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                    {cols.length===0&&(
                      <div style={{color:"#2d3748",fontSize:"12px",textAlign:"center",padding:"20px 0"}}>Empty</div>
                    )}
                    {cols.map(app=>(
                      <KanbanCard key={app.id} app={app}
                        onEdit={a=>setModal(a)}
                        onDelete={id=>setConfirmDel(id)}/>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop:"32px",textAlign:"center",color:"#2d3748",fontSize:"11px"}}>
          JobTrackr · {apps.length} application{apps.length!==1?"s":""} tracked
        </div>
      </div>

      {modal && (
        <Modal
          onClose={()=>setModal(null)}
          onSave={handleSave}
          initial={modal==="add" ? null : modal}
        />
      )}

      {confirmDel && (
        <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.7)",
          backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
          onClick={()=>setConfirmDel(null)}>
          <div style={{background:"#0f1117",border:"1px solid rgba(248,113,113,0.3)",
            borderRadius:"20px",padding:"32px",maxWidth:"360px",width:"100%",
            textAlign:"center",animation:"modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{width:52,height:52,borderRadius:"16px",background:"rgba(248,113,113,0.15)",
              display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
              <Trash2 size={22} color="#f87171"/>
            </div>
            <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:"18px",fontWeight:700,marginBottom:"8px",color:"#f1f5f9"}}>
              Delete Application?
            </h3>
            <p style={{color:"#64748b",fontSize:"13px",marginBottom:"24px"}}>This action cannot be undone.</p>
            <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
              <button onClick={()=>setConfirmDel(null)} style={btnSecondary}>Cancel</button>
              <button onClick={()=>handleDelete(confirmDel)} style={{
                ...btnPrimary,
                background:"linear-gradient(135deg,#ef4444,#dc2626)",
                boxShadow:"0 4px 20px rgba(239,68,68,0.4)"
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}