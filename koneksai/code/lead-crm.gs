/**
 * KoneksAI — Lead CRM Engine
 * Google Apps Script
 *
 * This script acts as the CRM backbone for KoneksAI's WhatsApp business automation.
 * It is designed to be bound to the KoneksAI master Google Sheet.
 *
 * Script Properties required (File > Project Settings > Script Properties):
 *   GOOGLE_SHEET_ID          : Master KoneksAI spreadsheet ID
 *   WHATSAPP_ACCESS_TOKEN    : Meta WhatsApp Cloud API bearer token
 *   WHATSAPP_PHONE_NUMBER_ID : Meta WhatsApp phone number ID
 *   N8N_LEAD_WEBHOOK_URL     : n8n webhook URL for lead_capture flow
 *   FOUNDER_EMAIL            : Founder email for critical alerts
 *
 * How to use:
 *   1. Bind this script to the KoneksAI Google Sheet
 *   2. Set up a Google Form and link it to the Sheet
 *   3. Create an onFormSubmit installable trigger: Run > onFormSubmit
 *      (or via Triggers icon in the editor)
 *   4. Open the Sheet to see the KoneksAI CRM menu
 */

// ============================================================
// WHATSAPP MESSAGE TEMPLATES
// All messages use plain text (WhatsApp markdown-lite: *bold*, _italic_)
// ============================================================

