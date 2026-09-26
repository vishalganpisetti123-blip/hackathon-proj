"""Serve the static export and proxy /api/ over one local HTTPS origin.

The API remains bound to 127.0.0.1. Only this HTTPS endpoint reaches the LAN.
Run from the repository root after building the frontend.
"""
import argparse
import http.server
import os
import ssl
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "frontend" / "out"
API = "http://127.0.0.1:8000"
MAX_BODY = 24 * 1024 * 1024


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            return self.proxy()
        return super().do_GET()

    def do_HEAD(self):
        if self.path.startswith("/api/"):
            return self.proxy()
        return super().do_HEAD()

    def do_POST(self):
        if self.path.startswith("/api/"):
            return self.proxy()
        self.send_error(405)

    def do_PUT(self):
        if self.path.startswith("/api/"):
            return self.proxy()
        self.send_error(405)

    def proxy(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            return self.send_error(400, "Invalid content length")
        if length < 0 or length > MAX_BODY:
            return self.send_error(413, "Request too large")
        body = self.rfile.read(length) if length else None
        headers = {key: value for key, value in self.headers.items()
                   if key.lower() in {"authorization", "content-type", "x-audio-type"}}
        request = urllib.request.Request(API + self.path, data=body, headers=headers, method=self.command)
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as error:
            response = error
        except (urllib.error.URLError, TimeoutError):
            return self.send_error(502, "Local API unavailable")
        with response:
            data = response.read()
            self.send_response(response.status)
            self.send_header("Content-Type", response.headers.get("Content-Type", "application/octet-stream"))
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(data)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True, help="Laptop's Wi-Fi IP address")
    parser.add_argument("--port", type=int, default=3443)
    parser.add_argument("--cert", required=True)
    parser.add_argument("--key", required=True)
    args = parser.parse_args()
    if not PUBLIC.is_dir():
        raise SystemExit("Build the frontend first: npm --prefix frontend run build")
    server = http.server.ThreadingHTTPServer((args.host, args.port), Handler)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(args.cert, args.key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    os.chmod(args.key, 0o600)
    print(f"FieldProof LAN HTTPS: https://{args.host}:{args.port}/transcribe/", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
