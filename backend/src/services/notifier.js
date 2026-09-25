/**
 * Slack & Discord Webhook Notification Service
 *
 * Sends rich, structured alerts to Slack (Block Kit) and Discord (Embeds)
 * whenever a scan completes or a critical/high severity secret is detected.
 *
 * Required env vars (optional — notifications only fire if URLs are set):
 *   SLACK_WEBHOOK_URL     - Slack Incoming Webhook URL
 *   DISCORD_WEBHOOK_URL   - Discord Webhook URL
 *   NOTIFY_ON_CLEAN_SCANS - "true" to also notify when 0 secrets found (default: false)
 */

const NOTIFY_ON_CLEAN = process.env.NOTIFY_ON_CLEAN_SCANS === 'true';

// ─── Internal HTTP helper ─────────────────────────────────────────────────────
// Uses Node.js built-in https (no extra deps) to POST JSON payloads.

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * HTTP POST JSON to a URL.
 * @param {string} webhookUrl
 * @param {object} body
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function postJSON(webhookUrl, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(webhookUrl);
    const payload = JSON.stringify(body);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'SecretlessCode-Notifier/1.0'
      }
    };

    const lib = parsed.protocol === 'https:' ? https : http;

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.setTimeout(6000, () => { req.destroy(new Error('Notification request timed out.')); });
    req.write(payload);
    req.end();
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskSecret(secret) {
  if (!secret) return '••••••••';
  const s = secret.trim();
  if (s.length <= 8) return '••••••••';
  return s.slice(0, Math.min(6, Math.floor(s.length * 0.25))) + '••••••••';
}

function severityEmoji(sev) {
  return sev === 'Critical' ? '🔴' : sev === 'High' ? '🟠' : '🟡';
}

// ─── Slack Block Kit Payloads ─────────────────────────────────────────────────

/**
 * Builds a Slack Block Kit payload for a completed scan.
 */
function buildSlackPayload({ repo, source, summary, findings, scanDurationMs }) {
  const hasIssues = summary.total > 0;
  const headerText = hasIssues
    ? `:rotating_light: *Secret Leak Detected in \`${repo}\`*`
    : `:white_check_mark: *Secretless Code — Clean Scan: \`${repo}\`*`;

  const color = summary.critical > 0 ? '#ef4444' : summary.high > 0 ? '#f59e0b' : summary.medium > 0 ? '#06b6d4' : '#10b981';

  const summaryText = hasIssues
    ? `*${summary.total} secret(s) found* — 🔴 ${summary.critical} Critical · 🟠 ${summary.high} High · 🟡 ${summary.medium} Medium`
    : 'No secrets or credentials detected.';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: hasIssues ? '🚨 Secretless Code Alert' : '✅ Secretless Code — Clear', emoji: true }
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: headerText }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Repository:*\n\`${repo}\`` },
        { type: 'mrkdwn', text: `*Source:*\n${source}` },
        { type: 'mrkdwn', text: `*Summary:*\n${summaryText}` },
        { type: 'mrkdwn', text: `*Scan Duration:*\n${scanDurationMs ? `${scanDurationMs}ms` : 'N/A'}` }
      ]
    }
  ];

  // Add top-5 findings as a compact list
  if (hasIssues) {
    const topFindings = findings.slice(0, 5);
    const findingLines = topFindings.map(
      f => `${severityEmoji(f.severity)} \`${f.filePath}:${f.lineNumber}\` — *${f.secretType}* — \`${maskSecret(f.rawMatch)}\``
    );

    if (findings.length > 5) {
      findingLines.push(`_...and ${findings.length - 5} more finding(s)_`);
    }

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Findings:*\n${findingLines.join('\n')}`
      }
    });

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':warning: *Action Required:* Revoke exposed credentials immediately and remove them from the codebase.'
      }
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Powered by <https://github.com/zameernagaral/secretlessCode|Secretless Code> · ${new Date().toUTCString()}`
      }
    ]
  });

  return {
    username: 'Secretless Code',
    icon_emoji: ':shield:',
    attachments: [
      {
        color,
        blocks
      }
    ]
  };
}

// ─── Discord Embed Payloads ───────────────────────────────────────────────────

