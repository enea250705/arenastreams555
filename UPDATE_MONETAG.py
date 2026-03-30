import os
import re

VIEWS_DIR = r'c:\Users\eneam\Downloads\arenastreams555-1\views'
NEW_TAG = '<meta name="monetag" content="6101daefdb18ab088d8cf761c35e815f">'

for fname in os.listdir(VIEWS_DIR):
    if fname.endswith('.html'):
        fpath = os.path.join(VIEWS_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if already updated
        if NEW_TAG in content:
            print(f"Already updated {fname}")
            continue
            
        # Target only the monetag meta tag for replacement
        if 'name="monetag"' in content:
            new_content = re.sub(r'<meta name="monetag"[^>]*>', NEW_TAG, content)
        else:
            # Fallback: insert after <head>
            new_content = re.sub(r'(<head[^>]*>)', rf'\1\n    {NEW_TAG}', content, count=1, flags=re.IGNORECASE)
            
        if new_content != content:
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {fname}")
        else:
            print(f"No match in {fname}")
