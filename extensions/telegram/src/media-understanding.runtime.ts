// Telegram plugin module implements media understanding behavior.
import {
  describeImageWithModel as describeImageWithModelImpl,
  transcribeFirstAudio as transcribeFirstAudioImpl,
} from "natesclaw/plugin-sdk/media-runtime";

type DescribeImageWithModel =
  typeof import("natesclaw/plugin-sdk/media-runtime").describeImageWithModel;
type TranscribeFirstAudio = typeof import("natesclaw/plugin-sdk/media-runtime").transcribeFirstAudio;

export async function describeImageWithModel(
  ...args: Parameters<DescribeImageWithModel>
): ReturnType<DescribeImageWithModel> {
  return await describeImageWithModelImpl(...args);
}

export async function transcribeFirstAudio(
  ...args: Parameters<TranscribeFirstAudio>
): ReturnType<TranscribeFirstAudio> {
  return await transcribeFirstAudioImpl(...args);
}
