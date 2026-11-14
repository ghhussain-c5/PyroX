"""Create the downloadable project; excludes secrets, build output and Site identity."""
from pathlib import Path
import zipfile
root = Path(__file__).resolve().parents[1]
target = root / 'public/downloads/IGNIS-source.zip'
target.parent.mkdir(parents=True, exist_ok=True)
files = ['package.json', 'package-lock.json', 'index.html', 'vite.config.js',
         '.gitignore', '.env.example', 'README.md', 'GITHUB_PAGES.md']
for directory in ['src', 'backend', 'tests', 'scripts', 'public/data', '.github']:
    files += [str(p.relative_to(root)) for p in (root / directory).rglob('*')
              if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc']
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
    for name in sorted(set(files)):
        z.write(root / name, 'IGNIS/' + name)
print(f'{target.name}: {target.stat().st_size:,} bytes')
