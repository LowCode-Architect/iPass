const CACHE_NAME = 'ipass-v1.0.0';
const urlsToCache = [
  '/iPass/',
  '/iPass/index.html',
  '/iPass/icon.png',
  '/iPass/og_image.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
  'https://cdn.tailwindcss.com'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
  // 새로운 서비스 워커를 즉시 활성화
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 이전 버전의 캐시 삭제
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 모든 클라이언트에서 서비스 워커 즉시 제어
      return self.clients.claim();
    })
  );
});

// 페치 이벤트 (네트워크 요청 처리)
self.addEventListener('fetch', (event) => {
  // GitHub Pages의 HTTPS만 처리
  if (event.request.url.startsWith('https://')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 캐시에 있으면 캐시에서 반환
          if (response) {
            return response;
          }
          
          // 네트워크에서 가져오기
          return fetch(event.request)
            .then((response) => {
              // 유효하지 않은 응답이면 그대로 반환
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 응답을 복제해서 캐시에 저장
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // 오프라인 상태일 때 기본 페이지 반환
              if (event.request.destination === 'document') {
                return caches.match('/iPass/index.html');
              }
            });
        })
    );
  }
});

// 백그라운드 동기화 (온라인 상태가 되었을 때)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 필요한 경우 데이터 동기화 로직 추가
      Promise.resolve()
    );
  }
});

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/iPass/icon.png',
    badge: '/iPass/icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '열기',
        icon: '/iPass/icon.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/iPass/icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('iPass', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/iPass/')
    );
  }
});

// 메시지 처리 (앱과 서비스 워커 간 통신)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 에러 처리
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error occurred', event.error);
});

// 처리되지 않은 Promise 거부 처리
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
  event.preventDefault();
});
