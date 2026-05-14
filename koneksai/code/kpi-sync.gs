/**
 * KoneksAI — Daily KPI Sync & Reporting
 * Google Apps Script
 *
 * Script Properties required (File > Project Settings > Script Properties):
 *   GOOGLE_SHEET_ID     : Master KoneksAI spreadsheet ID
 *   FOUNDER_EMAIL       : Founder email address for daily report
 *   FOUNDER_PHONE       : Founder WhatsApp E.164 (for alert routing via n8n)
 *   N8N_KPI_ALERT_URL   : n8n webhook URL to trigger CAC alert via WhatsApp
 *   META_AD_SPEND_TODAY : Optional override; if not set, uses last Analytics row
 *   CAC_THRESHOLD_USD   : Alert threshold (default: 20)
 *
 * How to deploy:
 *   1. Paste this file into Apps Script editor (script.google.com)
 *   2. Run setupSheets() to initialize tab structure
 *   3. Run createTimeDrivenTrigger() once to schedule daily 7AM execution
 *   4. Use the custom "KoneksAI" menu in the linked Sheet for manual runs
 */

// ============================================================
// CONFIG
// ============================================================

var CONFIG = {
  HAITI_TZ_OFFSET_HOURS: -5,     // Haiti is UTC-5 (no DST)
  HTG_TO_USD_RATE: 154,           // HTG per USD (update monthly)
  CAC_THRESHOLD_USD: 20,          // Alert if CAC exceeds this
  LTV_MULTIPLIER: 12,             // avg_monthly * 12 for annual LTV estimate
  TRIGGER_HOUR: 7,                // 7AM Haiti time
  TRIGGER_MINUTE: 0
};

var SHEET_NAMES = {
  LEADS: 'Leads',
  PAYMENTS: 'Payments',
  CLIENTS: 'Clients',
  ANALYTICS: 'Analytics',
  ALERTS: 'Alerts',
  ERROR_LOG: 'ErrorLog',
  CONTENT_CALENDAR: 'Content_Calendar'
};

// ============================================================
// CUSTOM MENU — onOpen
// ============================================================

/**
 * Adds the "KoneksAI" custom menu to the Google Sheets toolbar.
 * Runs automatically when the spreadsheet is opened.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🇭🇹 KoneksAI')
    .addItem('▶ Run Daily KPI Sync', 'dailyKpiSync')
    .addItem('📧 Send Daily Report', 'sendDailyReport')
    .addItem('🚩 Flag Underperforming Campaigns', 'flagUnderperformingCampaigns')
    .addSeparator()
    .addItem('⚙️ Setup Sheets', 'setupSheets')
    .addItem('🕐 Create Daily Trigger (7AM)', 'createTimeDrivenTrigger')
    .addItem('🗑 Delete All Triggers', 'deleteAllTriggers')
    .addSeparator()
    .addItem('🧪 Test: Run Full Sync + Report', 'runFullSyncTest')
    .addToUi();
}

// ============================================================
// MAIN DAILY KPI SYNC
// ============================================================

/**
 * Reads Leads, Payments, and Clients sheets.
 * Calculates all KPIs and writes a new row to the Analytics sheet.
 * Sends alert to n8n if CAC > threshold.
 * Called by time-driven trigger and the custom menu.
 */
