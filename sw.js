self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    if (url.origin !== location.origin) {
        return;
    }

    const whitelist = ['font', 'style', 'script', 'image'];
    const { destination } = request;

    if (whitelist.indexOf(destination) === -1) {
        return;
    }

    event.respondWith(
        caches.open('terminal-b-v1').then(cache => {
            return cache.match(request).then(response => {
                return response || fetch(request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    cache.put(request, response.clone());
                    return response;
                } );
            } );
        })
    );
} );
