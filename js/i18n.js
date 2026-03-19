function applyLanguage(lang) {
  // Find all elements that have a 'data-i18n-key' attribute
  document.querySelectorAll('[data-i18n-key]').forEach(element => {
    const key = element.getAttribute('data-i18n-key');
    // Get the translation from the 'translations' object
    const translation = translations[lang][key];
    if (translation) {
      element.textContent = translation;
    }
  });
}
