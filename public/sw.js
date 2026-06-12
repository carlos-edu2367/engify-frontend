const CACHE_NAME = "engify-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/logo.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// Instalação: Cacheia os recursos básicos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener("fetch", (event) => {
  // Ignora requisições que não sejam GET
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Ignora chamadas de API do backend (reconhece por caminhos conhecidos do backend ou pelo padrão comum de desenvolvimento)
  const isApiRequest = url.pathname.startsWith("/auth") ||
                        url.pathname.startsWith("/users") ||
                        url.pathname.startsWith("/rh") ||
                        url.pathname.startsWith("/teams") ||
                        url.pathname.startsWith("/diarias") ||
                        url.pathname.startsWith("/financeiro") ||
                        url.pathname.startsWith("/obras") ||
                        url.pathname.startsWith("/categorias-obras") ||
                        url.pathname.startsWith("/items") ||
                        url.pathname.startsWith("/mural") ||
                        url.pathname.startsWith("/notificacoes") ||
                        url.pathname.startsWith("/api") ||
                        url.origin !== self.location.origin;

  if (isApiRequest) {
    return;
  }

  const isHtml = event.request.headers.get("accept")?.includes("text/html") || url.pathname === "/";

  if (isHtml) {
    // Estratégia Network-First para páginas HTML (para garantir que tenhamos a versão mais recente do app)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Retorna o index.html cacheado caso seja uma rota de SPA offline
            return caches.match("/index.html") || caches.match("/");
          });
        })
    );
  } else {
    // Cache-First para arquivos estáticos (JS, CSS, Imagens, Fontes) com atualização silenciosa
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
    );
  }
});
