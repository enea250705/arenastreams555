(function () {
  if (localStorage.getItem('consent_accepted')) return;

  var banner = document.createElement('div');
  banner.id = 'consent-banner';
  banner.style.cssText = [
    'position:fixed',
    'bottom:0',
    'left:0',
    'right:0',
    'z-index:99999',
    'background:#1a1a1a',
    'border-top:2px solid #ffcc00',
    'padding:16px 24px',
    'display:flex',
    'align-items:center',
    'justify-content:space-between',
    'gap:16px',
    'flex-wrap:wrap',
    'font-family:sans-serif',
    'box-shadow:0 -4px 20px rgba(0,0,0,0.5)'
  ].join(';');

  banner.innerHTML = [
    '<div style="flex:1;min-width:200px;">',
      '<p style="margin:0;color:#fff;font-size:14px;line-height:1.5">',
        'We use cookies and personalized ads to keep this service free. ',
        'By continuing you agree to our use of cookies and advertising.',
      '</p>',
    '</div>',
    '<div style="display:flex;gap:10px;flex-shrink:0">',
      '<button id="consent-accept" style="',
        'background:#ffcc00;color:#111;border:none;padding:10px 24px;',
        'border-radius:6px;font-weight:700;font-size:14px;cursor:pointer;',
        'white-space:nowrap',
      '">Accept & Continue</button>',
      '<button id="consent-decline" style="',
        'background:transparent;color:#888;border:1px solid #444;padding:10px 16px;',
        'border-radius:6px;font-size:13px;cursor:pointer;white-space:nowrap',
      '">Decline</button>',
    '</div>'
  ].join('');

  document.body.appendChild(banner);

  function accept() {
    localStorage.setItem('consent_accepted', '1');
    banner.remove();
    // Signal consent to ad networks
    if (window.__tcfapi) {
      try { window.__tcfapi('setConsent', 2, function(){}, { purpose: { consents: { 1:true,2:true,3:true,4:true } } }); } catch(e){}
    }
    if (window.gtag) {
      gtag('consent', 'update', { ad_storage: 'granted', analytics_storage: 'granted' });
    }
  }

  function decline() {
    localStorage.setItem('consent_accepted', '0');
    banner.remove();
  }

  document.getElementById('consent-accept').addEventListener('click', accept);
  document.getElementById('consent-decline').addEventListener('click', decline);
})();