function dailyKpiSync() {
  Logger.log('=== KoneksAI dailyKpiSync started ===');

  try {
    var ss = getSpreadsheet();
    var now = new Date();
    var haitiDate = getHaitiDateString(now);

    // ---- Read raw data from sheets ----
    var leadsData = getSheetData(ss, SHEET_NAMES.LEADS);
    var paymentsData = getSheetData(ss, SHEET_NAMES.PAYMENTS);
    var clientsData = getSheetData(ss, SHEET_NAMES.CLIENTS);
    var analyticsData = getSheetData(ss, SHEET_NAMES.ANALYTICS);

    Logger.log('Data read: leads=' + leadsData.length + ' payments=' + paymentsData.length + ' clients=' + clientsData.length);

    // ---- Calculate date boundaries ----
    var todayStr = haitiDate;
    var monthStr = todayStr.substring(0, 7); // YYYY-MM
    var thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ---- LEADS metrics ----
    var newLeadsToday = leadsData.filter(function(r) {
      return r.timestamp && String(r.timestamp).indexOf(todayStr) === 0;
    }).length;

    var totalLeads = leadsData.length;
    var soldLeads = leadsData.filter(function(r) { return r.stage === 'sold'; }).length;

    // ---- PAYMENTS metrics ----
    var paymentsToday = paymentsData.filter(function(r) {
      return r.status === 'success' && r.timestamp && String(r.timestamp).indexOf(todayStr) === 0;
    });

    var paymentsThisMonth = paymentsData.filter(function(r) {
      return r.status === 'success' && r.timestamp && String(r.timestamp).indexOf(monthStr) === 0;
    });

    var allSuccessPayments = paymentsData.filter(function(r) { return r.status === 'success'; });

    var newClientsToday = paymentsToday.length;
    var newClientsThisMonth = paymentsThisMonth.length;

    var totalRevenueToday_HTG = paymentsToday.reduce(function(sum, r) {
      return sum + (parseFloat(r.amount_htg) || 0);
    }, 0);

    var totalRevenueToday_USD = paymentsToday.reduce(function(sum, r) {
      var usd = parseFloat(r.amount_usd) || ((parseFloat(r.amount_htg) || 0) / CONFIG.HTG_TO_USD_RATE);
      return sum + usd;
    }, 0);

    var totalRevenueAllTime_USD = allSuccessPayments.reduce(function(sum, r) {
      var usd = parseFloat(r.amount_usd) || ((parseFloat(r.amount_htg) || 0) / CONFIG.HTG_TO_USD_RATE);
      return sum + usd;
    }, 0);

    // ---- CLIENTS metrics ----
    var activeStatuses = ['active', 'active_30d', 'active_60d', 'onboarding'];
    var activeClients = clientsData.filter(function(r) {
      return activeStatuses.indexOf(r.status) !== -1;
    });

    var churnedClients = clientsData.filter(function(r) { return r.status === 'churned'; });

    // Clients who existed at start of current month (for churn denominator)
    var startOfMonth = new Date(todayStr.substring(0, 8) + '01');
    var clientsAtStartOfMonth = clientsData.filter(function(r) {
      return r.onboard_date && new Date(r.onboard_date) < startOfMonth;
    }).length;

    // Churned this month (heuristic: look for month string in notes)
    var churnedThisMonth = churnedClients.filter(function(r) {
      return r.notes && String(r.notes).indexOf(monthStr) !== -1;
    }).length;

    // Average monthly revenue per active client
    var avgMonthlyRevenue_USD = 0;
    if (activeClients.length > 0) {
      var totalMonthlyHTG = activeClients.reduce(function(sum, r) {
        return sum + (parseFloat(r.monthly_revenue_htg) || 0);
      }, 0);
      avgMonthlyRevenue_USD = (totalMonthlyHTG / CONFIG.HTG_TO_USD_RATE) / activeClients.length;
    }

    // ---- KPI CALCULATIONS ----

    // Ad spend: from Script Properties or last Analytics row
    var props = PropertiesService.getScriptProperties();
    var adSpendToday_USD = parseFloat(props.getProperty('META_AD_SPEND_TODAY') || 0);
    if (!adSpendToday_USD && analyticsData.length > 0) {
      var lastRow = analyticsData[analyticsData.length - 1];
      adSpendToday_USD = parseFloat(lastRow.total_ad_spend_usd) || 0;
    }

    // CAC = total ad spend / new clients today
    var cac_usd = newClientsToday > 0
      ? Math.round((adSpendToday_USD / newClientsToday) * 100) / 100
      : null;

    // LTV = avg monthly revenue (USD) * 12
    var ltv_usd = Math.round(avgMonthlyRevenue_USD * CONFIG.LTV_MULTIPLIER * 100) / 100;

    // Churn rate = churned this month / clients at start of month
    var churn_rate = clientsAtStartOfMonth > 0
      ? Math.round((churnedThisMonth / clientsAtStartOfMonth) * 10000) / 10000
      : 0;

    // Conversion rate = sold leads / total leads
    var conversion_rate = totalLeads > 0
      ? Math.round((soldLeads / totalLeads) * 10000) / 10000
      : 0;

    // ---- CAC ALERT CHECK ----
    var cacThreshold = parseFloat(props.getProperty('CAC_THRESHOLD_USD') || CONFIG.CAC_THRESHOLD_USD);
    var alert_cac_exceeded = cac_usd !== null && cac_usd > cacThreshold;

    // ---- BUILD KPI OBJECT ----
    var kpi = {
      date: todayStr,
      new_leads_today: newLeadsToday,
      new_clients_today: newClientsToday,
      new_clients_this_month: newClientsThisMonth,
      total_revenue_today_htg: Math.round(totalRevenueToday_HTG * 100) / 100,
      total_revenue_today_usd: Math.round(totalRevenueToday_USD * 100) / 100,
      total_revenue_all_time_usd: Math.round(totalRevenueAllTime_USD * 100) / 100,
      total_ad_spend_usd: Math.round(adSpendToday_USD * 100) / 100,
      cac_usd: cac_usd,
      ltv_usd: ltv_usd,
      churn_rate: churn_rate,
      conversion_rate: conversion_rate,
      active_clients_total: activeClients.length,
      total_leads: totalLeads,
      alert_cac_exceeded: alert_cac_exceeded,
      avg_monthly_revenue_usd: Math.round(avgMonthlyRevenue_USD * 100) / 100,
      synced_at: now.toISOString()
    };

    Logger.log('KPI calculated: ' + JSON.stringify(kpi));

    // ---- WRITE TO ANALYTICS SHEET ----
    writeAnalyticsRow(ss, kpi);

    // ---- TRIGGER CAC ALERT IF NEEDED ----
    if (alert_cac_exceeded) {
      sendCacAlert(kpi, cacThreshold);
    }

    // ---- STORE KPI IN CACHE FOR sendDailyReport() ----
    CacheService.getScriptCache().put(
      'last_kpi_' + todayStr,
      JSON.stringify(kpi),
      21600 // 6 hours TTL
    );

    Logger.log('=== dailyKpiSync completed successfully ===');
    return kpi;

  } catch (e) {
    var errorMsg = 'dailyKpiSync error: ' + e.toString();
    Logger.log(errorMsg);
    logError(SHEET_NAMES.ERROR_LOG, 'dailyKpiSync', 'runtime_error', errorMsg);
    sendAlertEmail('KoneksAI KPI Sync Error', errorMsg);
    throw e;
  }
}

