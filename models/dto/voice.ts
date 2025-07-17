export interface TranscribeVoiceToTextRequest {
  Language: string
  TranscribeMode: string
  File: {
    Uri: string
    MimeType: string
    Name: string
  }
}

export interface TranscribeVoiceToTextResponse {
  Text: string
}