let highestUserId = -1;

class User {
  constructor(id, username, email, password, data = {}) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.data = data;
  }

  async register() {
    if (User.getUserByUsername(this.username) != null) {
      return false;
    }

    if (highestUserId < 0) {
      User.setHighestUserId();
    }
    this.id = ++highestUserId;

    // Hash the plaintext password
    this.password = await window.eAPI.bcryptHash(this.password);

    // Save user in local storage
    localStorage.setItem(this.username, JSON.stringify([this.id,
      String(this.email), String(this.password), this.data]));

    return true;
  }

  async login(plaintextPassword) {
    const result = await window.eAPI.bcryptCompare(plaintextPassword, this.password);
    if (result === true) {
      User.currentUser = this;
      return true;
    } else {
      return false;
    }
  }

  logout() {
    sessionStorage.removeItem("currentUser");
  }

  update() {
    if (this.id < 0) {
      return false;
    }

    // Save user in local storage
    localStorage.setItem(this.username, JSON.stringify([this.id,
      String(this.email), String(this.password), this.data]));
  }

  delete() {
    // Delete user from local storage
    localStorage.removeItem(this.username);
  }

  static get highestUserId() {
    return highestUserId;
  }

  static get currentUser() {
    let currentUser = null;

    const entry = sessionStorage.getItem("currentUser");
    if (entry) {
      currentUser = User.getUserByUsername(entry);
    }

    return currentUser;
  }

  static set currentUser(currentUser) {
    sessionStorage.setItem("currentUser", currentUser.username);
  }

  static getUserByUsername(username) {
    let user = null;

    const value = localStorage.getItem(username);
    if (value) {
      const u = JSON.parse(value);
      user = new User(u[0], username, u[1], u[2], u[3]);
    }

    return user;
  }

  static setHighestUserId() {
    Object.entries(localStorage).forEach(entry => {
      const u = JSON.parse(entry[1]);
      if (u[0] > highestUserId) {
        highestUserId = u[0];
      }
    });
  }

  static get numRegisteredUsers() {
    return localStorage.length;
  }
}