import {Mp3Encoder} from "lamejs";

type CompressAudioOptions = {
  /**
   * Target MP3 bitrate in kbps. 128 is a good "voice first" balance.
   * We never change speed/pitch, only re-encode.
   */
  bitrateKbps?: number;
  /**
   * If set, we will try to pick a bitrate that fits under this byte budget
   * based on the decoded duration. Useful for proxy/body limits.
   */
  targetMaxBytes?: number;
  /**
   * Lower bound when auto-selecting bitrate.
   */
  minBitrateKbps?: number;
  /**
   * Upper bound when auto-selecting bitrate.
   */
  maxBitrateKbps?: number;
  /**
   * Prefer mono output for voice to reduce size (doesn't change speed/pitch).
   */
  forceMono?: boolean;
  /**
   * Skip compression for very large files to avoid heavy memory/CPU usage in the browser.
   * (Full-length listening audios can be long.)
   */
  maxInputBytes?: number;
  /**
   * Only keep the compressed file if it is smaller than the original by this ratio.
   * Example: 0.95 means "at least 5% smaller".
   */
  mustBeSmallerThanRatio?: number;
};

const DEFAULTS: Required<CompressAudioOptions> = {
  // Default to 96kbps for voice; we may go lower via targetMaxBytes.
  bitrateKbps: 96,
  // ~3.8MB is a safer budget for common serverless/proxy limits once multipart overhead is included.
  targetMaxBytes: 3.8 * 1024 * 1024,
  // Allow going lower for longer listening parts; speech remains understandable at 32-40kbps mono.
  minBitrateKbps: 32,
  maxBitrateKbps: 128,
  forceMono: true,
  maxInputBytes: 25 * 1024 * 1024, // 25MB
  mustBeSmallerThanRatio: 0.95
};

const compressionCache = new WeakMap<File, File>();

type WebkitAudioContextWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WebkitAudioContextWindow;
  return w.AudioContext ?? w.webkitAudioContext;
}

function canUseBrowserAudioApis() {
  return typeof getAudioContextCtor() !== "undefined";
}

function toBaseName(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(0, idx) : name;
}

function floatTo16BitPCM(input: Float32Array) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

function downmixToMono(buffer: AudioBuffer) {
  if (buffer.numberOfChannels <= 1) {
    return buffer.getChannelData(0);
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const out = new Float32Array(buffer.length);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = ((left[i] ?? 0) + (right[i] ?? 0)) / 2;
  }
  return out;
}

async function decodeToAudioBuffer(file: File) {
  const AudioCtx = getAudioContextCtor();
  if (!AudioCtx) {
    throw new Error("AudioContext is not available in this environment.");
  }

  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await file.arrayBuffer();
    // decodeAudioData is sometimes callback-based; Promise form is supported in modern browsers.
    const audioBuffer: AudioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return audioBuffer;
  } finally {
    // Avoid leaking AudioContext handles.
    try {
      await ctx.close();
    } catch {
      // ignore
    }
  }
}

function encodeMp3FromAudioBuffer(audioBuffer: AudioBuffer, params: {bitrateKbps: number; forceMono: boolean}) {
  const channels = params.forceMono ? 1 : Math.min(2, Math.max(1, audioBuffer.numberOfChannels || 1));
  const sampleRate = audioBuffer.sampleRate || 44100;
  const encoder = new Mp3Encoder(channels, sampleRate, params.bitrateKbps);

  const leftFloats = channels === 1 ? downmixToMono(audioBuffer) : audioBuffer.getChannelData(0);
  const rightFloats = channels === 2 ? audioBuffer.getChannelData(1) : undefined;

  const left = floatTo16BitPCM(leftFloats);
  const right = rightFloats ? floatTo16BitPCM(rightFloats) : undefined;

  const mp3Chunks: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < left.length; i += blockSize) {
    const leftChunk = left.subarray(i, i + blockSize);
    const rightChunk = right ? right.subarray(i, i + blockSize) : undefined;
    const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) mp3Chunks.push(mp3buf);
  }

  const endBuf = encoder.flush();
  if (endBuf.length > 0) mp3Chunks.push(endBuf);

  // TS 5.7+ is stricter about `BlobPart` typing for `Uint8Array<ArrayBufferLike>`; the runtime accepts this.
  const blobParts: BlobPart[] = mp3Chunks.map((chunk) => chunk as unknown as BlobPart);
  return new Blob(blobParts, {type: "audio/mpeg"});
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickNearestBitrate(kbps: number) {
  const allowed = [32, 40, 48, 56, 64, 80, 96, 112, 128];
  let best = allowed[0];
  let bestDist = Infinity;
  for (const candidate of allowed) {
    const dist = Math.abs(candidate - kbps);
    if (dist < bestDist) {
      best = candidate;
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Best-effort audio compression for uploads.
 * - Runs in the browser only.
 * - Never changes speed/pitch; only re-encodes as MP3 at a lower bitrate.
 * - Skips large files to avoid freezing/crashing the tab.
 * - Keeps original file if compression isn't meaningfully smaller.
 */
export async function maybeCompressAudioFileForUpload(file: File, options?: CompressAudioOptions): Promise<File> {
  const opts = {...DEFAULTS, ...(options ?? {})};

  if (!(file instanceof File)) return file;
  if (!canUseBrowserAudioApis()) return file;
  if (file.size <= 0) return file;
  if (file.size > opts.maxInputBytes) return file;

  const cached = compressionCache.get(file);
  if (cached) return cached;

  try {
    const audioBuffer = await decodeToAudioBuffer(file);

    const durationSeconds = Math.max(0.1, audioBuffer.duration || audioBuffer.length / (audioBuffer.sampleRate || 44100));
    // Choose bitrate to fit within targetMaxBytes when possible.
    let bitrate = opts.bitrateKbps;
    if (opts.targetMaxBytes && Number.isFinite(opts.targetMaxBytes)) {
      const targetBytes = Math.max(256 * 1024, Number(opts.targetMaxBytes));
      const idealKbps = Math.floor((targetBytes * 8) / (durationSeconds * 1000));
      bitrate = pickNearestBitrate(clamp(idealKbps, opts.minBitrateKbps, opts.maxBitrateKbps));
    }

    const blob = encodeMp3FromAudioBuffer(audioBuffer, {bitrateKbps: bitrate, forceMono: opts.forceMono});

    if (blob.size >= file.size * opts.mustBeSmallerThanRatio) {
      return file;
    }

    const nextName = `${toBaseName(file.name)}.mp3`;
    const nextFile = new File([blob], nextName, {type: "audio/mpeg", lastModified: file.lastModified});
    compressionCache.set(file, nextFile);
    return nextFile;
  } catch (error) {
    // Compression should never break uploads.
    console.warn("[audio] compression failed, uploading original file instead", error);
    return file;
  }
}
