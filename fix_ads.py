# Fix ad scripts in view files - remove old, add 4 new scripts
import re
import os

NEW_SCRIPTS = """    <script>(function(s){s.dataset.zone='10618021',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <script src="https://3nbf4.com/act/files/tag.min.js?z=10618026" data-cfasync="false" async></script>
    <script>(function(s){s.dataset.zone='10618027',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <script>(function(s){s.dataset.zone='10618028',s.src='https://gizokraijaw.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
"""

POPUNDER_SCRIPT = """
    <script>
(function(){
  var urls = [
    'https://deliverywhiskerspsychopath.com/ypspk8haet?key=ebca9a5f112a0cc9d8ce3ac18bdb7e39',
    'https://deliverywhiskerspsychopath.com/tbiht4vjbg?key=8980a7bd7a5303dd157a117e08d99fe6'
  ];
  var fired = 0;
  var maxFires = 3;
  function fire() {
    if (fired >= maxFires) return;
    fired++;
    var pu = urls[fired % urls.length];
    try {
      var w = window.open(pu, '_blank', 'noopener,noreferrer');
      if (w) { w.blur(); window.focus(); }
    } catch(e) {}
  }
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(function(ev) {
    document.addEventListener(ev, function fn() { fire(); document.removeEventListener(ev, fn); }, { passive: true });
  });
  setTimeout(fire, 1500);
  setTimeout(fire, 5000);
})();
</script>
"""

EXTRA_SCRIPTS = """    <script src="https://deliverywhiskerspsychopath.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js"></script>
    <script src="https://pl28727804.effectivegatecpm.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js"></script>
    <script async="async" data-cfasync="false" src="https://pl28727869.effectivegatecpm.com/a0f8966beff4098b4229daf0d949f8d9/invoke.js"></script>
    <script src="https://pl28727883.effectivegatecpm.com/73/ac/40/73ac40214d10d6616671c7ad6c95f14f.js"></script>
    <script>
  atOptions = {
    'key' : 'd8ef403890ab271bbfc7409ec4f49cfd',
    'format' : 'popunder',
    'height' : 60,
    'width' : 468,
    'params' : {}
  };
</script>
    <script src="https://deliverywhiskerspsychopath.com/d8ef403890ab271bbfc7409ec4f49cfd/invoke.js"></script>
""" + POPUNDER_SCRIPT

BODY_AD_DIV = """    <div id="container-a0f8966beff4098b4229daf0d949f8d9"></div>
"""

NEW_GTAG = """    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-S9DL2J6QBF"></script>
    <script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-S9DL2J6QBF');
</script>
"""

VIEWS_DIR = os.path.join(os.path.dirname(__file__), 'views')

CLCKD_META = '    <meta name="clckd" content="7e627cc99fbdafc273ac51e09967c665" />\n'

