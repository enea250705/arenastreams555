(function() {
  var PAGE = window.location.pathname || '/';
  var ADSTERRA_HOST = 'variationconfused.com';
  var _counted = false;

  function fireImpression(type) {
    try {
      var payload = JSON.stringify({ page: PAGE, type: type || 'unknown' });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/ad-impression', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/ad-impression', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function(){});
      }
    } catch(e) {}
  }

  // Re-apply window.open hook (in case ad scripts overrode it after head hook)
  var _origOpen = window.open;
  window.open = function(url, name, features) {
    fireImpression('popunder');
    return _origOpen.apply(window, arguments);
  };

  // Hook document.createElement to detect variationconfused.com script injections
  var _origCreateElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _origCreateElement(tag);
    if (tag && tag.toLowerCase() === 'script') {
      var _desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
      if (_desc) {
        Object.defineProperty(el, 'src', {
          get: function() { return _desc.get.call(el); },
          set: function(val) {
            if (val && val.indexOf(ADSTERRA_HOST) !== -1) {
              fireImpression('banner');
            }
            _desc.set.call(el, val);
          },
          configurable: true
        });
      }
    }
    return el;
  };

  // Count page load as impression if Adsterra scripts present
  window.addEventListener('load', function() {
    var scripts = document.querySelectorAll('script[src*="' + ADSTERRA_HOST + '"]');
    if (scripts.length > 0 && !_counted) {
      _counted = true;
      fireImpression('pageload');
    }
  });

  // Admin widget
  function getCookie(name) {
    var m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : null;
  }

  function formatNum(n) {
    if (!n) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function createWidget() {
    var w = document.createElement('div');
    w.id = 'ad-impression-widget';
    w.style.cssText = [
      'position:fixed', 'bottom:16px', 'right:16px', 'z-index:2147483647',
      'background:#0f172a', 'border:1px solid #1e3a5f', 'border-radius:12px',
      'padding:14px 18px', 'font-family:system-ui,-apple-system,sans-serif',
      'font-size:12px', 'color:#e2e8f0', 'min-width:200px',
      'box-shadow:0 8px 32px rgba(0,0,0,.7)'
    ].join(';');
    w.innerHTML = [
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">',
        '<span style="font-weight:700;font-size:11px;letter-spacing:.08em;color:#60a5fa;text-transform:uppercase">📊 Ad Impressions</span>',
        '<button id="adw-close" style="background:none;border:none;color:#475569;cursor:pointer;font-size:16px;line-height:1;padding:0">×</button>',
      '</div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">',
        '<div style="background:#1e293b;border-radius:8px;padding:8px 10px">',
          '<div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Today</div>',
          '<div id="adw-today" style="font-size:22px;font-weight:800;color:#34d399;letter-spacing:-.5px">–</div>',
        '</div>',
        '<div style="background:#1e293b;border-radius:8px;padding:8px 10px">',
          '<div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">Total</div>',
          '<div id="adw-total" style="font-size:22px;font-weight:800;color:#a78bfa;letter-spacing:-.5px">–</div>',
        '</div>',
      '</div>',
      '<div style="background:#1e293b;border-radius:8px;padding:8px 10px;margin-bottom:8px">',
        '<div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">By Type</div>',
        '<div id="adw-types" style="font-size:10px;color:#94a3b8;line-height:1.8"></div>',
      '</div>',
      '<div style="background:#1e293b;border-radius:8px;padding:8px 10px">',
        '<div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">By Page (top 5)</div>',
        '<div id="adw-pages" style="font-size:10px;color:#94a3b8;line-height:1.8"></div>',
      '</div>',
      '<div style="margin-top:8px;text-align:right;color:#334155;font-size:9px" id="adw-updated">–</div>'
    ].join('');
    document.body.appendChild(w);
    document.getElementById('adw-close').addEventListener('click', function() { w.remove(); });
  }

  function updateWidget() {
    fetch('/api/ad-impression/count').then(function(r) { return r.json(); }).then(function(d) {
      var t = document.getElementById('adw-today');
      var tot = document.getElementById('adw-total');
      var pg = document.getElementById('adw-pages');
      var ty = document.getElementById('adw-types');
      var upd = document.getElementById('adw-updated');
      if (t) t.textContent = formatNum(d.today);
      if (tot) tot.textContent = formatNum(d.total);
      if (ty && d.byType) {
        var typeColors = { popunder: '#f59e0b', banner: '#60a5fa', pageload: '#34d399', unknown: '#64748b' };
        var tEntries = Object.entries(d.byType).sort(function(a,b){ return b[1]-a[1]; });
        ty.innerHTML = tEntries.map(function(e) {
          var c = typeColors[e[0]] || '#94a3b8';
          return '<div style="display:flex;justify-content:space-between"><span style="color:' + c + '">' + e[0] + '</span><span style="color:' + c + ';font-weight:700">' + formatNum(e[1]) + '</span></div>';
        }).join('') || '<span style="color:#475569">No data yet</span>';
      }
      if (pg && d.byPage) {
        var entries = Object.entries(d.byPage).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
        pg.innerHTML = entries.map(function(e) {
          return '<div style="display:flex;justify-content:space-between"><span>' + e[0] + '</span><span style="color:#60a5fa;font-weight:700">' + formatNum(e[1]) + '</span></div>';
        }).join('') || '<span style="color:#475569">No data yet</span>';
      }
      if (upd) upd.textContent = 'Updated ' + new Date().toLocaleTimeString();
    }).catch(function(){});
  }

  if (getCookie('matchora_admin') === '1') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { createWidget(); updateWidget(); setInterval(updateWidget, 5000); });
    } else {
      createWidget(); updateWidget(); setInterval(updateWidget, 5000);
    }
  }
})();
