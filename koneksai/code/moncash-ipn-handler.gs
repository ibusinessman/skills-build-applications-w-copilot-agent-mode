/**
 * KoneksAI — MonCash IPN Handler
 * Deployed as a Google Apps Script Web App.
 *
 * Deployment settings:
 *   Execute as: Me (the script owner)
 *   Who has access: Anyone (MonCash servers must reach this URL)
 *
 * Environment:
 *   Set script properties via File > Project Settings > Script Properties:
 *   - N8N_FULFILLMENT_WEBHOOK_URL : Full n8n webhook URL for fulfillment trigger
 *   - MONCASH_SHARED_SECRET       : Shared secret for HMAC-SHA256 verification
 *   - GOOGLE_SHEET_ID             : ID of the KoneksAI master Google Sheet
 *   - FOUNDER_EMAIL               : Founder email for critical alerts
 *   - SETUP_GUIDE_DRIVE_URL       : Google Drive shareable URL for onboarding PDF
 */

// ============================================================
// CONSTANTS
// ============================================================

var SHEET_NAMES = {
  PAYMENTS: 'Payments',
  CLIENTS: 'Clients',
  LEADS: 'Leads',
  ERROR_LOG: 'ErrorLog',
  ALERTS: 'Alerts'
};

var PAYMENT_HEADERS = [
  'transaction_id', 'timestamp', 'client_phone', 'client_name',
  'amount_htg', 'amount_usd', 'package', 'status'
];

var ERROR_LOG_HEADERS = [
  'timestamp', 'source', 'error_type', 'error_message', 'raw_payload'
];

var HTG_TO_USD_RATE = 154; // Update periodically or fetch from exchange API

// ============================================================
// HMAC SIGNATURE VERIFICATION
// ============================================================

/**
 * Verifies the MonCash IPN HMAC-SHA256 signature.
 *
 * HOW TO FILL IN:
 * 1. Obtain your shared secret from the MonCash developer portal
 *    (Settings > Webhooks > Secret Key).
 * 2. Store it as a Script Property named MONCASH_SHARED_SECRET.
 * 3. MonCash sends the signature in the X-MonCash-Signature header
 *    formatted as: sha256=<hex_digest>
 * 4. The signature is computed over the raw request body string
 *    using HMAC-SHA256 with your shared secret.
 *
 * @param {string} rawBody - The raw request body string.
 * @param {string} receivedSignature - The signature from the X-MonCash-Signature header.
 * @returns {boolean} True if signature is valid, false otherwise.
 */
