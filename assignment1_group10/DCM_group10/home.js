const userDropdown = document.getElementById("dropdown-user");
const logoutItem = document.getElementById("itm-logout");

if (!User.currentUser) {
  userDropdown.textContent = "User";
} else {
  userDropdown.textContent = User.currentUser.username;
}

logoutItem.addEventListener('click', () => {
  User.currentUser.logout();
  window.location.href = "index.html";
});