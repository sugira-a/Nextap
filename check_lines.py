import os, re

files_to_check = [
    r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminCardView.tsx',
    r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminCompanyView.tsx',
    r'c:\Users\user\Desktop\Nextap\src\pages\admin\AdminUserView.tsx',
]

pat = re.compile('\u00e2\u20ac|\u00e2\u2020|\u201c|\u201d|' + '"{3,}')

for path in files_to_check:
    with open(path, encoding='utf-8') as fh:
        for i, line in enumerate(fh):
            if pat.search(line):
                print(f'{os.path.basename(path)}:{i+1}: {repr(line.strip())}')
