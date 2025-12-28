
export type User = {
  id: string;
  name: string;
  vaultId: string;
  avatar: string;
  publicKey: string;
};

export type Contact = {
  id: string;
  nickname: string;
  vaultId: string;
  publicKey: string;
  status: 'active' | 'compromised' | 'offline';
};

export type Attachment = {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  size: string;
  url: string;
  scanStatus: 'pending' | 'scanning' | 'safe' | 'threat';
  visionAnalysis?: string;
  threatReport?: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  content: string;
  cipherText: string;
  timestamp: number;
  read: boolean;
  attachments: Attachment[];
  ephemeral: boolean;
  expiresAt?: number;
  digitalSignature: string;
  securityReport?: {
    phishingRisk: 'LOW' | 'MEDIUM' | 'CRITICAL';
    aiDetectionScore: number;
    threatIndicators: string[];
    summary: string;
    piiDetected: boolean;
    identityVerified: boolean; // Is the sender/content "real"?
  };
};
