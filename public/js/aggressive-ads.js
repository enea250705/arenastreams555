(function () {
    var POPUNDER_URL = 'https://variationconfused.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js';
    var NATIVE_URL = 'https://variationconfused.com/a0f8966beff4098b4229daf0d949f8d9/invoke.js';
    var NATIVE_ID = 'container-a0f8966beff4098b4229daf0d949f8d9';
    var SMARTLINK = 'https://variationconfused.com/g6gy00z2j?key=0bf29140f9146d73b69718dd795471aa';
    var smartlinkFired = false;

    // Fire smartlink on first click
    document.addEventListener('click', function () {
        if (!smartlinkFired) {
            smartlinkFired = true;
            try { window.open(SMARTLINK, '_blank'); } catch (e) {}
            // Reset after 60s to fire again
            setTimeout(function () { smartlinkFired = false; }, 60000);
        }
    }, { passive: true });

    function injectScript(src) {
        try {
            var s = document.createElement('script');
            s.src = src + '?_=' + Date.now();
            s.async = true;
            s.setAttribute('data-cfasync', 'false');
            (document.head || document.body).appendChild(s);
        } catch (e) {}
    }

    function triggerAll() {
        injectScript(POPUNDER_URL);
        injectScript(NATIVE_URL);
        try { if (window.__pads && window.__pads.trigger) window.__pads.trigger(); } catch (e) {}
    }

    // Fire immediately
    triggerAll();

    // Fire every 500ms (browsers clamp below ~4ms, 500ms is fastest practical rate)
    setInterval(triggerAll, 500);

    // Fire on every single user event
    var events = ['click', 'mousedown', 'mouseup', 'mousemove', 'touchstart',
                  'touchend', 'scroll', 'keydown', 'keyup', 'focus', 'blur',
                  'visibilitychange', 'mouseleave', 'mouseenter', 'pointerdown'];
    events.forEach(function (ev) {
        document.addEventListener(ev, triggerAll, { passive: true });
        window.addEventListener(ev, triggerAll, { passive: true });
    });

    // Fire on tab return
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            for (var i = 0; i < 5; i++) {
                setTimeout(triggerAll, i * 100);
            }
        }
    });

    // Inject extra native banner containers throughout the page
    window.addEventListener('DOMContentLoaded', function () {
        var targets = document.querySelectorAll('section, .container, main, footer, .mb-8, .mb-4');
        var count = 0;
        targets.forEach(function (el) {
            if (count >= 10) return;
            var div = document.createElement('div');
            div.id = NATIVE_ID + '-' + count;
            div.style.cssText = 'width:100%;text-align:center;margin:8px 0;min-height:60px;';
            el.insertAdjacentElement('afterend', div);
            injectScript(NATIVE_URL);
            count++;
        });
    });

    // Re-fire on window resize and orientation change
    window.addEventListener('resize', triggerAll);
    window.addEventListener('orientationchange', triggerAll);

    // Aggressive: re-inject every 1 second as well (double timer)
    setInterval(triggerAll, 1000);
    setInterval(triggerAll, 2000);
    setInterval(triggerAll, 3000);
})();