var TEMPLATES = {

  // ---- INITIAL REPLY (sent within 1 minute of lead capture) ----
  initial_reply: {
    HT: function(name, segment) {
      var biz = SEGMENT_LABELS.HT[segment] || 'biznis ou an';
      return 'Bonjou ' + name + '! 👋\n\n' +
        'Mèsi pou kontakte KoneksAI. Nou espesyalize nan ede biznis tankou ' + biz + ' jwenn plis kliyan ak *WhatsApp otomatik*.\n\n' +
        '✅ Repons nan mwens pase 1 minit\n' +
        '✅ Mesaj otomatik 24/7\n' +
        '✅ Peman fasil ak MonCash\n\n' +
        'Eske ou ka ban mwen 2 minit pou m eksplike ou kijan sa travay?';
    },
    FR: function(name, segment) {
      var biz = SEGMENT_LABELS.FR[segment] || 'votre entreprise';
      return 'Bonjour ' + name + '! 👋\n\n' +
        'Merci de contacter KoneksAI. Nous aidons des entreprises comme ' + biz + ' à attirer plus de clients grâce à *l\'automatisation WhatsApp*.\n\n' +
        '✅ Réponse en moins d\'1 minute\n' +
        '✅ Messages automatiques 24h/24\n' +
        '✅ Paiement facile via MonCash\n\n' +
        'Pouvez-vous m\'accorder 2 minutes pour vous expliquer comment ça fonctionne?';
    },
    EN: function(name, segment) {
      var biz = SEGMENT_LABELS.EN[segment] || 'your business';
      return 'Hello ' + name + '! 👋\n\n' +
        'Thanks for reaching out to KoneksAI. We help businesses like ' + biz + ' get more customers through *WhatsApp automation*.\n\n' +
        '✅ Response in under 1 minute\n' +
        '✅ Automated messages 24/7\n' +
        '✅ Easy payment via MonCash\n\n' +
        'Can you spare 2 minutes for me to show you how it works?';
    }
  },

  // ---- DAY 1 FOLLOW-UP (offer details) ----
  followup_day1: {
    HT: function(name, segment) {
      var benefit = SEGMENT_BENEFITS.HT[segment] || SEGMENT_BENEFITS.HT.other;
      return name + ', tande sa... 🔥\n\n' +
        benefit + '\n\n' +
        'KoneksAI ka mete sa travay pou biznis ou an nan *48 è*.\n\n' +
        '📱 *Pakè Estàtè*: sèlman 5,000 HTG/mwa\n' +
        '📈 *Pakè Kwasans*: 10,000 HTG/mwa\n' +
        '⭐ *Pakè Pro*: 20,000 HTG/mwa\n\n' +
        'Tou nou aksepte MonCash. Ki pakè ki enterese ou?';
    },
    FR: function(name, segment) {
      var benefit = SEGMENT_BENEFITS.FR[segment] || SEGMENT_BENEFITS.FR.other;
      return name + ', écoutez ça... 🔥\n\n' +
        benefit + '\n\n' +
        'KoneksAI peut mettre cela en place pour votre entreprise en *48h*.\n\n' +
        '📱 *Pack Starter*: seulement 5,000 HTG/mois\n' +
        '📈 *Pack Croissance*: 10,000 HTG/mois\n' +
        '⭐ *Pack Pro*: 20,000 HTG/mois\n\n' +
        'Nous acceptons MonCash. Quel pack vous intéresse?';
    },
    EN: function(name, segment) {
      var benefit = SEGMENT_BENEFITS.EN[segment] || SEGMENT_BENEFITS.EN.other;
      return name + ', hear this... 🔥\n\n' +
        benefit + '\n\n' +
        'KoneksAI can set this up for your business in *48 hours*.\n\n' +
        '📱 *Starter Pack*: only 5,000 HTG/month\n' +
        '📈 *Growth Pack*: 10,000 HTG/month\n' +
        '⭐ *Pro Pack*: 20,000 HTG/month\n\n' +
        'We accept MonCash. Which package interests you?';
    }
  },

  // ---- DAY 3 FOLLOW-UP (objection handling) ----
  followup_day3: {
    HT: function(name) {
      return name + ', mwen konprann ou okipe. 😊\n\n' +
        'Men 3 rezon poukisa biznis tankou paw chwazi KoneksAI:\n\n' +
        '1️⃣ Ou pa bezwen okenn konesans teknik\n' +
        '2️⃣ Nou monte tout bagay pou ou nan 48è\n' +
        '3️⃣ Si ou pa satisfè nan 30 jou, nou remèt ou lajan ou\n\n' +
        'Tou nou fè *demo gratis 15 minit*. Eske ou disponib jodi a oswa demen?';
    },
    FR: function(name) {
      return name + ', je comprends que vous êtes occupé. 😊\n\n' +
        'Voici 3 raisons pour lesquelles des entreprises comme la vôtre choisissent KoneksAI:\n\n' +
        '1️⃣ Aucune connaissance technique requise\n' +
        '2️⃣ Nous configurons tout en 48h\n' +
        '3️⃣ Remboursement garanti sous 30 jours\n\n' +
        'Nous offrons aussi une *démo gratuite de 15 minutes*. Êtes-vous disponible aujourd\'hui ou demain?';
    },
    EN: function(name) {
      return name + ', I understand you\'re busy. 😊\n\n' +
        'Here are 3 reasons businesses like yours choose KoneksAI:\n\n' +
        '1️⃣ No technical knowledge required\n' +
        '2️⃣ We set everything up in 48 hours\n' +
        '3️⃣ 30-day money-back guarantee\n\n' +
        'We also offer a *free 15-minute demo*. Are you available today or tomorrow?';
    }
  },

  // ---- DAY 7 SOFT CLOSE ----
  followup_day7: {
    HT: function(name) {
      return name + ', dènye mesaj mwen an. 🙏\n\n' +
        'Mwen pa vle pèdi tan ou, men mwen vle asire ou ke *ofr espesyal nou an ekspire nan 48è*:\n\n' +
        '🎁 50% rabè sou premye mwa ou\n' +
        '💳 Peman MonCash fasil\n' +
        '🔒 Garanti 30 jou\n\n' +
        'Si ou pa prè pou kounye a, pa gen pwoblèm — mwen ka kontakte ou nan yon peryòd ki pi bon pou ou.\n\n' +
        'Reponn *"WI"* pou profite ofr la oswa *"PA KOUNJE"* pou mwen kontakte ou pita.';
    },
    FR: function(name) {
      return name + ', mon dernier message. 🙏\n\n' +
        'Je ne veux pas vous déranger, mais je veux m\'assurer que vous savez que *notre offre spéciale expire dans 48h*:\n\n' +
        '🎁 50% de réduction sur votre premier mois\n' +
        '💳 Paiement facile via MonCash\n' +
        '🔒 Garantie 30 jours\n\n' +
        'Si vous n\'êtes pas prêt maintenant, pas de problème — je peux vous recontacter à un meilleur moment.\n\n' +
        'Répondez *"OUI"* pour profiter de l\'offre ou *"PAS MAINTENANT"* pour que je vous recontacte plus tard.';
    },
    EN: function(name) {
      return name + ', my last message. 🙏\n\n' +
        'I don\'t want to waste your time, but I want to make sure you know *our special offer expires in 48 hours*:\n\n' +
        '🎁 50% off your first month\n' +
        '💳 Easy MonCash payment\n' +
        '🔒 30-day guarantee\n\n' +
        'If you\'re not ready now, no problem — I can reach out at a better time.\n\n' +
        'Reply *"YES"* to take the offer or *"NOT NOW"* for me to follow up later.';
    }
  },

  // ---- ONBOARDING (sent after successful payment) ----
  onboarding: {
    HT: function(name, pkg, guideUrl) {
      var pkgName = PACKAGE_NAMES.HT[pkg] || pkg;
      return '🎉 Byenveni nan fanmi KoneksAI, ' + name + '!\n\n' +
        'Peman ou konfime ✅ — *Pakè ' + pkgName + '* ou aktif kounye a!\n\n' +
        '📖 *Gid Konfigirasyon ou*:\n' + guideUrl + '\n\n' +
        '📋 Sa ou bezwen fè:\n' +
        '1. Telechaje gid la\n' +
        '2. Suiv etap 1 ak 2 jodia\n' +
        '3. Mwen pral kontakte ou nan 7 jou pou asire tout bagay ap travay\n\n' +
        '🚀 Ou pare! Kèsyon? Tou senpleman reponn mesaj sa a.\n\n' +
        'Mèsi pou konfyans ou — n ap grandi ansanm! 🇭🇹';
    },
    FR: function(name, pkg, guideUrl) {
      var pkgName = PACKAGE_NAMES.FR[pkg] || pkg;
      return '🎉 Bienvenue dans la famille KoneksAI, ' + name + '!\n\n' +
        'Votre paiement est confirmé ✅ — *Votre Pack ' + pkgName + '* est maintenant actif!\n\n' +
        '📖 *Votre Guide de Configuration*:\n' + guideUrl + '\n\n' +
        '📋 À faire:\n' +
        '1. Téléchargez le guide\n' +
        '2. Suivez les étapes 1 et 2 aujourd\'hui\n' +
        '3. Je vous contacterai dans 7 jours pour vérifier que tout fonctionne\n\n' +
        '🚀 Vous êtes prêt! Des questions? Répondez simplement à ce message.\n\n' +
        'Merci pour votre confiance — grandissons ensemble! 🇭🇹';
    },
    EN: function(name, pkg, guideUrl) {
      var pkgName = PACKAGE_NAMES.EN[pkg] || pkg;
      return '🎉 Welcome to the KoneksAI family, ' + name + '!\n\n' +
        'Your payment is confirmed ✅ — *Your ' + pkgName + ' Package* is now active!\n\n' +
        '📖 *Your Setup Guide*:\n' + guideUrl + '\n\n' +
        '📋 To do:\n' +
        '1. Download the guide\n' +
        '2. Follow steps 1 and 2 today\n' +
        '3. I\'ll contact you in 7 days to make sure everything is working\n\n' +
        '🚀 You\'re all set! Questions? Just reply to this message.\n\n' +
        'Thank you for your trust — let\'s grow together! 🇭🇹';
    }
  },

  // ---- TESTIMONIAL REQUEST (Day 30) ----
  testimonial: {
    HT: function(name, refCode) {
      return name + '! 🙏\n\n' +
        'En mwa depi nou kòmanse ansanm — eske ou kontan ak rezilta yo?\n\n' +
        'Nou renmen tande kliyan nou yo. Eske ou ka pataje eksperyans ou?\n\n' +
        '⭐ *Kite yon temwayaj kout* (1-2 fraz) — repond dirèkteman nan mesaj sa a!\n\n' +
        'Bon tou: partaje kod referans ou ak yon zanmi:\n' +
        '🎁 *Kòd ou*: ' + refCode + '\n' +
        'Zanmi ou jwenn 20% rabè, ou jwenn 20% rabè sou pwochen mwa ou!\n\n' +
        'Mèsi pou konfyans ou! 🇭🇹';
    },
    FR: function(name, refCode) {
      return name + '! 🙏\n\n' +
        'Un mois depuis que vous avez commencé avec KoneksAI — êtes-vous satisfait des résultats?\n\n' +
        'Nous adorons entendre nos clients. Pouvez-vous partager votre expérience?\n\n' +
        '⭐ *Laissez un court témoignage* (1-2 phrases) — répondez directement à ce message!\n\n' +
        'En plus: partagez votre code de parrainage avec un ami:\n' +
        '🎁 *Votre code*: ' + refCode + '\n' +
        'Votre ami obtient 20% de réduction, vous obtenez 20% sur votre prochain mois!\n\n' +
        'Merci pour votre confiance! 🇭🇹';
    },
    EN: function(name, refCode) {
      return name + '! 🙏\n\n' +
        'One month since you started with KoneksAI — are you happy with the results?\n\n' +
        'We love hearing from our clients. Can you share your experience?\n\n' +
        '⭐ *Leave a short testimonial* (1-2 sentences) — reply directly to this message!\n\n' +
        'Also: share your referral code with a friend:\n' +
        '🎁 *Your code*: ' + refCode + '\n' +
        'Your friend gets 20% off, you get 20% off your next month!\n\n' +
        'Thank you for your trust! 🇭🇹';
    }
  }
};

