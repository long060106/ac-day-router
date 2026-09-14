(function(){
"use strict";

/* ============================================================
   CITY TABLE — ni = miles north along the I-95/Turnpike corridor
   (0 = Homestead, 79 = West Palm Beach). Zone is derived from ni.
   ============================================================ */
var CITIES=[
["Homestead",0],["Country Walk",14],["Cutler Bay",10],["Richmond Heights",15],
["Palmetto Bay",14],["Pinecrest",17],["Kendall",18],["South Miami",20],
["Coral Gables",22],["Key Biscayne",22],["Westchester",22],["Miami",24],
["Sweetwater",24],["Miami Beach",26],["Doral",27],["Miami Springs",27],
["Hialeah",29],["Hialeah Gardens",30],["North Miami",31],["Opa-locka",31],
["Miami Lakes",32],["Miami Gardens",34],["North Miami Beach",34],["Aventura",37],
["Sunny Isles Beach",37],["Miramar",38],["Hallandale Beach",39],["Pembroke Pines",40],
["Hollywood",42],["Cooper City",43],["Dania Beach",44],["Davie",46],
["Weston",46],["Plantation",47],["Fort Lauderdale",48],["Sunrise",49],
["Lauderhill",49],["Wilton Manors",50],["Oakland Park",51],["Lauderdale Lakes",51],
["Tamarac",53],["North Lauderdale",53],["Pompano Beach",54],["Margate",55],
["Coconut Creek",56],["Lighthouse Point",56],["Coral Springs",57],["Deerfield Beach",58],
["Hillsboro Beach",58],["Parkland",60],["Boca Raton",62],["Highland Beach",64],
["Delray Beach",67],["Boynton Beach",71],["Wellington",74],["Lake Worth",75],
["West Palm Beach",79]
];
var CITY_NI={};CITIES.forEach(function(c){CITY_NI[c[0]]=c[1];});

/* Zones name stretches of the corridor. Since Stage 06 they only label a
   truck's area; they no longer decide which day anyone is visited. */
var ZONES=[
 {id:"Z1",name:"Dade",       range:"Homestead → Miami Lakes",       max:32},
 {id:"Z2",name:"The Line",   range:"North Dade → Hollywood/Davie",  max:45},
 {id:"Z3",name:"Lauderdale", range:"Plantation → Oakland Park",     max:52},
 {id:"Z4",name:"North",      range:"Pompano → Boca & up",           max:999}
];
function zoneOf(ni){for(var i=0;i<ZONES.length;i++){if(ni<=ZONES[i].max)return ZONES[i];}return ZONES[3];}

/* ============================================================
   SYMPTOMS — base minutes: 1 tech, <=2.5 ton, easy access
   ============================================================ */
var SYMPTOMS=[
 {id:"nocool_dead", label:"No cool — nothing runs",  min:100},
 {id:"nocool_warm", label:"Runs, blows warm",            min:120},
 {id:"water",       label:"Water leaking / ceiling",     min:60},
 {id:"ice",         label:"Ice on the lines",            min:90, twoVisit:true},
 {id:"breaker",     label:"Breaker keeps tripping",      min:120},
 {id:"noise",       label:"Loud noise / squeal",         min:90},
 {id:"airflow",     label:"Weak airflow",                min:100},
 {id:"smell",       label:"Smell / musty",               min:75},
 {id:"stat",        label:"Thermostat dead",             min:45},
 {id:"leak",        label:"Refrigerant leak search",     min:150},
 {id:"board",       label:"Control board",               min:180},
 {id:"comp",        label:"Compressor job",              min:330},
 {id:"duct",        label:"Duct / airflow work",         min:150},
 {id:"pm",          label:"Maintenance / tune-up",       min:60},
 {id:"quote",       label:"Estimate visit",              min:30},
 {id:"install",     label:"Full changeout",              min:420},
 {id:"callback",    label:"Callback / recheck",          min:45}
];
function sym(id){for(var i=0;i<SYMPTOMS.length;i++){if(SYMPTOMS[i].id===id)return SYMPTOMS[i];}return SYMPTOMS[0];}

var ACCESS=[
 {id:"attic",  label:"Attic",            mult:1.35, tier:1, tone:"hot"},
 {id:"roof",   label:"Roof",             mult:1.40, tier:1, tone:"hot"},
 {id:"crawl",  label:"Crawl / tight",    mult:1.40, tier:1, tone:"hot"},
 {id:"yard",   label:"Backyard / side",  mult:1.05, tier:2, tone:"warm"},
 {id:"garage", label:"Garage / closet",  mult:1.00, tier:3, tone:""}
];
function acc(id){for(var i=0;i<ACCESS.length;i++){if(ACCESS[i].id===id)return ACCESS[i];}return ACCESS[4];}

var SIZES=[
 {id:"s25",  label:"Up to 2.5 ton",  mult:1.00},
 {id:"s34",  label:"3–4 ton",   mult:1.15},
 {id:"s5",   label:"5 ton",          mult:1.30},
 {id:"mini", label:"Mini-split",     mult:1.45},
 {id:"rtu",  label:"Commercial RTU", mult:1.75}
];
function size(id){for(var i=0;i<SIZES.length;i++){if(SIZES[i].id===id)return SIZES[i];}return SIZES[0];}

/* Jobs saved before Stage 06 carry an urgency ("em", "soon", "flex"). It no
   longer changes anything: every call is an emergency and goes out as soon
   as a truck can take it. */

/* ============================================================
   SETTINGS
   ============================================================ */
var DEF={ base:"Fort Lauderdale", start:"07:00", hours:8.5, trucks:3, mpg:15, gas:3.35, rate:165 };
var SET_FIELDS=[
 {k:"base",   label:"Shop / home base", note:"where the vans start and end", type:"city"},
 {k:"start",  label:"First stop",       note:"clock-in at the first job",    type:"time"},
 {k:"hours",  label:"Hours per truck",  note:"before overtime",              type:"num"},
 {k:"trucks", label:"Trucks on the road",note:"vans out, not total techs",   type:"num"},
 {k:"mpg",    label:"Van MPG",          note:"loaded, city driving",         type:"num"},
 {k:"gas",    label:"Gas $/gal",        note:"",                             type:"num"},
 {k:"rate",   label:"$ per service call",note:"average ticket",              type:"num"}
];

/* ============================================================
   HEAT CUTOFF — from the forecast high
   ============================================================ */
var CUTOFFS=[
 {upTo:87,  min:12*60,      txt:"12:00p", why:"mild — attic tolerable most of the morning"},
 {upTo:92,  min:11*60,      txt:"11:00a", why:"warm — attic gets ugly by late morning"},
 {upTo:96,  min:10*60+30,   txt:"10:30a", why:"attic hits 130°F+ — short tasks only after 9a"},
 {upTo:999, min:9*60+30,    txt:"9:30a",  why:"140°F attic — nothing non-urgent up there after 9:30"}
];
function cutoffFor(hi){for(var i=0;i<CUTOFFS.length;i++){if(hi<=CUTOFFS[i].upTo)return CUTOFFS[i];}return CUTOFFS[3];}

/* ============================================================
   MATH
   ============================================================ */
function duration(j){
  var m=sym(j.symptom).min*acc(j.access).mult*size(j.size).mult*(j.crew===2?0.65:1);
  return Math.max(30,Math.round(m/15)*15);
}
function legMiles(a,b){ return Math.max(4, Math.abs(a-b)*1.25); }
function legMin(mi){ var mph = mi<8 ? 26 : 38; return Math.round(mi/mph*60)+6; }
function fmtMin(t){
  var h=Math.floor(t/60)%24, m=t%60, ap=h<12?"a":"p", hh=h%12; if(hh===0)hh=12;
  return hh+":"+(m<10?"0":"")+m+ap;
}
function fmtDur(m){ var h=Math.floor(m/60),r=m%60; return h?(h+"h"+(r?" "+r+"m":"")):(r+"m"); }

/* Route a list of jobs: heat tier first, then sweep the corridor. */
function routeJobs(list,baseNi,startMin,cut){
  var arr=list.slice();
  // sweep direction: go toward the far end of the cluster, then work back
  var nis=arr.map(function(j){return j.ni;});
  var far=nis.length?nis.reduce(function(a,b){return Math.abs(b-baseNi)>Math.abs(a-baseNi)?b:a;},nis[0]):baseNi;
  var up = far>=baseNi;
  arr.sort(function(a,b){
    if(a.tier!==b.tier) return a.tier-b.tier;      // hot places before the day cooks
    return up ? a.ni-b.ni : b.ni-a.ni;             // then sweep the corridor one way
  });
  var t=startMin, prev=baseNi, out=[], miles=0;
  for(var i=0;i<arr.length;i++){
    var j=arr[i], mi=legMiles(prev,j.ni), dm=legMin(mi);
    miles+=mi; t+=dm;
    var late = j.tier===1 && t>cut.min;
    out.push({job:j,arrive:t,driveMi:mi,driveMin:dm,late:late});
    t+=j.dur; prev=j.ni;
  }
  var home=legMiles(prev,baseNi); miles+=home;
  return {stops:out, miles:Math.round(miles), endMin:t+legMin(home), homeMi:Math.round(home)};
}
function routedMins(r){var m=0;r.stops.forEach(function(s){m+=s.driveMin;});return m+legMin(r.homeMi);}

/* ============================================================
   STATE + STORAGE — localStorage on this one phone, and nowhere else.
   ============================================================ */
var state={jobs:[],settings:Object.assign({},DEF),tab:"today",hi:94,draft:blankDraft(),
           seeded:false,savedAt:0,saveError:false,idbOk:null,persisted:null,
           lastBackupAt:0,nagSnoozeUntil:0,ready:false,dispatched:""};
var LS="acdayrouter.v1";

function uid(){return "j"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function hydrate(j){
  var ni = CITY_NI[j.city]; if(ni===undefined) ni=48;
  j.ni=ni; j.zone=zoneOf(ni).id; j.tier=acc(j.access).tier; j.dur=duration(j);
  /* Before Stage 05, "Done" deleted a job, so every job saved back then was
     still on the board. No status means open. This runs on every load, so old
     records and old backup files are carried over without a separate step. */
  if(!j.status) j.status="open";
  return j;
}
/* ---------- IndexedDB ----------
   The real store. Chosen over sql.js because SQLite-in-WebAssembly is a
   megabyte of download that still has to persist its database file into
   IndexedDB in the end — a lot of machinery to run queries nobody needs
   against a few hundred rows.

   localStorage is kept as a mirror rather than deleted. The data is a few
   kilobytes and it is his whole business, so a second copy that survives one
   store failing is worth more than the tidiness of a clean cutover. */
var IDB_NAME="acdayrouter", IDB_STORE="state", IDB_KEY="current", idbP=null;

function idbOpenAt(v){
  return new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error("no indexedDB"));return;}
    var req=indexedDB.open(IDB_NAME,v);
    req.onupgradeneeded=function(){
      var db=req.result;
      if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE);
    };
    req.onsuccess=function(){res(req.result);};
    req.onerror=function(){rej(req.error);};
    req.onblocked=function(){rej(new Error("blocked"));};
  });
}
function idbOpen(){
  if(idbP)return idbP;
  idbP=idbOpenAt(1).then(function(db){
    /* An upgrade interrupted halfway can leave the database present but the
       object store missing. Without this the app would quietly fall back to
       the mirror forever; reopening one version higher runs onupgradeneeded
       again and rebuilds the store. */
    if(db.objectStoreNames.contains(IDB_STORE))return db;
    var next=db.version+1;
    db.close();
    return idbOpenAt(next);
  });
  return idbP;
}
function idbLoad(){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var r=db.transaction(IDB_STORE,"readonly").objectStore(IDB_STORE).get(IDB_KEY);
      r.onsuccess=function(){res(r.result||null);};
      r.onerror=function(){rej(r.error);};
    });
  });
}
function idbSave(rec){
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      var t=db.transaction(IDB_STORE,"readwrite");
      t.objectStore(IDB_STORE).put(rec,IDB_KEY);
      t.oncomplete=function(){res(true);};
      t.onerror=function(){rej(t.error);};
      t.onabort=function(){rej(t.error);};
    });
  }).then(function(){
    if(state.idbOk!==true){state.idbOk=true;if(state.tab==="rules")renderRules();}
    return true;
  }).catch(function(){
    if(state.idbOk!==false){state.idbOk=false;if(state.tab==="rules")renderRules();}
    return false;
  });
}

