/**
 * Shared WebRTC transport — used by both household calls (§26) and
 * GFS DataChannel sync (§4.2).
 *
 * The RTC stack is browser-native (RTCPeerConnection). This module
 * handles:
 *   - Creating offers/answers
 *   - ICE candidate exchange via the WS signaling channel
 *   - DataChannel setup for space sync
 *
 * For v1 this is a minimal implementation — calls use audio/video
 * tracks; DataChannel sync uses a reliable ordered channel.
 */

import { ws } from '@/ws'

export interface RtcCallOptions {
  remoteUserId: string
  audio: boolean
  video: boolean
}

export class RtcTransport {
  private pc: RTCPeerConnection | null = null
  private cleanupFns: (() => void)[] = []

  async startCall(options: RtcCallOptions): Promise<MediaStream> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: options.audio,
      video: options.video,
    })

    localStream.getTracks().forEach(track => {
      this.pc!.addTrack(track, localStream)
    })

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send('call_ice_candidate', {
          to: options.remoteUserId,
          candidate: e.candidate.toJSON(),
        })
      }
    }

    const offer = await this.pc.createOffer()
    await this.pc.setLocalDescription(offer)

    ws.send('call_offer', {
      to: options.remoteUserId,
      sdp: offer.sdp,
      sdp_type: offer.type,
    })

    // Listen for answer
    const unsub = ws.on('call_answer', async (evt) => {
      if (this.pc) {
        await this.pc.setRemoteDescription(
          new RTCSessionDescription({ type: 'answer', sdp: evt.data.sdp as string })
        )
      }
    })
    this.cleanupFns.push(unsub)

    // Listen for ICE candidates
    const unsubIce = ws.on('call_ice_candidate', async (evt) => {
      if (this.pc) {
        await this.pc.addIceCandidate(new RTCIceCandidate(evt.data.candidate as RTCIceCandidateInit))
      }
    })
    this.cleanupFns.push(unsubIce)

    return localStream
  }

  async handleIncomingOffer(sdp: string, fromUserId: string): Promise<MediaStream> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    localStream.getTracks().forEach(track => this.pc!.addTrack(track, localStream))

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send('call_ice_candidate', { to: fromUserId, candidate: e.candidate.toJSON() })
      }
    }

    await this.pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }))
    const answer = await this.pc.createAnswer()
    await this.pc.setLocalDescription(answer)

    ws.send('call_answer', { to: fromUserId, sdp: answer.sdp, sdp_type: answer.type })

    return localStream
  }

  getRemoteStream(): MediaStream | null {
    if (!this.pc) return null
    const receivers = this.pc.getReceivers()
    if (receivers.length === 0) return null
    const stream = new MediaStream()
    receivers.forEach(r => { if (r.track) stream.addTrack(r.track) })
    return stream
  }

  hangup() {
    this.cleanupFns.forEach(fn => fn())
    this.cleanupFns = []
    this.pc?.close()
    this.pc = null
  }
}
