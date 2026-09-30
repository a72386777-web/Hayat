export async function playPCM(
  base64Data: string, 
  volume: number = 1.0,
  onAudioLevel?: (level: number) => void
): Promise<void> {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("AudioContext not supported");
      return;
    }
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = new Int16Array(bytes.buffer);
    const audioBuffer = audioCtx.createBuffer(1, buffer.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < buffer.length; i++) {
      channelData[i] = buffer[i] / 32768.0;
    }
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    // Real-time audio analyzer for visualizer sync
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    source.connect(analyser);
    analyser.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    let isPlaying = true;
    let animId: number | null = null;

    if (onAudioLevel) {
      const updateLevel = () => {
        if (!isPlaying) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1.0, (avg / 128.0) * 1.4);
        onAudioLevel(normalized);
        animId = requestAnimationFrame(updateLevel);
      };
      animId = requestAnimationFrame(updateLevel);
    }
    
    source.start();
    
    return new Promise<void>(resolve => {
      source.onended = () => {
        isPlaying = false;
        if (animId) cancelAnimationFrame(animId);
        if (onAudioLevel) onAudioLevel(0);
        try {
          audioCtx.close();
        } catch {}
        resolve();
      };
    });
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}