/* ---------- saving ---------- */
function snapshot(){
  return { v:2, seeded:true, jobs:state.jobs, settings:state.settings,
           hi:state.hi, savedAt:Date.now(),
           lastBackupAt:state.lastBackupAt, nagSnoozeUntil:state.nagSnoozeUntil,
           dispatched:state.dispatched };
}
function mirrorToLocal(rec){
  try{ localStorage.setItem(LS,JSON.stringify(rec)); state.lsOk=true; }
  catch(e){ state.lsOk=false; }
}
function saveLocal(){
  var rec=snapshot();
  state.savedAt=rec.savedAt;
  mirrorToLocal(rec);
  /* Only a real problem when BOTH stores are refusing, which in practice
     means private browsing. One of the two failing is survivable. */
  state.saveError = !state.lsOk && state.idbOk===false;
  idbSave(rec);
}
function adoptRecord(d){
  state.seeded=!!d.seeded;
  state.jobs = d.jobs ? d.jobs.map(hydrate) : [];   // an empty board is a REAL state
  if(d.settings){state.settings=Object.assign({},DEF,d.settings);}
  if(d.hi){state.hi=d.hi;}
  state.savedAt=d.savedAt||0;
  state.lastBackupAt=d.lastBackupAt||0;
  state.nagSnoozeUntil=d.nagSnoozeUntil||0;
  state.dispatched=d.dispatched||"";
}
function loadLocal(){
  try{
    var raw=localStorage.getItem(LS); if(!raw)return false;
    adoptRecord(JSON.parse(raw));
    return true;
  }catch(e){return false;}
}
function payload(){
  return JSON.stringify({
    app:"AC Day Router", v:2, exported:new Date().toISOString(),
    jobs:state.jobs.filter(function(j){return !j.example;}),
    settings:state.settings, hi:state.hi
  },null,2);
}
/* There is one device and no server, so "persist" just means the phone.
   Kept as a named call because the call sites read better that way. */
function persistSettings(){ saveLocal(); }

/* ============================================================
   EXAMPLE DAY — a realistic 8-call backlog, clearly marked
   ============================================================ */
function examples(){
  var t=Date.now()-6*3600000;
  function mk(o){o.id=uid();o.example=true;return hydrate(o);}
  /* Calls do not arrive sorted by zone — they arrive scrambled, which is
     exactly why the batching is worth anything. Fixed scramble so the
     "phone order" comparison reflects a real morning. */
  var PERM=[11,3,17,8,0,14,5,12,1,16,7,2,15,9,4,13,6,10];
  var list=[
    /* emergencies — break zone, go today wherever they are */
    mk({name:"Reyes",      phone:"3055550142",addr:"820 NW 22nd Ave",    city:"Miami",          symptom:"nocool_dead",access:"roof",  size:"s34",urgency:"em",  crew:1,note:"Duplex, upstairs tenant. Roof ladder in back."}),
    mk({name:"Marchetti",  phone:"9545550194",addr:"2200 Griffin Rd",    city:"Dania Beach",    symptom:"breaker",    access:"garage",size:"rtu",urgency:"em",  crew:2,note:"Restaurant walk-in. Cannot lose it over lunch."}),
    /* Z1 — Dade */
    mk({name:"Okonkwo",    phone:"3055550133",addr:"590 SW 88th St",     city:"Kendall",        symptom:"pm",         access:"yard",  size:"s34",urgency:"flex",crew:1,note:"Yearly PM, on the maintenance plan."}),
    mk({name:"Ferreira",   phone:"3055550127",addr:"1030 Alton Rd",      city:"Miami Beach",    symptom:"quote",      access:"roof",  size:"s34",urgency:"flex",crew:1,note:"Condo board wants three bids."}),
    mk({name:"Villanueva", phone:"3055550171",addr:"4501 NW 79th Ave",   city:"Doral",          symptom:"airflow",    access:"attic", size:"s5", urgency:"soon",crew:1,note:"Office suite. Front desk has the key."}),
    mk({name:"Batista",    phone:"3055550118",addr:"1245 W 44th Pl",     city:"Hialeah",        symptom:"water",      access:"garage",size:"s25",urgency:"soon",crew:1,note:"Water on the laundry room floor."}),
    /* Z2 — the Line */
    mk({name:"Grandmaison",phone:"9545550205",addr:"2100 Hollywood Blvd",city:"Hollywood",      symptom:"nocool_warm",access:"attic", size:"s34",urgency:"soon",crew:1,note:"Elderly tenant, no cool since Sunday. Please prioritize."}),
    mk({name:"Shapiro",    phone:"3055550164",addr:"20200 W Country Club",city:"Aventura",      symptom:"stat",       access:"garage",size:"mini",urgency:"soon",crew:1,note:"Two mini-split heads, only one responds."}),
    mk({name:"Pereira",    phone:"9545550231",addr:"11400 Pines Blvd",   city:"Pembroke Pines", symptom:"noise",      access:"yard",  size:"s34",urgency:"flex",crew:1,note:"Grinding sound outside, still cools."}),
    mk({name:"Adeyemi",    phone:"9545550248",addr:"6725 Miramar Pkwy",  city:"Miramar",        symptom:"leak",       access:"yard",  size:"s5", urgency:"soon",crew:1,note:"Third recharge this year — find the leak."}),
    /* Z3 — Lauderdale */
    mk({name:"Delacroix",  phone:"9545550159",addr:"77 S Federal Hwy",   city:"Fort Lauderdale",symptom:"ice",        access:"attic", size:"s25",urgency:"soon",crew:1,note:"Salon — opens 10a, needs us early."}),
    mk({name:"Kowalczyk",  phone:"9545550182",addr:"8300 W Broward Blvd",city:"Plantation",     symptom:"board",      access:"garage",size:"s34",urgency:"soon",crew:1,note:"Blank thermostat, breaker is fine."}),
    mk({name:"Thibodeaux", phone:"9545550216",addr:"3400 NW 44th St",    city:"Sunrise",        symptom:"duct",       access:"attic", size:"s34",urgency:"flex",crew:2,note:"Back bedrooms never cool. Quoted duct repair."}),
    mk({name:"Naipaul",    phone:"9545550137",addr:"4700 S University Dr",city:"Davie",         symptom:"callback",   access:"yard",  size:"s25",urgency:"soon",crew:1,note:"Recheck the capacitor we put in Tuesday."}),
    /* Z4 — North */
    mk({name:"Castellano", phone:"9545550188",addr:"3110 NE 14th St",    city:"Pompano Beach",  symptom:"water",      access:"garage",size:"s25",urgency:"soon",crew:1,note:"Ceiling stain in the hallway."}),
    mk({name:"Baptiste",   phone:"9545550176",addr:"1477 NW 40th Ter",   city:"Coral Springs",  symptom:"nocool_warm",access:"attic", size:"s34",urgency:"soon",crew:1,note:"Gate 4412. Dog in yard — call first."}),
    mk({name:"Whitcomb",   phone:"5615550110",addr:"245 SW 4th Ct",      city:"Boca Raton",     symptom:"comp",       access:"yard",  size:"s5", urgency:"soon",crew:2,note:"Out of warranty. Approved the quote Friday."}),
    mk({name:"Lindqvist",  phone:"5615550153",addr:"901 SE 10th St",     city:"Deerfield Beach",symptom:"smell",      access:"garage",size:"s34",urgency:"flex",crew:1,note:"Musty smell when it kicks on."})
  ];
  list.forEach(function(j,i){ j.created = t + PERM[i]*22*60000; });
  return list;
}

/* ============================================================
   RENDER
   ============================================================ */
var $=function(s){return document.querySelector(s);};
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function toneClass(t){return t===1?"s-hot":t===2?"s-warm":"s-in";}
function tonePill(t){return t===1?"p-hot":t===2?"p-warm":"p-in";}

/* ============================================================
   THE PLAN — every call goes out as soon as a truck can take it,
   and each truck keeps to one stretch of the corridor.
   This replaced the fixed zone-per-weekday rule in Stage 06. People
   only call when the AC is broken, so nobody can wait for their
   zone's day to come round.
   ============================================================ */

/* How much a customer's wait weighs against driving: one customer waiting
   one hour counts the same as 5 extra miles. Lower it and the plan uses
   fewer trucks to save gas; raise it and it spreads calls over more trucks
   so people are reached sooner. */
var WAIT_MI_PER_HOUR=5;
/* An attic or roof stop that lands past the heat cutoff counts as 40 extra
   miles, so the plan would rather drive further than send a tech up there
   at 2pm. It still goes if there is no other way. */
var LATE_HOT_MI=40;

function dayKey(d){
  var m=d.getMonth()+1, n=d.getDate();
  return d.getFullYear()+"-"+(m<10?"0":"")+m+"-"+(n<10?"0":"")+n;
}
function planSettings(){
  var s=state.settings, p=String(s.start||"07:00").split(":");
  return {
    baseNi:  CITY_NI[s.base]!==undefined?CITY_NI[s.base]:48,
    startMin:(+p[0])*60+(+p[1]||0),
    capMin:  Math.round((parseFloat(s.hours)||8.5)*60),
    nTrucks: Math.max(1,Math.min(4,parseInt(s.trucks,10)||2)),
    cut:     cutoffFor(parseInt(state.hi,10)||90)
  };
}
/* Once the working day is over (start + hours per truck + an hour to drive
   home) there is no point planning a day that has ended, so the board plans
   tomorrow instead. That is the evening view. */
function planDay(ps){
  var now=new Date(), mins=now.getHours()*60+now.getMinutes();
  var tomorrow=mins>=ps.startMin+ps.capMin+60;
  var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+(tomorrow?1:0));
  return {key:dayKey(d),date:d,tomorrow:tomorrow};
}

/* What one truck's day costs: miles, plus customers waiting, plus hot stops
   that land too late. ok is false when the day runs past the hours per truck,
   except for a single long job, which has to go on some truck anyway. */
function routeCost(list,ps){
  if(!list.length)return {ok:true,cost:0};
  var r=routeJobs(list,ps.baseNi,ps.startMin,ps.cut), wait=0, late=0;
  r.stops.forEach(function(st){wait+=st.arrive-ps.startMin;if(st.late)late++;});
  return {ok:list.length===1||r.endMin-ps.startMin<=ps.capMin,
          cost:r.miles+WAIT_MI_PER_HOUR*wait/60+LATE_HOT_MI*late};
}

/* Split calls across at most n trucks. Along one corridor the best split is
   always into runs of neighbouring calls, so sort by position and try every
   place to cut. A few hundred routes at most, which is instant on a phone.
   Returns null when the calls cannot all fit. */
function splitByArea(jobs,n,ps){
  var s=jobs.slice().sort(function(a,b){return a.ni-b.ni||(a.created||0)-(b.created||0);});
  var N=s.length, memo={}, best=[], from=[], k, i, a, c;
  function seg(a,b){
    var key=a+":"+b;
    if(!(key in memo)){var rc=routeCost(s.slice(a,b),ps);memo[key]=rc.ok?rc.cost:Infinity;}
    return memo[key];
  }
  for(k=0;k<=n;k++){best.push([]);from.push([]);for(i=0;i<=N;i++){best[k].push(Infinity);from[k].push(-1);}}
  best[0][0]=0;
  /* best[k][i] = the cheapest way to cover the first i calls with k trucks */
  for(k=1;k<=n;k++)for(i=1;i<=N;i++)for(a=k-1;a<i;a++){
    if(best[k-1][a]===Infinity)continue;
    c=best[k-1][a]+seg(a,i);
    if(c<best[k][i]){best[k][i]=c;from[k][i]=a;}
  }
  var bk=-1, bc=Infinity;
  for(k=1;k<=n;k++)if(best[k][N]<bc){bc=best[k][N];bk=k;}
  if(bk<0)return null;
  var out=[];
  for(k=bk,i=N;k>=1;k--){a=from[k][i];out.unshift(s.slice(a,i));i=a;}
  return out;
}

