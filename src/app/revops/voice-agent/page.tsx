import { redirect } from 'next/navigation'

// The Speak to Voice Agent app now lives in the mini-apps marketplace at
// /live-apps/voice-agent. This route is kept as a redirect so existing
// links and bookmarks continue to work.
export default function VoiceAgentRedirect() {
  redirect('/live-apps/voice-agent')
}
