# Website scope

The website focuses on the AI/ML problem statement: code-switching and spelling by ear. The public `/transcribe/` page runs local speech and translation models in the browser. `/analyze/` and `/demo/` show an explainable text pipeline served by local FastAPI. `/history/` stores the latest analyses in the browser. `/about/` explains the pipeline.

Run `npm --prefix frontend run test`, `npm --prefix frontend run lint` and `npm --prefix frontend run build`. Serve `frontend/out/` as a static site. The generated service worker caches the exported shell; model files are prepared on demand and are not bundled into that shell. Install the shell and model before disconnecting, then test the target browser without internet. The page continues to allow text editing and export if inference is unavailable.

The browser stores transcript sessions and optional audio in IndexedDB. Clearing browser data removes them. The English presentation and original transcript remain separate; failed translation does not masquerade as a successful English transcript. The Language Lab's token scores are heuristic and not calibrated recognition probabilities. See [frontend setup](../frontend/README.md) for a same-Wi-Fi iPhone HTTPS demo.
