import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { hasModel, installModel, modelCatalog } from './models';
import type { ModelKind } from './models';
import { Button, styles } from './ui';

export function Setup({ setBusy, onError }: { setBusy: (value: boolean) => void; onError: (message: string) => void }) {
  const [installed, setInstalled] = useState<Record<ModelKind, boolean>>({ speech: false, speechTelugu: false, speechHindi: false, speechTamil: false, speechBengali: false, speechMarathi: false, language: false });
  const [progress, setProgress] = useState('');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    void Promise.all((Object.keys(modelCatalog) as ModelKind[]).map(async kind => [kind, await hasModel(kind)]))
      .then(found => setInstalled(Object.fromEntries(found) as Record<ModelKind, boolean>))
      .catch(error => onError(String(error)));
  }, [onError]);
  async function install(kind: ModelKind) {
    setWorking(true); setBusy(true);
    try { await installModel(kind, setProgress); setInstalled(previous => ({ ...previous, [kind]: true })); }
    catch (error) { onError(error instanceof Error ? error.message : 'Download failed.'); }
    finally { setWorking(false); setBusy(false); }
  }
  return <View style={styles.stack}>
    <Text accessibilityRole="header" style={styles.title}>Prepare local models</Text>
    <Text style={styles.body}>Install while connected, then test transcription without internet.</Text>
    <Text style={styles.small}>Multilingual Whisper detects speech and presents it in English. Qwen presents transcripts in other languages. Optional Indian-language speech packs can improve recognition for their matching language. Model downloads are large and must finish before offline use.</Text>
    {(Object.keys(modelCatalog) as ModelKind[]).map(kind => <View key={kind} style={styles.card}>
      <Text style={styles.label}>{modelCatalog[kind].name}</Text>
      <Text style={styles.small}>{installed[kind] ? 'Installed on this phone' : `${Math.round(modelCatalog[kind].bytes / 1_000_000)} MB download`}</Text>
      <Button title={installed[kind] ? 'Installed' : `Install ${kind} model`} disabled={working || installed[kind]} onPress={() => void install(kind)} />
    </View>)}
    {!!progress && <Text accessibilityLiveRegion="polite" style={styles.body}>{progress}</Text>}
  </View>;
}