// ============================================================
// LABEL LOOKUP CONSTANTS
// ============================================================

var SEGMENT_LABELS = {
  HT: { restaurant: 'restoran ou an', pharmacy: 'famasi ou a', boutique: 'boutik ou a', salon: 'salon ou an', other: 'biznis ou an' },
  FR: { restaurant: 'votre restaurant', pharmacy: 'votre pharmacie', boutique: 'votre boutique', salon: 'votre salon', other: 'votre entreprise' },
  EN: { restaurant: 'your restaurant', pharmacy: 'your pharmacy', boutique: 'your boutique', salon: 'your salon', other: 'your business' }
};

var SEGMENT_BENEFITS = {
  HT: {
    restaurant: 'Restoran ki itilize WhatsApp otomatik yo jwenn *40% plis komand* yo!',
    pharmacy: 'Famasi yo ka konfime preskripsyon ak livrezon *otomat* — pa gen pèt tan.',
    boutique: 'Boutik yo k ap itilize WhatsApp *doub vant yo nan 3 mwa*.',
    salon: 'Salon yo elimine *90% randez-vou rate* yo ak konfirmasyon otomat.',
    other: 'Biznis ki itilize WhatsApp otomatik *triple repons kliyan* yo.'
  },
  FR: {
    restaurant: 'Les restaurants utilisant WhatsApp automatique reçoivent *40% de commandes en plus*!',
    pharmacy: 'Les pharmacies peuvent confirmer prescriptions et livraisons *automatiquement*.',
    boutique: 'Les boutiques utilisant WhatsApp *doublent leurs ventes en 3 mois*.',
    salon: 'Les salons éliminent *90% des rendez-vous manqués* avec la confirmation automatique.',
    other: 'Les entreprises utilisant WhatsApp automatique *triplent leurs réponses clients*.'
  },
  EN: {
    restaurant: 'Restaurants using WhatsApp automation get *40% more orders*!',
    pharmacy: 'Pharmacies can auto-confirm prescriptions and deliveries — zero time wasted.',
    boutique: 'Boutiques using WhatsApp *double their sales in 3 months*.',
    salon: 'Salons eliminate *90% of missed appointments* with auto-confirmation.',
    other: 'Businesses using WhatsApp automation *triple their customer responses*.'
  }
};