/* Until the techs have their lists, the plan is free to reshuffle each time a
   call is added, so calls entered the night before or early in the morning
   still get the best split. It locks when the working day starts, or sooner
   if he opens the call sheet, since reading it out is how he hands out lists. */
function planLocked(ps,day){
  if(state.dispatched===day.key)return true;
  if(day.tomorrow)return false;
  var now=new Date();
  return now.getHours()*60+now.getMinutes()>=ps.startMin;
}
/* Which truck each open call is on, for the day being planned.
   Before the day locks, everything is split by area from scratch. Once it
   locks the plan holds still: a new call joins the truck it adds the least
   to, and nobody else's list changes.
   extra is a call that is not saved yet, used to show where it would land.
   Nothing is written here; commitPlan does that. */
function assignDay(extra){
  var ps=planSettings(), day=planDay(ps), trucks=[], loose=[], spill=[], k;
  for(k=0;k<ps.nTrucks;k++)trucks.push([]);
  var open=openJobs(), locked=planLocked(ps,day); if(extra)open.push(extra);
  open.forEach(function(j){
    if(locked&&j.day===day.key&&j.truck>=1&&j.truck<=ps.nTrucks)trucks[j.truck-1].push(j);
    else loose.push(j);
  });
  loose.sort(function(a,b){return (a.created||0)-(b.created||0);});   // oldest call first

  var fresh=!trucks.some(function(t){return t.length;});
  if(fresh){
    /* More calls than the trucks can do: the most recent call is set aside
       and the split is tried again. First called, first served. */
    var parts=null, aside=[];
    while(loose.length&&!(parts=splitByArea(loose,ps.nTrucks,ps)))aside.unshift(loose.pop());
    if(parts)parts.forEach(function(p,i){trucks[i]=p;});
    /* Keeping each truck to one unbroken stretch is only the best split while
       the trucks have time to spare. Once they are full it strands calls that
       another truck still has room for, and driving a little further today
       beats leaving someone without AC until tomorrow. So the set-aside calls
       get a second try, oldest first. */
    loose=aside;
  }
  loose.forEach(function(j){ if(!placeCall(trucks,j,ps,fresh))spill.push(j); });
  return {ps:ps,day:day,trucks:trucks,spill:spill};
}
/* Put one call on the truck it adds the least to. If no truck has room and
   mayMove is true — the day has not been handed to the techs yet — one call
   already placed may move to another truck, when the gap it leaves is the
   room this call needs. Returns false when it fits nowhere. */
function placeCall(trucks,j,ps,mayMove){
  var best=null, cost=trucks.map(function(t){return routeCost(t,ps).cost;}), i, k, m, add;
  for(i=0;i<trucks.length;i++){
    var after=routeCost(trucks[i].concat([j]),ps);
    if(after.ok){add=after.cost-cost[i];if(!best||add<best.add)best={add:add,to:i};}
  }
  if(!best&&mayMove){
    for(i=0;i<trucks.length;i++)for(m=0;m<trucks[i].length;m++){
      var withJ=routeCost(trucks[i].slice(0,m).concat(trucks[i].slice(m+1),[j]),ps);
      if(!withJ.ok)continue;
      for(k=0;k<trucks.length;k++){
        if(k===i)continue;
        var moved=routeCost(trucks[k].concat([trucks[i][m]]),ps);
        if(!moved.ok)continue;
        add=withJ.cost+moved.cost-cost[i]-cost[k];
        if(!best||add<best.add)best={add:add,to:i,move:m,into:k};
      }
    }
  }
  if(!best)return false;
  if(best.move!==undefined)trucks[best.into].push(trucks[best.to].splice(best.move,1)[0]);
  trucks[best.to].push(j);
  return true;
}

/* Write the plan onto the jobs so it holds still while he dispatches. A call
   that did not fit loses its slot and is tried again every time the board is
   drawn, so it gets pulled in as soon as a truck frees up. */
function commitPlan(){
  var p=assignDay(null), changed=false;
  p.trucks.forEach(function(list,i){
    list.forEach(function(j){
      if(j.day!==p.day.key||j.truck!==i+1){j.day=p.day.key;j.truck=i+1;changed=true;}
    });
  });
  p.spill.forEach(function(j){if(j.truck){j.day="";j.truck=0;changed=true;}});
  if(changed)saveLocal();
}
function buildToday(extra){
  var p=assignDay(extra||null), ps=p.ps;
  return {day:p.day, cut:ps.cut, baseNi:ps.baseNi, spill:p.spill,
          routes:p.trucks.map(function(list){return list.length?routeJobs(list,ps.baseNi,ps.startMin,ps.cut):null;})};
}
/* A truck's area, named by the stretch of corridor its calls cover. */
function areaName(jobs){
  if(!jobs.length)return "";
  var nis=jobs.map(function(j){return j.ni;});
  var lo=zoneOf(Math.min.apply(null,nis)), hi=zoneOf(Math.max.apply(null,nis));
  return lo.id===hi.id?lo.name:lo.name+" → "+hi.name;
}
/* Where a call lands: its truck and arrival time, or truck 0 when every
   truck is full. Works for a saved job and for one still being entered. */
function whereItGoes(job){
  var d=buildToday(state.jobs.indexOf(job)<0?job:null);
  for(var i=0;i<d.routes.length;i++){
    if(!d.routes[i])continue;
    var stops=d.routes[i].stops;
    for(var k=0;k<stops.length;k++){
      if(stops[k].job===job)return {truck:i+1,arrive:stops[k].arrive,tomorrow:d.day.tomorrow};
    }
  }
  return {truck:0,tomorrow:d.day.tomorrow};
}

/* ---------- confirm + toast ---------- */
var _mcb=null;
function ask(title,body,okLabel,tone,cb){
  $("#mTitle").textContent=title;
  $("#mBody").textContent=body;
  var ok=$("#mOk");
  ok.textContent=okLabel;
  ok.className="btn"+(tone==="danger"?" danger-solid":"");
  _mcb=cb;
  $("#modal").hidden=false;
  ok.focus();
}
function closeModal(){$("#modal").hidden=true;_mcb=null;}
function toast(msg){
  var t=$("#toast");
  t.textContent=msg;t.hidden=false;
  requestAnimationFrame(function(){t.classList.add("show");});
  clearTimeout(t._h);
  t._h=setTimeout(function(){
    t.classList.remove("show");
    setTimeout(function(){t.hidden=true;},250);
  },1900);
}
function dropJob(id,msg){
  state.jobs=state.jobs.filter(function(j){return j.id!==id;});
  saveLocal();render();toast(msg);
}
function jobById(id){for(var i=0;i<state.jobs.length;i++){if(state.jobs[i].id===id)return state.jobs[i];}return null;}
/* Everything that plans or counts work looks at open jobs only. Finished jobs
   stay in state.jobs as his history and go out with every backup. */
function openJobs(){return state.jobs.filter(function(j){return j.status==="open";});}
function finishJob(id){
  var j=jobById(id); if(!j)return;
  j.status="done"; j.doneAt=Date.now();
  saveLocal();render();toast("Job finished");
}
function reopenJob(id){
  var j=jobById(id); if(!j)return;
  j.status="open"; delete j.doneAt;
  saveLocal();render();toast("Back on the board");
}

function renderToday(){
  var d=buildToday();
  var dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var dn=dayNames[d.day.date.getDay()];
  $("#dayTitle").textContent=d.day.tomorrow?"Tomorrow's run":dn+"'s run";
  $("#daySub").innerHTML=d.day.tomorrow
    ? 'Today’s hours are over, so this plans <b>'+dn+'</b>. A call saved now goes out first thing.'
    : 'Every call goes out as soon as a truck can take it. Each truck keeps to one part of the county.';

  renderNag();

  // example banner
  var hasEx=state.jobs.some(function(j){return j.example;});
  $("#exNote").innerHTML = hasEx
    ? '<div class="ex-note"><span>These jobs are examples so you can see the routing work. Clear them once his real calls go in.</span><button class="btn ghost sm" id="clrEx">Clear examples</button></div>'
    : '';
  if(hasEx){$("#clrEx").onclick=function(){
    var n=state.jobs.filter(function(j){return j.example;}).length;
    ask("Clear the example jobs?",
        "Removes all "+n+" sample jobs. Anything you added yourself stays, and the examples will not come back on their own.",
        "Clear examples","",
        function(){
          state.jobs=state.jobs.filter(function(j){return !j.example;});
          saveLocal();render();toast("Examples cleared");
        });
  };}

  // readout
  var totalJobs=0,totalMi=0,lastEnd=0;
  d.routes.forEach(function(r){if(r){totalJobs+=r.stops.length;totalMi+=r.miles;lastEnd=Math.max(lastEnd,r.endMin);}});
  $("#dayReadout").innerHTML=
    cell("Stops",totalJobs)+
    cell("Drive",totalMi+" mi")+
    cell("Back by",lastEnd?fmtMin(lastEnd):"—")+
    cell("Attic by",d.cut.txt);

  // plan
  var html="";
  if(!totalJobs&&!d.spill.length){
    html='<div class="card empty"><span class="disp">No open calls</span>Add a call and it goes straight onto a truck.</div>';
  }
  d.routes.forEach(function(r,i){
    if(!r)return;
    var area=areaName(r.stops.map(function(st){return st.job;}));
    html+='<div class="day-crew"><div class="crew-tag"><span class="disp">Truck '+(i+1)+'</span>'+
      '<span class="pill p-in">'+esc(area)+'</span>'+
      '<span class="meta">'+r.stops.length+' stop'+(r.stops.length>1?"s":"")+' · '+r.miles+' mi · back '+fmtMin(r.endMin)+'</span></div><div class="stops">';
    r.stops.forEach(function(st,k){
      var j=st.job, a=acc(j.access), sy=sym(j.symptom);
      html+='<div class="drive">'+(k===0?"from base":"")+' '+Math.round(st.driveMi)+' mi · '+st.driveMin+' min</div>';
      html+='<div class="stop '+toneClass(j.tier)+'"><div class="stripe"></div>'+
        '<div class="slot"><span class="t mono">'+fmtMin(st.arrive)+'</span><span class="dur mono">'+fmtDur(j.dur)+'</span></div>'+
        '<div class="sbody">'+
          '<div class="sline1"><span class="sname">'+esc(j.name||"No name")+'</span><span class="scity">'+esc(j.city)+'</span></div>'+
          '<div class="sline2"><b>'+esc(sy.label)+'</b> — '+esc(a.label.toLowerCase())+', '+esc(size(j.size).label.toLowerCase())+(j.crew===2?", 2 techs":"")+'</div>'+
          (j.note?'<div class="sline2" style="color:var(--ink-3)">'+esc(j.note)+'</div>':'')+
          (j.msg?'<details class="smsg"><summary>Their text</summary><p>'+esc(j.msg)+'</p></details>':'')+
          '<div class="stags">'+
            '<span class="pill '+tonePill(j.tier)+'">'+(j.tier===1?"Heat — go early":j.tier===2?"Outdoor":"Indoor — fine midday")+'</span>'+
            (sy.twoVisit?'<span class="pill p-warm">May need 2 trips</span>':'')+
          '</div>'+
          '<div class="sacts">'+
            (j.phone?'<a class="act" href="tel:'+esc(j.phone)+'">Call</a>':'')+
            '<a class="act go" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent((j.addr?j.addr+", ":"")+j.city+", FL")+'">Directions</a>'+
            '<button class="act" data-done="'+j.id+'">Done</button>'+
          '</div>'+
        '</div></div>';
      if(st.late){
        html+='<div class="warnrow"><b>'+esc(a.label)+' at '+fmtMin(st.arrive)+', past the '+d.cut.txt+' cutoff.</b> It still goes today — keep the '+esc(a.label.toLowerCase())+' time short, take water, and send two if you can.</div>';
      }
    });
    html+='<div class="drive">'+r.homeMi+' mi back to base</div></div></div>';
  });
  if(d.spill.length){
    html+='<div class="warnrow" style="margin-top:16px"><div><b>'+d.spill.length+' call'+(d.spill.length>1?"s":"")+' won’t fit '+(d.day.tomorrow?"tomorrow":"today")+'.</b> '+
      d.spill.map(function(j){return esc(j.name||j.city)+" ("+fmtDur(j.dur)+")";}).join(", ")+
      ' — every truck is full. They go out first the next morning, oldest call first. Or put another truck out in Rules &amp; setup.</div></div>';
  }
  if(totalJobs){
    html+='<div class="replan"><button type="button" class="linkish" id="replan">Plan the day again from scratch</button></div>';
  }
  $("#dayPlan").innerHTML=html;
  Array.prototype.forEach.call(document.querySelectorAll("[data-done]"),function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-done"), j=jobById(id);
      if(!j)return;
      ask("Mark this job finished?",
          (j.name||"This job")+" in "+j.city+" — "+sym(j.symptom).label.toLowerCase()+
          ". It comes off today’s run and moves to the Finished list on the Waiting tab, where Undo can bring it back.",
          "Mark finished","",
          function(){finishJob(id);});
    };
  });
  /* The plan holds still once made, so the techs' lists do not shuffle every
     time a call comes in. This is the way out when that is wrong: a truck
     broke down, or calls were added before the day was dispatched. */
  var rp=$("#replan");
  if(rp)rp.onclick=function(){
    ask("Plan the day again?",
        "Every open call is split across the trucks again, so a tech may get a different list. Do it before calling the techs, or when a truck goes down.",
        "Plan again","",
        function(){
          openJobs().forEach(function(j){j.day="";j.truck=0;});
          saveLocal();render();toast("Day planned again");
        });
  };

  renderSavings(d);
}
function cell(k,v){return '<div class="ro-cell"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';}

