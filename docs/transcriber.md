# Speech transcriber

- Public `/transcribe/` route; no sign-in or site role.
- Record or upload up to two minutes of audio. The selected local Whisper model transcribes automatically after capture. Auto is the default; a known-language hint or an optional Indic specialist can be chosen when appropriate.
- The original machine transcript is retained. Editable text, sentence segmentation, token language hints and Telugu spelling suggestions support review. A suggestion is accepted explicitly and the original remains visible.
- English is the default presentation. Original-language and other target choices are available. Local Whisper supplies English from audio and local Qwen handles text translation. A failed or missing translation leaves the presentation pending and the original available.
- Save sessions in the browser or export presented text. Prepare the website shell and model while connected, then test offline. Model cache may be evicted by the browser.

Recognition quality varies across accents, noise, language pairs and devices. Token tags and meaning checks flag areas to review; they are not calibrated confidence or proof that the translation is correct.
