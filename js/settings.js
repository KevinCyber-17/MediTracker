document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('loggedInUser')) {
        alert('You must be logged in to view this page.');
        window.location.href = 'index.html';
        return;
    }

    // --- GLOBAL THEME LOGIC ---
    const themeSelector = document.getElementById('themeSelector');
    function applyTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
    }
    const savedMode = localStorage.getItem('mode') || 'light';
    if (themeSelector) themeSelector.value = savedMode;
    applyTheme(savedMode);
    if (themeSelector) themeSelector.addEventListener('change', () => {
        const newMode = themeSelector.value;
        localStorage.setItem('mode', newMode);
        applyTheme(newMode);
    });

    // --- ACCENT COLOR LOGIC ---
    function applyAccentColor(colorName) {
        let colorCode = '#007bff'; // Default: Blue
        if (colorName === 'green') colorCode = '#198754';
        if (colorName === 'purple') colorCode = '#6f42c1';
        document.body.style.setProperty('--accent-color', colorCode);
    }

    // --- OTHER SETTINGS LOGIC ---
    const settingsControls = document.querySelectorAll('.setting-control');
    const settingsKey = 'meditracker_settings';

    function saveOtherSettings() {
        const currentSettings = {};
        settingsControls.forEach(el => {
            if (el.type === 'checkbox') {
                currentSettings[el.id] = el.checked;
            } else {
                currentSettings[el.id] = el.value;
            }
        });
        localStorage.setItem(settingsKey, JSON.stringify(currentSettings));
        
        if (currentSettings.accentColor) {
            applyAccentColor(currentSettings.accentColor);
        }
        if (currentSettings.language) {
            applyLanguage(currentSettings.language);
        }
    }

    function loadOtherSettings() {
        const savedSettings = JSON.parse(localStorage.getItem(settingsKey));
        const defaults = {
            remindBefore: '10', repeatReminder: false, vibration: true, 
            dndStart: '22:00', dndEnd: '08:00', accentColor: 'blue', 
            language: 'en', timeFormat: '12h'
        };
        const settings = { ...defaults, ...savedSettings };

        settingsControls.forEach(el => {
            if (el.type === 'checkbox') {
                el.checked = settings[el.id];
            } else {
                el.value = settings[el.id];
            }
        });
        
        applyAccentColor(settings.accentColor);
        applyLanguage(settings.language);
    }

    loadOtherSettings();
    settingsControls.forEach(el => el.addEventListener('change', saveOtherSettings));
});
