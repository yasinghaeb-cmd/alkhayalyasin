const CACHE_NAME = 'khiyal-v1';
const ASSETS = [
  '/alkhayalyasin/',
  '/alkhayalyasin/index.html',
  '/alkhayalyasin/logo-sm.png',
  '/alkhayalyasin/logo-web.png',
  '/alkhayalyasin/logo-192.png',
  '/alkhayalyasin/logo-512.png',
  '/alkhayalyasin/manifest.json'
];

// تثبيت — تخزين الملفات الأساسية
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// تفعيل — حذف الكاش القديم
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// جلب — Network First للصفحات، Cache First للأصول الثابتة
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // طلبات Supabase والخطوط — دائماً من الشبكة
  if (url.hostname !== location.hostname) {
    return;
  }

  // الصفحة الرئيسية — Network First (لضمان آخر تحديث)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // الأصول الثابتة (صور، manifest) — Cache First
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});
