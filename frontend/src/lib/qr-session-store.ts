// Shared session store for WhatsApp QR authentication
// In production, replace with Redis or database

export interface QRSession {
  token: string;
  phoneNumber?: string;
  verified: boolean;
  expiresAt: number;
  createdAt: number;
}

export const qrSessions = new Map<string, QRSession>();

// Cleanup expired sessions every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of qrSessions.entries()) {
      if (now > session.expiresAt) {
        qrSessions.delete(sessionId);
      }
    }
  }, 5 * 60 * 1000);
}
