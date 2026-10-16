"""Heuristic secret scan; reports only location/type, never matched values.
Run with --history to inspect all local Git refs, including remote refs after fetch.
This supplements review and is not a guarantee against every credential format.
"""
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
patterns = {
    'private-key': re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----'),
    'github-token': re.compile(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'),
    'aws-access-key': re.compile(rb'(?:AKIA|ASIA)[A-Z0-9]{16}'),
    'api-key': re.compile(rb'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{30,}'),
    'credential-assignment': re.compile(rb'''(?i)(?:api[_-]?key|api[_-]?token|client[_-]?secret|password|access[_-]?token)\s*[=:]\s*["'][A-Za-z0-9_+/=-]{16,}["']'''),
    'url-credentials': re.compile(rb'https?://[^\s/:]+:[^\s/@]+@'),
}
findings = []
def inspect(label, data):
    if b'\x00' in data[:8192] or data.startswith((b'\x89PNG', b'RIFF', b'\xff\xd8')):
        return
    for kind, pattern in patterns.items():
        if pattern.search(data):
            findings.append((label, kind))

files=0
for file in root.rglob('*'):
    relative=file.relative_to(root)
    if any(p in {'.git','node_modules','.wrangler','review','__pycache__'} for p in relative.parts) or not file.is_file():
        continue
    if file.name.startswith('.env') or file.name.startswith('.dev.vars') or file.suffix in {'.pem','.key','.p12','.pfx'}:
        findings.append((str(relative),'sensitive-file'))
    inspect(str(relative),file.read_bytes())
    files+=1

commits=0
if '--history' in sys.argv:
    def git(*args):
        return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.DEVNULL)
    commits=len(git('rev-list','--all').splitlines())
    for entry in git('rev-list','--objects','--all').splitlines():
        sha, _, name=entry.partition(b' ')
        if git('cat-file','-t',sha.decode()).strip()==b'blob':
            inspect('history:'+name.decode('utf-8',errors='replace'),git('cat-file','blob',sha.decode()))

print(f'Scanned {files} working files and {commits} historical commits; findings: {len(findings)}')
for label,kind in findings:
    print(f'{kind}: {label}')
sys.exit(bool(findings))
