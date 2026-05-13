(function() {
  var PAGE = window.location.pathname || '/';

  function fireImpression() {
    try {
      navigator.sendBeacon('/api/ad-impression', JSON.stringify({ page: PAGE }));
    } catch (e) {
      fetch('/api/ad-impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: PAGE }), keepalive: true }).catch(function(){});
    }
  }

  // Hook ExoClick popMagic
  var _hookInterval = setInterval(function() {
    if (typeof popMagic !== 'undefined' && popMagic.setAsOpened) {
      var orig = popMagic.setAsOpened.bind(popMagic);
      popMagic.setAsOpened = function(e) {
        fireImpression();
        return orig(e);
      };
      clearInterval(_hookInterval);
    }
  }, 200);

  // Hook blockadsnot / generic popunder (fires on click when popunder opens)
  document.addEventListener('click', function(e) {
    if (e.isTrusted && typeof window._popunderFired !== 'undefined') {
      fireImpression();
    }
  }, true);

  // Listen for ExoClick creativeDisplayed events (fires on every popMagic open)
  document.addEventListener('creativeDisplayed', fireImpression, true);
  // Catch zone-specific event pattern creativeDisplayed-ZONEID
  var _origDispatch = document.dispatchEvent.bind(document);
  document.dispatchEvent = function(ev) {
    if (ev && ev.type && ev.type.indexOf('creativeDisplayed') === 0) {
      fireImpression();
    }
    return _origDispatch(ev);
  };

  // Admin widget — visible only when cookie matchora_admin=1
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : null;
  }

  function formatNum(n) {
    return n ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
  }

  function createWidget() {
    var w = document.createElement('div');
    w.id = 'ad-impression-widget';
    w.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;background:#0f172a;border:1px solid #1e40af;border-radius:10px;padding:12px 16px;font-family:system-ui,sans-serif;font-size:12px;color:#e2e8f0;min-width:180px;box-shadow:0 4px 20px rgba(0,0,0,.6);';
    w.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><span style="font-weight:700;font-size:11px;letter-spacing:.05em;color:#60a5fa;">📊 AD IMPRESSIONS</span><button onclick="this.parentNode.parentNode.remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;line-height:1;">×</button></div><div style="display:flex;gap:16px"><div><div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Today</div><div id="adw-today" style="font-size:20px;font-weight:700;color:#34d399">0</div></div><div><div style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em">Total</div><div id="adw-total" style="font-size:20px;font-weight:700;color:#a78bfa">0</div></div></div>';
    document.body.appendChild(w);
    return w;
  }

  function updateWidget() {
    fetch('/api/ad-impression/count').then(function(r){ return r.json(); }).then(function(d) {
      var t = document.getElementById('adw-today');
      var tot = document.getElementById('adw-total');
      if (t) t.textContent = formatNum(d.today);
      if (tot) tot.textContent = formatNum(d.total);
    }).catch(function(){});
  }

  if (getCookie('matchora_admin') === '1') {
    document.addEventListener('DOMContentLoaded', function() {
      createWidget();
      updateWidget();
      setInterval(updateWidget, 5000);
    });
  }
})();
