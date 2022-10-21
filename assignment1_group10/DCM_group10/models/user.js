let highestUserId = -1;
let currentUser = null;

class User {
  constructor(id, username, email, password) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;

    if (highestUserId < 0) {
      User.setHighestUserId();
    }
  }

  async register() {
    if (User.getUserByUsername(this.username) != null) {
      return false;
    }

    this.password = await window.eAPI.bcryptHash(this.password);

    // Save user in local storage
    this.id = ++highestUserId;
    localStorage.setItem(this.id, JSON.stringify([String(this.username),
      String(this.email), String(this.password)]));

    return true;
  }

  async login(plaintextPassword) {
    const result = await window.eAPI.bcryptCompare(plaintextPassword, this.password);
    if (result === true) {
      currentUser = this;
      return true;
    } else {
      return false;
    }
  }

  update() {
    if (this.id < 0) {
      return false;
    }

    // Save user in local storage
    localStorage.setItem(this.id, JSON.stringify([String(this.username),
      String(this.email), String(this.password)]));
  }

  delete() {
    // Delete user from local storage
    localStorage.removeItem(this.id);
  }

  static get highestUserId() {
    return highestUserId;
  }

  static get currentUser() {
    return currentUser;
  }

  static getUserByUsername(username) {
    let user = null;

    Object.entries(localStorage).forEach(entry => {
      const u = JSON.parse(entry[1]);
      if (u[0] == username) {
        user = new User(entry[0], u[0], u[1], u[2]);
      }
    });

    return user;
  }

  static setHighestUserId() {
    Object.entries(localStorage).forEach(entry => {
      if (entry[0] > highestUserId) {
        highestUserId = entry[0];
      }
    });
  }
}