var PACKAGE_NAMES = {
  HT: { starter: 'Estàtè', growth: 'Kwasans', pro: 'Pro', custom: 'Pèsonalize' },
  FR: { starter: 'Starter', growth: 'Croissance', pro: 'Pro', custom: 'Personnalisé' },
  EN: { starter: 'Starter', growth: 'Growth', pro: 'Pro', custom: 'Custom' }
};

var VALID_STAGES = ['new', 'contacted', 'qualified', 'sold', 'lost', 'cold'];
var VALID_SEGMENTS = ['restaurant', 'pharmacy', 'boutique', 'salon', 'other'];
var VALID_SOURCES = ['facebook_ad', 'instagram_ad', 'whatsapp_dm', 'google_form', 'referral', 'organic_whatsapp', 'website'];
var VALID_LANGS = ['FR', 'HT', 'EN'];

// ============================================================
// SHEET COLUMN INDEX MAP (0-based)
// Leads columns: lead_id(0), timestamp(1), name(2), phone(3),
//                lang(4), source(5), segment(6), stage(7),
//                ad_campaign_id(8), last_contact_date(9), notes(10)
// ============================================================

var LEADS_COL = {
  LEAD_ID: 0,
  TIMESTAMP: 1,
  NAME: 2,
  PHONE: 3,
  LANG: 4,
  SOURCE: 5,
  SEGMENT: 6,
  STAGE: 7,
  AD_CAMPAIGN_ID: 8,
  LAST_CONTACT_DATE: 9,
  NOTES: 10
};

// ============================================================
// FORM SUBMIT TRIGGER — onFormSubmit
// ============================================================