def fix_head(content):
    # Insert clckd meta after <head> if not present
    if 'name="clckd"' not in content:
        content = re.sub(r'(<head>\s*\n)', r'\1' + CLCKD_META, content, count=1)
    # Remove commented-out obfuscated block (<!--<script ... voljr... -->)
    content = re.sub(r'\n\s*<!--<script[\s\S]+?voljr\.com[^>]+></script>\s*[^\n]*-->', '\n', content, count=1)
    # Remove obfuscated script line (contains "var K='ChmaorrCfozdgenzi" and ends with yohle or voljr)
    content = re.sub(r'\n\s*<script data-cfasync="false" type="text/javascript">\(\(\)=>\{var K=\'ChmaorrCfozdgenzi[\s\S]+?</script>(?:<script src="//(?:voljr|yohle)[^<]+</script>)?', '\n', content, count=1)
    # Remove fpyf8 / adblock-provider script
    content = re.sub(r'\n\s*<script id="adblock-provider-script" data-src="https://fpyf8\.com/[^"]+"[^>]*></script>', '\n', content)
    content = re.sub(r'\n\s*<script src="https://fpyf8\.com/88/tag\.min\.js"[^>]*></script>', '\n', content)
    # Remove old al5sm (9879600)
    content = re.sub(r"\n\s*<script>\(s=>\{s\.dataset\.zone='9879600'[^<]+</script>", '\n', content)
    # Remove advanced-ads.js
    content = re.sub(r'\n\s*<script src="/js/advanced-ads\.js"></script>', '\n', content)
    content = re.sub(r'\n\s*<!-- Advanced Ad System -->\s*\n\s*<script src="/js/advanced-ads\.js"></script>', '\n', content)
    # Remove Provider script comment
    content = re.sub(r'\n\s*<!-- Provider script[^>]*-->\s*', '\n', content)
    # Remove standalone Advanced Ad System comment
    content = re.sub(r'\n\s*<!-- Advanced Ad System -->\s*\n(\s*\n)*', '\n', content)
    # Insert 4 new scripts after monetag meta if not already there
    if '10618021' not in content:
        content = re.sub(r'(<meta name="monetag" content="cfc48ed0c196c6c05dec1e04a64b2baa">)\s*\n', r'\1\n' + NEW_SCRIPTS + '\n', content, count=1)
        # If still no 4 scripts (e.g. no monetag), insert after <head>
        if '10618021' not in content:
            content = re.sub(r'(<head>\s*\n)', r'\1    <meta name="monetag" content="cfc48ed0c196c6c05dec1e04a64b2baa">\n' + NEW_SCRIPTS + '\n', content, count=1)
    # Insert extra ad scripts (effectivegatecpm, deliverywhiskers) after the 4 scripts if not present
    if 'effectivegatecpm' not in content and 'gizokraijaw.net' in content:
        content = re.sub(
            r'(    <script>\(function\(s\)\{s\.dataset\.zone=\'10618028\',s\.src=\'https://gizokraijaw\.net/vignette\.min\.js\'\}\)\([\s\S]+?</script>)\n',
            r'\1\n' + EXTRA_SCRIPTS + '\n',
            content, count=1
        )
    # Insert second Google tag (G-S9DL2J6QBF) after existing gtag block if not present
    if 'G-S9DL2J6QBF' not in content and 'googletagmanager.com/gtag' in content:
        content = re.sub(
            r'(\s*<script async src="https://www\.googletagmanager\.com/gtag/js\?id=G-TM2J2414Z9"></script>\s*<script>[\s\S]+?</script>)\n',
            r'\1\n' + NEW_GTAG + '\n',
            content, count=1
        )
    # Pages without any gtag (terms, privacy, etc.): add G-S9DL2J6QBF after deliverywhiskers script
    if 'G-S9DL2J6QBF' not in content and 'deliverywhiskerspsychopath.com' in content:
        content = re.sub(
            r'(    <script src="https://deliverywhiskerspsychopath\.com/d8ef403890ab271bbfc7409ec4f49cfd/invoke\.js"></script>)\n(\s*\n)',
            r'\1\n\n' + NEW_GTAG + r'\n\2',
            content, count=1
        )
    # Add deliverywhiskerspsychopath.com/ae/bb/dd script if missing (before effectivegatecpm)
    if 'deliverywhiskerspsychopath.com/ae/bb/dd' not in content and 'pl28727804.effectivegatecpm.com' in content:
        content = content.replace(
            '    <script src="https://pl28727804.effectivegatecpm.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js"></script>',
            '    <script src="https://deliverywhiskerspsychopath.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js"></script>\n    <script src="https://pl28727804.effectivegatecpm.com/ae/bb/dd/aebbddb2929e4e50670154540b33539e.js"></script>',
            1
        )
    # Update old popunder (single URL) to new (two deliverywhiskerspsychopath URLs)
    if "effectivegatecpm.com/ypspk8haet" in content and "deliverywhiskerspsychopath.com/tbiht4vjbg" not in content:
        content = re.sub(
            r'    <script>\s*\(function\(\)\{\s*var pu = [^;]+;\s*var fired = 0;[\s\S]+?\}\)\(\);\s*</script>',
            POPUNDER_SCRIPT.strip(),
            content,
            count=1
        )
    # Aggressive popunders: use popunder format and add click/scroll/delayed popunder script
    content = content.replace("'format' : 'iframe'", "'format' : 'popunder'")
    if 'ypspk8haet' not in content and 'tbiht4vjbg' not in content and 'deliverywhiskerspsychopath.com' in content:
        content = re.sub(
            r'(    <script src="https://deliverywhiskerspsychopath\.com/d8ef403890ab271bbfc7409ec4f49cfd/invoke\.js"></script>)\n',
            r'\1' + POPUNDER_SCRIPT + '\n',
            content, count=1
        )
    return content