// ============================================================
// SEND DAILY REPORT
// ============================================================

/**
 * Reads the latest KPI data (from cache or Analytics sheet) and sends
 * a formatted HTML email report to the founder.
 * Can be called independently from the custom menu.
 */
function sendDailyReport() {
  Logger.log('=== sendDailyReport started ===');

  try {
    var props = PropertiesService.getScriptProperties();
    var founderEmail = props.getProperty('FOUNDER_EMAIL');

    if (!founderEmail) {
      throw new Error('FOUNDER_EMAIL Script Property not configured.');
    }

    // Try to get KPI from cache first
    var todayStr = getHaitiDateString(new Date());
    var cached = CacheService.getScriptCache().get('last_kpi_' + todayStr);
    var kpi;

    if (cached) {
      kpi = JSON.parse(cached);
      Logger.log('Using cached KPI data for ' + todayStr);
    } else {
      // Fall back to running the sync to get fresh data
      Logger.log('No cached KPI found, running dailyKpiSync...');
      kpi = dailyKpiSync();
    }

    var html = buildReportHtml(kpi);
    var subject = buildEmailSubject(kpi);

    GmailApp.sendEmail(founderEmail, subject, stripHtml(html), {
      htmlBody: html,
      name: 'KoneksAI Analytics',
      replyTo: founderEmail
    });

    Logger.log('Daily report sent to: ' + founderEmail);

  } catch (e) {
    var errorMsg = 'sendDailyReport error: ' + e.toString();
    Logger.log(errorMsg);
    logError(SHEET_NAMES.ERROR_LOG, 'sendDailyReport', 'send_error', errorMsg);
  }
}

// ============================================================
// FLAG UNDERPERFORMING CAMPAIGNS
// ============================================================

/**
 * Checks if current CAC exceeds the threshold and appends alert rows
 * to the Alerts sheet for each flagged campaign.
 * In production, extend this to loop through Meta Ads campaign IDs.
 */