function renderSavings(d){
  var used=d.routes.filter(Boolean), all=[];
  used.forEach(function(r){r.stops.forEach(function(s){all.push(s.job);});});
  if(all.length<2){
    $("#savings").innerHTML='<div class="empty">Needs at least two stops before there’s a route to compare.</div>';
    return;
  }
  var baseNi=d.baseNi, n=all.length, k=used.length, i;

  /* Without a plan, each call goes to the next truck in turn and every truck
     drives its calls in the order they rang. Same calls, same trucks: the
     only difference measured is the grouping. */
  var byCall=all.slice().sort(function(a,b){return (a.created||0)-(b.created||0);});
  var nv=[];for(i=0;i<k;i++)nv.push([]);
  byCall.forEach(function(j,x){nv[x%k].push(j);});
  var nvMi=0,nvMin=0,nvAreas=0;
  nv.forEach(function(list){
    var prev=baseNi,z={};
    list.forEach(function(j){var mi=legMiles(prev,j.ni);nvMi+=mi;nvMin+=legMin(mi);prev=j.ni;z[j.zone]=1;});
    var hb=legMiles(prev,baseNi);nvMi+=hb;nvMin+=legMin(hb);
    nvAreas+=Object.keys(z).length;
  });
  nvMi=Math.round(nvMi);

  var optMi=0,optMin=0,optAreas=0;
  used.forEach(function(r){
    var z={};
    optMi+=r.miles;optMin+=routedMins(r);
    r.stops.forEach(function(s){z[s.job.zone]=1;});
    optAreas+=Object.keys(z).length;
  });

  var s=state.settings;
  var mpg=parseFloat(s.mpg)||15, gas=parseFloat(s.gas)||3.35, rate=parseFloat(s.rate)||165;
  var miSaved=Math.max(0,nvMi-optMi), minSaved=Math.max(0,nvMin-optMin);
  var fuel=(miSaved/mpg*gas);
  var weekFuel=fuel*5, weekHrs=minSaved*5/60;
  var extraCalls=Math.floor(minSaved/90);
  var mx=Math.max(nvMi,optMi)||1;
  function avg(x){return (x/k).toFixed(1).replace(/\.0$/,"");}

  $("#savings").innerHTML=
  '<div class="sv-head"><h3>'+n+' stops on '+k+' truck'+(k>1?"s":"")+', two ways</h3>'+
   '<p>Same calls, same trucks. One way hands each call to the next truck in the order the phone rang; the other gives each truck one part of the county, hot jobs first.</p></div>'+
  '<div class="sv-grid">'+
    '<div class="sv-cell win"><div class="k">Miles saved today</div><div class="v">'+miSaved+'<span class="u">mi</span></div></div>'+
    '<div class="sv-cell win"><div class="k">Windshield time back</div><div class="v">'+fmtDur(minSaved)+'</div></div>'+
    '<div class="sv-cell"><div class="k">Gas, 5-day week</div><div class="v">$'+weekFuel.toFixed(0)+'</div></div>'+
    '<div class="sv-cell"><div class="k">Hours back, per week</div><div class="v">'+weekHrs.toFixed(1)+'<span class="u">hr</span></div></div>'+
  '</div>'+
  '<div class="sv-bars">'+
    bar("Call order",nvMi,mx,"var(--high)",nvMi+" mi")+
    bar("By area",optMi,mx,"var(--cool)",optMi+" mi")+
    '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink-2);line-height:1.55">'+
    (miSaved>4
      ? 'In call order each truck crosses <b>'+avg(nvAreas)+' areas</b> a day; grouped, <b>'+avg(optAreas)+'</b>. That is where the miles go.'+
        (extraCalls>0?' <b>'+fmtDur(minSaved)+' is roughly '+extraCalls+' more service call'+(extraCalls>1?"s":"")+'</b>, near $'+(extraCalls*rate)+' of work currently being spent on I-95.':'')
      : 'Today’s calls happen to sit close together, so grouping wins little — the tool is honest about that. The savings show up on the days the calls are spread across the county.')+
    '</p>'+
  '</div>';
}
function bar(lbl,val,mx,color,num){
  return '<div class="bar-row"><span class="lbl">'+lbl+'</span>'+
    '<span class="bar-track"><span class="bar-fill" style="width:'+Math.round(val/mx*100)+'%;background:'+color+'"></span></span>'+
    '<span class="num">'+num+'</span></div>';
}

/* ============================================================
   NEW CALL — one question per screen.
   He is usually standing in someone else's house when the phone rings.
   So a call goes in by pasting whatever the customer texted, and the app
   asks only what that text did not already say. Target: 30 seconds.
   ============================================================ */

/* Every call is an emergency — people only call when the AC is broken — so
   urgency is not asked. Neither are system size and crew: they only stretch
   the time block, and a sensible default beats one more question. */
var NEW_CALL={urgency:"em",size:"s34",crew:1};

/* Four answers per question, mapped onto the existing tables so duration(),
   the heat tiers and the routing all work unchanged. */
var UNIT_OPTS=[
 {id:"attic", label:"Attic",    sub:"hot — goes early"},
 {id:"roof",  label:"Roof",     sub:"hot — goes early"},
 {id:"yard",  label:"Backyard", sub:"outside"},
 {id:"garage",label:"Inside",   sub:"closet or garage"}
];
var PROB_OPTS=[
 {id:"nocool_warm",label:"Not cooling"},
 {id:"water",      label:"Leaking water"},
 {id:"noise",      label:"Noise"},
 {id:"nocool_dead",label:"Won’t turn on"}
];
function optLabel(list,id){for(var i=0;i<list.length;i++){if(list[i].id===id)return list[i].label;}return "";}

/* ---------- reading a pasted customer text ----------
   Plain pattern matching on the phone, no service. It only has to be right
   often enough to skip questions: every guess is shown on the check screen,
   and anything it misses simply gets asked. */
var CITY_ALIASES=[
 ["ft lauderdale","Fort Lauderdale"],["ftl","Fort Lauderdale"],
 ["n miami beach","North Miami Beach"],["nmb","North Miami Beach"],["n miami","North Miami"],
 ["n lauderdale","North Lauderdale"],["miami bch","Miami Beach"],["boca","Boca Raton"],
 ["delray","Delray Beach"],["boynton","Boynton Beach"],["pompano","Pompano Beach"],
 ["deerfield","Deerfield Beach"],["hallandale","Hallandale Beach"],["sunny isles","Sunny Isles Beach"],
 ["dania","Dania Beach"],["west palm","West Palm Beach"],["wpb","West Palm Beach"],
 ["lake worth beach","Lake Worth"],["pembroke","Pembroke Pines"],["opa locka","Opa-locka"]
];
/* Text and city names are flattened the same way — lowercase, punctuation to
   spaces — so "Hialeah." and "Opa-locka" match. Longest first, so "North Miami
   Beach" is found before "Miami Beach" before "Miami". */
function flat(s){return " "+String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim()+" ";}
var CITY_KEYS=CITIES.map(function(c){return [flat(c[0]),c[0]];})
  .concat(CITY_ALIASES.map(function(a){return [flat(a[0]),a[1]];}))
  .sort(function(a,b){return b[0].length-a[0].length;});

var ST_TYPES="St|Street|Ave|Avenue|Av|Blvd|Boulevard|Rd|Road|Dr|Drive|Ter|Terr|Terrace|Ct|Court|"+
             "Cir|Circle|Ln|Lane|Pl|Place|Pkwy|Parkway|Hwy|Highway|Way|Trl|Trail";
/* number · optional direction · up to four words · street type · optional
   trailing direction · optional apartment with a digit in it */
var ADDR_RE=new RegExp(
  "\\b(\\d{2,6}[A-Za-z]?\\s+(?:(?:N|S|E|W|NE|NW|SE|SW)\\.?\\s+)?(?:[A-Za-z0-9'-]+\\s+){0,4}?(?:"+ST_TYPES+")\\b\\.?"+
  "(?:\\s+(?:N|S|E|W|NE|NW|SE|SW)\\b\\.?)?"+
  "(?:\\s*,?\\s*(?:Apt|Apartment|Unit|Ste|Suite|#)\\.?\\s*#?\\s*[A-Za-z]?\\d[A-Za-z0-9-]*)?)","i");
var PHONE_RE=/(?:\+?1[\s.-]*)?\(?([2-9]\d{2})\)?[\s.-]*(\d{3})[\s.-]*(\d{4})(?!\d)/;

/* Order matters: the first rule that matches wins. A dead unit outranks
   "not cooling", which outranks a leak, which outranks a noise — the more
   serious reading gets the longer time block. */
