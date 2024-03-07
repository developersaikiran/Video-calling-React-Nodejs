class PeerService {
    constructor() {
        if (!this.peer) {
            this.peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls: [
                            "stun:stun.l.google.com:19302",
                            "stun:global.stun.twilio.com:3478"
                        ]
                    }
                ]
            })
        }
    }
    
    async getAnswer(offer) {
        try {
            await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peer.createAnswer();
            await this.peer.setLocalDescription(answer);
            return answer
        } catch (error) {
            console.error('Error setting local description:', error);
            throw error;
        }
    }

    async setRemoteDescription(anw) {
        try {
            // await this.peer.setRemoteDescription(new RTCSessionDescription(anw));
            await this.peer.setRemoteDescription(anw);
        } catch (error) {
            console.error('Error setting remote description:', error);
            throw error;
        }
    }

    async getOffer() {
        try {
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(new RTCSessionDescription(offer));
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            throw error;
        }
    }

}

export default new PeerService();
