/**
 * Maps Gitleaks rules and secret types to standard severity levels.
 * Critical: Direct remote access / cloud root credentials / private keys
 * High: Production services / payment keys / write-capable API tokens
 * Medium: Webhooks / analytics / sandbox / generic identifiers
 */

const SEVERITY_MAP = {
  // Critical
  'aws-access-token': { severity: 'Critical', name: 'AWS Access Token' },
  'aws-secret-key': { severity: 'Critical', name: 'AWS Secret Access Key' },
  'gcp-api-key': { severity: 'Critical', name: 'Google Cloud API Key' },
  'gcp-service-account': { severity: 'Critical', name: 'GCP Service Account JSON' },
  'private-key': { severity: 'Critical', name: 'Asymmetric Private Key' },
  'rsa-private-key': { severity: 'Critical', name: 'RSA Private Key' },
  'ssh-private-key': { severity: 'Critical', name: 'SSH Private Key' },
  'github-pat': { severity: 'Critical', name: 'GitHub Personal Access Token' },
  'github-fine-grained-pat': { severity: 'Critical', name: 'GitHub Fine-grained PAT' },
  'stripe-api-key': { severity: 'Critical', name: 'Stripe Live Secret Key' },
  'database-connection-string': { severity: 'Critical', name: 'Database Connection String with Credentials' },
  'postgres-uri': { severity: 'Critical', name: 'PostgreSQL URI with Password' },
  'mongodb-uri': { severity: 'Critical', name: 'MongoDB URI with Password' },
  'mysql-uri': { severity: 'Critical', name: 'MySQL URI with Password' },

  // High
  'slack-bot-token': { severity: 'High', name: 'Slack Bot Token' },
  'slack-user-token': { severity: 'High', name: 'Slack User Token' },
  'slack-webhook-url': { severity: 'High', name: 'Slack Incoming Webhook URL' },
  'openai-api-key': { severity: 'High', name: 'OpenAI Secret API Key' },
  'anthropic-api-key': { severity: 'High', name: 'Anthropic Secret API Key' },
  'sendgrid-api-key': { severity: 'High', name: 'SendGrid API Key' },
  'twilio-api-key': { severity: 'High', name: 'Twilio API Credentials' },
  'jwt': { severity: 'High', name: 'JSON Web Token (JWT)' },
  'generic-api-key': { severity: 'High', name: 'Generic API Key / Secret' },
  'heroku-api-key': { severity: 'High', name: 'Heroku API Key' },
  'pypi-upload-token': { severity: 'High', name: 'PyPI Upload Token' },
  'npm-access-token': { severity: 'High', name: 'npm Access Token' },

  // Medium
  'discord-bot-token': { severity: 'Medium', name: 'Discord Bot Token' },
  'discord-webhook-url': { severity: 'Medium', name: 'Discord Webhook URL' },
  'mailgun-api-key': { severity: 'Medium', name: 'Mailgun API Key' },
  'square-access-token': { severity: 'Medium', name: 'Square Access Token' },
  'generic-password': { severity: 'Medium', name: 'Hardcoded Password Assignment' },
  'vault-token': { severity: 'Medium', name: 'HashiCorp Vault Token' }
};

/**
 * Returns clean severity and human-readable name for a given rule ID or secret tag.
 * @param {string} ruleId 
 * @param {string} description 
 * @returns {{ severity: 'Critical' | 'High' | 'Medium', secretType: string }}
 */
function getRuleMetadata(ruleId = '', description = '') {
  const normalizedId = ruleId.toLowerCase().trim();
  
  if (SEVERITY_MAP[normalizedId]) {
    return {
      severity: SEVERITY_MAP[normalizedId].severity,
      secretType: SEVERITY_MAP[normalizedId].name
    };
  }

  // Fallback heuristic based on rule description or ID
  const checkText = `${normalizedId} ${description}`.toLowerCase();

  if (
    checkText.includes('private key') ||
    checkText.includes('aws') ||
    checkText.includes('postgres') ||
    checkText.includes('mongo') ||
    checkText.includes('database') ||
    checkText.includes('stripe') ||
    checkText.includes('github')
  ) {
    return {
      severity: 'Critical',
      secretType: description || ruleId || 'High-Risk Secret'
    };
  }

  if (
    checkText.includes('token') ||
    checkText.includes('openai') ||
    checkText.includes('slack') ||
    checkText.includes('jwt') ||
    checkText.includes('api_key') ||
    checkText.includes('apikey')
  ) {
    return {
      severity: 'High',
      secretType: description || ruleId || 'API Key or Token'
    };
  }

  return {
    severity: 'Medium',
    secretType: description || ruleId || 'Generic Sensitive String'
  };
}

module.exports = {
  getRuleMetadata,
  SEVERITY_MAP
};