var PROB_RULES=[
 ["nocool_dead",/won'?t\s+(?:turn|come|kick|power)\s+on|(?:not|isn'?t|doesn'?t|does\s+not)\s+(?:turn|turning|come|coming)\s+on|won'?t\s+start|no\s+power|nothing\s+(?:happens|works|runs|comes\s+on)|completely\s+dead|\bdead\b|breaker|tripp/i],
 ["nocool_warm",/not\s+cool|no\s+cool|isn'?t\s+cool|not\s+(?:getting\s+)?cold|(?:warm|hot)\s+air|blow(?:s|ing)?\s+(?:warm|hot)|no\s+(?:ac|a\/c|air)\b|(?:ac|a\/c|air)\s+(?:is\s+)?(?:out|broke|broken|not\s+working|stopped)|not\s+working|stopped\s+working|freon|refrigerant/i],
 ["water",/water|leak|drip|puddle|\bwet\b|ceiling\s+stain|overflow|flood/i],
 ["noise",/nois|loud|squeal|grind|rattl|bang|buzz|humm|clunk|vibrat|screech/i]
];
/* Where the unit is. Attic outranks everything because it decides the time of
   day; "outside" is weakest because every split system has an outside unit.
   The third value marks a word strong enough to trust anywhere in the text. */
var UNIT_RULES=[
 ["attic",/attic/i,true],
 ["roof",/\broof/i,true],
 ["garage",/closet|garage|laundry|utility\s+room|hallway|air\s+handler/i],
 ["yard",/back\s*yard|side\s+yard|\byard\b|outside|side\s+of\s+the\s+house|patio/i]
];
var NOTE_RE=/\b(gate|code|dogs?|pets?|tenant|landlord|condo|apt|apartment|floor|keys?|lock\s?box|buzz(?:er)?|call\s+(?:me\s+)?(?:first|before|when)|text\s+(?:me\s+)?(?:first|before)|park(?:ing)?|after\s+\d|before\s+\d|elderly|baby|infant|pregnant|oxygen)\b/i;

function fmtPhone(d){
  d=String(d||"").replace(/\D/g,"");
  if(d.length===11&&d.charAt(0)==="1")d=d.slice(1);
  return d.length===10 ? d.slice(0,3)+"-"+d.slice(3,6)+"-"+d.slice(6) : "";
}
function findCity(t){
  var low=flat(t);
  for(var i=0;i<CITY_KEYS.length;i++){
    if(low.indexOf(CITY_KEYS[i][0])>=0)return CITY_KEYS[i][1];
  }
  return "";
}
var NOT_NAMES=/^(?:please|so|again|you|ok|okay|in advance|god bless|sir|mam|ma'am)$/i;
function titleWord(w){return w.charAt(0).toUpperCase()+w.slice(1).toLowerCase();}

function readCall(raw){
  var t=String(raw||""), out={}, m, rest=t;

  m=t.match(/(?:^|\n)\s*name\s*[:\-]\s*([^\n,]+)/i) ||
    t.match(/\b(?:[Tt]his is|[Mm]y name is|[Mm]y name's|[Nn]ame is)\s+([A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)?)/) ||
    t.match(/\b(?:[Tt]hanks|[Tt]hank you|[Rr]egards)[,!.\s-]+([A-Z][a-z'’-]+(?:\s+[A-Z][a-z'’-]+)?)\s*$/);
  if(m&&!findCity(m[1])&&!NOT_NAMES.test(m[1].trim()))
    out.name=m[1].trim().split(/\s+/).map(titleWord).join(" ");

  m=t.match(PHONE_RE);
  if(m){out.phone=m[1]+"-"+m[2]+"-"+m[3];rest=rest.replace(m[0]," ");}

  var after="";
  m=rest.match(ADDR_RE);
  if(m){
    out.addr=m[1].replace(/\s+/g," ").replace(/[.,]$/,"").trim();
    after=rest.slice(m.index+m[0].length,m.index+m[0].length+40);
    rest=rest.replace(m[0]," ");
  }

  /* The city written right after the street is the one that counts. Only then
     search the rest — with the street already cut out, or "2100 Hollywood Blvd"
     and "Hallandale Beach Blvd" would be read as cities. */
  out.city=findCity(after)||findCity(rest);

  /* "Dog in yard" is a note, not where the unit is. A wrong guess here is worse
     than asking — it can put attic work in the afternoon — so the weaker words
     are only read from sentences that are not notes. */
  var i, plain=rest.split(/[\n.!?;]+/).filter(function(s){return !NOTE_RE.test(s);}).join(". ");
  for(i=0;i<UNIT_RULES.length;i++){
    if(UNIT_RULES[i][1].test(UNIT_RULES[i][2]?t:plain)){out.access=UNIT_RULES[i][0];break;}
  }
  for(i=0;i<PROB_RULES.length;i++){if(PROB_RULES[i][1].test(t)){out.symptom=PROB_RULES[i][0];break;}}

  var notes=rest.split(/[\n.!?;]+/).map(function(s){return s.trim();})
    .filter(function(s){return s.length>2&&NOTE_RE.test(s);});
  if(notes.length){
    var n=notes.join(". ");
    out.note=(n.charAt(0).toUpperCase()+n.slice(1)).slice(0,220)+".";
  }
  return out;
}

/* ---------- the draft ---------- */
var DRAFT_KEY="acdayrouter.draft";
var IK_STEPS=["paste","addr","city","access","symptom","phone","review"];
var IK_FIELDS=["addr","city","access","symptom","phone"];
var IK_NAMES={addr:"address",city:"city",access:"unit",symptom:"problem",phone:"phone"};

function blankDraft(){
  return {step:"paste",hist:[],back:false,text:"",msg:"",
          name:"",phone:"",addr:"",city:"",access:"",symptom:"",note:"",read:{},skip:{}};
}
/* A half-entered call survives the app being closed, because the moment that
   happens is a second call interrupting the first. It is a convenience copy,
   not the store of record, so localStorage on its own is enough. */
function loadDraft(){
  try{
    var d=JSON.parse(localStorage.getItem(DRAFT_KEY)||"null");
    if(d&&d.step)return Object.assign(blankDraft(),d);
  }catch(e){}
  return blankDraft();
}
function saveDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state.draft));}catch(e){}}
function clearDraft(){state.draft=blankDraft();try{localStorage.removeItem(DRAFT_KEY);}catch(e){}}
function draftDirty(){
  var d=state.draft;
  return !!(d.text||d.name||d.phone||d.addr||d.city||d.access||d.symptom||d.note);
}

/* ---------- moving between questions ---------- */
function ikAnswered(s){
  var d=state.draft;
  if(s==="addr"||s==="phone")return !!d[s]||!!d.skip[s];
  return !!d[s];
}
function ikMove(step){
  var d=state.draft;
  d.hist.push(d.step);d.step=step;
  saveDraft();render();
  window.scrollTo(0,0);
  var el=document.querySelector("#intake .ik-in");
  if(el)el.focus();
}
/* After an answer: straight back to the check screen if that is where he
   came from, otherwise on to the next question the text did not answer. */
function ikNext(){
  var d=state.draft;
  if(d.back){d.back=false;d.hist.pop();d.step="review";saveDraft();render();window.scrollTo(0,0);return;}
  var i=IK_STEPS.indexOf(d.step)+1;
  while(i<IK_STEPS.length-1&&ikAnswered(IK_STEPS[i]))i++;
  ikMove(IK_STEPS[i]);
}
function ikBack(){
  var d=state.draft;
  d.back=false;
  d.step=d.hist.length?d.hist.pop():"paste";
  saveDraft();render();window.scrollTo(0,0);
}
function ikEdit(step){
  var d=state.draft;
  d.skip[step]=false;d.back=true;
  ikMove(step);
}
/* Reading a text starts the call fresh: whatever an earlier paste guessed is
   dropped, so pasting a second time never mixes two customers together. */
function ikRead(text){
  var r=readCall(text), d=blankDraft();
  d.hist=state.draft.hist;d.step=state.draft.step;
  d.text=String(text||"");d.msg=d.text.trim();
  ["name","phone","addr","city","access","symptom","note"].forEach(function(k){
    if(r[k]){d[k]=r[k];d.read[k]=true;}
  });
  state.draft=d;
  ikNext();
}

/* ---------- drawing ---------- */
function ikHead(title,sub,showRead){
  var d=state.draft;
  var h='<div class="ik-top"><span class="eyebrow">New call</span>'+
        (draftDirty()?'<button type="button" class="linkish" id="ikReset">Start over</button>':'')+'</div>'+
        '<h2 class="ik-q">'+title+'</h2>';
  if(sub)h+='<p class="ik-sub">'+sub+'</p>';
  if(showRead&&d.msg){
    var got=IK_FIELDS.filter(function(k){return d.read[k];}).map(function(k){return IK_NAMES[k];});
    h+='<p class="ik-read">'+(got.length
      ? 'Read from their text: <b>'+got.join(" · ")+'</b>'
      : 'Nothing could be read from their text, so a few quick questions.')+'</p>';
  }
  return h;
}
function ikOpts(list,cur){
  return '<div class="ik-opts">'+list.map(function(o){
    return '<button type="button" class="ik-opt" data-pick="'+o.id+'" aria-pressed="'+(o.id===cur)+'">'+
      '<b>'+esc(o.label)+'</b>'+(o.sub?'<span>'+esc(o.sub)+'</span>':'')+'</button>';
  }).join("")+'</div>';
}
/* Never more than four cities on screen. Before anything is typed, the four
   his calls come from most; after, the best matches for what he typed. */
function cityChoices(q){
  var f=flat(q).trim();
  if(!f){
    var ct={};
    state.jobs.forEach(function(j){if(!j.example&&j.city)ct[j.city]=(ct[j.city]||0)+1;});
    var top=Object.keys(ct).sort(function(a,b){return ct[b]-ct[a];}).slice(0,4);
    return top.length?top:[state.settings.base];
  }
  var seen={},starts=[],inside=[];
  CITY_KEYS.forEach(function(k){
    var key=k[0].trim(),name=k[1];
    if(seen[name])return;
    if(key.indexOf(f)===0){starts.push(name);seen[name]=1;}
    else if((" "+key).indexOf(" "+f)>=0){inside.push(name);seen[name]=1;}
  });
  function shortFirst(a,b){return a.length-b.length;}
  return starts.sort(shortFirst).concat(inside.sort(shortFirst)).slice(0,4);
}
function ikReview(d){
  var a=acc(d.access), cut=cutoffFor(parseInt(state.hi,10)||90);
  /* Where it would land if saved now, worked out by the same planner. */
  var x=hydrate({id:"draft",created:Date.now(),status:"open",city:d.city,access:d.access,
                 symptom:d.symptom,size:NEW_CALL.size,crew:NEW_CALL.crew});
  var w=whereItGoes(x);
  var none='<em>none</em>';
  function tag(k){return d.read[k]?'<i>from text</i>':'';}
  function row(k,label,val){
    return '<div class="ik-rrow"><span class="k">'+label+tag(k)+'</span><span class="v">'+val+'</span>'+
           '<button type="button" class="act" data-edit="'+k+'">Change</button></div>';
  }
  return ikHead("Check it, then save","",false)+
    '<div class="readout">'+
      cell("Truck",w.truck?String(w.truck):"Full")+
      cell(w.tomorrow?"Tomorrow":"Arrives",w.truck?fmtMin(w.arrive):"next AM")+
      cell("Block",fmtDur(x.dur))+
      cell("Unit",a.tier===1?"by "+cut.txt:a.tier===2?"any time":"midday ok")+
    '</div>'+
    '<div class="ik-rev">'+
      row("addr","Address",d.addr?esc(d.addr):none)+
      row("city","City",esc(d.city))+
      row("access","Unit",esc(optLabel(UNIT_OPTS,d.access)))+
      row("symptom","Problem",esc(optLabel(PROB_OPTS,d.symptom)))+
      row("phone","Phone",d.phone?esc(d.phone):none)+
      '<div class="ik-rrow wide"><label class="k" for="ikName">Name'+tag("name")+'</label>'+
        '<input id="ikName" class="ik-inline" type="text" autocomplete="off" autocapitalize="words" placeholder="Optional" value="'+esc(d.name)+'"></div>'+
      '<div class="ik-rrow wide"><label class="k" for="ikNote">Note'+tag("note")+'</label>'+
        '<textarea id="ikNote" class="ik-inline" placeholder="Gate code, dog, call first">'+esc(d.note)+'</textarea></div>'+
    '</div>';
}
function renderNew(){
  var d=state.draft, h;
  if(d.step==="paste"){
    h=ikHead("Paste the customer’s text","The address, where the unit is and what’s wrong — whatever they sent.",false)+
      '<button type="button" class="btn ik-paste" id="ikPaste">Paste their text</button>'+
      '<textarea id="ikText" class="ik-text" placeholder="…or type it here. The keyboard mic works too.">'+esc(d.text)+'</textarea>';
  }else if(d.step==="addr"){
    h=ikHead("What’s the address?","Street and number. Add the city too if you have it.",true)+
      '<input id="ikAddr" class="ik-in" type="text" autocomplete="off" autocapitalize="words" placeholder="1420 NW 12th Ave" value="'+esc(d.addr)+'">'+
      '<div class="ik-row"><button type="button" class="linkish" id="ikSkip">Skip — no address yet</button></div>';
  }else if(d.step==="city"){
    h=ikHead("Which city?","Needed to put the job on a route.",true)+
      '<input id="ikCity" class="ik-in" type="text" autocomplete="off" placeholder="Start typing — Hialeah, Boca…">'+
      '<div class="ik-opts" id="ikCityOpts"></div>';
  }else if(d.step==="access"){
    h=ikHead("Where is the unit?","",true)+ikOpts(UNIT_OPTS,d.access);
  }else if(d.step==="symptom"){
    h=ikHead("What’s wrong?","",true)+ikOpts(PROB_OPTS,d.symptom);
  }else if(d.step==="phone"){
    h=ikHead("Customer’s phone?","So the tech can call ahead.",true)+
      '<input id="ikPhone" class="ik-in" type="tel" autocomplete="off" placeholder="305-555-0142" value="'+esc(d.phone)+'">'+
      '<div class="ik-row"><button type="button" class="btn ghost sm" id="ikPhonePaste">Paste a copied number</button>'+
      '<button type="button" class="linkish" id="ikSkip">Skip</button></div>';
  }else{
    h=ikReview(d);
  }
  $("#intake").innerHTML=h;
  ikWire(d.step);
}