function verifyHmacSignature(rawBody, receivedSignature) {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('MONCASH_SHARED_SECRET');

  // If no secret is configured, log a warning but allow through (development mode).
  // In production, remove this bypass and return false if secret is missing.
  if (!secret) {
    Logger.log('WARNING: MONCASH_SHARED_SECRET not configured. Skipping signature verification.');
    return true; // REMOVE THIS LINE IN PRODUCTION
  }

  if (!receivedSignature) {
    Logger.log('No signature header received from MonCash.');
    return false;
  }

  try {
    // Compute HMAC-SHA256 using Google Apps Script's Utilities.computeHmacSha256Signature
    // Returns a byte array that must be converted to hex
    var computedBytes = Utilities.computeHmacSha256Signature(rawBody, secret);
    var computedHex = computedBytes.map(function(byte) {
      var hex = (byte & 0xFF).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    var expectedSignature = 'sha256=' + computedHex;

    // Constant-time comparison to prevent timing attacks
    // GAS doesn't have a built-in for this; we compare lengths first then all chars
    if (receivedSignature.length !== expectedSignature.length) {
      return false;
    }

    var diff = 0;
    for (var i = 0; i < receivedSignature.length; i++) {
      diff |= receivedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return diff === 0;
  } catch (e) {
    Logger.log('HMAC verification error: ' + e.toString());
    return false;
  }
}

// ============================================================
// MAIN IPN HANDLER — doPost
// ============================================================

/**
 * Handles POST requests from MonCash IPN.
 * This is the main entry point for payment notifications.
 */
function doPost(e) {
  var response = {
    status: 'error',
    message: 'Unknown error'
  };

  try {
    // ---- 1. Parse raw body ----
    var rawBody = e.postData && e.postData.contents ? e.postData.contents : '';

    if (!rawBody) {
      logError('doPost', 'empty_body', 'No POST body received', '');
      response.message = 'Empty request body';
      return buildJsonResponse(400, response);
    }

    // ---- 2. Verify HMAC signature ----
    // MonCash sends signature in the X-MonCash-Signature header
    // In Apps Script, request headers are available via e.parameter (not directly)
    // For Web Apps, custom headers may not be accessible; check e.headers if available
    var signature = '';
    if (e.headers) {
      signature = e.headers['X-MonCash-Signature'] || e.headers['x-moncash-signature'] || '';
    }

    var isValidSignature = verifyHmacSignature(rawBody, signature);
    if (!isValidSignature) {
      logError('doPost', 'invalid_signature', 'HMAC signature verification failed', rawBody.substring(0, 200));
      response.message = 'Invalid signature';
      return buildJsonResponse(401, response);
    }

    // ---- 3. Parse JSON payload ----
    var payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      logError('doPost', 'json_parse_error', 'Failed to parse JSON: ' + parseError.toString(), rawBody.substring(0, 500));
      response.message = 'Invalid JSON payload';
      return buildJsonResponse(400, response);
    }

    // ---- 4. Validate required fields ----
    var validationResult = validatePayload(payload);
    if (!validationResult.valid) {
      logError('doPost', 'validation_error', validationResult.errors.join('; '), JSON.stringify(payload).substring(0, 500));
      response.message = 'Validation failed: ' + validationResult.errors.join('; ');
      return buildJsonResponse(400, response);
    }

    // ---- 5. Check for duplicate transaction_id (idempotency) ----
    if (isDuplicateTransaction(payload.transaction_id)) {
      Logger.log('Duplicate IPN received for transaction_id: ' + payload.transaction_id + '. Ignoring.');
      response.status = 'duplicate';
      response.message = 'Transaction already processed';
      return buildJsonResponse(200, response);
    }

    // ---- 6. If status === "success": log payment and trigger fulfillment ----
    if (payload.status === 'success') {
      appendPaymentToSheet(payload);
      triggerFulfillment(payload);
      response.status = 'success';
      response.message = 'Payment logged and fulfillment triggered';
    } else {
      // Log non-success payments for audit purposes
      appendPaymentToSheet(payload);
      response.status = 'received';
      response.message = 'Payment logged with status: ' + payload.status;
    }

    Logger.log('IPN processed successfully: ' + payload.transaction_id + ' status=' + payload.status);
    return buildJsonResponse(200, response);

  } catch (globalError) {
    var errorMsg = globalError.toString();
    Logger.log('CRITICAL ERROR in doPost: ' + errorMsg);
    logError('doPost', 'unhandled_exception', errorMsg, '');
    sendCriticalAlert('MonCash IPN doPost critical error: ' + errorMsg);
    response.message = 'Internal server error';
    return buildJsonResponse(500, response);
  }
}

// ============================================================
// HEALTH CHECK — doGet
// ============================================================

/**
 * Handles GET requests. Used as a health check endpoint.
 * Access: GET {Web App URL}
 */
function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var hasSecret = !!props.getProperty('MONCASH_SHARED_SECRET');
  var hasWebhook = !!props.getProperty('N8N_FULFILLMENT_WEBHOOK_URL');
  var hasSheetId = !!props.getProperty('GOOGLE_SHEET_ID');

  var health = {
    status: 'ok',
    service: 'KoneksAI MonCash IPN Handler',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    configuration: {
      moncash_secret_configured: hasSecret,
      n8n_webhook_configured: hasWebhook,
      sheet_id_configured: hasSheetId
    }
  };

  var allConfigured = hasSecret && hasWebhook && hasSheetId;
  if (!allConfigured) {
    health.status = 'degraded';
    health.warning = 'One or more required Script Properties are not configured.';
  }

  return buildJsonResponse(200, health);
}

// ============================================================
// PAYLOAD VALIDATION
// ============================================================

/**
 * Validates the required fields of a MonCash IPN payload.
 * @param {Object} payload - Parsed JSON payload.
 * @returns {{valid: boolean, errors: string[]}}
 */
function validatePayload(payload) {
  var errors = [];

  // transaction_id: required, non-empty string
  if (!payload.transaction_id || typeof payload.transaction_id !== 'string' || payload.transaction_id.trim() === '') {
    errors.push('Missing or invalid transaction_id');
  }

  // amount: required, positive number
  if (payload.amount === undefined || payload.amount === null || isNaN(payload.amount) || payload.amount <= 0) {
    errors.push('Missing or invalid amount (must be positive number in HTG)');
  }

  // status: required, valid enum
  var validStatuses = ['success', 'failed', 'pending', 'cancelled', 'refunded'];
  if (!payload.status || !validStatuses.includes(payload.status)) {
    errors.push('Missing or invalid status. Must be one of: ' + validStatuses.join(', '));
  }

  // customer_phone: required, E.164 format
  if (!payload.customer_phone || typeof payload.customer_phone !== 'string') {
    errors.push('Missing customer_phone');
  } else {
    var phoneRegex = /^\+[1-9]\d{7,14}$/;
    if (!phoneRegex.test(payload.customer_phone)) {
      errors.push('customer_phone must be in E.164 format (e.g. +50941234567)');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

/**
 * Checks if a transaction_id already exists in the Payments sheet.
 * @param {string} transactionId
 * @returns {boolean}
 */
function isDuplicateTransaction(transactionId) {
  try {
    var sheet = getOrCreateSheet(SHEET_NAMES.PAYMENTS, PAYMENT_HEADERS);
    var data = sheet.getDataRange().getValues();

    // Column A (index 0) is transaction_id, skip header row
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === transactionId) {
        return true;
      }
    }
    return false;
  } catch (e) {
    Logger.log('Error checking for duplicate: ' + e.toString());
    return false; // Fail open: allow processing, log will catch true duplicates
  }
}

// ============================================================
// APPEND PAYMENT TO GOOGLE SHEETS
// ============================================================

/**
 * Appends a payment record to the Payments sheet.
 * @param {Object} payload - Validated MonCash IPN payload.
 */
function appendPaymentToSheet(payload) {
  var sheet = getOrCreateSheet(SHEET_NAMES.PAYMENTS, PAYMENT_HEADERS);

  var amountUsd = payload.amount_usd
    ? parseFloat(payload.amount_usd)
    : Math.round((payload.amount / HTG_TO_USD_RATE) * 100) / 100;

  var row = [
    payload.transaction_id,
    payload.timestamp || new Date().toISOString(),
    payload.customer_phone,
    payload.customer_name || 'Unknown',
    parseFloat(payload.amount),
    amountUsd,
    payload.package || 'starter',
    payload.status
  ];

  sheet.appendRow(row);
  Logger.log('Payment appended: ' + payload.transaction_id);
}

// ============================================================
// TRIGGER n8n FULFILLMENT WEBHOOK
// ============================================================

/**
 * Sends a POST request to the n8n fulfillment webhook with retry logic.
 * @param {Object} payload - MonCash IPN payload for a successful payment.
 */
function triggerFulfillment(payload) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('N8N_FULFILLMENT_WEBHOOK_URL');
  var setupGuideUrl = props.getProperty('SETUP_GUIDE_DRIVE_URL') || '';
  var sheetId = props.getProperty('GOOGLE_SHEET_ID');

  if (!webhookUrl) {
    logError('triggerFulfillment', 'missing_config', 'N8N_FULFILLMENT_WEBHOOK_URL not configured', '');
    sendCriticalAlert('N8N_FULFILLMENT_WEBHOOK_URL missing. Fulfillment NOT triggered for: ' + payload.transaction_id);
    return;
  }

  // Build the fulfillment_trigger schema payload
  var fulfillmentPayload = {
    fulfillment_id: 'fulfill-' + Utilities.getUuid(),
    client_phone: payload.customer_phone,
    client_name: payload.customer_name || 'Kliyan',
    lang: payload.lang || 'HT',
    package: payload.package || 'starter',
    segment: payload.segment || 'other',
    payment_transaction_id: payload.transaction_id,
    setup_guide_url: setupGuideUrl,
    triggered_at: new Date().toISOString()
  };

  var options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(fulfillmentPayload),
    muteHttpExceptions: true,
    followRedirects: true
  };

  var maxRetries = 3;
  var retryDelays = [60000, 120000, 240000]; // 1min, 2min, 4min (exponential backoff)
  var lastError = null;

  for (var attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      Logger.log('Triggering fulfillment webhook, attempt ' + attempt + '/' + maxRetries);
      var response = UrlFetchApp.fetch(webhookUrl, options);
      var responseCode = response.getResponseCode();

      if (responseCode >= 200 && responseCode < 300) {
        Logger.log('Fulfillment webhook triggered successfully (HTTP ' + responseCode + ')');
        return; // Success
      } else {
        lastError = 'HTTP ' + responseCode + ': ' + response.getContentText().substring(0, 200);
        Logger.log('Fulfillment webhook returned error: ' + lastError);
      }
    } catch (fetchError) {
      lastError = fetchError.toString();
      Logger.log('Fulfillment webhook fetch error (attempt ' + attempt + '): ' + lastError);
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      Logger.log('Retrying in ' + (retryDelays[attempt - 1] / 1000) + ' seconds...');
      Utilities.sleep(retryDelays[attempt - 1]);
    }
  }

  // All retries exhausted
  var finalError = 'Fulfillment webhook failed after ' + maxRetries + ' attempts. Last error: ' + lastError;
  logError('triggerFulfillment', 'webhook_failure', finalError, JSON.stringify(fulfillmentPayload));
  sendCriticalAlert(finalError + '\n\nTransaction: ' + payload.transaction_id + '\nClient: ' + payload.customer_phone);
}