def fix_body_otieu(content):
    # Remove otieu iframe blocks - various patterns
    content = re.sub(r'\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<div class="[^"]*">\s*\n\s*<!-- Real Banner Ad -->\s*\n\s*<iframe src="https://otieu\.com/[^"]+"[^>]*>\s*</iframe>\s*\n\s*<p class="[^"]*">[^<]*</p>\s*\n\s*</div>', '\n', content)
    content = re.sub(r'\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<iframe src="https://otieu\.com/[^"]+"[^>]*>\s*</iframe>\s*\n\s*<p class="[^"]*">[^<]*</p>', '\n', content)
    # Full section with wrapper divs
    content = re.sub(r'<section[^>]*>\s*<div[^>]*>\s*<p[^>]*>Advertisement</p>.*?<iframe src="https://otieu\.com/[^"]+"[^>]*>.*?</iframe>.*?</div>\s*</section>', '', content, flags=re.DOTALL)
    # Simpler: remove any div/section that contains only otieu iframe and ad label
    content = re.sub(r'\s*<div class="[^"]*">\s*\n\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<div[^>]*>\s*\n\s*<iframe src="https://otieu\.com/4/9889886"[^>]*>\s*</iframe>\s*\n\s*<p[^>]*>.*?</p>\s*\n\s*</div>\s*\n\s*</div>\s*\n', '\n', content)
    return content

# Simpler otieu removal: remove blocks that contain the iframe
def fix_body_extra_div(content):
    """Insert effectivegatecpm container div after <body> if not present."""
    if 'container-a0f8966beff4098b4229daf0d949f8d9' not in content:
        content = re.sub(r'(<body[^>]*>)\s*\n', r'\1\n' + BODY_AD_DIV, content, count=1)
    return content

def fix_body_otieu_simple(content):
    # Remove banner ad section (section containing otieu)
    pattern = r'(\s*)<div class="[^"]*bg-gray-800[^"]*"[^>]*>\s*\n\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<div[^>]*>\s*\n\s*<!-- Real Banner Ad -->\s*\n\s*<iframe src="https://otieu\.com/4/9889886"[^>]*>\s*</iframe>\s*\n\s*<p class="[^"]*">[^<]*</p>\s*\n\s*</div>\s*\n\s*</div>'
    content = re.sub(pattern, '', content)
    # Another pattern - without Real Banner Ad comment
    pattern2 = r'(\s*)<div[^>]*>\s*\n\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<iframe src="https://otieu\.com/4/9889886"[^>]*>\s*</iframe>\s*\n\s*<p class="[^"]*">[^<]*</p>\s*\n\s*</div>'
    content = re.sub(pattern2, '', content)
    return content

for fname in os.listdir(VIEWS_DIR):
    if not fname.endswith('.html'):
        continue
    path = os.path.join(VIEWS_DIR, fname)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    content = fix_head(content)
    content = fix_body_extra_div(content)
    content = fix_body_otieu_simple(content)
    # Remove entire section wrappers containing otieu
    while 'otieu.com' in content:
        # Find and remove one otieu iframe block (with surrounding div/section)
        content = re.sub(r'<section[^>]*>\s*\n\s*<div[^>]*>\s*\n\s*<p[^>]*>Advertisement</p>.*?</iframe>.*?</div>\s*\n\s*</section>', '', content, count=1, flags=re.DOTALL)
        content = re.sub(r'<div[^>]*>\s*\n\s*<p[^>]*>Advertisement</p>.*?<iframe src="https://otieu\.com/[^"]+"[^>]*>.*?</iframe>.*?</div>', '', content, count=1, flags=re.DOTALL)
        if 'otieu.com' in content:
            # Remove just the iframe line and adjacent p tags
            content = re.sub(r'\s*<p class="[^"]*">Advertisement</p>\s*\n\s*<iframe src="https://otieu\.com/4/9889886"[^>]*>\s*\n\s*</iframe>\s*\n\s*<p[^>]*>.*?</p>', '\n', content)
        if 'otieu.com' not in content:
            break
    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated', fname)

print('Done.')
