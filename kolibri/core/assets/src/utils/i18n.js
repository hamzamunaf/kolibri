import FontFaceObserver from 'fontfaceobserver';
import vue from 'kolibri.lib.vue';
import logger from '../logging';
import importIntlLocale from './intl-locale-data';
import importVueIntlLocaleData from './vue-intl-locale-data';

const logging = logger.getLogger(__filename);

function $trWrapper(nameSpace, defaultMessages, formatter, messageId, args) {
  if (args) {
    if (!Array.isArray(args) && typeof args !== 'object') {
      logging.error(`The $tr functions take either an array of positional
                      arguments or an object of named options.`);
    }
  }
  const defaultMessageText = defaultMessages[messageId];
  const message = {
    id: `${nameSpace}.${messageId}`,
    defaultMessage: defaultMessageText,
  };

  return formatter(message, args);
}

export const languageDirections = {
  LTR: 'ltr',
  RTL: 'rtl',
};

const defaultLocale = 'en';

export const defaultLanguage = {
  id: 'en',
  lang_name: 'English',
  lang_direction: languageDirections.LTR,
};

export const languageValidator = language => {
  return ['id', 'lang_name', 'lang_direction'].reduce((valid, key) => valid && language[key], true);
};

export const availableLanguages = {
  en: defaultLanguage,
};

export let currentLanguage = defaultLocale;

// Default to ltr
export let languageDirection = languageDirections.LTR;

export const getContentLangDir = language => {
  return (language || {}).lang_direction || languageDirections.LTR;
};

export const getLangDir = id => {
  return (availableLanguages[id] || {}).lang_direction || languageDirections.LTR;
};

export const isRtl = id => {
  return getLangDir(id) === languageDirections.RTL;
};

export const languageDensities = {
  englishLike: 'english_like',
  tall: 'tall',
  dense: 'dense',
};

export let languageDensity = languageDensities.englishLike;

const languageDensityMapping = {
  ar: languageDensities.tall,
  bn: languageDensities.tall,
  fa: languageDensities.tall,
  gu: languageDensities.tall,
  hi: languageDensities.tall,
  ja: languageDensities.dense,
  km: languageDensities.tall,
  kn: languageDensities.tall,
  ko: languageDensities.dense,
  lo: languageDensities.tall,
  ml: languageDensities.tall,
  mr: languageDensities.tall,
  my: languageDensities.tall,
  ne: languageDensities.tall,
  pa: languageDensities.tall,
  si: languageDensities.tall,
  ta: languageDensities.tall,
  te: languageDensities.tall,
  th: languageDensities.tall,
  ur: languageDensities.tall,
  vi: languageDensities.tall,
  zh: languageDensities.dense,
};

function languageIdToCode(id) {
  return id.split('-')[0].toLowerCase();
}

function setLanguageDensity(id) {
  const langCode = languageIdToCode(id);
  // Set the exported languageDensity in JS
  languageDensity = languageDensityMapping[langCode] || languageDensities.englishLike;
  // Set the body class for global typography
  global.document.body.classList.add(`language-${languageDensity}`);
}

/**
 * Class exposing translation functions for a particular message name space.
 * @class
 */
class Translator {
  /**
   * Create a Translator object.
   * @param {string} nameSpace - The nameSpace of the messages for translation.
   * @param {object} defaultMessages - an object mapping message ids to default messages.
   */
  constructor(nameSpace, defaultMessages) {
    this.nameSpace = nameSpace;
    this.defaultMessages = defaultMessages;
  }
  $tr(messageId, args) {
    return $trWrapper(
      this.nameSpace,
      this.defaultMessages,
      vue.prototype.$formatMessage,
      messageId,
      args
    );
  }
  // For convenience, also proxy all vue intl translation methods on this object
  $formatDate(date, options = {}) {
    return vue.prototype.$formatDate(date, options);
  }
  $formatTime(time, options = {}) {
    return vue.prototype.$formatTime(time, options);
  }
  $formatRelative(date, options = {}) {
    return vue.prototype.$formatRelative(date, options);
  }
  $formatNumber(number, options = {}) {
    return vue.prototype.$formatNumber(number, options);
  }
  $formatPlural(plural, options = {}) {
    return vue.prototype.$formatPlural(plural, options);
  }
}

/**
 * Returns a Translator instance.
 * @param {string} nameSpace - The nameSpace of the messages for translation.
 * @param {object} defaultMessages - an object mapping message ids to default messages.
 */
export function createTranslator(nameSpace, defaultMessages) {
  return new Translator(nameSpace, defaultMessages);
}

