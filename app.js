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

var ZONES=[
 {id:"Z1",name:"Dade",       range:"Homestead → Miami Lakes",       max:32, day:1, dayName:"Monday"},
 {id:"Z2",name:"The Line",   range:"North Dade → Hollywood/Davie",  max:45, day:2, dayName:"Tuesday"},
 {id:"Z3",name:"Lauderdale", range:"Plantation → Oakland Park",     max:52, day:3, dayName:"Wednesday"},
 {id:"Z4",name:"North",      range:"Pompano → Boca & up",           max:999,day:4, dayName:"Thursday"}
];
function zoneOf(ni){for(var i=0;i<ZONES.length;i++){if(ni<=ZONES[i].max)return ZONES[i];}return ZONES[3];}
function zoneById(id){for(var i=0;i<ZONES.length;i++){if(ZONES[i].id===id)return ZONES[i];}return null;}

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

var URGENCY=[
 {id:"em",   label:"Emergency",  sub:"today, breaks zone", tone:"hot"},
 {id:"soon", label:"This week",  sub:"next zone day",      tone:""},
 {id:"flex", label:"Flexible",   sub:"any zone day",       tone:""}
];
var CREWS=[{id:1,label:"1 tech",mult:1.00},{id:2,label:"2 techs",mult:0.65}];

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
    var ae=a.urgency==="em"?0:1, be=b.urgency==="em"?0:1;
    if(ae!==be) return ae-be;                      // no-cool in Florida goes first
    if(a.tier!==b.tier) return a.tier-b.tier;      // then hot places before the day cooks
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
/* The SAME truck's SAME jobs, driven in the order the phone rang. */
function naiveMiles(list,baseNi){
  var arr=list.slice().sort(function(a,b){return a.created-b.created;});
  var prev=baseNi,mi=0,mins=0;
  for(var i=0;i<arr.length;i++){var d=legMiles(prev,arr[i].ni);mi+=d;mins+=legMin(d);prev=arr[i].ni;}
  var h=legMiles(prev,baseNi);mi+=h;mins+=legMin(h);
  return {miles:Math.round(mi),mins:mins};
}
function routedMins(r){var m=0;r.stops.forEach(function(s){m+=s.driveMin;});return m+legMin(r.homeMi);}

/* ============================================================
   STATE + STORAGE — localStorage on this one phone, and nowhere else.
   ============================================================ */
var state={jobs:[],settings:Object.assign({},DEF),tab:"today",hi:94,draft:blankDraft(),
           seeded:false,savedAt:0,saveError:false,idbOk:null,persisted:null};
var LS="acdayrouter.v1";

