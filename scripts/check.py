#!/usr/bin/env python3
"""Run a build check and surface failure details in GitHub's check annotations."""
import os
import subprocess
import sys

result = subprocess.run(sys.argv[1:], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
print(result.stdout, end='')
if result.returncode and os.environ.get('GITHUB_ACTIONS'):
    message = result.stdout[-6000:].replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
    print(f'::error title=Build check failed::{message}')
sys.exit(result.returncode)
