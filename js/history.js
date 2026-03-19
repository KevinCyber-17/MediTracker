document.addEventListener('DOMContentLoaded', () => {

  function formatTime(time24) {
      if (!time24) return '--:--';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      let hour12 = hour % 12;
      if (hour12 === 0) { hour12 = 12; }
      return `${hour12}:${minutes} ${ampm}`;
  }

  function getHistoryFromStorage() { 
    return JSON.parse(localStorage.getItem("history") || "[]"); 
  }

  function clearHistory() {
    if (confirm("Are you sure you want to permanently clear all medication history? This cannot be undone.")) {
      localStorage.removeItem("history");
      renderHistory();
    }
  }
  window.clearHistory = clearHistory;

  function renderHistory() {
    const history = getHistoryFromStorage().reverse();
    const container = document.getElementById('history-list');
    const clearButton = document.querySelector('.clear-btn');
    
    const settings = JSON.parse(localStorage.getItem("meditracker_settings") || '{}');
    const lang = settings.language || 'en';

    if (history.length === 0) {
      container.innerHTML = `<div class="no-meds-card" data-i18n-key="noHistory">${translations[lang].noHistory}</div>`;
      if (clearButton) clearButton.style.display = 'none';
      return;
    }
    
    if (clearButton) clearButton.style.display = 'inline-flex';

    container.innerHTML = history.map((h, index) => {
      let statusHtml = '';
      if (h.status === 'Taken') {
        statusHtml = `<div class="status-badge status-taken">Taken on ${h.date} at ${h.time}</div>`;
      } else {
        statusHtml = `<div class="status-badge status-not-taken">Not Taken on ${h.date} at ${h.time}</div>`;
      }

      return `
        <li>
          <div class="medicine-card">
            <div class="med-serial">#${history.length - index}</div>
            <div class="med-header">
              <h3 class="med-name">${h.medicineName}</h3>
              <span class="med-cycle">${h.dayCycle.join(', ')}</span>
            </div>
            <div class="med-details-grid">
              <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>${h.foodReference}</span>
              </div>
              <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span data-i18n-key="medCycleLabel">Ends</span>: ${h.endDate}
              </div>
              <div class="detail-item">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Reminder: ${formatTime(h.reminderTime)}</span>
              </div>
            </div>
            <div class="med-actions">${statusHtml}</div>
          </div>
        </li>
      `;
    }).join('');
  }

  renderHistory();

});
