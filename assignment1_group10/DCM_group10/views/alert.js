class AlertView {
  constructor() {
    this.alertContainer = document.getElementById('container-alert');
  }

  showAlert(type, message, timeout = 5) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `   <div>&#9432; ${message}</div>`;

    const closeButton = document.createElement('button');
    closeButton.className = 'btn-close';
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('data-bs-dismiss', 'alert');
    closeButton.addEventListener('click', () => this.setAlertPlaceholder());

    alert.appendChild(closeButton);
    this.alertContainer.innerHTML = '';
    this.alertContainer.appendChild(alert);

    setTimeout(() => {
      if (closeButton) closeButton.click();
    }, timeout * 1000);
  }

  setAlertPlaceholder() {
    this.alertContainer.innerHTML = '<div class="alert hide" role="alert"><div><br></div></div>';
  }
}

module.exports = AlertView;