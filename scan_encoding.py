import os, re

src = r'c:\Users\user\Desktop\Nextap\src'
issues = []

# Pattern to check for remaining mojibake or triple-quote artifacts
pat = re.compile(r'\u00e2\u20ac|\u00e2\u2020|"{3,}|\u201c|\u201d')

for root, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d != 'node_modules']
    for ff in files:
        if not ff.endswith(('.tsx', '.ts')):
            continue
        path = os.path.join(root, ff)
        with open(path, encoding='utf-8') as fh:
            for i, line in enumerate(fh):
                if pat.search(line):
                    issues.append(f'{ff}:{i+1}: {line.strip()[:80]}')

if issues:
    for x in issues:
        print(x)
else:
    print('All clean!')

# Also verify line 161 of AdminOverview
with open(r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminOverview.tsx', encoding='utf-8') as fh:
    lines = fh.readlines()
print('AdminOverview line 161:', lines[160].strip()[-30:])