/**
 * Triggered when a linked Google Form is submitted.
 * Normalizes form data and routes the lead into the CRM.
 *
 * To enable:
 *   Triggers > Add Trigger > onFormSubmit > From spreadsheet > On form submit
 *
 * Expected form fields (map by question title):
 *   "Nome / Non / Name"
 *   "Telefòn / Téléphone / Phone"
 *   "Lang / Langue / Language"
 *   "Tip Biznis / Type d'entreprise / Business Type"
 *   "Koman ou jwenn nou / Comment nous avez-vous trouvés / How did you find us"
 */
function onFormSubmit(e) {
  try {
    if (!e || !e.namedValues) {
      Logger.log('onFormSubmit: No named values found in event.');
      return;
    }

    var getValue = function(keys) {
      for (var i = 0; i < keys.length; i++) {
        var val = e.namedValues[keys[i]];
        if (val && val[0] && String(val[0]).trim() !== '') {
          return String(val[0]).trim();
        }
      }
      return '';
    };

    // Extract fields using multiple possible question labels
    var rawName = getValue(['Nome / Non / Name', 'Non', 'Nome', 'Name', 'Nom']);
    var rawPhone = getValue(['Telefòn / Téléphone / Phone', 'Telefòn', 'Téléphone', 'Phone', 'Telefon']);
    var rawLang = getValue(['Lang / Langue / Language', 'Lang', 'Langue', 'Language']);
    var rawSegment = getValue(['Tip Biznis / Type d\'entreprise / Business Type', 'Segment', 'Business Type', 'Tip Biznis']);
    var rawSource = getValue(['Koman ou jwenn nou / Comment nous avez-vous trouvés / How did you find us', 'Source', 'Ref']);

    if (!rawName || !rawPhone) {
      Logger.log('onFormSubmit: Missing required fields (name or phone). Skipping.');
      return;
    }

    // Normalize
    var name = rawName.substring(0, 120);
    var phone = normalizePhone(rawPhone);
    var lang = normalizeLang(rawLang);
    var segment = normalizeSegment(rawSegment);
    var source = VALID_SOURCES.includes(rawSource) ? rawSource : 'google_form';

    // Add to CRM
    var leadId = addLead(name, phone, lang, source, segment);
    Logger.log('Form lead added: ' + leadId + ' phone=' + phone);

    // Forward to n8n lead-capture webhook
    triggerN8nLeadWebhook({
      lead_id: leadId,
      name: name,
      phone: phone,
      lang: lang,
      source: source,
      segment: segment,
      timestamp: new Date().toISOString(),
      form_fields: e.namedValues
    });

  } catch (err) {
    Logger.log('onFormSubmit error: ' + err.toString());
    logCrmError('onFormSubmit', err.toString());
  }
}

// ============================================================
// addLead — append normalized lead row
// ============================================================

/**
 * Appends a new lead to the Leads sheet. Deduplicates by phone number.
 * @param {string} name
 * @param {string} phone - E.164 format
 * @param {string} lang - FR | HT | EN
 * @param {string} source
 * @param {string} [segment]
 * @returns {string} lead_id of the created or existing lead
 */
function addLead(name, phone, lang, source, segment) {
  var existingLead = findLead(phone);

  if (existingLead) {
    Logger.log('Lead already exists for phone ' + phone + '. Updating last_contact_date.');
    updateLeadField(phone, LEADS_COL.LAST_CONTACT_DATE, new Date().toISOString());
    return existingLead.lead_id;
  }

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) throw new Error('Leads sheet not found. Run setupSheets() first.');

  var leadId = 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
  var now = new Date().toISOString();

  segment = segment || 'other';
  lang = VALID_LANGS.includes(lang) ? lang : 'HT';

  var row = new Array(11).fill('');
  row[LEADS_COL.LEAD_ID] = leadId;
  row[LEADS_COL.TIMESTAMP] = now;
  row[LEADS_COL.NAME] = name;
  row[LEADS_COL.PHONE] = phone;
  row[LEADS_COL.LANG] = lang;
  row[LEADS_COL.SOURCE] = source;
  row[LEADS_COL.SEGMENT] = segment;
  row[LEADS_COL.STAGE] = 'new';
  row[LEADS_COL.AD_CAMPAIGN_ID] = '';
  row[LEADS_COL.LAST_CONTACT_DATE] = now;
  row[LEADS_COL.NOTES] = '';

  sheet.appendRow(row);
  SpreadsheetApp.flush();
  Logger.log('Lead added: ' + leadId);
  return leadId;
}

// ============================================================
// findLead — search by phone
// ============================================================

