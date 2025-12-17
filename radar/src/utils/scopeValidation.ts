
export function validateApiKeyScopes(requiredScopes: string[], apiKeyScopes: string[]): boolean {
  if (!requiredScopes || requiredScopes.length === 0) {
    return true; // No specific scopes required, access granted
  }

  if (!apiKeyScopes || apiKeyScopes.length === 0) {
    return false; // Scopes required, but API key has none
  }

  // Check if all required scopes are present in the API key's scopes
  return requiredScopes.every(scope => apiKeyScopes.includes(scope));
}
