# FieldProof native speech prototype

The current hackathon focus is the website. This separate React Native prototype has a transcription screen and a model-setup screen only. It records speech, detects a spoken language with local Whisper, preserves the machine original, supports reviewed edits, and presents the transcript in English or another selected language with local models. It does not submit reports or connect to a supervisor.

The Android path has been built previously but has not been validated on a physical phone; iPhone support has not been validated. Use the website's HTTPS speech studio for the current phone demo.

```sh
npm ci
npm run typecheck
npm test
```

From `mobile/`, `npm run android:release` starts a native release build when the Android SDK is installed. Model installation needs connectivity once; inference then runs on the phone. Model downloads are large and device performance and recognition accuracy require measurement on target hardware. The browser and native model artifacts are not interchangeable.
