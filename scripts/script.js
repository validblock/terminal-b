function getSearchParam() {
    if (!window.location.search) {
        return undefined;
    }

    const params = new URLSearchParams(window.location.search);

    if (!params.has('currency')) {
        return undefined;
    }

    const currency = params.get('currency').toLowerCase();

    if (!['eur', 'usd', 'gbp'].includes(currency)) {
        return undefined;
    }

    return currency;
}

document.getElementById('size').addEventListener('change', (event) => {
    const size = parseInt(event.target.value, 10).toString();

    localStorage.setItem('size', size);

    setTickSize(size);
});

let ws;
const currency = getSearchParam() || 'eur';
const tickSizeVariable = '--tick-size';

function setTickSize(size) {
    if (!size) {
        return;
    }

    document.documentElement.style.setProperty(tickSizeVariable, `${size}em`);
}

function setupTickSize() {
    let size = localStorage.getItem('size');

    if (size) {
        setTickSize(size);
    } else {
        size = getComputedStyle(document.documentElement).getPropertyValue(tickSizeVariable);
    }

    document.getElementById('size').value = size;
}

function prepareTitle(price) {
    const priceFormated = price.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 });

    document.title = `Terminal ₿ | ${priceFormated}`;
}

function showFlip(tick) {
    const tickElement = tick._element;
    const isHidden = tickElement.hasAttribute('hidden');

    if (isHidden) {
        tickElement.removeAttribute('hidden');
    }
}

function setupFlip(tick) {
    setupTickSize();
    initWebsocket(tick);
}

function initWebsocket(tick) {
    ws = new WebSocket('wss://ws.bitstamp.net');

    ws.onopen = function() {
        ws.send(JSON.stringify({
            event: 'bts:subscribe',
            data: { channel: `live_trades_btc${currency}` }
        }));
    };

    ws.onmessage = function(evt) {
        const response = JSON.parse(evt.data);
        const price = parseInt(response.data['price'], 10);

        switch (response.event) {
            case 'trade': {
                tick.value = price;
                prepareTitle(price);
                showFlip(tick);
                break;
            }
            case 'bts:request_reconnect': {
                initWebsocket(tick);
                break;
            }
        }
    };

    ws.onclose = function () {
        initWebsocket();
    };
}
