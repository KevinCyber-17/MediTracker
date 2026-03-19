document.addEventListener('DOMContentLoaded', () => {
  if (!sessionStorage.getItem('loggedInUser')) {
    alert('You must be logged in to view this page.');
    window.location.href = 'index.html';
    return;
  }
  loadTodayMedicines();
  setupNotifications();
});

// --- HELPER FUNCTIONS ---
function getMedicinesFromStorage() { return JSON.parse(localStorage.getItem("medicines") || "[]"); }
function getHistoryFromStorage() { return JSON.parse(localStorage.getItem("history") || "[]"); }
function setHistoryToStorage(arr) { localStorage.setItem("history", JSON.stringify(arr)); }
function todayKey() { return 'dayStatus-' + new Date().toISOString().split('T')[0]; }
function getTodayStatus() { return JSON.parse(localStorage.getItem(todayKey()) || "{}"); }
function setTodayStatus(statusObj) { localStorage.setItem(todayKey(), JSON.stringify(statusObj)); }

// Gets settings, providing defaults if none are set
function getSettings() {
    const savedSettings = JSON.parse(localStorage.getItem("meditracker_settings") || "{}");
    const defaults = {
        remindBefore: '10', repeatReminder: false, vibration: true, 
        dndStart: '22:00', dndEnd: '08:00', timeFormat: '12h'
    };
    return { ...defaults, ...savedSettings };
}

// Manages the state of notifications to handle repeats
function getNotificationLog() { return JSON.parse(localStorage.getItem("notification_log") || "{}"); }
function setNotificationLog(log) { localStorage.setItem("notification_log", JSON.stringify(log)); }


// --- CORE FUNCTIONS ---

function markStatus(medIdentifier, medObject, status) {
    const statusObj = getTodayStatus();
    statusObj[medIdentifier] = { status: status, time: new Date().toLocaleTimeString() };
    setTodayStatus(statusObj);

    const history = getHistoryFromStorage();
    const todayStr = new Date().toISOString().split('T')[0];
    const alreadyLogged = history.some(h => h.identifier === medIdentifier && h.date === todayStr);
    if (!alreadyLogged) {
        history.push({
            ...medObject,
            identifier: medIdentifier,
            date: todayStr,
            time: statusObj[medIdentifier].time,
            status: status === 'yes' ? 'Taken' : 'Not Taken'
        });
        setHistoryToStorage(history);
    }
    
    // **NEW**: When a medicine is marked, remove it from the notification log to stop repeats
    const notificationLog = getNotificationLog();
    if (notificationLog[medIdentifier]) {
        delete notificationLog[medIdentifier];
        setNotificationLog(notificationLog);
    }

    loadTodayMedicines();
}

function resetTodayStatus() {
    if (confirm("Are you sure you want to reset the status for all of today's medicines?")) {
        localStorage.removeItem(todayKey());
        // Also clear the notification log for the day to reset repeat reminders
        localStorage.removeItem("notification_log");
        loadTodayMedicines();
    }
}

function removeMedicine(medNameToRemove, startDateToRemove) {
    if (!confirm(`Are you sure you want to permanently remove "${medNameToRemove}"? This action cannot be undone.`)) {
        return;
    }
    let allMeds = getMedicinesFromStorage();
    allMeds = allMeds.filter(med => med.medicineName !== medNameToRemove || med.startDate !== startDateToRemove);
    localStorage.setItem("medicines", JSON.stringify(allMeds));
    loadTodayMedicines(); 
}

window.markStatus = markStatus;
window.resetTodayStatus = resetTodayStatus;
window.removeMedicine = removeMedicine; 


// --- NOTIFICATION SYSTEM (COMPLETELY REWRITTEN) ---

function setupNotifications() {
    if (!('Notification' in window)) {
        console.log("This browser does not support desktop notification.");
        return;
    }

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // Check for reminders every minute
            setInterval(checkReminders, 60000); 
        }
    });
}

