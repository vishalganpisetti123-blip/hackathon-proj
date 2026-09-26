"""Download and hash one public GGML speech model for local verification."""
import argparse
import hashlib
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--repo', required=True)
    parser.add_argument('--file', required=True)
    parser.add_argument('--name', required=True)
    args = parser.parse_args()
    target = ROOT / 'export' / f'phone-{args.name}' / args.file
    target.parent.mkdir(parents=True, exist_ok=True)
    url = f'https://huggingface.co/{args.repo}/resolve/main/{args.file}'
    digest = hashlib.sha256()
    size = 0
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with target.open('wb') as output:
            for chunk in response.iter_content(1024 * 1024):
                if not chunk:
                    continue
                output.write(chunk)
                digest.update(chunk)
                size += len(chunk)
    print({'model': args.repo, 'file': str(target), 'bytes': size, 'sha256': digest.hexdigest()})


if __name__ == '__main__':
    main()