function flagUnderperformingCampaigns() {
  Logger.log('=== flagUnderperformingCampaigns started ===');

  try {
    var props = PropertiesService.getScriptProperties();
    var cacThreshold = parseFloat(props.getProperty('CAC_THRESHOLD_USD') || CONFIG.CAC_THRESHOLD_USD);

    var ss = getSpreadsheet();
    var analyticsData = getSheetData(ss, SHEET_NAMES.ANALYTICS);

    if (analyticsData.length === 0) {
      Logger.log('No analytics data found. Skipping campaign flag check.');
      return;
    }

    // Get the most recent analytics row
    var latest = analyticsData[analyticsData.length - 1];
    var cacUsd = parseFloat(latest.cac_usd);
    var date = latest.date;

    var flagged = [];

    if (!isNaN(cacUsd) && cacUsd > cacThreshold) {
      // Account-level flag
      flagged.push({
        date: date,
        campaign_id: 'ACCOUNT_LEVEL',
        cac_usd: cacUsd,
        threshold_usd: cacThreshold,
        new_clients: parseInt(latest.new_clients) || 0,
        ad_spend_usd: parseFloat(latest.total_ad_spend_usd) || 0,
        action_required: 'Review Meta Ads targeting, creative assets, and landing page CVR',
        flagged_at: new Date().toISOString()
      });

      Logger.log('Account-level CAC flag: $' + cacUsd + ' > threshold $' + cacThreshold);
    }

    // Write flags to Alerts sheet
    if (flagged.length > 0) {
      var alertsSheet = getOrCreateSheetInSS(ss, SHEET_NAMES.ALERTS, [
        'date', 'campaign_id', 'cac_usd', 'threshold_usd', 'new_clients',
        'ad_spend_usd', 'action_required', 'flagged_at'
      ]);

      flagged.forEach(function(flag) {
        alertsSheet.appendRow([
          flag.date,
          flag.campaign_id,
          flag.cac_usd,
          flag.threshold_usd,
          flag.new_clients,
          flag.ad_spend_usd,
          flag.action_required,
          flag.flagged_at
        ]);
      });

      Logger.log(flagged.length + ' campaigns flagged and written to Alerts sheet.');
      SpreadsheetApp.flush();
    } else {
      Logger.log('No campaigns flagged. CAC ($' + cacUsd + ') is within threshold ($' + cacThreshold + ').');
    }

    return flagged;

  } catch (e) {
    var errorMsg = 'flagUnderperformingCampaigns error: ' + e.toString();
    Logger.log(errorMsg);
    logError(SHEET_NAMES.ERROR_LOG, 'flagUnderperformingCampaigns', 'runtime_error', errorMsg);
  }
}

// ============================================================
// HTML EMAIL BUILDER
// ============================================================

