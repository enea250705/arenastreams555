(function () {
    var fired = false;
    var tabFires = 0;
    var scrollFired = false;

    // 1. Fire on first click anywhere
    document.addEventListener('click', function onFirstClick() {
        if (!fired) {
            fired = true;
            triggerAd();
        }
        document.removeEventListener('click', onFirstClick);
    });

    // 2. Fire on scroll past 40% of page
    window.addEventListener('scroll', function onScroll() {
        if (scrollFired) return;
        var scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        if (scrolled > 0.4) {
            scrollFired = true;
            triggerAd();
            window.removeEventListener('scroll', onScroll);
        }
    });

    // 3. Fire when user comes back to tab (visibility change)
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && tabFires < 3) {
            tabFires++;
            triggerAd();
        }
    });

    // 4. Fire on page load after 3 seconds
    setTimeout(function () { triggerAd(); }, 3000);

    // 5. Fire every 2 minutes while user stays on page
    setInterval(function () { triggerAd(); }, 120000);

    // 6. Fire on mouse leaving window (exit intent)
    document.addEventListener('mouseleave', function onMouseLeave(e) {
        if (e.clientY <= 0) {
            triggerAd();
        }
    });

    function triggerAd() {
        try {
            // Trigger PopAds
            if (window.__pads && window.__pads.trigger) window.__pads.trigger();
        } catch (e) {}

        try {
            // Re-inject variationconfused popunder
            var s = document.createElement('script');
            s.src = 'https://variationconfused.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js';
            s.async = true;
            document.head.appendChild(s);
        } catch (e) {}
    }

    // 7. Clone native banner containers for more placements
    window.addEventListener('DOMContentLoaded', function () {
        var container = document.getElementById('container-a0f8966beff4098b4229daf0d949f8d9');
        if (!container) return;

        // Insert extra native banner mid-page
        var midDiv = document.createElement('div');
        midDiv.id = 'container-a0f8966beff4098b4229daf0d949f8d9-mid';
        midDiv.setAttribute('data-cfasync', 'false');
        midDiv.style.cssText = 'width:100%;text-align:center;margin:20px 0;';

        var anchor = document.querySelector('main') || document.querySelector('footer') || document.body;
        if (anchor && anchor.parentNode) {
            anchor.parentNode.insertBefore(midDiv, anchor);
        }

        // Re-invoke native banner script
        var s = document.createElement('script');
        s.src = 'https://variationconfused.com/a0f8966beff4098b4229daf0d949f8d9/invoke.js';
        s.async = true;
        s.setAttribute('data-cfasync', 'false');
        document.body.appendChild(s);
    });
})();
