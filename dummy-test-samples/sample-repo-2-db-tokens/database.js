// ==============================================================================
// ⚠️ DEMO / TEST FILE ONLY - ALL VALUES BELOW ARE OBVIOUSLY FAKE / DUMMY STRINGS
// DO NOT USE IN PRODUCTION. CREATED SOLELY FOR SCANNER DETECTION DEMONSTRATION.
// ==============================================================================

// FAKE PostgreSQL Database Connection String
const DATABASE_URL = "postgres://db_master_admin:FakeDemoPassword99812!@db.internal.cluster:5432/production_analytics";

// FAKE GitHub Personal Access Token (PAT)
const GITHUB_ACCESS_TOKEN = "ghp_TEST_MOCK_PAT_FOR_SCANNER_DEMO_PURPOSES";

// FAKE Slack Incoming Webhook
const SLACK_ALERT_WEBHOOK = "https://hooks.slack.com/services/T01234567/B01234567/FakeSlackTokenForTesting00";

function connect() {
  console.log("Connecting with mock config:", { DATABASE_URL });
}

module.exports = {
  DATABASE_URL,
  GITHUB_ACCESS_TOKEN,
  SLACK_ALERT_WEBHOOK,
  connect
};