function buildReportHtml(kpi) {
  var cacDisplay = kpi.cac_usd !== null ? '$' + kpi.cac_usd : 'N/A';
  var cacColor = kpi.alert_cac_exceeded ? '#e74c3c' : '#27ae60';
  var churnPct = (kpi.churn_rate * 100).toFixed(1);
  var convPct = (kpi.conversion_rate * 100).toFixed(1);
  var revenueAllTime = kpi.total_revenue_all_time_usd.toLocaleString('en-US', { maximumFractionDigits: 2 });

  var alertBanner = kpi.alert_cac_exceeded
    ? '<div style="background:#fff3cd;border:2px solid #ffc107;border-radius:8px;padding:16px;margin:16px 24px;font-family:Arial,sans-serif;">' +
      '<strong>⚠️ ALÈT CAC:</strong> Koute akizisyon kliyan an (<strong>$' + kpi.cac_usd + '</strong>) ' +
      'depase limit $' + CONFIG.CAC_THRESHOLD_USD + ' USD. Revize pèfòmans Meta Ads ou yo imedyatman.</div>'
    : '';

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>KoneksAI KPI ' + kpi.date + '</title></head>' +
    '<body style="margin:0;padding:20px;background:#f0f2f5;font-family:Arial,sans-serif;">' +
    '<div style="max-width:640px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.12);">' +

    // Header
    '<div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);color:white;padding:32px 24px;text-align:center;">' +
    '<div style="font-size:32px;margin-bottom:8px;">🇭🇹</div>' +
    '<h1 style="margin:0;font-size:26px;letter-spacing:1px;">KoneksAI</h1>' +
    '<p style="margin:6px 0 0;opacity:0.8;font-size:14px;">Rapò Jounalye — ' + kpi.date + '</p>' +
    '<p style="margin:4px 0 0;opacity:0.6;font-size:12px;">Port-au-Prince, Haiti · Jeneratik 7h chak maten</p>' +
    '</div>' +

    alertBanner +

    // KPI Grid
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:20px 16px 8px;">' +
    kpiCard('Nouvo Leads', kpi.new_leads_today, '', '#3498db') +
    kpiCard('Nouvo Kliyan', kpi.new_clients_today, '', kpi.new_clients_today > 0 ? '#27ae60' : '#7f8c8d') +
    kpiCard('CAC', cacDisplay, 'Koute Akizisyon (USD)', kpi.alert_cac_exceeded ? '#e74c3c' : '#27ae60') +
    kpiCard('LTV Estimasyon', '$' + kpi.ltv_usd, 'Valè Ane (USD)', '#9b59b6') +
    '</div>' +

    // Details table
    '<div style="padding:8px 24px 24px;">' +
    '<h2 style="color:#1a1a2e;font-size:16px;border-bottom:2px solid #3498db;padding-bottom:8px;">📊 Detay Metrik</h2>' +
    '<table style="width:100%;border-collapse:collapse;">' +
    metricRow('Revni Jodi a', '$' + kpi.total_revenue_today_usd + ' USD (' + Math.round(kpi.total_revenue_today_htg).toLocaleString() + ' HTG)') +
    metricRow('Depans Meta Ads Jodi a', '$' + kpi.total_ad_spend_usd + ' USD') +
    metricRow('To Konvèsyon (Total)', convPct + '%') +
    metricRow('To Churn Mwa Sa a', churnPct + '%') +
    metricRow('Total Kliyan Aktif', String(kpi.active_clients_total)) +
    metricRow('Mwayèn Revni Mansyèl/Kliyan', '$' + kpi.avg_monthly_revenue_usd + ' USD') +
    metricRow('Total Revni Tout Tan', '$' + revenueAllTime + ' USD') +
    metricRow('Total Leads Tout Tan', String(kpi.total_leads)) +
    metricRow('Senkronizasyon', new Date(kpi.synced_at).toLocaleString('fr-FR')) +
    '</table>' +
    '</div>' +

    // Footer
    '<div style="background:#f8f9fa;padding:16px 24px;text-align:center;color:#888;font-size:11px;">' +
    'KoneksAI · Port-au-Prince, Haiti 🇭🇹 · ' + new Date().getFullYear() + '<br>' +
    'Rapò sa a jeneratik otomat. Pa reponn imèl sa a.' +
    '</div>' +
    '</div></body></html>';
}

function kpiCard(label, value, subtitle, color) {
  return '<div style="background:#f8f9fa;border-radius:12px;padding:16px;text-align:center;border-top:4px solid ' + color + ';">' +
    '<div style="font-size:30px;font-weight:bold;color:' + color + ';">' + value + '</div>' +
    '<div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">' + label + '</div>' +
    (subtitle ? '<div style="font-size:10px;color:#888;margin-top:2px;">' + subtitle + '</div>' : '') +
    '</div>';
}

function metricRow(name, value) {
  return '<tr style="border-bottom:1px solid #eee;">' +
    '<td style="padding:10px 0;color:#555;font-size:13px;">' + name + '</td>' +
    '<td style="padding:10px 0;color:#1a1a2e;font-weight:bold;font-size:13px;text-align:right;">' + value + '</td>' +
    '</tr>';
}

