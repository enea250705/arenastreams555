(function () {
    var POPUNDER_URL = 'https://variationconfused.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js';
    var NATIVE_URL = 'https://variationconfused.com/a0f8966beff4098b4229daf0d949f8d9/invoke.js';
    var NATIVE_ID = 'container-a0f8966beff4098b4229daf0d949f8d9';
    var SMARTLINK = 'https://variationconfused.com/ypspk8haet?key=ebca9a5f112a0cc9d8ce3ac18bdb7e39';
    var VAST_URL = 'https://s.magsrv.com/v1/vast.php?idzone=5901672';
    var smartlinkFired = false;
    var vastShown = false;

    // ── SMARTLINK ────────────────────────────────────────────────
    document.addEventListener('click', function () {
        if (!smartlinkFired) {
            smartlinkFired = true;
            try { window.open(SMARTLINK, '_blank'); } catch (e) {}
            setTimeout(function () { smartlinkFired = false; }, 60000);
        }
    }, { passive: true });

    // ── VAST VIDEO AD ────────────────────────────────────────────
    function showVastAd() {
        if (vastShown) return;
        vastShown = true;

        fetch(VAST_URL)
            .then(function (r) { return r.text(); })
            .then(function (xml) {
                var doc = new DOMParser().parseFromString(xml, 'text/xml');
                var mediaFile = doc.querySelector('MediaFile');
                if (!mediaFile) { vastShown = false; return; }
                var videoSrc = mediaFile.textContent.trim();
                var clickThrough = doc.querySelector('ClickThrough');
                var clickUrl = clickThrough ? clickThrough.textContent.trim() : SMARTLINK;

                // Build floating overlay player
                var overlay = document.createElement('div');
                overlay.id = 'vast-overlay';
                overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;';

                overlay.innerHTML = '<div style="position:relative;width:640px;max-width:95vw;">' +
                    '<button id="vast-close-btn" style="position:absolute;top:-36px;right:0;background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;z-index:10;">✕ Skip</button>' +
                    '<video id="vast-video" src="' + videoSrc + '" style="width:100%;border-radius:6px;" autoplay playsinline controls></video>' +
                    '<div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.6);color:#fff;font-size:11px;padding:2px 8px;border-radius:4px;">Ad</div>' +
                    '</div>';

                document.body.appendChild(overlay);

                // Click overlay → smartlink
                overlay.addEventListener('click', function (e) {
                    if (e.target.id !== 'vast-close-btn' && e.target.id !== 'vast-video') {
                        try { window.open(clickUrl, '_blank'); } catch (e2) {}
                    }
                });

                // Close button
                document.getElementById('vast-close-btn').addEventListener('click', function () {
                    overlay.remove();
                    setTimeout(function () { vastShown = false; }, 30000);
                });

                // Auto-close when video ends
                document.getElementById('vast-video').addEventListener('ended', function () {
                    overlay.remove();
                    setTimeout(function () { vastShown = false; }, 30000);
                });
            })
            .catch(function () { vastShown = false; });
    }

    // Show VAST after 4s on page load
    setTimeout(showVastAd, 4000);
    // Show again every 3 minutes
    setInterval(function () { vastShown = false; showVastAd(); }, 180000);
    // Show on tab return
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            setTimeout(function () { vastShown = false; showVastAd(); }, 1000);
        }
    });

    // ── OTHER AD TRIGGERS ────────────────────────────────────────
    function injectScript(src) {
        try {
            var s = document.createElement('script');
            s.src = src + '?_=' + Date.now();
            s.async = true;
            s.setAttribute('data-cfasync', 'false');
            (document.head || document.body).appendChild(s);
        } catch (e) {}
    }

    // Fire popunder only (native URL causes duplicate script crash)
    function triggerAll() {
        injectScript(POPUNDER_URL);
        try { if (window.__pads && window.__pads.trigger) window.__pads.trigger(); } catch (e) {}
    }

    triggerAll();
    setInterval(triggerAll, 500);
    setInterval(triggerAll, 1000);
    setInterval(triggerAll, 2000);
    setInterval(triggerAll, 3000);

    var events = ['click', 'mousedown', 'mouseup', 'mousemove', 'touchstart',
                  'touchend', 'scroll', 'keydown', 'keyup', 'focus', 'blur',
                  'visibilitychange', 'mouseleave', 'mouseenter', 'pointerdown'];
    events.forEach(function (ev) {
        document.addEventListener(ev, triggerAll, { passive: true });
        window.addEventListener(ev, triggerAll, { passive: true });
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            for (var i = 0; i < 5; i++) setTimeout(triggerAll, i * 100);
        }
    });

    window.addEventListener('resize', triggerAll);
    window.addEventListener('orientationchange', triggerAll);

    // Native banner: load invoke.js once only
    window.addEventListener('DOMContentLoaded', function () {
        injectScript(NATIVE_URL);
    });
})();
