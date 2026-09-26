import { useState } from 'react';
import { ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Setup } from './src/Setup';
import { Transcriber } from './src/Transcriber';
import { Button, colors, styles } from './src/ui';

export default function App() { return <SafeAreaProvider><SpeechApp /></SafeAreaProvider>; }

function SpeechApp() {
  const [tab, setTab] = useState<'transcribe' | 'setup'>('transcribe');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  return <SafeAreaView style={styles.root}>
    <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />
    <View style={styles.header}><Text style={styles.brand}>FieldProof</Text><Text style={styles.small}>Local multilingual speech AI</Text></View>
    <View style={styles.tabs}>
      <Button title="Transcribe" secondary={tab !== 'transcribe'} disabled={Boolean(busy)} onPress={() => { setTab('transcribe'); setError(''); }} />
      <Button title="Models & setup" secondary={tab !== 'setup'} disabled={Boolean(busy)} onPress={() => { setTab('setup'); setError(''); }} />
    </View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!!busy && <Text accessibilityLiveRegion="polite" style={styles.body}>{busy}</Text>}
      {tab === 'transcribe' ? <Transcriber setBusy={setBusy} onError={setError} /> : <Setup setBusy={value => setBusy(value ? 'Preparing model…' : '')} onError={setError} />}
    </ScrollView>
  </SafeAreaView>;
}
