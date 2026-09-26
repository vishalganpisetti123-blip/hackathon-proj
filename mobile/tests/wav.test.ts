import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'buffer';
import { pcmToWav } from '../src/wav.ts';
test('recordings have a 16kHz mono 16-bit WAV header and retain PCM samples', () => {
  const pcm = Buffer.from([0, 0, 255, 127, 0, 128]);
  const wav = pcmToWav(pcm);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.readUInt32LE(4), wav.length - 8);
  assert.equal(wav.readUInt32LE(24), 16000);
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt16LE(34), 16);
  assert.equal(wav.readUInt32LE(40), pcm.length);
  assert.deepEqual(wav.subarray(44), pcm);
});