function blankDraft(){
  return {name:"",phone:"",addr:"",city:"Fort Lauderdale",symptom:"nocool_dead",
          access:"yard",size:"s34",urgency:"soon",crew:1,note:""};
}
function uid(){return "j"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function hydrate(j){
  var ni = CITY_NI[j.city]; if(ni===undefined) ni=48;
  j.ni=ni; j.zone=zoneOf(ni).id; j.tier=acc(j.access).tier; j.dur=duration(j);
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

function idbOpen(){
  if(idbP)return idbP;
  idbP=new Promise(function(res,rej){
    if(!window.indexedDB){rej(new Error("no indexedDB"));return;}
    var req=indexedDB.open(IDB_NAME,1);
    req.onupgradeneeded=function(){
      var db=req.result;
      if(!db.objectStoreNames.contains(IDB_STORE))db.createObjectStore(IDB_STORE);
    };
    req.onsuccess=function(){res(req.result);};
    req.onerror=function(){rej(req.error);};
    req.onblocked=function(){rej(new Error("blocked"));};
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
  return { v:1, seeded:true, jobs:state.jobs, settings:state.settings,
           hi:state.hi, savedAt:Date.now() };
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
    app:"AC Day Router", v:1, exported:new Date().toISOString(),
    jobs:state.jobs.filter(function(j){return !j.example;}),
    settings:state.settings, hi:state.hi
  },null,2);
}
/* There is one device and no server, so "persist" just means the phone.
   Kept as named calls because the call sites read better that way. */
function persist(j){ saveLocal(); }
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

function todaysZone(){
  var dow=new Date().getDay(); // 0 Sun .. 6 Sat
  for(var i=0;i<ZONES.length;i++){if(ZONES[i].day===dow)return ZONES[i];}
  return null; // Fri/Sat/Sun -> overflow: pick the fullest zone
}
function fullestZone(){
  var best=null,bn=-1;
  ZONES.forEach(function(z){
    var n=state.jobs.filter(function(j){return j.zone===z.id&&j.urgency!=="em";}).length;
    if(n>bn){bn=n;best=z;}
  });
  return best;
}

function buildToday(){
  var zone=todaysZone(), overflow=false;
  if(!zone){zone=fullestZone();overflow=true;}
  var cut=cutoffFor(parseInt(state.hi,10)||90);
  var baseNi=CITY_NI[state.settings.base]!==undefined?CITY_NI[state.settings.base]:48;
  var startMin=(function(s){var p=String(s||"07:00").split(":");return (+p[0])*60+(+p[1]||0);})(state.settings.start);

  var ems=state.jobs.filter(function(j){return j.urgency==="em";});
  var zoneJobs=state.jobs.filter(function(j){return j.urgency!=="em"&&j.zone===zone.id;});
  var pool=ems.concat(zoneJobs);

  var capMin=Math.round((parseFloat(state.settings.hours)||8.5)*60);
  var nTrucks=Math.max(1,Math.min(4,parseInt(state.settings.trucks,10)||2));
  var buckets=[],used=[];
  for(var i=0;i<nTrucks;i++){buckets.push([]);used.push(0);}
  state.jobs.forEach(function(j){j._overflow=false;j._piggy=null;});

  // Emergencies are scattered by nature — spread them so one truck isn't
  // crossing the whole corridor twice. Everything else CLUSTERS: fill
  // truck 1 before opening truck 2, or the batching undoes itself.
  var truckEmZones=[];for(var t2=0;t2<nTrucks;t2++)truckEmZones.push({});
  ems.slice().sort(function(a,b){return a.ni-b.ni;}).forEach(function(j,i){
    var k=i%nTrucks; buckets[k].push(j); used[k]+=j.dur;
    if(j.zone!==zone.id) truckEmZones[k][j.zone]=1;
  });

  // A truck already driving off-zone for an emergency should not come home
  // empty. Pull that zone's waiting work along for the ride \u2014 the drive
  // is already paid for.
  var piggy={};
  for(var k2=0;k2<nTrucks;k2++){
    Object.keys(truckEmZones[k2]).forEach(function(zid){
      state.jobs.filter(function(j){return j.urgency!=="em"&&j.zone===zid&&!piggy[j.id];})
        .sort(function(a,b){return a.tier-b.tier||a.ni-b.ni;})
        .forEach(function(j){
          if(used[k2]+j.dur<=capMin){buckets[k2].push(j);used[k2]+=j.dur;piggy[j.id]=1;j._piggy=zid;}
        });
    });
  }

  // A truck sent off-zone is COMMITTED to that end of the county. Giving it
  // today's zone work too just rebuilds the zigzag we are trying to kill.
  var committed=[];
  for(var k3=0;k3<nTrucks;k3++){
    var zs=Object.keys(truckEmZones[k3]);
    committed.push(zs.length?zs[0]:null);
  }
  zoneJobs.slice().sort(function(a,b){return a.tier-b.tier||a.ni-b.ni;}).forEach(function(j){
    var pick=-1;
    for(var k=0;k<nTrucks;k++){                       // free trucks first
      if(!committed[k]&&used[k]+j.dur<=capMin){pick=k;break;}
    }
    if(pick<0){          // a committed truck only takes work in the zone it is already in
      for(var k2=0;k2<nTrucks;k2++){
        if(committed[k2]===j.zone&&used[k2]+j.dur<=capMin){pick=k2;break;}
      }
    }
    if(pick<0){j._overflow=true;return;}   // better to roll it than to zigzag
    buckets[pick].push(j);used[pick]+=j.dur;
  });

  var routes=buckets.map(function(b){return b.length?routeJobs(b,baseNi,startMin,cut):null;});
  var spill=pool.filter(function(j){return j._overflow;});
  return {zone:zone,overflow:overflow,cut:cut,routes:routes,buckets:buckets,pool:pool,spill:spill,baseNi:baseNi,piggy:piggy};
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

function renderToday(){
  var d=buildToday(), s=state.settings;
  var dt=new Date();
  var dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  $("#dayTitle").textContent=dayNames[dt.getDay()]+"'s run";
  $("#daySub").innerHTML = d.overflow
    ? 'Overflow day — no zone assigned, so it’s working the fullest one: <b>'+esc(d.zone.name)+'</b>.'
    : 'Zone day: <b>'+esc(d.zone.name)+'</b> — '+esc(d.zone.range)+'. Emergencies anywhere still go today.';

  // example banner
  var hasEx=state.jobs.some(function(j){return j.example;});
  $("#exNote").innerHTML = hasEx
    ? '<div class="ex-note"><span>These jobs are examples so you can see the routing work on any day of the week. Clear them once his real calls go in.</span><button class="btn ghost sm" id="clrEx">Clear examples</button></div>'
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
  if(!totalJobs){
    html='<div class="card empty"><span class="disp">Nothing on the board for '+esc(d.zone.name)+'</span>Add a call, or check the Waiting tab — other zones may be stacked up.</div>';
  }
  d.routes.forEach(function(r,i){
    if(!r)return;
    var mins=routedMins(r);
    html+='<div class="day-crew"><div class="crew-tag"><span class="disp">Truck '+(i+1)+'</span>'+
      '<span class="pill p-in">'+r.stops.length+' stop'+(r.stops.length>1?"s":"")+'</span>'+
      '<span class="meta">'+r.miles+' mi · '+fmtDur(mins)+' driving · back '+fmtMin(r.endMin)+'</span></div><div class="stops">';
    r.stops.forEach(function(st,k){
      var j=st.job, a=acc(j.access), sy=sym(j.symptom);
      html+='<div class="drive">'+(k===0?"from base":"")+' '+Math.round(st.driveMi)+' mi · '+st.driveMin+' min</div>';
      html+='<div class="stop '+toneClass(j.tier)+'"><div class="stripe"></div>'+
        '<div class="slot"><span class="t mono">'+fmtMin(st.arrive)+'</span><span class="dur mono">'+fmtDur(j.dur)+'</span></div>'+
        '<div class="sbody">'+
          '<div class="sline1"><span class="sname">'+esc(j.name||"No name")+'</span><span class="scity">'+esc(j.city)+'</span></div>'+
          '<div class="sline2"><b>'+esc(sy.label)+'</b> — '+esc(a.label.toLowerCase())+', '+esc(size(j.size).label.toLowerCase())+(j.crew===2?", 2 techs":"")+'</div>'+
          (j.note?'<div class="sline2" style="color:var(--ink-3)">'+esc(j.note)+'</div>':'')+
          '<div class="stags">'+
            (j.urgency==="em"?'<span class="pill p-em">Emergency</span>':'')+
            (j.urgency==="em"&&j.zone!==d.zone.id?'<span class="pill p-warm">Off-zone — '+esc(zoneById(j.zone).name)+'</span>':'')+
            (j._piggy?'<span class="pill p-ok">Picked up — truck was already in '+esc(zoneById(j._piggy).name)+'</span>':'')+
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
        html+= j.urgency==="em"
          ? '<div class="warnrow"><b>'+esc(a.label)+' at '+fmtMin(st.arrive)+', past the '+d.cut.txt+' cutoff.</b> It is an emergency, so it goes anyway — send two, send water, and keep the '+esc(a.label.toLowerCase())+' time short.</div>'
          : '<div class="warnrow"><b>Too late for the '+esc(a.label.toLowerCase())+'.</b> This lands at '+fmtMin(st.arrive)+', past the '+d.cut.txt+' cutoff. Only one '+esc(a.label.toLowerCase())+' job fits per morning — move this one to the next zone day.</div>';
      }
    });
    html+='<div class="drive">'+r.homeMi+' mi back to base</div></div></div>';
  });
  if(d.spill.length){
    html+='<div class="warnrow" style="margin-top:16px"><div><b>'+d.spill.length+' job'+(d.spill.length>1?"s":"")+' didn’t fit today.</b> '+
      d.spill.map(function(j){return esc(j.name)+" ("+fmtDur(j.dur)+")";}).join(", ")+
      ' — every truck is either full or committed to an off-zone emergency. These roll to the next '+esc(d.zone.name)+' day, or put another truck out in setup.</div></div>';
  }
  $("#dayPlan").innerHTML=html;
  Array.prototype.forEach.call(document.querySelectorAll("[data-done]"),function(b){
    b.onclick=function(){
      var id=b.getAttribute("data-done"), j=jobById(id);
      if(!j)return;
      ask("Mark this job finished?",
          (j.name||"This job")+" in "+j.city+" — "+sym(j.symptom).label.toLowerCase()+
          ". It comes off the board and the rest of the day re-times around it.",
          "Mark finished","",
          function(){dropJob(id,"Job finished");});
    };
  });

  renderSavings(d);
}
function cell(k,v){return '<div class="ro-cell"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';}

function renderSavings(d){
  var all=[];d.routes.forEach(function(r){if(r)r.stops.forEach(function(s){all.push(s.job);});});
  if(all.length<2){
    $("#savings").innerHTML='<div class="empty">Needs at least two stops before there\u2019s a route to compare.</div>';
    return;
  }
  var baseNi=d.baseNi, n=all.length;

  /* The saving is NOT from resorting one zone \u2014 it is from not crossing
     zones in the same day. So compare the two POLICIES on the same workload:
     take n jobs in the order the phone rang, wherever they are, and drive
     them in that order (what he does now) vs. today's one-zone plan. */
  var byCall=state.jobs.slice().sort(function(a,b){return a.created-b.created;}).slice(0,n);
  var prev=baseNi, nvMi=0, nvMin=0;
  byCall.forEach(function(j){var mi=legMiles(prev,j.ni);nvMi+=mi;nvMin+=legMin(mi);prev=j.ni;});
  var hb=legMiles(prev,baseNi); nvMi+=hb; nvMin+=legMin(hb);
  nvMi=Math.round(nvMi);

  var optMi=0,optMin=0;
  d.routes.forEach(function(r){if(r){optMi+=r.miles;optMin+=routedMins(r);}});

  var s=state.settings;
  var mpg=parseFloat(s.mpg)||15, gas=parseFloat(s.gas)||3.35, rate=parseFloat(s.rate)||165;
  var miSaved=Math.max(0,nvMi-optMi), minSaved=Math.max(0,nvMin-optMin);
  var fuel=(miSaved/mpg*gas);
  var weekFuel=fuel*5, weekHrs=minSaved*5/60;
  var extraCalls=Math.floor(minSaved/90);
  var mx=Math.max(nvMi,optMi)||1;
  var zonesHit={};byCall.forEach(function(j){zonesHit[j.zone]=1;});
  var nz=Object.keys(zonesHit).length;

  $("#savings").innerHTML=
  '<div class="sv-head"><h3>'+n+' stops, two ways to run the day</h3>'+
   '<p>Same number of jobs. One day answers them in the order they rang, wherever they are; the other works a single zone with the hot jobs first.</p></div>'+
  '<div class="sv-grid">'+
    '<div class="sv-cell win"><div class="k">Miles saved today</div><div class="v">'+miSaved+'<span class="u">mi</span></div></div>'+
    '<div class="sv-cell win"><div class="k">Windshield time back</div><div class="v">'+fmtDur(minSaved)+'</div></div>'+
    '<div class="sv-cell"><div class="k">Gas, 5-day week</div><div class="v">$'+weekFuel.toFixed(0)+'</div></div>'+
    '<div class="sv-cell"><div class="k">Hours back, per week</div><div class="v">'+weekHrs.toFixed(1)+'<span class="u">hr</span></div></div>'+
  '</div>'+
  '<div class="sv-bars">'+
    bar("Call order",nvMi,mx,"var(--high)",nvMi+" mi")+
    bar("Zone-batched",optMi,mx,"var(--cool)",optMi+" mi")+
    '<p style="margin:4px 0 0;font-size:12.5px;color:var(--ink-2);line-height:1.55">'+
    (miSaved>4
      ? 'Answering in call order touches <b>'+nz+' zone'+(nz>1?"s":"")+'</b> in one day \u2014 that is where the miles go, not the order of the stops inside a zone.'+
        (extraCalls>0?' <b>'+fmtDur(minSaved)+' is roughly '+extraCalls+' more service call'+(extraCalls>1?"s":"")+'</b>, near $'+(extraCalls*rate)+' of work currently being spent on I-95.':'')
      : 'Today\u2019s calls happen to sit close together, so batching wins little \u2014 the tool is honest about that. The savings show up on the days the calls are spread across the county.')+
    '</p>'+
  '</div>';
}
function bar(lbl,val,mx,color,num){
  return '<div class="bar-row"><span class="lbl">'+lbl+'</span>'+
    '<span class="bar-track"><span class="bar-fill" style="width:'+Math.round(val/mx*100)+'%;background:'+color+'"></span></span>'+
    '<span class="num">'+num+'</span></div>';
}

/* ---------- new call ---------- */
function chipRow(el,items,cur,onPick,keyf,labf,subf,tonef){
  el.innerHTML=items.map(function(it){
    var k=keyf(it);
    return '<button class="chip '+(tonef?tonef(it):"")+'" aria-pressed="'+(String(k)===String(cur))+'" data-k="'+esc(k)+'">'+
      esc(labf(it))+(subf&&subf(it)?'<span class="sub">'+esc(subf(it))+'</span>':'')+'</button>';
  }).join("");
  Array.prototype.forEach.call(el.querySelectorAll(".chip"),function(b){
    b.onclick=function(){onPick(b.getAttribute("data-k"));};
  });
}
function renderNew(){
  var dr=state.draft;
  var sel=$("#f-city");
  if(!sel.options.length){
    sel.innerHTML=CITIES.slice().sort(function(a,b){return a[0]<b[0]?-1:1;})
      .map(function(c){return '<option value="'+esc(c[0])+'">'+esc(c[0])+'</option>';}).join("");
  }
  sel.value=dr.city;
  $("#f-name").value=dr.name;$("#f-phone").value=dr.phone;$("#f-addr").value=dr.addr;$("#f-note").value=dr.note;

  chipRow($("#c-symptom"),SYMPTOMS,dr.symptom,function(k){dr.symptom=k;renderNew();},
    function(i){return i.id;},function(i){return i.label;},function(i){return fmtDur(i.min);},null);
  chipRow($("#c-access"),ACCESS,dr.access,function(k){dr.access=k;renderNew();},
    function(i){return i.id;},function(i){return i.label;},
    function(i){return i.tier===1?"early only":i.tier===2?"any time":"midday ok";},
    function(i){return i.tone;});
  chipRow($("#c-size"),SIZES,dr.size,function(k){dr.size=k;renderNew();},
    function(i){return i.id;},function(i){return i.label;},null,null);
  chipRow($("#c-urgency"),URGENCY,dr.urgency,function(k){dr.urgency=k;renderNew();},
    function(i){return i.id;},function(i){return i.label;},function(i){return i.sub;},
    function(i){return i.tone;});
  chipRow($("#c-crew"),CREWS,dr.crew,function(k){dr.crew=parseInt(k,10);renderNew();},
    function(i){return i.id;},function(i){return i.label;},null,null);

  var ni=CITY_NI[dr.city], z=zoneOf(ni===undefined?48:ni), a=acc(dr.access);
  var mins=duration({symptom:dr.symptom,access:dr.access,size:dr.size,crew:dr.crew});
  var cut=cutoffFor(parseInt(state.hi,10)||90);
  $("#liveCalc").innerHTML=
    cell("Zone",z.name)+
    cell("Route day",dr.urgency==="em"?"Today":z.dayName.slice(0,3))+
    cell("Block",fmtDur(mins))+
    cell("Window",a.tier===1?("before "+cut.txt):a.tier===2?"any time":"midday fine");
}

/* ---------- queue ---------- */
function renderQueue(){
  var html="",any=false;
  var ems=state.jobs.filter(function(j){return j.urgency==="em";});
  if(ems.length){
    any=true;
    html+='<div class="zgroup"><div class="zhead"><span class="zn" style="color:var(--high)">Emergency</span>'+
      '<span class="zc">'+ems.length+' job'+(ems.length>1?"s":"")+'</span><span class="zd" style="color:var(--high)">Today, any zone</span></div>'+
      '<div class="qlist">'+ems.map(qrow).join("")+'</div></div>';
  }
  ZONES.forEach(function(z){
    var list=state.jobs.filter(function(j){return j.urgency!=="em"&&j.zone===z.id;});
    if(!list.length)return;
    any=true;
    var mins=list.reduce(function(a,j){return a+j.dur;},0);
    list.sort(function(a,b){return a.tier-b.tier||a.ni-b.ni;});
    html+='<div class="zgroup"><div class="zhead"><span class="zn">'+esc(z.name)+'</span>'+
      '<span class="zc">'+list.length+' · '+fmtDur(mins)+' · '+esc(z.range)+'</span>'+
      '<span class="zd">'+esc(z.dayName)+'</span></div>'+
      '<div class="qlist">'+list.map(qrow).join("")+'</div></div>';
  });
  $("#queueList").innerHTML = any ? html :
    '<div class="card empty"><span class="disp">Empty board</span>Every call that comes in lands here first, then gets pulled into the day its zone comes up.</div>';
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
}
function qrow(j){
  return '<div class="qrow"><span class="pill '+tonePill(j.tier)+'">'+(j.tier===1?"AM":j.tier===2?"OUT":"IN")+'</span>'+
    '<span><span class="qn">'+esc(j.name||"No name")+'</span> <span class="qm">'+esc(j.city)+' · '+esc(sym(j.symptom).label)+'</span></span>'+
    '<span class="qr"><span class="qdur">'+fmtDur(j.dur)+'</span><button class="xbtn" data-del="'+j.id+'" title="Remove">&times;</button></span></div>';
}

/* ---------- rules tab ---------- */
function renderRules(){
  $("#zoneTable").innerHTML='<thead><tr><th>Zone</th><th>Covers</th><th>Route day</th></tr></thead><tbody>'+
    ZONES.map(function(z){return '<tr><td><b>'+esc(z.name)+'</b></td><td>'+esc(z.range)+'</td><td class="n">'+esc(z.dayName)+'</td></tr>';}).join("")+
    '<tr><td><b>Overflow</b></td><td>Whichever zone is stacked highest</td><td class="n">Friday</td></tr></tbody>';

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

  $("#bkSave").onclick=function(){
    var txt=payload(), n=state.jobs.filter(function(j){return !j.example;}).length;
    var fname="ac-day-router-"+new Date().toISOString().slice(0,10)+".json";
    saveBackup(txt,fname,n);
  };
  $("#bkLoad").onclick=function(){
    $("#bkBox").style.display="block";$("#bkText").value="";$("#bkText").focus();
  };
  $("#bkClose").onclick=function(){$("#bkBox").style.display="none";};
  $("#bkDo").onclick=function(){
    var raw=$("#bkText").value.trim();
    if(!raw){toast("Paste a backup first");return;}
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
  };
  $("#resetEx").onclick=function(){
    ask("Load the example jobs?","Adds 18 sample jobs alongside his real ones, so you can see the routing work. They are labelled and can be cleared again.",
        "Load examples","",
        function(){examples().forEach(function(j){state.jobs.push(j);});saveLocal();render();toast("Examples loaded");});
  };
  $("#wipe").onclick=function(){
    var n=state.jobs.length;
    ask("Delete everything?",
        "All "+n+" job"+(n===1?"":"s")+" will be permanently deleted. Settings stay. Save a backup first if you are not sure — this cannot be undone.",
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
      .then(function(){toast("Backup saved");})
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
    b.innerHTML='<button class="btn ghost" id="barCancel">Clear</button><button class="btn" id="barSave">Add to the board</button>';
    $("#barCancel").onclick=function(){
      var d0=state.draft, dirty=$("#f-name").value||$("#f-phone").value||$("#f-addr").value||$("#f-note").value;
      if(!dirty){state.draft=blankDraft();renderNew();return;}
      ask("Clear this call?","What you have typed for this customer will be thrown away.","Clear","danger",
          function(){state.draft=blankDraft();renderNew();toast("Cleared");});
    };
    $("#barSave").onclick=addJob;
  }else if(state.tab==="today"){
    b.innerHTML='<button class="btn ghost" id="barSheet">Call sheet</button><button class="btn" id="barNew">New call</button>';
    $("#barNew").onclick=function(){go("new");};
    $("#barSheet").onclick=function(){openSheet(0);};
  }else{
    b.innerHTML='<button class="btn wide" id="barNew2">New call</button>';
    $("#barNew2").onclick=function(){go("new");};
  }
}
function addJob(){
  var dr=state.draft;
  dr.name=$("#f-name").value.trim();dr.phone=$("#f-phone").value.trim();
  dr.addr=$("#f-addr").value.trim();dr.note=$("#f-note").value.trim();dr.city=$("#f-city").value;
  if(!dr.name&&!dr.addr){$("#f-name").focus();$("#f-name").style.borderColor="var(--high)";return;}
  var j=hydrate(Object.assign({},dr,{id:uid(),created:Date.now(),example:false}));
  state.jobs.push(j);persist(j);
  state.draft=blankDraft();
  go("today");
  toast("Saved \u2014 "+(j.name||"job")+" added to "+zoneOf(j.ni).name);
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
    r.stops.forEach(function(st,k){
      out.push({truck:i+1,n:k+1,of:r.stops.length,st:st,zone:d.zone,cut:d.cut});
    });
  });
  return out;
}
function openSheet(i){
  sheetList=buildSheet();
  if(!sheetList.length){toast("Nothing on the board for today");return;}
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
                             " &middot; "+esc(e.zone.name);

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
                  esc(acc(j.access).label.toLowerCase())+" work. Move it to tomorrow morning.</div>";
  if(j.urgency==="em")h+='<div class="sh-warn hot">Emergency &mdash; this one broke the zone to get on today.</div>';

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
  var cut=cutoffFor(parseInt(state.hi,10)||90);
  $("#cutoffTxt").textContent=cut.txt;
  $("#hi").value=state.hi;
  $("#qct").textContent=state.jobs.length;
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
    if(state.tab==="new")renderNew();}
});

/* Paint immediately from the localStorage mirror — it is synchronous, so
   there is no blank frame — then let IndexedDB have the last word. */
var hadLocal=loadLocal();
render();

/* Seeding the examples is deliberately NOT done here. If localStorage had
   been cleared but IndexedDB still held his real jobs, seeding now would
   call saveLocal() and overwrite them with sample data. Nothing is written
   until we know what IndexedDB actually has. */
function seedExamples(){
  state.jobs=examples(); state.seeded=true; saveLocal(); render();
}
idbLoad().then(function(rec){
  state.idbOk=true;
  if(rec && (rec.savedAt||0) >= (state.savedAt||0)){
    adoptRecord(rec);
    mirrorToLocal(rec);   // rebuild the mirror now, not at the next save
    render(); return;                              // the newer copy wins
  }
  if(rec){ idbSave(snapshot()); return; }          // localStorage was ahead; sync it up
  if(hadLocal || state.seeded){ idbSave(snapshot()); return; }   // first run: migrate
  seedExamples();                                  // a genuinely new device
}).catch(function(){
  state.idbOk=false;                               // no IndexedDB; the mirror carries on
  if(!hadLocal && !state.seeded) seedExamples();
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
