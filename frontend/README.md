# FieldProof website

The static Next.js export has a public speech studio at `/transcribe/` and an explainable text Language Lab at `/analyze/`. `/demo/`, `/history/` and `/about/` support the AI/ML demonstration. No account is needed for transcription. The website has no worker, supervisor, emergency or reporting pages.

```sh
npm install
npm run test
npm run lint
npm run build
npm start
```

`npm start` serves `out/` at `http://127.0.0.1:3000/`. The speech studio records and processes audio in the browser with local model runtimes. The Language Lab calls the local FastAPI service on port 8000. The production build generates `out/sw.js`; use **Prepare offline website** in the speech studio and **Download & prepare model** for the desired model while connected. Model preparation is on demand. Test audio capture and transcription with the network disconnected before a demo, since browsers may evict model caches.

## Open on an iPhone on the same Wi-Fi

The phone cannot use the laptop's `127.0.0.1`. Safari requires a secure context for microphone capture, so the local demo uses an HTTPS server bound to the laptop's Wi-Fi IPv4 address. With FastAPI running on `127.0.0.1:8000`, from the repository root:

```sh
npm --prefix frontend run build
sh frontend/scripts/make-lan-cert.sh YOUR_LAPTOP_WIFI_IP
python3 -m http.server 3103 --bind YOUR_LAPTOP_WIFI_IP --directory .local-lan-public
# In another terminal:
python3 frontend/scripts/serve-lan.py --host YOUR_LAPTOP_WIFI_IP --port 3443 \
  --cert .local-lan-certs/server.crt --key .local-lan-certs/server.key
```

On the iPhone, visit `http://YOUR_LAPTOP_WIFI_IP:3103/` in Safari. This setup page serves only a public certificate and instructions. Compare its SHA-256 fingerprint with the one printed by the certificate script. Install the certificate in Settings → Profile Downloaded (or General → VPN & Device Management), then enable full trust in Settings → General → About → Certificate Trust Settings. Open `https://YOUR_LAPTOP_WIFI_IP:3443/transcribe/`. The HTTPS server proxies `/api/` to the loopback FastAPI process for the Language Lab; FastAPI itself stays off the Wi-Fi interface.

The CA private key stays in ignored `.local-lan-certs/`; never share it. The public setup page lives in ignored `.local-lan-public/`. If the Wi-Fi IP changes, rerun the certificate script and restart HTTPS. Remove the installed certificate from the phone when the local demo is over. Wi-Fi client isolation can prevent phone-to-laptop access even when both devices show the same network name.
