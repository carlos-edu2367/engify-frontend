// v3: o rewrite catch-all da Vercel devolve o index.html (200, text/html) para
// qualquer /assets/* que nao exista mais apos um deploy. A v2 cacheava essa
// resposta sob a URL do .js/.css porque so checava response.ok — bastava um
// dispositivo pedir um asset de build antigo para o cache ficar com HTML no
// lugar de codigo. Subir a versao descarta esse cache envenenado na base
// instalada; o guard de content-type abaixo evita que aconteca de novo.
const CACHE_NAME = "engify-cache-v3";
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
    // O campo "destination" vem vazio em navegadores antigos/Safari; cair no
    // ramo de imagem faria um JS/CSS ficar preso em cache-first para sempre.
    // A extensão cobre esse caso mesmo sem destination confiável.
    const isCodeAsset =
      event.request.destination === "script" ||
      event.request.destination === "style" ||
      /\.(js|css)$/.test(url.pathname);

    if (isCodeAsset) {
      // Network-First para JS/CSS: evita que uma versão antiga do app fique presa no celular.
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            const contentType = response.headers.get("content-type") || "";
            // Um /assets/*.js inexistente é servido como o index.html (200,
            // text/html) pelo rewrite catch-all da Vercel. Sem esse guard, essa
            // resposta seria gravada em cache sob a URL do .js/.css.
            if (response.ok && !contentType.includes("text/html")) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }

    // Cache-First para imagens, fontes e demais arquivos estáticos.
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