/* ---------- answering ---------- */
function ikPasteByHand(){
  var ta=$("#ikText");
  if(ta)ta.focus();
  toast("Tap and hold in the box, then Paste");
}
function ikSubmitAddr(){
  var el=$("#ikAddr"), v=el.value.trim(), d=state.draft;
  if(!v){toast("Type the address, or tap Skip");el.focus();return;}
  /* He may type the city on the end, or the whole line. Read it the same
     way as a pasted text so the city question can be skipped too. */
  var r=readCall(v);
  d.addr=r.addr||v;d.read.addr=false;
  if(r.city){d.city=r.city;d.read.city=false;}
  if(r.phone&&!d.phone)d.phone=r.phone;
  ikNext();
}
function ikSubmitPhone(){
  var el=$("#ikPhone"), v=el.value.trim(), d=state.draft;
  if(!v){toast("Type the number, or tap Skip");el.focus();return;}
  d.phone=fmtPhone(v)||v;d.read.phone=false;
  ikNext();
}
function ikCityOpts(){
  var box=$("#ikCityOpts"), list=cityChoices($("#ikCity").value);
  box.innerHTML=list.length
    ? list.map(function(c){return '<button type="button" class="ik-opt" data-city="'+esc(c)+'"><b>'+esc(c)+'</b></button>';}).join("")
    : '<p class="ik-sub">Not on his list. Type the nearest city instead.</p>';
  Array.prototype.forEach.call(box.querySelectorAll("[data-city]"),function(b){
    b.onclick=function(){
      state.draft.city=b.getAttribute("data-city");state.draft.read.city=false;
      ikNext();
    };
  });
}
function ikOnEnter(el,fn){
  el.onkeydown=function(e){if(e.key==="Enter"){e.preventDefault();fn();}};
}
function ikWire(step){
  var reset=$("#ikReset");
  if(reset)reset.onclick=function(){
    ask("Start this call over?","What you have so far for this customer will be thrown away.",
        "Start over","danger",function(){clearDraft();render();});
  };
  var skip=$("#ikSkip");
  if(skip)skip.onclick=function(){
    var d=state.draft;
    d[step]="";d.skip[step]=true;d.read[step]=false;
    ikNext();
  };

  if(step==="paste"){
    $("#ikText").oninput=function(){state.draft.text=this.value;saveDraft();};
    $("#ikPaste").onclick=function(){
      if(!(navigator.clipboard&&navigator.clipboard.readText)){ikPasteByHand();return;}
      navigator.clipboard.readText().then(function(t){
        if(!t||!t.trim()){toast("Nothing is copied yet");return;}
        ikRead(t);
      }).catch(ikPasteByHand);
    };
  }
  if(step==="addr"){
    $("#ikAddr").oninput=function(){state.draft.addr=this.value;saveDraft();};
    ikOnEnter($("#ikAddr"),ikSubmitAddr);
  }
  if(step==="city"){
    $("#ikCity").oninput=ikCityOpts;
    ikOnEnter($("#ikCity"),function(){
      var first=document.querySelector("#ikCityOpts [data-city]");
      if(first)first.click();
    });
    ikCityOpts();
  }
  if(step==="access"||step==="symptom"){
    Array.prototype.forEach.call(document.querySelectorAll("#intake [data-pick]"),function(b){
      b.onclick=function(){
        state.draft[step]=b.getAttribute("data-pick");state.draft.read[step]=false;
        ikNext();
      };
    });
  }
  if(step==="phone"){
    $("#ikPhone").oninput=function(){state.draft.phone=this.value;saveDraft();};
    ikOnEnter($("#ikPhone"),ikSubmitPhone);
    $("#ikPhonePaste").onclick=function(){
      if(!(navigator.clipboard&&navigator.clipboard.readText)){$("#ikPhone").focus();toast("Tap and hold in the box, then Paste");return;}
      navigator.clipboard.readText().then(function(t){
        var m=String(t||"").match(PHONE_RE);
        if(!m){toast("No phone number in what’s copied");return;}
        $("#ikPhone").value=m[1]+"-"+m[2]+"-"+m[3];
        ikSubmitPhone();
      }).catch(function(){$("#ikPhone").focus();toast("Tap and hold in the box, then Paste");});
    };
  }
  if(step==="review"){
    Array.prototype.forEach.call(document.querySelectorAll("#intake [data-edit]"),function(b){
      b.onclick=function(){ikEdit(b.getAttribute("data-edit"));};
    });
    $("#ikName").oninput=function(){state.draft.name=this.value;saveDraft();};
    $("#ikNote").oninput=function(){state.draft.note=this.value;saveDraft();};
  }
}
function ikSave(){
  var d=state.draft;
  d.name=$("#ikName").value.trim();
  d.note=$("#ikNote").value.trim();
  if(!d.city){ikEdit("city");return;}
  if(!d.access){ikEdit("access");return;}
  if(!d.symptom){ikEdit("symptom");return;}
  var j=hydrate({id:uid(),created:Date.now(),example:false,status:"open",
    name:d.name,phone:d.phone,addr:d.addr,city:d.city,access:d.access,symptom:d.symptom,
    note:d.note,msg:d.msg,urgency:NEW_CALL.urgency,size:NEW_CALL.size,crew:NEW_CALL.crew});
  state.jobs.push(j);
  clearDraft();
  saveLocal();
  go("today");
  var w=whereItGoes(j);
  toast(w.truck
    ? "Saved \u2014 Truck "+w.truck+(w.tomorrow?" tomorrow":"")+", about "+fmtMin(w.arrive)
    : "Saved \u2014 every truck is full, so it goes out first next morning");
}

/* ---------- queue ---------- */
function renderQueue(){
  var d=buildToday(), html="", when=d.day.tomorrow?"Tomorrow":"Today";
  d.routes.forEach(function(r,i){
    if(!r)return;
    var jobs=r.stops.map(function(st){return st.job;});
    var mins=jobs.reduce(function(a,j){return a+j.dur;},0);
    html+='<div class="zgroup"><div class="zhead"><span class="zn">Truck '+(i+1)+'</span>'+
      '<span class="zc">'+jobs.length+' · '+fmtDur(mins)+' · '+esc(areaName(jobs))+'</span>'+
      '<span class="zd">'+when+'</span></div>'+
      '<div class="qlist">'+r.stops.map(function(st){return qrow(st.job,fmtMin(st.arrive));}).join("")+'</div></div>';
  });
  if(d.spill.length){
    html+='<div class="zgroup"><div class="zhead"><span class="zn" style="color:var(--high)">Doesn’t fit</span>'+
      '<span class="zc">'+d.spill.length+' call'+(d.spill.length>1?"s":"")+'</span>'+
      '<span class="zd" style="color:var(--high)">Next morning, first</span></div>'+
      '<div class="qlist">'+d.spill.map(function(j){return qrow(j,fmtDur(j.dur));}).join("")+'</div></div>';
  }
  if(!openJobs().length)html='<div class="card empty"><span class="disp">No open calls</span>Every call that comes in lands here, on the truck that will take it.</div>';

  /* Finishing a job used to delete it. Now it is kept: the history is his
     customer list, and Undo is the fix for a Done tapped by mistake. */
  var done=state.jobs.filter(function(j){return j.status==="done";})
    .sort(function(a,b){return (b.doneAt||0)-(a.doneAt||0);});
  if(done.length){
    var older=done.length-15;
    html+='<div class="sec-head"><h2>Finished</h2><span class="note">Kept on the phone, not deleted. Undo puts a job back on the board.</span></div>'+
      '<div class="qlist qdone">'+done.slice(0,15).map(drow).join("")+'</div>'+
      (older>0?'<p class="qmore">'+older+' older finished job'+(older===1?' is':'s are')+' kept too.</p>':'');
  }
  $("#queueList").innerHTML=html;
  Array.prototype.forEach.call(document.querySelectorAll("[data-del]"),function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-del"), j=jobById(id);
      if(!j)return;
      ask("Remove this job?",
          (j.name||"This job")+" in "+j.city+" will be deleted from the board. This cannot be undone.",
          "Remove","danger",
          function(){dropJob(id,"Job removed");});
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-undo]"),function(b){
    b.onclick=function(){reopenJob(b.getAttribute("data-undo"));};
  });
}
function qrow(j,right){
  return '<div class="qrow"><span class="pill '+tonePill(j.tier)+'">'+(j.tier===1?"AM":j.tier===2?"OUT":"IN")+'</span>'+
    '<span><span class="qn">'+esc(j.name||"No name")+'</span> <span class="qm">'+esc(j.city)+' · '+esc(sym(j.symptom).label)+'</span></span>'+
    '<span class="qr"><span class="qdur">'+esc(right)+'</span><button class="xbtn" data-del="'+j.id+'" title="Remove">&times;</button></span></div>';
}
function drow(j){
  var when=j.doneAt?new Date(j.doneAt).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"";
  return '<div class="qrow"><span class="pill p-ok">Done</span>'+
    '<span><span class="qn">'+esc(j.name||"No name")+'</span> <span class="qm">'+esc(j.city)+' · '+esc(sym(j.symptom).label)+'</span></span>'+
    '<span class="qr"><span class="qdur">'+esc(when)+'</span><button class="act" data-undo="'+j.id+'">Undo</button></span></div>';
}

/* ---------- rules tab ---------- */
function renderRules(){
  $("#zoneTable").innerHTML='<thead><tr><th>Area</th><th>Covers</th></tr></thead><tbody>'+
    ZONES.map(function(z){return '<tr><td><b>'+esc(z.name)+'</b></td><td>'+esc(z.range)+'</td></tr>';}).join("")+'</tbody>';

  $("#cutTable").innerHTML='<thead><tr><th>Forecast high</th><th>Attic/roof cutoff</th><th>Why</th></tr></thead><tbody>'+
    CUTOFFS.map(function(c,i){
      var lo=i?CUTOFFS[i-1].upTo+1:0;
      var range=i===CUTOFFS.length-1?(lo+"°F+"):(i===0?("under "+(c.upTo+1)+"°F"):(lo+"–"+c.upTo+"°F"));
      return '<tr><td class="n">'+range+'</td><td class="n"><b>'+c.txt+'</b></td><td>'+esc(c.why)+'</td></tr>';
    }).join("")+'</tbody>';

  $("#symTable").innerHTML='<thead><tr><th>What they say on the phone</th><th>Base block</th></tr></thead><tbody>'+
    SYMPTOMS.map(function(s){return '<tr><td>'+esc(s.label)+(s.twoVisit?' <span class="pill p-warm">2 trips</span>':'')+'</td><td class="n">'+fmtDur(s.min)+'</td></tr>';}).join("")+'</tbody>';

  var rows=[];
  ACCESS.forEach(function(a){rows.push(["Access",a.label,"×"+a.mult.toFixed(2),a.tier===1?"Morning only":a.tier===2?"Any time":"Midday fine"]);});
  SIZES.forEach(function(s){rows.push(["System",s.label,"×"+s.mult.toFixed(2),""]);});
  rows.push(["Crew","2 techs","×0.65","not 0.50 — write-up and customer time don’t halve"]);
  $("#multTable").innerHTML='<thead><tr><th>Factor</th><th>Value</th><th>Multiplier</th><th>Time of day</th></tr></thead><tbody>'+
    rows.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td class="n">'+esc(r[2])+'</td><td>'+esc(r[3])+'</td></tr>';}).join("")+'</tbody>';

  $("#settingsForm").innerHTML=SET_FIELDS.map(function(f){
    var v=state.settings[f.k];
    var input = f.type==="city"
      ? '<select data-set="'+f.k+'">'+CITIES.slice().sort(function(a,b){return a[0]<b[0]?-1:1;}).map(function(c){
          return '<option'+(c[0]===v?' selected':'')+'>'+esc(c[0])+'</option>';}).join("")+'</select>'
      : '<input data-set="'+f.k+'" type="text" inputmode="'+(f.type==="num"?"decimal":"text")+'" value="'+esc(v)+'">';
    return '<div class="set-row"><label>'+esc(f.label)+(f.note?'<small>'+esc(f.note)+'</small>':'')+'</label>'+input+'</div>';
  }).join("");
  Array.prototype.forEach.call(document.querySelectorAll("[data-set]"),function(el){
    el.onchange=function(){
      state.settings[el.getAttribute("data-set")]=el.value;
      persistSettings();render();toast("Setting saved");
    };
  });

  var when = state.savedAt ? new Date(state.savedAt).toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "not yet";
  var where = state.idbOk===true
    ? "in the phone\u2019s database, with a second copy alongside it"
    : "in this browser";
  var prot = state.persisted===true
    ? " The phone has marked it <b>protected</b>, so it will not be cleared to make room for anything else."
    : "";
  $("#storeStatus").innerHTML = state.saveError
    ? '<b>This browser is blocking storage.</b> Nothing is being kept between visits \u2014 usually private/incognito mode. Open the page in a normal window.'
    : ('<b>Kept on this phone.</b> Jobs are stored '+where+', so a reload, a restart or a week off does not touch them.'+prot+
       ' They still live on this one phone: erasing the app or switching phones loses them, so save a backup now and then. Last write: '+esc(when)+'.');

  $("#bkSave").onclick=doBackup;
  $("#bkWeek").onclick=openWeek;
  $("#bkLoad").onclick=function(){ $("#bkFile").value=""; $("#bkFile").click(); };
  $("#bkFile").onchange=function(){
    var f=this.files&&this.files[0]; if(!f)return;
    var rd=new FileReader();
    rd.onload=function(){ tryRestore(String(rd.result)); };
    rd.onerror=function(){ toast("Could not read that file"); };
    rd.readAsText(f);
  };
  $("#bkPaste").onclick=function(){
    $("#bkBox").style.display="block";$("#bkText").value="";$("#bkText").focus();
  };
  $("#bkClose").onclick=function(){$("#bkBox").style.display="none";};
  $("#bkDo").onclick=function(){ tryRestore($("#bkText").value); };
  $("#resetEx").onclick=function(){
    ask("Load the example jobs?","Adds 18 sample jobs alongside his real ones, so you can see the routing work. They are labelled and can be cleared again.",
        "Load examples","",
        function(){examples().forEach(function(j){state.jobs.push(j);});saveLocal();render();toast("Examples loaded");});
  };
  $("#wipe").onclick=function(){
    var n=state.jobs.length;
    ask("Delete everything?",
        "All "+n+" job"+(n===1?"":"s")+", finished ones included, will be permanently deleted. Settings stay. Save a backup first if you are not sure — this cannot be undone.",
        "Delete all "+n,"danger",
        function(){
          state.jobs=[];saveLocal();render();toast("Board cleared");
        });
  };
}