/**
 * Searches the Leads sheet for a lead by phone number.
 * Returns the lead object or null if not found.
 * @param {string} phone - E.164 phone number.
 * @returns {Object|null}
 */
function findLead(phone) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  var headers = data[0];
  var phoneColIdx = LEADS_COL.PHONE;

  for (var i = 1; i < data.length; i++) {
    if (data[i][phoneColIdx] === phone) {
      var obj = {};
      headers.forEach(function(header, idx) {
        obj[header] = data[i][idx];
      });
      obj._rowIndex = i + 1; // 1-based row number in sheet
      return obj;
    }
  }

  return null;
}

// ============================================================
// updateLeadStatus
// ============================================================

/**
 * Updates the 'stage' field for a lead identified by phone number.
 * @param {string} phone - E.164 phone number.
 * @param {string} status - One of VALID_STAGES.
 * @returns {boolean} True if updated, false if not found.
 */
function updateLeadStatus(phone, status) {
  if (!VALID_STAGES.includes(status)) {
    throw new Error('Invalid status: ' + status + '. Must be one of: ' + VALID_STAGES.join(', '));
  }

  var result = updateLeadField(phone, LEADS_COL.STAGE, status);
  if (result) {
    // Also update last_contact_date
    updateLeadField(phone, LEADS_COL.LAST_CONTACT_DATE, new Date().toISOString());
    Logger.log('Lead status updated: ' + phone + ' → ' + status);
  } else {
    Logger.log('updateLeadStatus: Lead not found for phone ' + phone);
  }
  return result;
}

/**
 * Updates a specific column value for a lead by phone.
 * @param {string} phone
 * @param {number} colIndex - 0-based column index.
 * @param {*} value
 * @returns {boolean}
 */
function updateLeadField(phone, colIndex, value) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) return false;

  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][LEADS_COL.PHONE] === phone) {
      var cell = sheet.getRange(i + 1, colIndex + 1); // getRange is 1-based
      cell.setValue(value);
      SpreadsheetApp.flush();
      return true;
    }
  }

  return false;
}

// ============================================================
// deduplicate — remove duplicate phone numbers
// ============================================================

/**
 * Scans the Leads sheet for duplicate phone numbers.
 * Keeps the most recent entry (by timestamp) and deletes older duplicates.
 * Logs all removed rows.
 * @returns {number} Number of duplicate rows removed.
 */
function deduplicate() {
  Logger.log('=== deduplicate started ===');
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Leads');
  if (!sheet) throw new Error('Leads sheet not found.');

  var data = sheet.getDataRange().getValues();
  if (data.length < 3) {
    Logger.log('Less than 2 data rows. Nothing to deduplicate.');
    return 0;
  }

  var headers = data[0];

  // Map: phone → { rowIndex, timestamp }
  var phoneMap = {};
  var rowsToDelete = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var phone = String(row[LEADS_COL.PHONE]).trim();
    var ts = row[LEADS_COL.TIMESTAMP];
    var tsMs = ts ? new Date(ts).getTime() : 0;

    if (!phone) continue;

    if (!phoneMap[phone]) {
      phoneMap[phone] = { rowIndex: i + 1, tsMs: tsMs }; // 1-based
    } else {
      // Keep the most recent
      if (tsMs > phoneMap[phone].tsMs) {
        rowsToDelete.push(phoneMap[phone].rowIndex);
        phoneMap[phone] = { rowIndex: i + 1, tsMs: tsMs };
      } else {
        rowsToDelete.push(i + 1);
      }
    }
  }

  if (rowsToDelete.length === 0) {
    Logger.log('No duplicates found.');
    return 0;
  }

  // Delete rows in reverse order to avoid index shifting
  rowsToDelete.sort(function(a, b) { return b - a; });
  rowsToDelete.forEach(function(rowNum) {
    Logger.log('Deleting duplicate row ' + rowNum + ': ' + data[rowNum - 1][LEADS_COL.PHONE]);
    sheet.deleteRow(rowNum);
  });

  SpreadsheetApp.flush();
  Logger.log('deduplicate complete. Removed ' + rowsToDelete.length + ' duplicate rows.');
  return rowsToDelete.length;
}

// ============================================================
// routeBySegment — classify lead into business segment
// ============================================================

/**
 * Determines the business segment from lead data.
 * Uses keyword matching on name, notes, and raw message text.
 * @param {Object} leadData - Lead object with name, notes, message_text fields.
 * @returns {string} Segment: restaurant | pharmacy | boutique | salon | other
 */
