import Stream from '@fugood/react-native-audio-pcm-stream';
import { AudioModule, setAudioModeAsync } from 'expo-audio';
import * as FS from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { pcmToWav } from './wav';

export async function startRecording(onLimit: () => void): Promise<() => Promise<string>> {
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  if (!permission.granted) throw new Error('Microphone access was denied. You can still type a transcript.');
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  const chunks: Buffer[] = [];
  let bytes = 0;
  let stopped = false;
  const maxBytes = 20 * 16000 * 2;
  await Stream.init({ sampleRate: 16000, channels: 1, bitsPerSample: 16, audioSource: 6, bufferSize: 4096 });
  const subscription = Stream.on('data', data => {
    if (stopped || bytes >= maxBytes) return;
    const chunk = Buffer.from(data, 'base64').subarray(0, maxBytes - bytes);
    chunks.push(chunk); bytes += chunk.length;
  });
  const timer = setTimeout(onLimit, 20_000);
  try { Stream.start(); } catch (error) { clearTimeout(timer); subscription.remove(); throw error; }
  return async () => {
    if (stopped) throw new Error('Recording already stopped.');
    stopped = true; clearTimeout(timer);
    try { Stream.stop(); } finally { subscription.remove(); }
    await setAudioModeAsync({ allowsRecording: false });
    if (bytes < 3200) throw new Error('Recording was too short. Hold the phone closer and try again.');
    const uri = `${FS.documentDirectory}recording-${Date.now()}.wav`;
    await FS.writeAsStringAsync(uri, pcmToWav(Buffer.concat(chunks)).toString('base64'), { encoding: FS.EncodingType.Base64 });
    return uri;
  };
}
