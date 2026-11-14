// AuditIQ Service Worker — offline support
const CACHE = 'auditiq-v13-1';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json',
  'icon.svg'
];

// التثبيت: خزّن ملفات التطبيق
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// التفعيل: امسح الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// الجلب: الصفحة نفسها من الشبكة أولاً (عشان أي تحديث يظهر فوراً) ولو مفيش نت من الكاش.
// باقي الملفات: الكاش أولاً ثم الشبكة.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = e.request.url.startsWith(self.location.origin);
  const isPage = e.request.mode === 'navigate' || (sameOrigin && /(\/|index\.html)$/.test(new URL(e.request.url).pathname));
  const store = res => {
    if (res && res.status === 200 && sameOrigin) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  };
  if (isPage) {
    e.respondWith(
      fetch(e.request).then(store).catch(() =>
        caches.match(e.request).then(c => c || caches.match('index.html'))
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(store))
  );
});
