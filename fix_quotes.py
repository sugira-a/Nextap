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
        # Replace 3+ consecutive double-quotes (encoding artifact) with "-"
        fixed = re.sub(r'"{3,}', '"-"', text)
        if fixed != text:
            with open(path, 'w', encoding='utf-8', newline='') as fh:
                fh.write(fixed)
            print('Fixed:', f)

print('Done')
