const loginForm = document.getElementById("login-form");
const loginTabButton = document.getElementById("btn-login-tab");
const registerForm = document.getElementById("register-form");
const registerTabButton = document.getElementById("btn-register-tab");
const button = document.getElementById("btn");
const loginUsernameInput = document.getElementById("input-login-username");
const loginPasswordInput = document.getElementById("input-login-pw");
const loginButton = document.getElementById("btn-login");
const registerUsernameInput = document.getElementById("input-register-username");
const registerEmailInput = document.getElementById("input-register-email");
const registerPasswordInput = document.getElementById("input-register-pw");
const registerButton = document.getElementById("btn-register");

registerTabButton.addEventListener('click', () => {
  loginForm.style.left = "-400px";
  registerForm.style.left = "50px";
  button.style.left = "110px";
});

loginTabButton.addEventListener('click', () => {
  loginForm.style.left = "50px";
  registerForm.style.left = "450px";
  button.style.left = "0px";
});

registerButton.addEventListener('click', async () => {
  const user = new User(-1, registerUsernameInput.value,
    registerEmailInput.value, registerPasswordInput.value);

  if (User.highestUserId == 9) {
    alert("Error: Maximum number of users (10) has been reached!");
    return;
  }

  const registerResult = await user.register();
  if (registerResult == false) {
    alert('Error: Username "' + user.username + '" already exists!');
  }
});

loginButton.addEventListener('click', async () => {
  const user = User.getUserByUsername(loginUsernameInput.value);
  if (user == null) {
    alert("Error: Username does not exist!");
  }

  const loginResult = await user.login(loginPasswordInput.value);
  if (loginResult) {
    alert("Success!");
  } else {
    alert("Error: Password is not correct!");
  }
});

loginTabButton.click();