// ============================================================
// ERROR LOGGING
// ============================================================

/**
 * Appends an error record to the ErrorLog sheet.
 * @param {string} source - Function name where error occurred.
 * @param {string} errorType - Short error type identifier.
 * @param {string} errorMessage - Full error message.
 * @param {string} rawPayload - Raw payload (truncated to 500 chars).
 */
function logError(source, errorType, errorMessage, rawPayload) {
  try {
    var sheet = getOrCreateSheet(SHEET_NAMES.ERROR_LOG, ERROR_LOG_HEADERS);
    sheet.appendRow([
      new Date().toISOString(),
      source,
      errorType,
      errorMessage.substring(0, 1000),
      (rawPayload || '').substring(0, 500)
    ]);
  } catch (e) {
    // Last resort: just log to Apps Script logger
    Logger.log('FAILED TO LOG ERROR: ' + e.toString());
    Logger.log('Original error: ' + source + ' | ' + errorType + ' | ' + errorMessage);
  }
}

// ============================================================
// CRITICAL ALERT (EMAIL)
// ============================================================

/**
 * Sends a critical alert email to the founder.
 * @param {string} message - Alert message body.
 */
function sendCriticalAlert(message) {
  try {
    var props = PropertiesService.getScriptProperties();
    var founderEmail = props.getProperty('FOUNDER_EMAIL');

    if (!founderEmail) {
      Logger.log('FOUNDER_EMAIL not configured. Cannot send alert: ' + message);
      return;
    }

    GmailApp.sendEmail(
      founderEmail,
      '🚨 KoneksAI IPN CRITICAL ALERT — ' + new Date().toLocaleString(),
      message,
      {
        replyTo: founderEmail,
        name: 'KoneksAI System Alert'
      }
    );
    Logger.log('Critical alert email sent to: ' + founderEmail);
  } catch (e) {
    Logger.log('Failed to send critical alert email: ' + e.toString());
  }
}

