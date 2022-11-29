const User = require('./models/user.js');

const loginForm = document.getElementById('login-form');
const loginTabButton = document.getElementById('btn-login-tab');
const registerForm = document.getElementById('register-form');
const registerTabButton = document.getElementById('btn-register-tab');
const button = document.getElementById('btn');
const loginUsernameInput = document.getElementById('input-login-username');
const loginPasswordInput = document.getElementById('input-login-pw');
const loginButton = document.getElementById('btn-login');
const registerUsernameInput = document.getElementById('input-register-username');
const registerEmailInput = document.getElementById('input-register-email');
const registerPasswordInput = document.getElementById('input-register-pw');
const registerButton = document.getElementById('btn-register');

registerTabButton.addEventListener('click', () => {
  loginForm.style.left = '-400px';
  registerForm.style.left = '50px';
  button.style.left = '110px';
});

loginTabButton.addEventListener('click', () => {
  loginForm.style.left = '50px';
  registerForm.style.left = '450px';
  button.style.left = '0px';
});

registerButton.addEventListener('click', () => {
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (registerUsernameInput.value.match(usernameRegex) === null) {
    window.alert('Username is not valid. Only characters A-Z, a-z, 0-9 and _ are acceptable.');
    return;
  }

  const user = new User(-1, registerUsernameInput.value,
    registerEmailInput.value, registerPasswordInput.value);

  if (User.numRegisteredUsers === 10) {
    window.alert('Error: Maximum number of users (10) has been reached!');
    return;
  }

  const registerResult = user.register();
  if (registerResult === false) {
    window.alert('Error: Username "' + user.username + '" already exists!');
    registerUsernameInput.focus();
  }
});

registerForm.addEventListener('keypress', e => {
  if (e.key === 'Enter') registerButton.click();
});

loginButton.addEventListener('click', () => {
  const user = User.getUserByUsername(loginUsernameInput.value);
  if (user === null) {
    window.alert('Error: Username does not exist!');
    loginUsernameInput.focus();
    loginPasswordInput.value = '';
    return;
  }

  console.log(user);
  const loginResult = user.login(loginPasswordInput.value);
  if (loginResult) {
    window.location.href = 'home.html';
  } else {
    window.alert('Error: Password is not correct!');
    loginPasswordInput.value = '';
    loginPasswordInput.focus();
  }
});

loginForm.addEventListener('keypress', e => {
  if (e.key === 'Enter') loginButton.click();
});

if (window.location.hash === '#register') {
  registerTabButton.click();
} else {
  loginTabButton.click();
}