function buildEmailSubject(kpi) {
  var cacStr = kpi.cac_usd !== null ? '$' + kpi.cac_usd : 'N/A';
  var alert = kpi.alert_cac_exceeded ? ' ⚠️ CAC ALÈT' : ' ✅';
  return 'KoneksAI ' + kpi.date + ': ' + kpi.new_clients_today + ' kliyan, CAC ' + cacStr + alert;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ============================================================
// CAC ALERT — sends to n8n for WhatsApp delivery
// ============================================================

function sendCacAlert(kpi, threshold) {
  try {
    var props = PropertiesService.getScriptProperties();
    var alertUrl = props.getProperty('N8N_KPI_ALERT_URL');

    if (!alertUrl) {
      Logger.log('N8N_KPI_ALERT_URL not set. Sending CAC alert via email only.');
      sendAlertEmail(
        '🚨 KoneksAI CAC Alert — $' + kpi.cac_usd,
        'CAC exceeded threshold of $' + threshold + ' USD.\n\n' +
        'CAC today: $' + kpi.cac_usd + '\n' +
        'New clients: ' + kpi.new_clients_today + '\n' +
        'Ad spend: $' + kpi.total_ad_spend_usd
      );
      return;
    }

    var payload = JSON.stringify(kpi);
    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(alertUrl, options);
    Logger.log('CAC alert sent to n8n: HTTP ' + response.getResponseCode());
  } catch (e) {
    Logger.log('Failed to send CAC alert: ' + e.toString());
    sendAlertEmail('KoneksAI CAC Alert Error', 'CAC=$' + kpi.cac_usd + ' but alert delivery failed: ' + e.toString());
  }
}

// ============================================================
// ANALYTICS SHEET WRITER
// ============================================================

function writeAnalyticsRow(ss, kpi) {
  var analyticsSheet = getOrCreateSheetInSS(ss, SHEET_NAMES.ANALYTICS, [
    'date', 'new_leads', 'new_clients', 'total_revenue_usd', 'cac_usd', 'ltv_usd', 'churn_rate'
  ]);

  analyticsSheet.appendRow([
    kpi.date,
    kpi.new_leads_today,
    kpi.new_clients_today,
    kpi.total_revenue_today_usd,
    kpi.cac_usd !== null ? kpi.cac_usd : '',
    kpi.ltv_usd,
    kpi.churn_rate
  ]);

  SpreadsheetApp.flush();
  Logger.log('Analytics row written for ' + kpi.date);
}

// ============================================================
// SHEET HELPERS
// ============================================================

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = props.getProperty('GOOGLE_SHEET_ID');

  if (sheetId) {
    return SpreadsheetApp.openById(sheetId);
  }

  // If running bound to the spreadsheet directly
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  throw new Error('GOOGLE_SHEET_ID Script Property not configured and no active spreadsheet found.');
}

/**
 * Returns sheet data as an array of objects keyed by header row values.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} sheetName
 * @returns {Object[]}
 */
function getSheetData(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName + '. Returning empty array.');
    return [];
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return []; // Only header row or empty

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    rows.push(obj);
  }

  return rows;
}

function getOrCreateSheetInSS(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a1a2e');
      headerRange.setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
    Logger.log('Created sheet: ' + sheetName);
  }
  return sheet;
}

// ============================================================
// UTILITY: HAITI DATE
// ============================================================

/**
 * Returns the current date in Haiti timezone as YYYY-MM-DD string.
 * @param {Date} date - UTC date object.
 * @returns {string}
 */