// ============================================================
// SHEET HELPERS
// ============================================================

/**
 * Gets or creates a sheet tab with the given name and sets headers if new.
 * @param {string} sheetName - Name of the sheet tab.
 * @param {string[]} headers - Array of header strings for the first row.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(sheetName, headers) {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('GOOGLE_SHEET_ID');

  var spreadsheet;
  if (sheetId) {
    spreadsheet = SpreadsheetApp.openById(sheetId);
  } else {
    // Fall back to the active spreadsheet if bound
    spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  }

  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Set headers in row 1
    if (headers && headers.length > 0) {
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a1a2e');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    Logger.log('Created new sheet tab: ' + sheetName);
  }

  return sheet;
}

/**
 * Builds a JSON ContentService response with the given HTTP code and data.
 * @param {number} httpCode - HTTP status code.
 * @param {Object} data - Response data object.
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function buildJsonResponse(httpCode, data) {
  // Apps Script Web Apps always return 200; we embed the code in the body
  // for client-side interpretation. The real HTTP code is set via the
  // HtmlService/ContentService, which only supports 200 for Web Apps.
  data._http_code = httpCode;
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SETUP HELPER — setupSheets()
// ============================================================

/**
 * Creates all required sheet tabs with proper headers if they don't exist.
 * Run this once manually after deploying to set up the spreadsheet.
 * Run via the Apps Script editor: Run > setupSheets
 */