function _setUpVueIntl() {
  /**
   * Use the vue-intl plugin.
   *
   * Note that this _must_ be called after i18nSetup because this function sets up
   * the currentLanguage module variable which is referenced inside of here.
   **/
  const VueIntl = require('vue-intl');
  vue.use(VueIntl, { defaultLocale });
  vue.prototype.isRtl = languageDirection === 'rtl';

  vue.prototype.$tr = function $tr(messageId, args) {
    const nameSpace = this.$options.name || this.$options.$trNameSpace;
    return $trWrapper(nameSpace, this.$options.$trs, this.$formatMessage, messageId, args);
  };

  vue.setLocale(currentLanguage);
  if (global.coreLanguageMessages) {
    vue.registerMessages(currentLanguage, global.coreLanguageMessages);
  }
  importVueIntlLocaleData().forEach(localeData => VueIntl.addLocaleData(localeData));
}

function _loadDefaultFonts() {
  /*
   * Eagerly load the full default fonts for the current language asynchronously, but
   * avoid referencing them until they've been fully loaded. This is done by adding a
   * class to the HTML root which has the effect of switching fonts from system defaults
   * to Noto.
   *
   * This prevents the text from being invisible while the fonts are loading ("FOIT")
   * and instead falls back on system fonts while they're loading ("FOUT").
   */

  // We use the <html> element to store the CSS 'loaded' class
  const htmlEl = document.documentElement;
  const FULL_FONTS = 'full-fonts-loaded';
  const PARTIAL_FONTS = 'partial-fonts-loaded';
  htmlEl.classList.add(PARTIAL_FONTS);

  // If this is a modern browser, go ahead and immediately reference the full fonts.
  // Then, continue pre-emptively loading the full default language fonts below.
  if (global.useModernFontLoading) {
    htmlEl.classList.remove(PARTIAL_FONTS);
    htmlEl.classList.add(FULL_FONTS);
  }

  const language = availableLanguages[currentLanguage];

  const uiNormal = new FontFaceObserver('noto-ui-full', { weight: 400 });
  const uiBold = new FontFaceObserver('noto-ui-full', { weight: 700 });
  const contentNormal = new FontFaceObserver('noto-content-full', { weight: 400 });
  const contentBold = new FontFaceObserver('noto-content-full', { weight: 700 });

  // passing 'language_name' to 'load' for its glyphs, not its value per se
  Promise.all([
    uiNormal.load(language.language_name, 20000),
    uiBold.load(language.language_name, 20000),
    contentNormal.load(language.language_name, 20000),
    contentBold.load(language.language_name, 20000),
  ])
    .then(function() {
      htmlEl.classList.remove(PARTIAL_FONTS);
      htmlEl.classList.add(FULL_FONTS);
      logging.debug(`Loaded full font for '${currentLanguage}'`);
    })
    .catch(function() {
      logging.warn(`Could not load full font for '${currentLanguage}'`);
    });
}

export function i18nSetup(skipPolyfill = false) {
  /**
   * Load fonts, app strings, and Intl polyfills
   **/

  // Set up exported module variable
  if (global.languageCode) {
    currentLanguage = global.languageCode;
  }

  if (global.languages) {
    Object.assign(availableLanguages, global.languages);
  }

  languageDirection = global.languageDir || languageDirection;

  // Set up typography
  setLanguageDensity(currentLanguage);
  _loadDefaultFonts();

  // If the browser doesn't support the Intl polyfill, we retrieve that and
  // the modules need to wait until that happens.
  return new Promise((resolve, reject) => {
    if (Object.prototype.hasOwnProperty.call(global, 'Intl') || skipPolyfill) {
      _setUpVueIntl();
      resolve();
    } else {
      Promise.all([
        new Promise(resolve => {
          require.ensure(
            ['intl'],
            require => {
              resolve(() => require('intl'));
            },
            'intl'
          );
        }),
        importIntlLocale(global.languageCode),
      ]).then(
        // eslint-disable-line
        ([requireIntl, requireIntlLocaleData]) => {
          requireIntl(); // requireIntl must run before requireIntlLocaleData
          requireIntlLocaleData();
          _setUpVueIntl();
          resolve();
        },
        error => {
          logging.error(error);
          logging.error('An error occurred trying to setup Internationalization', error);
          reject();
        }
      );
    }
  });
}

export function localeCompare(str1, str2) {
  // Catch if browser does not support extended localeCompare arguments
  try {
    // use 'search' option to ignore case rather than use locale defaults
    return String(str1).localeCompare(String(str2), 'default', { usage: 'search' });
  } catch (e) {
    return String(str1).localeCompare(String(str2));
  }
}