function checkReminders() {
    const settings = getSettings();
    const now = new Date();
    const currentHour = now.getHours();
    const [dndStartHour] = settings.dndStart.split(':').map(Number);
    const [dndEndHour] = settings.dndEnd.split(':').map(Number);

    // 1. Check for Do Not Disturb Mode
    if (dndStartHour > dndEndHour) { // Overnight DND (e.g., 10 PM to 8 AM)
        if (currentHour >= dndStartHour || currentHour < dndEndHour) {
            console.log("DND mode is active.");
            return; 
        }
    } else { // Same-day DND
        if (currentHour >= dndStartHour && currentHour < dndEndHour) {
            console.log("DND mode is active.");
            return;
        }
    }

    // 2. Check all medicines
    const allMeds = getMedicinesFromStorage();
    const today = new Date().toISOString().split('T')[0];
    const todaysMeds = allMeds.filter(med => med.startDate <= today && med.endDate >= today);
    const statusObj = getTodayStatus();
    const notificationLog = getNotificationLog();

    todaysMeds.forEach((med, index) => {
        const identifier = `${med.medicineName}_${med.startDate}_${index}`;
        
        // Skip if already taken
        if (statusObj[identifier]) return;

        // Calculate the target notification time based on settings
        const [hour, minute] = med.reminderTime.split(':');
        const medTime = new Date();
        medTime.setHours(hour, minute, 0, 0);
        const remindBeforeMinutes = parseInt(settings.remindBefore, 10);
        const notificationTime = new Date(medTime.getTime() - remindBeforeMinutes * 60000);

        // A. Check for initial notification
        if (notificationTime.getHours() === now.getHours() && notificationTime.getMinutes() === now.getMinutes()) {
            if (!notificationLog[identifier]) { // Only send if it's the first time
                console.log(`Sending initial notification for ${med.medicineName}`);
                showNotification(med, settings);
                notificationLog[identifier] = { lastSent: now.getTime() };
            }
        }
        // B. Check for repeat notification
        else if (settings.repeatReminder && notificationLog[identifier]) {
            const timeSinceLast = now.getTime() - notificationLog[identifier].lastSent;
            const fifteenMinutesInMillis = 15 * 60 * 1000;
            if (timeSinceLast >= fifteenMinutesInMillis) {
                console.log(`Sending repeat notification for ${med.medicineName}`);
                showNotification(med, settings);
                notificationLog[identifier].lastSent = now.getTime();
            }
        }
    });

    setNotificationLog(notificationLog);
}

function showNotification(medicine, settings) {
    const notification = new Notification('Time for your medicine!', {
        body: `It's time to take your ${medicine.medicineName}.`,
        icon: 'https://img.icons8.com/color/48/000000/pill.png',
        silent: !settings.vibration // Use the silent option for sound control
    });

    // Vibrate based on settings
    if (settings.vibration && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
}


// --- UI RENDERING ---

// This function remains largely the same, but includes the time format setting
function loadTodayMedicines() {
    const allMeds = getMedicinesFromStorage();
    const today = new Date().toISOString().split('T')[0];
    const todaysMeds = allMeds.filter(med => med.startDate <= today && med.endDate >= today);
    const statusObj = getTodayStatus();
    const container = document.getElementById('today-medicines');
    const resetButton = document.getElementById('resetStatusBtn');
    const settings = getSettings(); // Get settings for time format

    function formatDisplayTime(time24) {
        if (!time24) return '--:--';
        if (settings.timeFormat === '24h') return time24;

        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        let hour12 = hour % 12;
        if (hour12 === 0) { hour12 = 12; }
        return `${hour12}:${minutes} ${ampm}`;
    }

    if (todaysMeds.length === 0) {
        container.innerHTML = '<div class="no-meds-card">You have no medicines scheduled for today.</div>';
        if(resetButton) resetButton.style.display = 'none';
        return;
    }
    
    if(resetButton) resetButton.style.display = 'inline-flex';

    container.innerHTML = todaysMeds.map((med, index) => {
        const identifier = `${med.medicineName}_${med.startDate}_${index}`;
        const statusInfo = statusObj[identifier];
        let actionHtml = '';

        if (statusInfo?.status === 'yes') {
            actionHtml = `<div class="status-badge status-taken">Taken at ${statusInfo.time}</div>`;
        } else if (statusInfo?.status === 'no') {
            actionHtml = `<div class="status-badge status-not-taken">Marked as Not Taken at ${statusInfo.time}</div>`;
        } else {
            actionHtml = `<span class="action-prompt">Did you take this medicine?</span>
                        <button class="action-btn no-btn" onclick="markStatus('${identifier}', JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(med))}')), 'no')">No</button>
                        <button class="action-btn yes-btn" onclick="markStatus('${identifier}', JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(med))}')), 'yes')">Yes</button>
                        <button class="action-btn remove-btn" onclick="removeMedicine('${med.medicineName}', '${med.startDate}')">Remove</button>`;
        }

        return `
        <li>
            <div class="medicine-card">
            <div class="med-serial">#${index + 1}</div>
            <div class="med-header">
                <h3 class="med-name">${med.medicineName}</h3>
                <span class="med-cycle">${med.dayCycle.join(', ')}</span>
            </div>
            <div class="med-details-grid">
                <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>${med.foodReference}</span>
                </div>
                <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Ends: ${med.endDate}</span>
                </div>
                <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Reminder: ${formatDisplayTime(med.reminderTime)}</span>
                </div>
            </div>
            <div class="med-actions">${actionHtml}</div>
            </div>
        </li>
        `;
    }).join('');
}
