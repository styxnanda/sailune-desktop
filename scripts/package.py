#!/usr/bin/env python3
"""Package the desktop app and a standalone CLI built from the same core checkout."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import zipfile

ROOT = Path(__file__).resolve().parent.parent
CORE = ROOT.parent / 'sailune-cli'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--platform', choices=['windows', 'linux', 'darwin'], required=True)
    parser.add_argument('--arch', choices=['amd64', 'arm64'], default='amd64')
    parser.add_argument('--version', default='v0.1.0')
    args = parser.parse_args()
    if not args.version.startswith('v') or any(c not in 'v0123456789.-abcdefghijklmnopqrstuvwxyz' for c in args.version):
        parser.error('version must be a simple v-prefixed release version')
    name = f'sailune-{args.version}-{args.platform}-{args.arch}'
    output = ROOT / 'build' / 'packages'
    output.mkdir(parents=True, exist_ok=True)
    stage = ROOT / 'build' / 'staging' / name
    if stage.exists():
        shutil.rmtree(stage)
    stage.mkdir(parents=True)
    cli_name = 'sailune.exe' if args.platform == 'windows' else 'sailune'
    cli_dir = stage
    if args.platform == 'darwin':
        app = ROOT / 'build' / 'bin' / 'Sailune.app'
        if not app.is_dir():
            raise SystemExit(f'Missing {app}; run the local macOS build first')
        shutil.copytree(app, stage / 'Sailune.app', symlinks=True)
        cli_dir = stage / 'Sailune.app' / 'Contents' / 'MacOS'
    else:
        desktop_name = 'sailune-desktop.exe' if args.platform == 'windows' else 'sailune-desktop'
        shutil.copy2(ROOT / 'build' / 'bin' / desktop_name, stage / desktop_name)
    env = dict(os.environ, GOOS=args.platform, GOARCH=args.arch, CGO_ENABLED='0')
    subprocess.run(['go', 'build', '-trimpath', '-o', str(cli_dir / cli_name), './cmd/sailune'], cwd=CORE, env=env, check=True)
    shutil.copy2(ROOT / 'LICENSE', stage / 'LICENSE')
    shutil.copy2(CORE / 'LICENSE', stage / 'SAILUNE-GO-LICENSE')
    core_commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=CORE, text=True).strip()
    (stage / 'build-info.json').write_text(json.dumps({'version': args.version, 'platform': args.platform, 'arch': args.arch, 'core_commit': core_commit}, indent=2) + '\n')
    instructions = f'''Sailune Desktop {args.version} — {args.platform}/{args.arch}

This download includes the desktop app AND a standalone Sailune CLI.
Both use the same local library and encrypted sessions by default.
No Go or Node.js installation is needed to run these binaries.

'''
    if args.platform == 'windows':
        instructions += 'Open sailune-desktop.exe. WebView2 Runtime is required.\nRun .\\sailune.exe --help in PowerShell for the CLI.\n'
    elif args.platform == 'linux':
        shutil.copy2(ROOT / 'build' / 'appicon.png', stage / 'sailune-icon.png')
        shutil.copy2(ROOT / 'build' / 'linux' / 'sailune-desktop.desktop', stage / 'sailune-desktop.desktop')
        shutil.copy2(ROOT / 'build' / 'linux' / 'install-bundle.sh', stage / 'install.sh')
        instructions += ('Run ./sailune-desktop or ./sailune --help.\n'
                         'On Ubuntu 24.04, install libgtk-3-0t64 and libwebkit2gtk-4.1-0.\n'
                         'Optional: sh install.sh installs both commands and the desktop launcher for this user.\n'
                         'The Linux build targets Ubuntu 24.04 or a compatible/newer runtime.\n')
    else:
        instructions += ('Open Sailune.app. This unsigned/ad-hoc-signed build is for local testing only.\n'
                         'CLI: ./Sailune.app/Contents/MacOS/sailune --help\n'
                         'The macOS test build is not a release platform or a SwiftUI client.\n')
        # Adding the CLI changes the bundle. Refresh the local ad-hoc signature.
        subprocess.run(['codesign', '--force', '--deep', '--sign', '-', str(stage / 'Sailune.app')], check=True)
    instructions += ('\nKeep SQLite libraries local; use JSON export/import for transfers.\n'
                     'The CLI and desktop store metadata, not full story text.\n'
                     'See https://github.com/styxnanda/sailune-desktop for usage and limitations.\n')
    (stage / 'README.txt').write_text(instructions)
    if args.platform == 'linux':
        archive = output / f'{name}.tar.gz'
        with tarfile.open(archive, 'w:gz') as tar:
            tar.add(stage, arcname=name)
    else:
        archive = output / f'{name}.zip'
        if args.platform == 'darwin':
            if archive.exists():
                archive.unlink()
            subprocess.run(['ditto', '-c', '-k', '--sequesterRsrc', '--keepParent', str(stage), str(archive)], check=True)
        else:
            with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
                for path in sorted(stage.rglob('*')):
                    if path.is_file():
                        z.write(path, path.relative_to(stage.parent))
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / f'{archive.name}.sha256').write_text(f'{digest}  {archive.name}\n')
    print(f'Packaged {archive}')


if __name__ == '__main__':
    main()