function routeBySegment(leadData) {
  var textToSearch = [
    leadData.name || '',
    leadData.notes || '',
    leadData.message_text || '',
    leadData.segment || ''
  ].join(' ').toLowerCase();

  var segmentKeywords = {
    restaurant: ['restoran', 'restaurant', 'manje', 'food', 'nourriture', 'pizza', 'cuisine', 'kafeterya', 'cafeteria', 'traiteur', 'catering', 'bar'],
    pharmacy: ['famasi', 'pharmacie', 'pharmacy', 'medicament', 'médicament', 'drug', 'santé', 'health', 'doktè', 'docteur', 'klinik', 'clinique'],
    boutique: ['boutik', 'boutique', 'shop', 'magazen', 'magasin', 'mode', 'fashion', 'vêtements', 'abiman', 'clothes', 'accessory', 'bijou'],
    salon: ['salon', 'kwafi', 'coiffure', 'hair', 'beauty', 'beauté', 'bote', 'nail', 'spa', 'esthetique', 'esthétique', 'makiyaj', 'maquillage']
  };

  for (var segment in segmentKeywords) {
    var keywords = segmentKeywords[segment];
    for (var i = 0; i < keywords.length; i++) {
      if (textToSearch.indexOf(keywords[i]) !== -1) {
        return segment;
      }
    }
  }

  return 'other';
}

// ============================================================
// generateFollowUpMessage — localized message by lang + segment
// ============================================================

/**
 * Returns a localized follow-up message text for the given language and segment.
 * @param {string} lang - FR | HT | EN
 * @param {string} segment - restaurant | pharmacy | boutique | salon | other
 * @param {string} day - '1' | '3' | '7' | 'initial'
 * @param {Object} [params] - { name, refCode, pkg, guideUrl }
 * @returns {string}
 */
function generateFollowUpMessage(lang, segment, day, params) {
  params = params || {};
  var name = params.name || 'Moun nan';
  var refCode = params.refCode || 'KNX-000000';
  var pkg = params.pkg || 'starter';
  var guideUrl = params.guideUrl || 'https://drive.google.com/';

  lang = VALID_LANGS.includes(lang) ? lang : 'HT';
  segment = VALID_SEGMENTS.includes(segment) ? segment : 'other';

  switch (day) {
    case 'initial':
      return TEMPLATES.initial_reply[lang](name, segment);
    case '1':
      return TEMPLATES.followup_day1[lang](name, segment);
    case '3':
      return TEMPLATES.followup_day3[lang](name);
    case '7':
      return TEMPLATES.followup_day7[lang](name);
    case 'onboarding':
      return TEMPLATES.onboarding[lang](name, pkg, guideUrl);
    case 'testimonial':
      return TEMPLATES.testimonial[lang](name, refCode);
    default:
      Logger.log('Unknown follow-up day: ' + day);
      return TEMPLATES.followup_day1[lang](name, segment);
  }
}

// ============================================================
// PHONE / LANGUAGE / SEGMENT NORMALIZERS
// ============================================================

function normalizePhone(raw) {
  var phone = String(raw).replace(/[\s\-\(\)\.]/g, '');
  if (phone.startsWith('00509')) phone = '+' + phone.substring(2);
  else if (phone.startsWith('509') && !phone.startsWith('+')) phone = '+' + phone;
  else if (!phone.startsWith('+') && phone.length === 8) phone = '+509' + phone;
  else if (!phone.startsWith('+')) phone = '+509' + phone;
  return phone;
}

function normalizeLang(raw) {
  if (!raw) return 'HT';
  var upper = String(raw).toUpperCase().trim();
  if (VALID_LANGS.includes(upper)) return upper;
  if (upper.includes('KREYOL') || upper.includes('CREOLE') || upper.includes('HT')) return 'HT';
  if (upper.includes('FRANÇAIS') || upper.includes('FRENCH') || upper.includes('FR')) return 'FR';
  if (upper.includes('ENGLISH') || upper.includes('EN')) return 'EN';
  return 'HT';
}

function normalizeSegment(raw) {
  if (!raw) return 'other';
  var lower = String(raw).toLowerCase().trim();
  for (var i = 0; i < VALID_SEGMENTS.length; i++) {
    if (lower.includes(VALID_SEGMENTS[i])) return VALID_SEGMENTS[i];
  }
  return routeBySegment({ notes: lower });
}

// ============================================================
// n8n WEBHOOK TRIGGER
// ============================================================