function setupSheets() {
  Logger.log('Setting up KoneksAI sheet tabs...');

  var allSheets = [
    {
      name: SHEET_NAMES.PAYMENTS,
      headers: PAYMENT_HEADERS
    },
    {
      name: SHEET_NAMES.ERROR_LOG,
      headers: ERROR_LOG_HEADERS
    },
    {
      name: 'Leads',
      headers: ['lead_id', 'timestamp', 'name', 'phone', 'lang', 'source', 'segment', 'stage', 'ad_campaign_id', 'last_contact_date', 'notes']
    },
    {
      name: 'Clients',
      headers: ['client_id', 'onboard_date', 'name', 'phone', 'lang', 'segment', 'package', 'monthly_revenue_htg', 'status', 'referral_code', 'referred_by', 'notes']
    },
    {
      name: 'Analytics',
      headers: ['date', 'new_leads', 'new_clients', 'total_revenue_usd', 'cac_usd', 'ltv_usd', 'churn_rate']
    },
    {
      name: 'Content_Calendar',
      headers: ['post_date', 'platform', 'content_type', 'caption_text', 'status', 'campaign_id']
    },
    {
      name: SHEET_NAMES.ALERTS,
      headers: ['date', 'campaign_id', 'cac_usd', 'threshold_usd', 'new_clients', 'ad_spend_usd', 'action_required', 'flagged_at']
    }
  ];

  allSheets.forEach(function(sheetDef) {
    getOrCreateSheet(sheetDef.name, sheetDef.headers);
    Logger.log('OK: ' + sheetDef.name);
  });

  Logger.log('All sheet tabs configured successfully.');
  SpreadsheetApp.flush();
}

// ============================================================
// MANUAL TEST FUNCTION
// ============================================================

/**
 * Simulates a MonCash IPN call for testing in the Apps Script editor.
 * Run via Run > testIpnHandler
 */
function testIpnHandler() {
  var testPayload = {
    transaction_id: 'TEST-' + Date.now(),
    order_id: 'KONEKS-TEST-0001',
    amount: 15000,
    amount_usd: 97.40,
    currency: 'HTG',
    status: 'success',
    customer_phone: '+50941234567',
    customer_name: 'Marie Joseph (TEST)',
    package: 'growth',
    segment: 'restaurant',
    lang: 'HT',
    timestamp: new Date().toISOString(),
    moncash_reference: 'REF-TEST-001'
  };

  var mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload),
      type: 'application/json'
    },
    headers: {}
  };

  var result = doPost(mockEvent);
  Logger.log('Test result: ' + result.getContent());
}
