
export interface VaultData {
  users: {
    [vaultId: string]: {
      name: string;
      code: string;
      publicKey: string;
      avatar: string;
    }
  }
}

/**
 * Fetches the private vault from GitHub Gist
 */
export async function fetchVault(gistId: string, pat: string): Promise<VaultData> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${pat}`,
      'Accept': 'application/vnd.github.v3+json'
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