/* Get the backup off the phone and into somewhere that survives losing it.
   On iOS the only reliable way out of a standalone web app is the native
   share sheet, which reaches Files, iCloud Drive, Google Drive and Mail.
   <a download> is the desktop path; iOS Safari largely ignores it. A box of
   text he has to select by hand is the last resort, not the plan. */
function saveBackup(txt,fname,n){
  var file=null;
  try{ file=new File([txt],fname,{type:"application/json"}); }catch(e){}

  if(file&&navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:"AC Day Router backup"})
      .then(function(){markBackedUp();toast("Backup saved");})
      .catch(function(err){
        if(err&&err.name==="AbortError")return;      /* he closed the share sheet */
        showBackupText(txt,n);
      });
    return;
  }

  if(window.URL&&URL.createObjectURL&&"download" in document.createElement("a")){
    var url=URL.createObjectURL(new Blob([txt],{type:"application/json"}));
    var a=document.createElement("a");
    a.href=url;a.download=fname;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
    markBackedUp();
    toast("Backup saved — "+n+" job"+(n===1?"":"s"));
    return;
  }

  showBackupText(txt,n);
}

function showBackupText(txt,n){
  $("#bkBox").style.display="block";
  $("#bkText").value=txt;
  $("#bkText").focus();$("#bkText").select();
  toast("Copy this text and keep it safe");
}

/* ---------- sticky bar ---------- */
function renderBar(){
  var b=$("#stickybar");
  if(state.tab==="new"){
    var st=state.draft.step;
    if(st==="paste"){
      b.innerHTML='<button class="btn ghost" id="barAsk">No text — ask me</button><button class="btn" id="barNext">Next</button>';
      $("#barAsk").onclick=function(){ikRead("");};
      $("#barNext").onclick=function(){ikRead($("#ikText").value);};
    }else if(st==="review"){
      b.innerHTML='<button class="btn ghost" id="barBack">Back</button><button class="btn" id="barSave">Save</button>';
      $("#barSave").onclick=ikSave;
    }else if(st==="addr"||st==="phone"){
      b.innerHTML='<button class="btn ghost" id="barBack">Back</button><button class="btn" id="barNext">Next</button>';
      $("#barNext").onclick=st==="addr"?ikSubmitAddr:ikSubmitPhone;
    }else{
      b.innerHTML='<button class="btn ghost wide" id="barBack">Back</button>';
    }
    var bb=$("#barBack"); if(bb)bb.onclick=ikBack;
  }else if(state.tab==="today"){
    b.innerHTML='<button class="btn ghost" id="barSheet">Call sheet</button><button class="btn" id="barNew">New call</button>';
    $("#barNew").onclick=function(){go("new");};
    $("#barSheet").onclick=function(){openSheet(0);};
  }else{
    b.innerHTML='<button class="btn wide" id="barNew2">New call</button>';
    $("#barNew2").onclick=function(){go("new");};
  }
}
/* ============================================================
   CALL SHEET — one stop at a time, big type, in route order.
   The boss dispatches by voice: he holds the phone to his ear and
   reads this out to the tech. So every stop also gets a spoken
   line — "fourteen seventy-seven Northwest Fortieth Terrace" —
   because nobody says "1477 NW 40th Ter" out loud.
   ============================================================ */
var ONES=["zero","one","two","three","four","five","six","seven","eight","nine","ten",
          "eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen",
          "eighteen","nineteen"];
var TENS=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
var ORD={one:"first",two:"second",three:"third",four:"fourth",five:"fifth",six:"sixth",
         seven:"seventh",eight:"eighth",nine:"ninth",ten:"tenth",eleven:"eleventh",
         twelve:"twelfth",hundred:"hundredth"};
var DIRS={N:"North",S:"South",E:"East",W:"West",NE:"Northeast",NW:"Northwest",
          SE:"Southeast",SW:"Southwest"};
var TYPES={st:"Street",ave:"Avenue",av:"Avenue",blvd:"Boulevard",rd:"Road",dr:"Drive",
           ter:"Terrace",terr:"Terrace",ct:"Court",cir:"Circle",ln:"Lane",pl:"Place",
           pkwy:"Parkway",pky:"Parkway",hwy:"Highway",apt:"apartment",
           ste:"suite",bldg:"building"};
var ACC_SAY={attic:"unit is in the attic",roof:"unit is on the roof",
             crawl:"tight crawl space",yard:"unit is out back",
             garage:"unit is in the garage or closet"};

function words(n){                       /* 0..999999 spelled out */
  if(n<0||n>999999)return String(n);
  if(n<20)return ONES[n];
  if(n<100){var t=TENS[Math.floor(n/10)],r=n%10;return r?t+"-"+ONES[r]:t;}
  if(n<1000){var h=Math.floor(n/100),r2=n%100;return ONES[h]+" hundred"+(r2?" "+words(r2):"");}
  var k=Math.floor(n/1000),r3=n%1000;
  return words(k)+" thousand"+(r3?" "+words(r3):"");
}
function ordWords(n){                    /* 40 -> "fortieth", 132 -> "...thirty-second" */
  if(n<1||n>999)return String(n);
  var w=words(n),m=w.match(/[a-z]+$/),last=m?m[0]:w;
  var rep=ORD[last]||(/y$/.test(last)?last.slice(0,-1)+"ieth":last+"th");
  return w.slice(0,w.length-last.length)+rep;
}
function sayHouseNum(s){                 /* how a person reads a street number aloud */
  if(s.length<=2)return words(+s);
  if(s.length===3)return ONES[+s.charAt(0)]+" "+(s.slice(1)==="00"?"hundred":words(+s.slice(1)));
  if(s.length===4){
    var a=+s.slice(0,2),b=+s.slice(2);
    if(b===0)return words(a)+" hundred";
    if(b<10)return words(a)+" oh "+ONES[b];
    return words(a)+" "+words(b);
  }
  if(s.length===5)return words(+s);      /* 11400 -> "eleven thousand four hundred" */
  return s.split("").map(function(d){return ONES[+d];}).join(" ");   /* longer, digit by digit */
}
function sayAddr(a){
  return String(a||"").trim().split(/\s+/).map(function(w,i){
    var bare=w.replace(/[.,]/g,"");
    if(!bare)return w;
    if(i===0&&/^[0-9]+$/.test(bare))return sayHouseNum(bare);
    if(DIRS[bare.toUpperCase()])return DIRS[bare.toUpperCase()];
    if(TYPES[bare.toLowerCase()])return TYPES[bare.toLowerCase()];
    var m=bare.match(/^([0-9]+)(st|nd|rd|th)$/i);
    if(m)return ordWords(+m[1]);
    if(/^[0-9]+$/.test(bare))return words(+bare);
    return w;
  }).join(" ");
}
function sayNote(t){                     /* "Gate 4412" -> "Gate four four one two" */
  return String(t||"").replace(/((?:gate|code|lockbox|lock box|box|door|keypad)\D{0,12})([0-9]{3,8})/gi,
    function(_,pre,num){
      return pre+num.split("").map(function(d){return ONES[+d];}).join(" ");
    });
}
/* "Duct / airflow work" is fine on screen and unsayable out loud. */
function saySymptom(id){
  return sym(id).label.replace(/\s*—\s*/g,", ").replace(/\s*\/\s*/g," or ").toLowerCase();
}
function sayJob(j){
  var bits=[];
  if(j.name)bits.push(j.name);
  if(j.city)bits.push(j.city);
  if(j.addr)bits.push(sayAddr(j.addr));
  bits.push(ACC_SAY[j.access]||acc(j.access).label.toLowerCase());
  bits.push(saySymptom(j.symptom));
  var s=bits.join(", ")+".";
  if(j.note)s+=" "+sayNote(j.note.trim().replace(/\.$/,""))+".";
  return s;
}

/* ---------- the view ---------- */
var sheetList=[], sheetAt=0;

function buildSheet(){
  var d=buildToday(),out=[];
  d.routes.forEach(function(r,i){
    if(!r)return;
    var area=areaName(r.stops.map(function(st){return st.job;}));
    r.stops.forEach(function(st,k){
      out.push({truck:i+1,n:k+1,of:r.stops.length,st:st,area:area,cut:d.cut});
    });
  });
  return out;
}
function openSheet(i){
  sheetList=buildSheet();
  if(!sheetList.length){toast("Nothing on the board yet");return;}
  /* Reading the lists out is dispatching, so from here the plan holds still. */
  var day=planDay(planSettings());
  if(state.dispatched!==day.key){state.dispatched=day.key;saveLocal();}
  sheetAt=Math.max(0,Math.min(i||0,sheetList.length-1));
  $("#sheet").hidden=false;
  document.body.style.overflow="hidden";
  renderSheet();
}
function closeSheet(){
  $("#sheet").hidden=true;
  document.body.style.overflow="";
}
function stepSheet(d){
  var n=sheetAt+d;
  if(n<0)return;
  if(n>=sheetList.length){closeSheet();toast("That is the whole day");return;}
  sheetAt=n;renderSheet();
  $("#sheetBody").scrollTop=0;
}
function renderSheet(){
  var e=sheetList[sheetAt], j=e.st.job, last=sheetAt===sheetList.length-1;

  $("#sheetWhere").innerHTML="Truck "+e.truck+" &middot; stop "+e.n+" of "+e.of+
                             " &middot; "+esc(e.area);

  var dots="",i;
  for(i=0;i<sheetList.length;i++){
    dots+='<i class="'+(i===sheetAt?"on":(i<sheetAt?"done":""))+'"></i>';
  }
  $("#sheetDots").innerHTML=dots;

  var h="";
  h+='<div class="sh-when">'+fmtMin(e.st.arrive)+"<span>"+fmtDur(j.dur)+" on site"+
     (j.crew===2?" &middot; 2 techs":"")+"</span></div>";
  h+='<div class="sh-who">'+esc(j.name||"No name")+"</div>";
  h+='<div class="sh-city">'+esc(j.city||"")+"</div>";
  if(j.addr)h+='<div class="sh-addr">'+esc(j.addr)+"</div>";

  h+='<div class="sh-say"><div class="sh-k">Read it like this</div>'+
     "<p>&ldquo;"+esc(sayJob(j))+"&rdquo;</p></div>";

  h+='<div class="sh-facts">';
  h+='<div class="sh-fact"><b>'+esc(sym(j.symptom).label)+"</b><span>what they said</span></div>";
  h+='<div class="sh-fact"><b>'+esc(acc(j.access).label)+"</b><span>where the unit is</span></div>";
  h+='<div class="sh-fact"><b>'+esc(size(j.size).label)+"</b><span>system</span></div>";
  h+="</div>";

  /* The note is already inside the spoken line above. Repeat it verbatim only when
     it carries digits — a gate code has to be read off exactly, not as words. */
  if(j.note&&/[0-9]/.test(j.note))
    h+='<div class="sh-note"><div class="sh-k">Exactly as written</div><p>'+esc(j.note)+"</p></div>";
  if(e.st.late)h+='<div class="sh-warn">Past the '+e.cut.txt+" cutoff for "+
                  esc(acc(j.access).label.toLowerCase())+" work. Keep it short and take water.</div>";

  if(j.phone)h+='<a class="sh-call" href="tel:'+esc(j.phone.replace(/[^0-9+]/g,""))+'">Call '+esc(j.phone)+"</a>";

  $("#sheetBody").innerHTML=h;
  $("#sheetPrev").disabled=sheetAt===0;
  $("#sheetNext").textContent=last?"Done":"Next stop";
}

