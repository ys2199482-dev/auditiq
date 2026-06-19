// AuditIQ Service Worker — offline support
const CACHE = 'auditiq-v9-1';
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

// الجلب: الكاش أولاً ثم الشبكة (يشتغل offline بالكامل)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // خزّن نسخة من الطلبات الناجحة من نفس الأصل
        if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