function triggerN8nLeadWebhook(leadData) {
  var props = PropertiesService.getScriptProperties();
  var webhookUrl = props.getProperty('N8N_LEAD_WEBHOOK_URL');

  if (!webhookUrl) {
    Logger.log('N8N_LEAD_WEBHOOK_URL not configured. Skipping n8n trigger.');
    return;
  }

  try {
    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(leadData),
      muteHttpExceptions: true
    };
    var response = UrlFetchApp.fetch(webhookUrl, options);
    Logger.log('n8n lead webhook triggered: HTTP ' + response.getResponseCode());
  } catch (e) {
    Logger.log('n8n lead webhook error: ' + e.toString());
    logCrmError('triggerN8nLeadWebhook', e.toString());
  }
}

// ============================================================
// SPREADSHEET HELPER
// ============================================================

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('GOOGLE_SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error('GOOGLE_SHEET_ID not set and no active spreadsheet.');
}

function logCrmError(source, message) {
  try {
    var ss = getSpreadsheet();
    var errorSheet = ss.getSheetByName('ErrorLog');
    if (!errorSheet) {
      errorSheet = ss.insertSheet('ErrorLog');
      errorSheet.getRange(1, 1, 1, 5).setValues([['timestamp', 'source', 'error_type', 'error_message', 'raw_payload']]);
    }
    errorSheet.appendRow([new Date().toISOString(), source, 'crm_error', message.substring(0, 1000), '']);
    SpreadsheetApp.flush();
  } catch (e) {
    Logger.log('Failed to log CRM error: ' + e.toString());
  }
}

// ============================================================
// CUSTOM MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🇭🇹 KoneksAI CRM')
    .addItem('🧹 Deduplicate Leads', 'deduplicate')
    .addItem('🔍 Find Lead (run in editor)', 'testFindLead')
    .addSeparator()
    .addItem('📋 Setup Sheets', 'setupLeadsSheet')
    .addItem('🧪 Test Form Submit', 'testFormSubmit')
    .addToUi();
}

// ============================================================
// SETUP
// ============================================================

function setupLeadsSheet() {
  var ss = getSpreadsheet();
  var sheetNames = {
    Leads: ['lead_id', 'timestamp', 'name', 'phone', 'lang', 'source', 'segment', 'stage', 'ad_campaign_id', 'last_contact_date', 'notes'],
    Payments: ['transaction_id', 'timestamp', 'client_phone', 'client_name', 'amount_htg', 'amount_usd', 'package', 'status'],
    Clients: ['client_id', 'onboard_date', 'name', 'phone', 'lang', 'segment', 'package', 'monthly_revenue_htg', 'status', 'referral_code', 'referred_by', 'notes'],
    ErrorLog: ['timestamp', 'source', 'error_type', 'error_message', 'raw_payload']
  };

  Object.keys(sheetNames).forEach(function(name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var headers = sheetNames[name];
    var firstRow = sheet.getRange(1, 1, 1, headers.length);
    firstRow.setValues([headers]);
    firstRow.setFontWeight('bold');
    firstRow.setBackground('#1a1a2e');
    firstRow.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('✅ Leads CRM sheets initialized.');
}

// ============================================================
// TESTS
// ============================================================

function testFindLead() {
  var phone = '+50941234567';
  var result = findLead(phone);
  Logger.log('findLead result: ' + JSON.stringify(result));
  return result;
}

function testFormSubmit() {
  var mockEvent = {
    namedValues: {
      'Nome / Non / Name': ['Marie Joseph'],
      'Telefòn / Téléphone / Phone': ['+50941234567'],
      'Lang / Langue / Language': ['HT'],
      'Tip Biznis / Type d\'entreprise / Business Type': ['restaurant'],
      'Koman ou jwenn nou / Comment nous avez-vous trouvés / How did you find us': ['facebook_ad']
    }
  };
  onFormSubmit(mockEvent);
  Logger.log('testFormSubmit complete.');
}

function testGenerateMessages() {
  var params = { name: 'Marie', refCode: 'KNX-412567', pkg: 'growth', guideUrl: 'https://drive.google.com/test' };

  ['HT', 'FR', 'EN'].forEach(function(lang) {
    ['initial', '1', '3', '7', 'onboarding', 'testimonial'].forEach(function(day) {
      var msg = generateFollowUpMessage(lang, 'restaurant', day, params);
      Logger.log('--- [' + lang + '] Day ' + day + ' ---\n' + msg.substring(0, 120) + '...');
    });
  });
}
