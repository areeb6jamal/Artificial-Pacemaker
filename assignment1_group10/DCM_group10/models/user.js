class User {
  constructor(id, username, password) {
    this.id = id;
    this.username = username;
    this.password = password;
  }

  save() {
    // Save user in local storage
    localStorage.setItem(this.id, JSON.stringify(this));
  }

  delete() {
    // Delete user from local storage
    localStorage.removeItem(this.id);
  }

  static getUserByUsername(username) {
    const user = null;

    Object.entries(localStorage).forEach(entry => {
      const u = JSON.parse(entry[1]);
      if (u.username == username) {
        user = u;
      }
    });

    return user;
  }
}