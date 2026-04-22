import os, re

src = r'c:\Users\user\Desktop\Nextap\src'

for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for f in files:
        if not f.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, f)
        with open(path, 'r', encoding='utf-8') as fh:
            text = fh.read()
        fixed = text
        # Fix 3+ consecutive ASCII double-quotes (encoding artifact) -> "-"
        fixed = re.sub(r'"{3,}', '"-"', fixed)
        # Fix arrow mojibake: â (U+00E2) + † (U+2020) + any quote variant -> ->
        fixed = re.sub(r'\u00e2\u2020[\u2019\u2018\']', '->', fixed)
        # Also fix â†' where last char might already be ASCII '
        fixed = re.sub(r'\u00e2\u2020\u0027', '->', fixed)
        if fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)
            print('Fixed:', f)

print('Done')
