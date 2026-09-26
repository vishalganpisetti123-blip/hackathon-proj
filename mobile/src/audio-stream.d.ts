declare module '@fugood/react-native-audio-pcm-stream' {
  const stream: {
    init(options: { sampleRate: number; channels: number; bitsPerSample: number; audioSource: number; bufferSize: number }): Promise<void>;
    on(event: 'data', listener: (data: string) => void): { remove(): void };
    start(): void;
    stop(): void;
  };
  export default stream;
}
