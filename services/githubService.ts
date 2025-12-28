
import { Message, Contact, User } from '../types';

export interface VaultData {
  users: {
    [vaultId: string]: {
      name: string;
      code: string;
      publicKey: string;
      avatar: string;
    }
  };
  messages: Message[];
  contacts: Contact[];
}

/**
 * Fetches the entire database state from GitHub Gist
 */
export async function fetchVault(gistId: string, pat: string): Promise<VaultData> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error('FAILED_TO_SYNC_VAULT: Unauthorized or Invalid Gist ID');
  }

  const gist = await response.json();
  const content = gist.files['vault.json']?.content;
  
  if (!content) {
    throw new Error('DATABASE_CORRUPTED: vault.json not found in Gist');
  }

  return JSON.parse(content);
}

/**
 * Updates the entire database state in GitHub Gist
 */
export async function updateVault(gistId: string, pat: string, data: VaultData): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        'vault.json': {
          content: JSON.stringify(data, null, 2)
        }
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`UPDATE_FAILED: ${err.message || 'Check Token Permissions'}`);
  }
}