/**
 * Builds a Discord Webhook payload with rich embeds.
 */
function buildDiscordPayload({ repo, source, summary, findings, scanDurationMs }) {
  const hasIssues = summary.total > 0;

  const color = summary.critical > 0
    ? 0xef4444   // red
    : summary.high > 0
    ? 0xf59e0b   // amber
    : summary.medium > 0
    ? 0x06b6d4   // cyan
    : 0x10b981;  // emerald

  const title = hasIssues
    ? `🚨 ${summary.total} Secret(s) Detected — ${repo}`
    : `✅ Clean Scan — ${repo}`;

  const description = hasIssues
    ? `**${summary.total} credential leak(s) found** — action required.\n🔴 ${summary.critical} Critical · 🟠 ${summary.high} High · 🟡 ${summary.medium} Medium`
    : '**No secrets or credentials were detected** in this scan.';

  const fields = [
    { name: '📦 Repository', value: `\`${repo}\``, inline: true },
    { name: '📡 Source', value: source, inline: true },
    { name: '⏱️ Duration', value: scanDurationMs ? `${scanDurationMs}ms` : 'N/A', inline: true }
  ];

  // Top findings as fields
  if (hasIssues) {
    const topFindings = findings.slice(0, 5);
    const findingText = topFindings.map(
      f => `${severityEmoji(f.severity)} \`${f.filePath}:${f.lineNumber}\`\n**${f.secretType}** — \`${maskSecret(f.rawMatch)}\``
    ).join('\n\n');

    fields.push({
      name: `🔍 Findings (${findings.length} total)`,
      value: findingText + (findings.length > 5 ? `\n_...and ${findings.length - 5} more_` : ''),
      inline: false
    });
  }

  return {
    username: 'Secretless Code',
    avatar_url: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
    embeds: [
      {
        title,
        description,
        color,
        fields,
        footer: {
          text: 'Secretless Code · Secret Credential Scanner'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Sends a scan completion notification to all configured channels (Slack & Discord).
 * Silently skips if webhook URLs are not configured in env.
 * Never throws — notification failures must not crash the scan pipeline.
 *
 * @param {object} params
 * @param {string} params.repo          - "owner/repo" string
 * @param {string} params.source        - "Manual Scan" | "PR #<n>" | "GitHub App"
 * @param {object} params.summary       - { total, critical, high, medium }
 * @param {Array}  params.findings      - formatted findings array
 * @param {number} [params.scanDurationMs]
 */
async function sendScanNotification(params) {
  const { summary } = params;

  // Skip clean scans unless explicitly enabled
  if (summary.total === 0 && !NOTIFY_ON_CLEAN) return;

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  const discordUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!slackUrl && !discordUrl) return; // No channels configured

  const promises = [];

  if (slackUrl) {
    const slackPayload = buildSlackPayload(params);
    promises.push(
      postJSON(slackUrl, slackPayload)
        .then(r => {
          if (r.statusCode !== 200) {
            console.warn(`[Notifier] Slack returned non-200: ${r.statusCode} — ${r.body}`);
          } else {
            console.log(`[Notifier] ✅ Slack notification sent for ${params.repo}`);
          }
        })
        .catch(err => console.error('[Notifier] Slack error:', err.message))
    );
  }

  if (discordUrl) {
    const discordPayload = buildDiscordPayload(params);
    // Discord requires appending /slack or /json to the URL; standard webhooks end with /webhook
    const discordFinalUrl = discordUrl.endsWith('/slack') ? discordUrl : discordUrl;
    promises.push(
      postJSON(discordFinalUrl, discordPayload)
        .then(r => {
          // Discord returns 204 No Content on success
          if (r.statusCode !== 200 && r.statusCode !== 204) {
            console.warn(`[Notifier] Discord returned non-200/204: ${r.statusCode} — ${r.body}`);
          } else {
            console.log(`[Notifier] ✅ Discord notification sent for ${params.repo}`);
          }
        })
        .catch(err => console.error('[Notifier] Discord error:', err.message))
    );
  }

  // Fire-and-forget — await in parallel, never block the main flow
  await Promise.allSettled(promises);
}

module.exports = { sendScanNotification };
