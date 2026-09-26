#!/bin/sh
set -eu

lan_ip=${1:?Pass the laptop Wi-Fi IPv4 address}
case "$lan_ip" in
  *[!0-9.]*|'') echo 'Expected an IPv4 address.' >&2; exit 1 ;;
esac
repo_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
private_dir="$repo_root/.local-lan-certs"
public_dir="$repo_root/.local-lan-public"
mkdir -p "$private_dir" "$public_dir"
chmod 700 "$private_dir"
if [ ! -f "$private_dir/ca.key" ]; then
  openssl req -x509 -newkey rsa:3072 -nodes -sha256 -days 365 \
    -subj '/CN=FieldProof Local Demo CA' \
    -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' \
    -addext 'keyUsage=critical,keyCertSign,cRLSign' \
    -keyout "$private_dir/ca.key" -out "$private_dir/ca.crt" >/dev/null 2>&1
fi
cat > "$private_dir/server.ext" <<EOF
subjectAltName=IP:$lan_ip
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
EOF
openssl req -new -newkey rsa:2048 -nodes -sha256 \
  -subj "/CN=$lan_ip" -keyout "$private_dir/server.key" \
  -out "$private_dir/server.csr" >/dev/null 2>&1
openssl x509 -req -in "$private_dir/server.csr" -CA "$private_dir/ca.crt" \
  -CAkey "$private_dir/ca.key" -CAcreateserial -days 30 -sha256 \
  -extfile "$private_dir/server.ext" -out "$private_dir/server.crt" >/dev/null 2>&1
openssl x509 -in "$private_dir/ca.crt" -outform der \
  -out "$public_dir/FieldProof-Local-CA.cer"
chmod 600 "$private_dir"/*.key
fingerprint=$(openssl x509 -in "$private_dir/ca.crt" -noout -fingerprint -sha256 | cut -d= -f2)
cat > "$public_dir/index.html" <<EOF
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FieldProof iPhone setup</title>
  <style>
    :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f7f7f2; color: #171d18; }
    main { max-width: 38rem; margin: auto; padding: 2rem 1.25rem 4rem; }
    .eyebrow { color: #52624c; font-size: .8rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
    h1 { font-size: clamp(2rem, 9vw, 3.3rem); line-height: 1.08; margin: .6rem 0 1rem; }
    p, li { font-size: 1.1rem; line-height: 1.55; }
    ol { padding-left: 1.4rem; }
    li { margin: 1.2rem 0; }
    a.button { display: block; padding: 1.15rem; margin: 1rem 0; border-radius: .9rem; background: #143b2d; color: white; font-size: 1.15rem; font-weight: 750; text-align: center; text-decoration: none; }
    a.secondary { background: #dce9dd; color: #143b2d; }
    .fingerprint { overflow-wrap: anywhere; padding: 1rem; border: 1px solid #bacab9; border-radius: .7rem; background: white; font: .85rem/1.5 ui-monospace, monospace; }
    .note { font-size: .9rem; color: #455047; }
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">FieldProof · iPhone setup</p>
    <h1>Open the speech studio on your iPhone</h1>
    <p>This one-time certificate setup lets Safari use the microphone on the laptop's private Wi-Fi address.</p>
    <ol>
      <li>Download the local certificate in Safari.<a class="button" href="/FieldProof-Local-CA.cer">Download certificate</a></li>
      <li>Open <strong>Settings → Profile Downloaded → Install</strong>. If that entry is absent, try <strong>Settings → General → VPN &amp; Device Management</strong>. Install the certificate profile.</li>
      <li>Open <strong>Settings → General → About → Certificate Trust Settings</strong> and enable full trust for <strong>FieldProof Local Demo CA</strong>.</li>
      <li>Return to Safari and open the secure website.<a class="button secondary" href="https://$lan_ip:3443/transcribe/">Open FieldProof transcriber</a></li>
    </ol>
    <p class="note">Only install this certificate if its SHA-256 fingerprint matches the one provided separately with these instructions. The certificate private key stays on this laptop. You can remove the certificate from your iPhone after the demo.</p>
    <p class="fingerprint">$fingerprint</p>
  </main>
</body>
</html>
EOF
echo "SHA256 Fingerprint=$fingerprint"
echo "Server certificate issued for $lan_ip."
