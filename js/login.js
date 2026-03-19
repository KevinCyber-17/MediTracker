document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const toggleLoginPassword = document.getElementById('toggleLoginPassword');
  const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
  const loginPasswordInput = document.getElementById('loginPassword');
  const registerPasswordInput = document.getElementById('registerPassword');

  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('registerEmail').value.trim().toLowerCase();
      const password = registerPasswordInput.value;

      const hasNumber = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (!password || password.length < 8 || !hasNumber || !hasSpecialChar) {
        alert('Password is too weak!\n\nIt must meet the following criteria:\n- At least 8 characters long\n- At least one number (0-9)\n- At least one special character (e.g., !, @, #, $)');
        return;
      }

      if (!email) {
        alert('Please enter your email address.');
        return;
      }

      // If Firebase Auth is available, use it. Otherwise fall back to localStorage.
      if (window.auth) {
        auth.createUserWithEmailAndPassword(email, password)
          .then((cred) => {
            const uid = cred.user.uid;
            // Optionally create a user document in Firestore
            if (window.db) {
              db.collection('users').doc(uid).set({ email: email }).catch(() => {});
            }
            sessionStorage.setItem('loggedInUser', uid);
            alert('Registration successful!');
            window.location.href = 'index.html';
          })
          .catch(err => {
            alert(err.message || 'Registration failed.');
          });
      } else {
        const users = JSON.parse(localStorage.getItem('users') || '[]' );

        if (users.find(user => user.email === email)) {
          alert('An account with this email already exists.');
          return;
        }
        
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));

        alert('Registration successful! You can now log in.');
        window.location.href = 'index.html';
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = loginPasswordInput.value;

      if (!email || !password) {
        alert('Please enter both email and password.');
        return;
      }

      if (window.auth) {
        auth.signInWithEmailAndPassword(email, password)
          .then((cred) => {
            sessionStorage.setItem('loggedInUser', cred.user.uid);
            window.location.href = 'main.html';
          })
          .catch(err => {
            alert(err.message || 'Invalid email or password.');
          });
      } else {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
          sessionStorage.setItem('loggedInUser', user.email);
          window.location.href = 'main.html'; 
        } else {
          alert('Invalid email or password.');
        }
      }
    });
  }

  if (toggleLoginPassword) {
    toggleLoginPassword.addEventListener('click', function () {
      const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      loginPasswordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  if (toggleRegisterPassword) {
    toggleRegisterPassword.addEventListener('click', function () {
      const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      registerPasswordInput.setAttribute('type', type);
      this.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
});
