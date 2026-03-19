document.addEventListener('DOMContentLoaded', () => {
    if (!sessionStorage.getItem('loggedInUser')) {
      alert('You must be logged in to view this page.');
      window.location.href = 'index.html';
      return;
    }
  
    function getMedicinesFromStorage() {
      return JSON.parse(localStorage.getItem("medicines") || "[]");
    }
  
    function setMedicinesToStorage(arr) {
      localStorage.setItem("medicines", JSON.stringify(arr));
    }
  
    document.getElementById("medicineForm").addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById("medicineName").value.trim();
      const cycles = Array.from(document.querySelectorAll('input[name="daycycle"]:checked')).map(cb => cb.value);
      const food = document.querySelector('input[name="food"]:checked').value;
      const reminderTime = document.getElementById("reminderTime").value;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      const expiryDate = document.getElementById("expiryDate").value;
  
      if (!name || cycles.length === 0 || !startDate || !endDate || !expiryDate || !reminderTime) {
        alert("Please fill all fields and select at least one day cycle timing.");
        return;
      }
      if (endDate < startDate) {
        alert("End date cannot be before the start date.");
        return;
      }
      if (expiryDate < startDate) {
        alert("Expiry date cannot be before the start date.");
        return;
      }
  
      const newMedicine = {
        medicineName: name, dayCycle: cycles, foodReference: food,
        startDate: startDate, endDate: endDate, expiryDate: expiryDate,
        reminderTime: reminderTime
      };
      
      const medicines = getMedicinesFromStorage();
      medicines.push(newMedicine);
      setMedicinesToStorage(medicines);
      
      alert(`"${name}" has been added successfully!`);
      document.getElementById("medicineForm").reset();
    });
});
