const express = require('express');
const { validateGitHubUrl } = require('../utils/validator');
const { scanRepository } = require('../services/scanner');

const router = express.Router();

/**
 * POST /api/scan
 * Body: { repoUrl: "https://github.com/owner/repo" }
 */
router.post('/scan', async (req, res) => {
  const { repoUrl } = req.body || {};

  // 1. Strict input validation
  const validation = validateGitHubUrl(repoUrl);
  if (!validation.valid) {
    return res.status(400).json({
      status: 'error',
      errorCode: 'INVALID_URL',
      message: validation.error
    });
  }

  try {
    // 2. Perform isolated clone & scan
    const result = await scanRepository(validation.sanitizedUrl, validation.repo);

    return res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error(`[Scan Error] for ${validation.sanitizedUrl}:`, error.message);

    // Provide clean, structured error responses for the frontend
    let statusCode = 500;
    let errorCode = 'SCAN_FAILED';

    if (error.message.includes('not found or is private')) {
      statusCode = 404;
      errorCode = 'REPO_NOT_FOUND_OR_PRIVATE';
    } else if (error.message.includes('timed out')) {
      statusCode = 408;
      errorCode = 'TIMEOUT';
    } else if (error.message.includes('exceeds the maximum allowed size')) {
      statusCode = 413;
      errorCode = 'REPO_TOO_LARGE';
    }

    return res.status(statusCode).json({
      status: 'error',
      errorCode,
      message: error.message || 'An unexpected error occurred while scanning the repository.'
    });
  }
});

module.exports = router;