$("#sheetX").onclick=closeSheet;
$("#sheetPrev").onclick=function(){stepSheet(-1);};
$("#sheetNext").onclick=function(){stepSheet(1);};
document.addEventListener("keydown",function(ev){
  if($("#sheet").hidden)return;
  if(ev.key==="Escape")closeSheet();
  if(ev.key==="ArrowRight")stepSheet(1);
  if(ev.key==="ArrowLeft")stepSheet(-1);
});

/* ============================================================
   BACKUP NAG — the app knows when he last got a copy off the phone,
   and says so on the Today tab. Silent while there is nothing real to
   lose, because nagging about sample data teaches him to ignore it.
   ============================================================ */
var NAG_DAYS=7, DAY_MS=86400000;

function realJobCount(){
  return state.jobs.filter(function(j){return !j.example;}).length;
}
/* 0 = nothing to say, -1 = never backed up, N = N days since the last one */
function backupDue(){
  if(realJobCount()===0)return 0;
  if(state.nagSnoozeUntil && Date.now()<state.nagSnoozeUntil)return 0;
  if(!state.lastBackupAt)return -1;
  var days=Math.floor((Date.now()-state.lastBackupAt)/DAY_MS);
  return days>=NAG_DAYS ? days : 0;
}
function markBackedUp(){
  state.lastBackupAt=Date.now();
  state.nagSnoozeUntil=0;
  saveLocal();
  render();
}
function doBackup(){
  var n=realJobCount();
  saveBackup(payload(),"ac-day-router-"+new Date().toISOString().slice(0,10)+".json",n);
}
function renderNag(){
  var due=backupDue();
  if(due===0){$("#nagBox").innerHTML="";return;}
  var n=realJobCount();
  $("#nagBox").innerHTML=
    '<div class="nag"><div class="nag-txt"><b>'+
    (due<0 ? "No backup has ever been saved." : "No backup in "+due+" days.")+
    '</b><span>'+n+' real job'+(n===1?'':'s')+' exist only on this phone. Losing it loses them.</span></div>'+
    '<div class="nag-acts">'+
    '<button class="btn sm" id="nagSave">Save one now</button>'+
    '<button class="btn ghost sm" id="nagLater">Later</button></div></div>';
  $("#nagSave").onclick=doBackup;
  $("#nagLater").onclick=function(){
    state.nagSnoozeUntil=Date.now()+3*DAY_MS;
    saveLocal();renderNag();toast("Asking again in 3 days");
  };
}

/* ---------- restore, from a file or from pasted text ---------- */
function tryRestore(raw){
  raw=String(raw||"").trim();
  if(!raw){toast("Nothing to restore");return;}
  var d2;
  try{d2=JSON.parse(raw);}catch(e){toast("That is not a valid backup file");return;}
  if(!d2||!d2.jobs||!d2.jobs.length){toast("No jobs found in that backup");return;}
  ask("Restore "+d2.jobs.length+" job"+(d2.jobs.length===1?"":"s")+"?",
      "This replaces everything currently on the board with the contents of the backup.",
      "Restore","danger",
      function(){
        state.jobs=d2.jobs.map(hydrate);
        if(d2.settings)state.settings=Object.assign({},DEF,d2.settings);
        if(d2.hi)state.hi=d2.hi;
        saveLocal();$("#bkBox").style.display="none";render();
        toast("Restored "+d2.jobs.length+" jobs");
      });
}

/* ============================================================
   WEEK VIEW — the backup that survives him forgetting to make one.
   He screenshots this; iOS syncs photos to iCloud by itself. If the
   phone goes in a pool, the jobs are still legible in his camera roll,
   which is why every field needed to rebuild a call is printed here.
   ============================================================ */
function openWeek(){
  $("#week").hidden=false;
  document.body.style.overflow="hidden";
  renderWeek();
  $("#weekBody").scrollTop=0;
}
function closeWeek(){
  $("#week").hidden=true;
  document.body.style.overflow="";
}
function weekJobRow(j,time){
  var bits=[sym(j.symptom).label,acc(j.access).label,size(j.size).label];
  if(j.crew===2)bits.push("2 techs");
  return '<div class="wk-job">'+
    '<div class="wk-j1">'+(time?'<span class="mono">'+esc(time)+'</span>':'')+'<b>'+esc(j.name||"No name")+'</b>'+
      (j.phone?'<span class="mono">'+esc(j.phone)+'</span>':'')+
      (j.example?'<i class="wk-ex">example</i>':'')+'</div>'+
    '<div class="wk-j2">'+esc([j.addr,j.city].filter(Boolean).join(", "))+'</div>'+
    '<div class="wk-j3">'+esc(bits.join(" · "))+'</div>'+
    (j.note?'<div class="wk-j4">'+esc(j.note)+'</div>':'')+
    '</div>';
}
function renderWeek(){
  var dt=new Date(), open=openJobs(), n=open.length;
  $("#weekWhere").innerHTML="Whole board &middot; "+n+" job"+(n===1?"":"s")+
    " &middot; "+(dt.getMonth()+1)+"/"+dt.getDate()+"/"+dt.getFullYear();

  var h='<div class="wk-lead">Screenshot this page. Photos back themselves up to '+
        'iCloud on their own, so a picture of this survives losing the phone — '+
        'no remembering required. Scroll and take a second shot if it runs long.</div>';

  if(!n){
    $("#weekBody").innerHTML=h+'<div class="wk-empty">The board is empty. Nothing to record yet.</div>';
    return;
  }

  var d=buildToday(), when=d.day.tomorrow?"tomorrow":"today";
  d.routes.forEach(function(r,i){
    if(!r)return;
    h+='<div class="wk-group"><div class="wk-head">Truck '+(i+1)+' &middot; '+
       esc(areaName(r.stops.map(function(st){return st.job;})))+' &middot; '+when+'</div>';
    r.stops.forEach(function(st){h+=weekJobRow(st.job,fmtMin(st.arrive));});
    h+='</div>';
  });
  if(d.spill.length){
    h+='<div class="wk-group"><div class="wk-head hot">Didn’t fit &middot; first thing next morning &middot; '+d.spill.length+'</div>';
    d.spill.forEach(function(j){h+=weekJobRow(j,"");});
    h+='</div>';
  }

  var s=state.settings;
  h+='<div class="wk-foot">Setup — base '+esc(s.base)+' · start '+esc(s.start)+
     ' · '+esc(s.hours)+'h per truck · '+esc(s.trucks)+' trucks · '+esc(s.mpg)+
     ' mpg · $'+esc(s.gas)+'/gal · $'+esc(s.rate)+' per call · high '+esc(state.hi)+'°F</div>';

  $("#weekBody").innerHTML=h;
}

$("#weekX").onclick=closeWeek;
document.addEventListener("keydown",function(ev){
  if(!$("#week").hidden && ev.key==="Escape")closeWeek();
});

function go(t){
  state.tab=t;
  ["today","new","queue","rules"].forEach(function(k){
    $("#v-"+k).hidden = k!==t;
  });
  Array.prototype.forEach.call(document.querySelectorAll(".tab"),function(b){
    b.setAttribute("aria-selected",String(b.getAttribute("data-tab")===t));
  });
  window.scrollTo(0,0);
  render();
}
function render(){
  if(state.ready)commitPlan();
  var cut=cutoffFor(parseInt(state.hi,10)||90);
  $("#cutoffTxt").textContent=cut.txt;
  $("#hi").value=state.hi;
  $("#qct").textContent=openJobs().length;
  if(state.tab==="today")renderToday();
  if(state.tab==="new")renderNew();
  if(state.tab==="queue")renderQueue();
  if(state.tab==="rules")renderRules();
  renderBar();
}

/* ---------- boot ---------- */
Array.prototype.forEach.call(document.querySelectorAll(".tab"),function(b){
  b.onclick=function(){go(b.getAttribute("data-tab"));};
});
$("#mCancel").onclick=closeModal;
$("#mOk").onclick=function(){var c=_mcb;closeModal();if(c)c();};
$("#modal").onclick=function(e){if(e.target===$("#modal"))closeModal();};
document.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&!$("#modal").hidden)closeModal();
});
$("#hi").addEventListener("input",function(){
  var v=parseInt($("#hi").value,10);
  if(!isNaN(v)&&v>40&&v<120){state.hi=v;persistSettings();
    $("#cutoffTxt").textContent=cutoffFor(v).txt;
    if(state.tab==="today")renderToday();
    if(state.tab==="new"&&state.draft.step==="review")renderNew();}
});

/* Paint immediately from the localStorage mirror — it is synchronous, so
   there is no blank frame — then let IndexedDB have the last word. */
var hadLocal=loadLocal();
state.draft=loadDraft();
render();

/* Seeding the examples is deliberately NOT done here. If localStorage had
   been cleared but IndexedDB still held his real jobs, seeding now would
   call saveLocal() and overwrite them with sample data. Nothing is written
   until we know what IndexedDB actually has. */
function seedExamples(){
  state.jobs=examples(); state.seeded=true; saveLocal(); render();
}
/* state.ready stays false until IndexedDB has been read. Until then the plan
   is drawn but never written: saving a plan built on a stale localStorage copy
   would stamp that copy newer than the real data in IndexedDB, and the stale
   copy would win the next boot. */
idbLoad().then(function(rec){
  state.idbOk=true;
  if(rec && (rec.savedAt||0) >= (state.savedAt||0)){
    adoptRecord(rec);                              // the newer copy wins
    mirrorToLocal(rec);                            // rebuild the mirror now, not at the next save
  }else if(rec || hadLocal || state.seeded){
    idbSave(snapshot());                           // localStorage was ahead, or first run: sync it up
  }else{
    state.ready=true; seedExamples(); return;      // a genuinely new device
  }
  state.ready=true; render();
}).catch(function(){
  state.idbOk=false;                               // no IndexedDB; the mirror carries on
  state.ready=true;
  if(!hadLocal && !state.seeded){ seedExamples(); return; }
  render();
});

/* Ask the browser not to evict this data when the phone runs short on space.
   On iOS the home-screen install is what does the real work; this is the
   belt to that pair of braces, and it is what protects him everywhere else. */
if(navigator.storage && navigator.storage.persist){
  (navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false))
    .then(function(already){
      return already ? true : navigator.storage.persist();
    })
    .then(function(ok){
      state.persisted=!!ok;
      if(state.tab==="rules")renderRules();
    })
    .catch(function(){});
}

/* Offline shell. If this fails the app is unharmed — it just goes back to
   needing a signal to open, so there is nothing to report to him. */
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js").catch(function(){});
}

})();
