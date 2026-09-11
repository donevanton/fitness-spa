import { supabase, supabaseConfigured, getWorkoutHistory, getWorkoutProgress, saveWorkoutProgress, saveWorkoutSession, updateWorkoutSession } from "./supabase";
import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {Dumbbell,CalendarDays,ChartNoAxesCombined,Timer,Check,ChevronRight,RotateCcw,Settings,Menu, X, Moon, Sun} from "lucide-react";
import {LineChart,Line,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from "recharts";
import "./styles.css";

type Ex={name:string;sets:number;reps:string;rest:number;muscles:string;cue:string;iso?:string};
type Day={id:string;name:string;focus:string;duration:string;ex:Ex[];mobility:string[]};

const days:Day[]=[
{id:"mon",name:"Monday",focus:"Full Body A · Strength",duration:"60–70 min",ex:[
{name:"Pull-ups",sets:4,reps:"5–8",rest:180,muscles:"Back · biceps",cue:"Start from a controlled hang. Pull elbows toward ribs; avoid swinging."},
{name:"Push-ups",sets:4,reps:"8–15",rest:120,muscles:"Chest · triceps",cue:"Brace the trunk and keep elbows roughly 30–45° from your body."},
{name:"KB Goblet Squat",sets:4,reps:"8–12",rest:150,muscles:"Quads · glutes",cue:"Brace, sit between the hips and reach a comfortable full depth."},
{name:"Ring Row",sets:3,reps:"8–15",rest:90,muscles:"Upper back · biceps",cue:"Keep the body rigid and pull the rings toward your lower ribs."},
{name:"KB Romanian Deadlift",sets:3,reps:"10–15",rest:120,muscles:"Hamstrings · glutes",cue:"Push hips back, keep spine neutral and control the eccentric."},
],mobility:["Deep squat pry · 60 sec","Couch stretch · 45 sec/side","Thoracic rotations · 8/side","Passive hang · 30–45 sec"]},
{id:"tue",name:"Tuesday",focus:"Full Body B · Hypertrophy",duration:"~60 min",ex:[
{name:"Feet-elevated Push-ups",sets:3,reps:"10–15",rest:90,muscles:"Chest · triceps",cue:"Use a stable elevation and move through a controlled range."},
{name:"Chin-ups / Assisted Chin-ups",sets:3,reps:"6–10",rest:120,muscles:"Lats · biceps",cue:"Pull the chest toward the bar and lower under control."},
{name:"Bulgarian Split Squat",sets:3,reps:"8–12/leg",rest:120,muscles:"Quads · glutes",cue:"Stay tall and let the front knee track naturally over the toes."},
{name:"Ring Hamstring Curl",sets:3,reps:"8–15",rest:90,muscles:"Hamstrings · glutes",cue:"Keep hips extended while curling the rings toward you."},
{name:"Ring Push-up",sets:3,reps:"8–15",rest:90,muscles:"Chest · shoulders · triceps",cue:"Control ring movement; keep ribs down."},
{name:"Band Face Pull",sets:3,reps:"15–20",rest:75,muscles:"Rear delts · upper back",cue:"Pull toward eye level with elbows high."},
{name:"Band Lateral Raise",sets:2,reps:"12–20",rest:60,muscles:"Side delts",cue:"Raise with control; stop before shrugging."},
],iso:"Ring support hold · 3 × 15–30 sec",mobility:["90/90 hip switches · 2×8/side","Shoulder extension stretch · 45 sec","Lat stretch · 45 sec/side","Ankle rocks · 10/side"]},
{id:"wed",name:"Wednesday",focus:"Full Body C · Strength + Control",duration:"~65 min",ex:[
{name:"Pull-ups",sets:4,reps:"4–8",rest:180,muscles:"Back · biceps",cue:"Make this your stronger pull-up day. Add resistance when ready."},
{name:"Pike Push-ups",sets:3,reps:"6–12",rest:120,muscles:"Shoulders · triceps",cue:"Drive head forward/down between hands, then press away."},
{name:"Front-loaded KB Squat",sets:3,reps:"10–15",rest:120,muscles:"Quads · glutes",cue:"Stay braced and use a controlled 2–3 sec lowering phase."},
{name:"Feet-elevated Ring Row",sets:3,reps:"8–12",rest:120,muscles:"Back · biceps",cue:"Keep hips high and pull rings toward ribs."},
{name:"Single-leg KB RDL",sets:3,reps:"8–12/leg",rest:90,muscles:"Hamstrings · glutes",cue:"Hinge at the hip; keep the pelvis square."},
{name:"Band Triceps Extension",sets:2,reps:"12–20",rest:75,muscles:"Triceps",cue:"Keep upper arms stable and fully extend without snapping."},
],iso:"Hollow-body hold · 3 × 20–40 sec + scapular pull-up hold · 2 × 15–25 sec",mobility:["Cossack squat · 6/side","Thoracic extension · 8","Passive hang · 30–60 sec","Very light Jefferson curl · 8"]},
{id:"thu",name:"Thursday",focus:"Full Body D · Volume + Technique",duration:"~55–60 min",ex:[
{name:"Push-ups",sets:3,reps:"12–20",rest:90,muscles:"Chest · triceps",cue:"Leave about 2–3 reps in reserve."},
{name:"Band-assisted Pull-ups",sets:3,reps:"8–12",rest:120,muscles:"Back · biceps",cue:"Use assistance to keep every rep smooth."},
{name:"Reverse Lunge",sets:3,reps:"10–15/leg",rest:90,muscles:"Quads · glutes",cue:"Step back softly and drive through the front foot."},
{name:"Ring Row",sets:3,reps:"12–15",rest:90,muscles:"Upper back · biceps",cue:"Pause briefly at the top."},
{name:"KB Swing",sets:3,reps:"12–20",rest:90,muscles:"Glutes · hamstrings",cue:"Hinge and snap the hips; don't turn it into a squat."},
{name:"Band Lateral Raise",sets:2,reps:"15–25",rest:60,muscles:"Side delts",cue:"Use clean reps rather than momentum."},
{name:"Band Curl",sets:2,reps:"12–20",rest:60,muscles:"Biceps",cue:"Keep elbows still and squeeze at the top."},
],iso:"Split-squat hold · 2 × 30–45 sec/leg",mobility:["Deep squat hold · 60 sec","90/90 · 60 sec/side","Wall shoulder slides · 10","Wrist extension mobility · 60 sec","Calf stretch · 45 sec/side"]},
{id:"fri",name:"Friday",focus:"Full Body E · Strength + Pump",duration:"~60–70 min",ex:[
{name:"Pull-ups",sets:3,reps:"5–8",rest:180,muscles:"Back · biceps",cue:"Use the hardest clean variation you can repeat."},
{name:"Difficult Push-up Variation",sets:3,reps:"8–12",rest:120,muscles:"Chest · triceps",cue:"Progress leverage or band resistance once the range is owned."},
{name:"Bulgarian Split Squat",sets:3,reps:"8–12/leg",rest:120,muscles:"Quads · glutes",cue:"Use controlled depth and stable balance."},
{name:"Ring Hamstring Curl",sets:3,reps:"10–15",rest:90,muscles:"Hamstrings · glutes",cue:"Keep hips up as you curl."},
{name:"Ring Row",sets:3,reps:"8–15",rest:90,muscles:"Back · biceps",cue:"Use a harder body angle when ready."},
{name:"KB Overhead Press",sets:2,reps:"8–12/arm",rest:90,muscles:"Shoulders · triceps",cue:"Brace hard and finish with the arm stacked over shoulder."},
{name:"Band Curl + Triceps Extension",sets:2,reps:"12–20 each",rest:60,muscles:"Arms",cue:"Controlled reps; stop 1–2 reps before failure."},
],iso:"Tuck L-sit / L-sit · 3 × 10–30 sec",mobility:["Pancake stretch · 60 sec","Hip flexor stretch · 45 sec/side","Lat stretch · 45 sec/side","Passive hang · 45 sec","Wrist mobility · 60 sec"]}
];

const phases=[
["Month 1","Foundation","RIR 2–3","Learn technique, establish baseline and own the ranges."],
["Month 2","Progressive overload","RIR 1–2","Add reps, resistance or a harder progression when all sets reach the top of the range."],
["Month 3","Intensification","RIR 1–2","Prioritize harder push-up, pull-up, squat and row variations."],
["Month 4","Performance","RIR 1–2","Consolidate strength and improve measurable performance."]
];

function fmt(s:number){return `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`}
function currentWeekStart(){
  const date=new Date();
  const day=date.getDay()||7;
  date.setDate(date.getDate()-day+1);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function App(){
  const [sessionUser, setSessionUser] = React.useState<any>(null);
  const [authEmail, setAuthEmail] = React.useState("");
  const [authPassword, setAuthPassword] = React.useState("");
  const [authBusy, setAuthBusy] = React.useState(false);
  const [authMessage, setAuthMessage] = React.useState("");

  React.useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setSessionUser(data.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

 const [tab,setTab]=useState<"today"|"plan"|"progress">("today");
 const [selected,setSelected]=useState("mon");
 const [completed,setCompleted]=useState<Record<string,number>>(()=>JSON.parse(localStorage.getItem("hf-completed")||"{}"));
 const [sessionIds,setSessionIds]=useState<Record<string,string>>({});
 const [sessionStarted,setSessionStarted]=useState<Record<string,string>>({});
 const [dark,setDark]=useState(()=>localStorage.getItem("hf-dark")==="1");
 const [timer,setTimer]=useState(0);
 const [running,setRunning]=useState(false);
 const day=days.find(d=>d.id===selected)!;
 useEffect(()=>localStorage.setItem("hf-completed",JSON.stringify(completed)),[completed]);
 useEffect(()=>{localStorage.setItem("hf-dark",dark?"1":"0");document.documentElement.dataset.theme=dark?"dark":"light"},[dark]);
 useEffect(()=>{if(!running||timer<=0)return;const x=setInterval(()=>setTimer(t=>t-1),1000);return()=>clearInterval(x)},[running,timer]);
 useEffect(()=>{if(timer===0)setRunning(false)},[timer]);
 useEffect(()=>{
   if(!sessionUser) return;
   getWorkoutProgress(currentWeekStart()).then(({data,error})=>{
     if(error){setAuthMessage(`Progress sync error: ${error.message}`);return;}
     setCompleted(previous=>{
       const next={...previous};
       data.forEach(row=>{
         Object.keys(next).filter(key=>key.startsWith(`${row.workout_day}-`)).forEach(key=>delete next[key]);
         Object.entries((row.completed||{}) as Record<string,number>).forEach(([key,value])=>{next[`${row.workout_day}-${key}`]=value});
       });
       return next;
     });
   });
 },[sessionUser]);
 const signInOrSignUp = async (createAccount:boolean) => {
   if (!supabase) return;
   if (!authEmail.trim() || authPassword.length < 6) {
     setAuthMessage("Enter an email and a password with at least 6 characters.");
     return;
   }
   setAuthBusy(true);
   setAuthMessage("");
   try {
     if (createAccount) {
       const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });
       if (error) throw error;
       setAuthMessage(data.session ? "Account created and signed in." : "Account created. Check your email to confirm it, then sign in.");
     } else {
       const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
       if (error) throw error;
       setAuthMessage("Signed in successfully.");
     }
   } catch (err:any) {
     setAuthMessage(err?.message || "Authentication failed.");
   } finally {
     setAuthBusy(false);
   }
 };

 const signOut = async () => {
   if (!supabase) return;
   const { error } = await supabase.auth.signOut();
   if (error) setAuthMessage(error.message);
   else setAuthMessage("Signed out.");
 };

 const checkCloudHistory = async () => {
   setAuthMessage("Checking cloud history…");
   const { data, error } = await getWorkoutHistory();
   if (error) setAuthMessage(`Cloud history error: ${error.message}`);
   else setAuthMessage(`Cloud history is working. ${data.length} workout session${data.length === 1 ? "" : "s"} found.`);
 };

 const doneSets=Object.values(completed).reduce((a,b)=>a+b,0);
 const totalSets=days.reduce((a,d)=>a+d.ex.reduce((x,e)=>x+e.sets,0),0);
 const progressData=days.map((d,i)=>({day:d.name.slice(0,3),sets:d.ex.reduce((a,e)=>a+e.sets,0),done:Object.entries(completed).filter(([k])=>k.startsWith(d.id+"-")).reduce((a,[,v])=>a+v,0)}));
 function toggle(exi:number){
   const key=`${day.id}-${exi}`;
   const current=completed[key]||0;
   const max=day.ex[exi].sets;
   const nextCount=current>=max?0:current+1;
   const nextCompleted={...completed,[key]:nextCount};
   setCompleted(nextCompleted);
   if(!sessionUser) return;

   const startedAt=sessionStarted[day.id]||new Date().toISOString();
  if(!sessionStarted[day.id]) setSessionStarted(previous=>({...previous,[day.id]:startedAt}));
   const dayCompleted=day.ex.reduce((total,exercise,index)=>total+(index===exi?nextCount:(nextCompleted[`${day.id}-${index}`]||0)),0);
   const dayTotal=day.ex.reduce((total,exercise)=>total+exercise.sets,0);
   const payload={completed:Object.fromEntries(day.ex.map((_,index)=>[index,nextCompleted[`${day.id}-${index}`]||0]))};
   const sessionPayload={week_start:currentWeekStart(),...payload};
   const sessionId=sessionIds[day.id];
   const finished=dayCompleted===dayTotal;
   (async()=>{
     const progressResult=await saveWorkoutProgress({week_start:currentWeekStart(),workout_day:day.id,completed:payload.completed});
     if(progressResult.error){setAuthMessage(`Progress sync error: ${progressResult.error.message}`);return;}
     if(sessionId){
       const result=await updateWorkoutSession(sessionId,{finished_at:finished?new Date().toISOString():null,duration_seconds:Math.round((Date.now()-new Date(startedAt).getTime())/1000),payload:sessionPayload});
       if(result.error) setAuthMessage(`Session sync error: ${result.error.message}`);
       return;
     }
     const result=await saveWorkoutSession({workout_day:day.id,started_at:startedAt,finished_at:finished?new Date().toISOString():null,duration_seconds:finished?Math.round((Date.now()-new Date(startedAt).getTime())/1000):null,payload:sessionPayload});
     if(result.error){setAuthMessage(`Session sync error: ${result.error.message}`);return;}
     if(result.data?.id){setSessionIds(previous=>({...previous,[day.id]:result.data.id}));setSessionStarted(previous=>({...previous,[day.id]:startedAt}));}
   })();
 }
 return <div className="app">
  <header><div className="brand"><div className="logo"><Dumbbell size={21}/></div><div><b>HOME FITNESS</b><span>5-DAY FULL BODY</span></div></div>
   <div className="header-actions"><button className="icon" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon"><Settings size={18}/></button></div>
  </header>
  <main>
    <section className="card" style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div>
          <strong>☁ Cloud Sync</strong>
          <div style={{fontSize:13,opacity:.75,marginTop:4}}>
            {!supabaseConfigured
              ? "Add Supabase credentials to enable sync."
              : sessionUser
                ? `Signed in: ${sessionUser.email}`
                : "Sign in to sync your progress across devices."}
          </div>
        </div>
        {sessionUser && <button onClick={signOut}>Sign out</button>}
      </div>
      {!sessionUser && supabaseConfigured && (
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          <input placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)} />
          <button disabled={authBusy} onClick={()=>signInOrSignUp(false)}>Sign in</button>
          <button disabled={authBusy} onClick={()=>signInOrSignUp(true)}>Create account</button>
        </div>
      )}
      {sessionUser && <button style={{marginTop:10}} onClick={checkCloudHistory}>Check cloud history</button>}
      {authMessage && <div style={{fontSize:13,marginTop:8}}>{authMessage}</div>}
    </section>
   <section className="hero"><div><div className="eyebrow">4-MONTH PROGRESSION</div><h5>Build strength.<br/><em>Move better.</em></h5><p>Home program using bands, kettlebells, rings and your pull-up bar.</p></div><div className="hero-stat"><strong>{Math.round(doneSets/Math.max(1,totalSets)*100)}%</strong><span>WEEK COMPLETE</span></div></section>
   <nav className="tabs">{[["today","Today",Dumbbell],["plan","Program",CalendarDays],["progress","Progress",ChartNoAxesCombined]].map(([id,label,Icon]:any)=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}><Icon size={17}/>{label}</button>)}</nav>
   {tab==="today"&&<><div className="day-strip">{days.map(d=><button onClick={()=>setSelected(d.id)} className={selected===d.id?"sel":""} key={d.id}><span>{d.name.slice(0,3)}</span><b>{d.name.slice(0,1)}</b></button>)}</div>
    <section className="section-head"><div><div className="eyebrow">{day.focus}</div><h2>{day.name}</h2></div><span className="pill">{day.duration}</span></section>
    <div className="callout"><b>Warm-up · 8 min</b><span>Wrist circles · band pull-aparts · scapular pulls · squat hold · hip circles · easy push-ups & squats.</span></div>
    <div className="exercise-list">{day.ex.map((e,i)=>{const n=completed[`${day.id}-${i}`]||0;return <article className={n===e.sets?"exercise done": "exercise"} key={e.name}><div className="ex-num">{String(i+1).padStart(2,"0")}</div><div className="ex-main"><div className="ex-title"><h3>{e.name}</h3><span>{e.muscles}</span></div><p>{e.cue}</p><div className="chips"><span>{e.sets} × {e.reps}</span><span>Rest {fmt(e.rest)}</span><span>RIR 1–3</span></div></div><button className="set-btn" onClick={()=>toggle(i)}><Check size={17}/><span>{n}/{e.sets}</span></button></article>})}</div>
    <div className="two-col"><div className="card"><div className="card-title"><Timer size={18}/> Rest timer</div><div className="timer">{fmt(timer)}</div><div className="timer-buttons">{[60,90,120,180].map(s=><button key={s} onClick={()=>{setTimer(s);setRunning(true)}}>{s/60}m</button>)}</div><button className="wide" onClick={()=>setRunning(!running)}>{running?"Pause":"Start"} timer</button></div>
    <div className="card"><div className="card-title"><RotateCcw size={18}/> Isometric</div><h3>{day.iso||"Ring support hold · 3 × 15–30 sec"}</h3><p>Use clean positions. Increase hold time or leverage difficulty gradually.</p></div></div>
    <div className="card mobility"><div className="card-title">Mobility · every workout</div>{day.mobility.map(x=><span key={x}>✓ {x}</span>)}</div>
   </>}
   {tab==="plan"&&<section><div className="section-head"><div><div className="eyebrow">MONDAY → FRIDAY</div><h2>Weekly program</h2></div><span className="pill">15–20 effective sets / muscle</span></div><div className="week-grid">{days.map(d=><button onClick={()=>{setSelected(d.id);setTab("today")}} className="week-card" key={d.id}><span>{d.name}</span><h3>{d.focus.split(" · ")[1]}</h3><p>{d.ex.length} exercises · {d.duration}</p><ChevronRight/></button>)}</div><div className="card progression"><div className="card-title">Monthly progression</div>{phases.map((p,i)=><div className="phase" key={p[0]}><div className="phase-no">{i+1}</div><div><b>{p[0]} · {p[1]}</b><small>{p[2]} · {p[3]}</small></div>{i<3&&<div className="arrow">→</div>}</div>)}<div className="deload"><b>Every 4th week: deload</b><span>Reduce working sets by ~40–50%, keep movement patterns, increase mobility.</span></div></div></section>}
   {tab==="progress"&&<section><div className="section-head"><div><div className="eyebrow">THIS WEEK</div><h2>Training progress</h2></div><span className="pill">{doneSets} / {totalSets} sets</span></div><div className="chart card"><ResponsiveContainer width="100%" height={300}><LineChart data={progressData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="day"/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="sets" stroke="currentColor" strokeWidth={2} name="Planned"/><Line type="monotone" dataKey="done" stroke="currentColor" strokeWidth={3} strokeDasharray="6 4" name="Completed"/></LineChart></ResponsiveContainer></div><div className="stats"><div><strong>{doneSets}</strong><span>sets done</span></div><div><strong>{totalSets}</strong><span>sets planned</span></div><div><strong>{Math.round(doneSets/Math.max(1,totalSets)*100)}%</strong><span>completion</span></div></div><div className="card"><div className="card-title">Progression rule</div><p>When every set reaches the top of the prescribed rep range with about 1–2 RIR, progress one variable: reps → resistance → harder variation → ROM → tempo/pauses.</p></div></section>}
  </main>
  <footer>Home Fitness · Built for bands, 12/16 kg kettlebells, rings & pull-up bar</footer>
 </div>
}
createRoot(document.getElementById("root")!).render(<App/>);