function getMedicinesFromStorage() {
  return JSON.parse(localStorage.getItem("medicines") || "[]");
}
function setMedicines(arr) {
  localStorage.setItem("medicines", JSON.stringify(arr));
}

// Filter out old medicines on every load
function filterExpiredMedicines() {
  let medicines = getMedicinesFromStorage();
  const today = new Date().toISOString().split('T')[0];
  medicines = medicines.filter(med => med.endDate >= today);
  setMedicines(medicines);
  return medicines;
}

document.getElementById("medicineForm").onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById("medicineName").value.trim();
  const cycles = Array.from(document.querySelectorAll('input[name="daycycle"]:checked')).map(cb => cb.value);
  const food = document.querySelector('input[name="food"]:checked').value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const expiryDate = document.getElementById("expiryDate").value;

  if (!name || !cycles.length || !startDate || !endDate || !expiryDate) {
    alert("Please fill all fields and select at least one timing.");
    return;
  }
  if (endDate < startDate) {
    alert("End date must be after start date.");
    return;
  }

  const medicines = filterExpiredMedicines();
  medicines.push({
    medicineName: name,
    dayCycle: cycles,
    foodReference: food,
    startDate: startDate,
    endDate: endDate,
    expiryDate: expiryDate
  });
  setMedicines(medicines);
  alert("Medicine added!");
  document.getElementById("medicineForm").reset();
  loadMedicines();

  // Optional: Redirect user after adding medicine (uncomment next line if you have a dashboard/main page)
  // window.location.href = "main.html";
};

function removeMedicine(index) {
  const medicines = filterExpiredMedicines();
  medicines.splice(index, 1);
  setMedicines(medicines);
  loadMedicines();
}
window.removeMedicine = removeMedicine;

function loadMedicines() {
  let medicines = filterExpiredMedicines();
  medicines.sort((a, b) => a.medicineName.localeCompare(b.medicineName));
  const div = document.getElementById("medicines");
  if (!medicines.length) {
    div.innerHTML = `<h2>No Medicines Added</h2>`;
    return;
  }
  div.innerHTML = `<h2>Medicine List:</h2>
    <ul class="medicine-list">` +
    medicines.map((m, i) => `<li>
      <strong>${m.medicineName}</strong><br>
      <span>Day Cycle: ${m.dayCycle.join(", ")}</span><br>
      <span>${m.foodReference}</span><br>
      <span>Duration: ${m.startDate} to ${m.endDate}</span><br>
      Expiry: <em>${m.expiryDate}</em>
      <button class="remove-btn" onclick="removeMedicine(${i})">Remove</button>
    </li>`).join('') +
    `</ul>`;
}
window.onload = loadMedicines;
