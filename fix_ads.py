# Fix ad scripts in view files - remove old, add 4 new scripts
import re
import os

NEW_SCRIPTS = """    <script>(function(s){s.dataset.zone='10618021',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <script src="https://3nbf4.com/act/files/tag.min.js?z=10618026" data-cfasync="false" async></script>
    <script>(function(s){s.dataset.zone='10618027',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
    <script>(function(s){s.dataset.zone='10618028',s.src='https://gizokraijaw.net/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
"""

VIEWS_DIR = os.path.join(os.path.dirname(__file__), 'views')

def fix_head(content):
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
