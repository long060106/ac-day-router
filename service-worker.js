/* ============================================================
   AC Day Router — offline shell.

   He works dead zones: concrete garages, Homestead, the far end of
   Alligator Alley. The app is entirely local already, so the only thing
   standing between him and a working app with zero bars is fetching the
   four files it is made of. This caches them.

   BUMP VERSION ON EVERY DEPLOY. The version is the cache name, so a new
   value installs a clean copy of everything and deletes the old cache.
   Forget to bump it and he keeps running the previous build.
   ============================================================ */
var VERSION = "2026-09-10e";
var CACHE   = "acdr-" + VERSION;

/* Relative paths on purpose: this has to work from /ac-day-router/ on
   GitHub Pages and from / when the folder is served locally. */
var SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function isFontHost(url){
  return url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
}

function put(req, res){
  if(!res || !res.ok) return res;
  var copy = res.clone();
  caches.open(CACHE).then(function(c){ c.put(req, copy); });
  return res;
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  /* Page loads: try the network first, so a fix I deploy reaches him the
     moment he has a signal. Fall back to the cached page, which is what
     makes zero bars open at all. */
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req)
        .then(function(res){ return put("./index.html", res); })
        .catch(function(){
          return caches.match("./index.html").then(function(r){
            return r || caches.match("./");
          });
        })
    );
    return;
  }

  /* The fonts live on Google's servers. Cache them the first time he is
     online or the whole app drops to system type in a dead zone. */
  if(isFontHost(url)){
    e.respondWith(
      caches.match(req).then(function(hit){
        return hit || fetch(req)
          .then(function(res){ return put(req, res); })
          .catch(function(){ return hit; });
      })
    );
    return;
  }

  if(url.origin !== self.location.origin) return;

  /* Our own files: answer from cache immediately, refresh in the background
     so the next open is current. */
  e.respondWith(
    caches.match(req).then(function(hit){
      var net = fetch(req)
        .then(function(res){ return put(req, res); })
        .catch(function(){ return hit; });
      return hit || net;
    })
  );
});