function getHaitiDateString(date) {
  var haitiMs = date.getTime() + (CONFIG.HAITI_TZ_OFFSET_HOURS * 60 * 60 * 1000);
  var haitiDate = new Date(haitiMs);
  var yyyy = haitiDate.getUTCFullYear();
  var mm = String(haitiDate.getUTCMonth() + 1).padStart(2, '0');
  var dd = String(haitiDate.getUTCDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

// ============================================================
// ERROR LOGGING
// ============================================================

function logError(sheetName, source, errorType, errorMessage) {
  try {
    var ss = getSpreadsheet();
    var sheet = getOrCreateSheetInSS(ss, sheetName, [
      'timestamp', 'source', 'error_type', 'error_message', 'raw_payload'
    ]);
    sheet.appendRow([
      new Date().toISOString(),
      source,
      errorType,
      String(errorMessage).substring(0, 1000),
      ''
    ]);
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log('Failed to write error log: ' + e.toString());
  }
}

function sendAlertEmail(subject, body) {
  try {
    var props = PropertiesService.getScriptProperties();
    var founderEmail = props.getProperty('FOUNDER_EMAIL');
    if (founderEmail) {
      GmailApp.sendEmail(founderEmail, '🚨 ' + subject, body, { name: 'KoneksAI System' });
    }
  } catch (e) {
    Logger.log('Failed to send alert email: ' + e.toString());
  }
}

// ============================================================
// SETUP — setupSheets
// ============================================================

/**
 * Creates all required sheet tabs with headers.
 * Run manually once after first deployment.
 */
function setupSheets() {
  Logger.log('Setting up KoneksAI spreadsheet tabs...');
  var ss = getSpreadsheet();

  var tabs = [
    { name: 'Leads', headers: ['lead_id', 'timestamp', 'name', 'phone', 'lang', 'source', 'segment', 'stage', 'ad_campaign_id', 'last_contact_date', 'notes'] },
    { name: 'Payments', headers: ['transaction_id', 'timestamp', 'client_phone', 'client_name', 'amount_htg', 'amount_usd', 'package', 'status'] },
    { name: 'Clients', headers: ['client_id', 'onboard_date', 'name', 'phone', 'lang', 'segment', 'package', 'monthly_revenue_htg', 'status', 'referral_code', 'referred_by', 'notes'] },
    { name: 'Analytics', headers: ['date', 'new_leads', 'new_clients', 'total_revenue_usd', 'cac_usd', 'ltv_usd', 'churn_rate'] },
    { name: 'Content_Calendar', headers: ['post_date', 'platform', 'content_type', 'caption_text', 'status', 'campaign_id'] },
    { name: 'ErrorLog', headers: ['timestamp', 'source', 'error_type', 'error_message', 'raw_payload'] },
    { name: 'Alerts', headers: ['date', 'campaign_id', 'cac_usd', 'threshold_usd', 'new_clients', 'ad_spend_usd', 'action_required', 'flagged_at'] }
  ];

  tabs.forEach(function(tab) {
    getOrCreateSheetInSS(ss, tab.name, tab.headers);
    Logger.log('Tab ready: ' + tab.name);
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ All KoneksAI sheet tabs have been configured.');
  Logger.log('setupSheets complete.');
}

// ============================================================
// TIME-DRIVEN TRIGGER MANAGEMENT
// ============================================================

/**
 * Creates a time-driven trigger to run dailyKpiSync() every day at 7AM Haiti time.
 * Apps Script timezone must match: set it to America/Port-au-Prince in Project Settings.
 *
 * Run this function once from the Apps Script editor to schedule daily execution.
 * Run > createTimeDrivenTrigger
 */
function createTimeDrivenTrigger() {
  // Delete existing triggers for dailyKpiSync to avoid duplicates
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'dailyKpiSync') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('Deleted existing dailyKpiSync trigger.');
    }
  });

  // Create new daily trigger at 7AM (Apps Script uses local project timezone)
  // Set timezone to America/Port-au-Prince in Project Settings before running
  ScriptApp.newTrigger('dailyKpiSync')
    .timeBased()
    .atHour(CONFIG.TRIGGER_HOUR)
    .nearMinute(CONFIG.TRIGGER_MINUTE)
    .everyDays(1)
    .create();

  Logger.log('Daily trigger created: dailyKpiSync runs every day at ' + CONFIG.TRIGGER_HOUR + ':' + String(CONFIG.TRIGGER_MINUTE).padStart(2, '0'));

  // Also create a trigger for sendDailyReport 15 minutes later
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .atHour(CONFIG.TRIGGER_HOUR)
    .nearMinute(15)
    .everyDays(1)
    .create();

  Logger.log('Daily trigger created: sendDailyReport runs every day at ' + CONFIG.TRIGGER_HOUR + ':15');

  try {
    SpreadsheetApp.getUi().alert(
      '✅ Daily triggers created!\n\n' +
      '• dailyKpiSync: every day at 7:00 AM\n' +
      '• sendDailyReport: every day at 7:15 AM\n\n' +
      'Make sure Project Settings timezone is set to America/Port-au-Prince.'
    );
  } catch (e) {
    // Running headlessly (not from UI)
    Logger.log('Triggers created (running headlessly).');
  }
}

/**
 * Deletes all project triggers. Use with caution.
 */
function deleteAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log('All project triggers deleted (' + triggers.length + ' total).');
}

// ============================================================
// MANUAL TEST
// ============================================================

/**
 * Run from the Apps Script editor to test the full sync + report pipeline.
 */
function runFullSyncTest() {
  Logger.log('=== FULL SYNC TEST STARTING ===');
  var kpi = dailyKpiSync();
  Logger.log('KPI result: ' + JSON.stringify(kpi));
  sendDailyReport();
  flagUnderperformingCampaigns();
  Logger.log('=== FULL SYNC TEST COMPLETE ===');
}
