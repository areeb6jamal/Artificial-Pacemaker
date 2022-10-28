const userItem = document.getElementById("itm-user");
const logoutItem = document.getElementById('itm-logout');
const connectButton = document.getElementById('btn-connect');
const alertPlaceholder = document.getElementById('liveAlertPlaceholder');

const dsnInput = document.getElementById('input-dsn');
const dsnButton = document.getElementById('btn-dsn');

const pacingModeInput = document.getElementById('select-pacing');
const slidersContainer = document.getElementById('container-sliders');
const saveButton = document.getElementById('btn-save');

// Mapping between pacing modes and their parameters
const pacingModesParams = {
  NONE: [],
  AOO: ['lrl', 'url', 'aa', 'apw'],
  VOO: ['lrl', 'url', 'va', 'vpw'],
  VVI: ['lrl', 'url', 'va', 'vpw', 'vrp']
};

// This map sets the name, unit, range, increment and default value for the parameters
// Some parameters have two ranges with different step sizes (see PACEMAKER.pdf)
// mode: [name, unit, [[min, max, increment]], default]
const paramConfigs = {
  LRL: ['Lower Rate Limit', 'ppm', [[30, 175, 5], [50, 90, 1]], 60],
  URL: ['Upper Rate Limit', 'ppm', [[50, 175, 5]], 120],
  AA:  ['Atrial Amplitude', 'V', [[0, 7.0, 0.5], [0.5, 3.2, 0.1]], 3.5],
  APW: ['Atrial Pulse Width', 'ms', [[0.1, 1.9, 0.1], [0.05, 0.1, 0.05]], 0.4],
  VA:  ['Ventricular Amplitude', 'V', [[0, 7.0, 0.5], [0.5, 3.2, 0.1]], 3.5],
  VPW: ['Ventricular Pulse Width', 'ms', [[0.1, 1.9, 0.1], [0.05, 0.1, 0.05]], 0.4],
  VRP: ['Ventricular Refractory Period (VRP)', 'ms', [[150, 500, 10]], 320],
  ARP: ['Atrial Refractory Period (ARP)', 'ms', [[150, 500, 10]], 250],
};

let currentUser = User.currentUser;
if (!currentUser) {
  currentUser = new User(0, 'User', '', '');
}
userItem.textContent = currentUser.username;
if (currentUser.data.dsn) {
  dsnInput.value = currentUser.data.dsn;
}

logoutItem.addEventListener('click', () => {
  currentUser.logout();
  window.location.href = 'index.html';
});

dsnButton.addEventListener('click', () => {
  if (dsnInput.disabled) {
    dsnInput.disabled = false;
    dsnButton.innerText = 'Save';
  } else {
    currentUser.data.dsn = dsnInput.value;
    currentUser.update();
    dsnInput.disabled = true;
    dsnButton.innerText = 'Update';
  }
});

let deviceConnected = false;
connectButton.addEventListener('click', () => {
  if (currentUser.data.dsn) {
    if (deviceConnected) {
      customAlert(`Device (S/N ${currentUser.data.dsn}) disconnected`, 'warning');
      connectButton.className = 'btn btn-success';
      connectButton.innerText = 'Connect Device';
      deviceConnected = false;
    } else {
      connectButton.disabled = true;
      customAlert(`Connecting Device (S/N ${currentUser.data.dsn}) please wait...`, 'warning');
      setTimeout(() => {
        customAlert(`Device (S/N ${currentUser.data.dsn}) successfully connected!`, 'success');
        connectButton.className = 'btn btn-danger';
        connectButton.innerText = 'Disconnect Device';
        connectButton.disabled = false;
        deviceConnected = true;
      }, 3500);
    }
  }
});

const selectPacingMode = () => {
  slidersContainer.innerHTML = '';

  const selectedMode = pacingModeInput.value.toUpperCase();
  pacingModesParams[selectedMode].forEach(param => {
    const config = paramConfigs[param.toUpperCase()];
    const range = config[2][0]; // this is the bigger range
    let value = config[3];  // default value
    if (currentUser.data.params && currentUser.data.params[pacingModeInput.value]) {
      // If a value is already stored, use this instead of the default
      const v = currentUser.data.params[pacingModeInput.value][param];
      if (v != null) {
        value = v;
      }
    }

    // Add HTML code for slider and text field to the container
    slidersContainer.innerHTML += [
      '<div class="col-8">',
      `  <label for="input-range-${param}" class="form-label">${config[0]}</label>`,
      `  <input type="range" min="${range[0]}" max="${range[1]}" step="${range[2]}" value="${value}"`,
      `    class="form-range" oninput="handleInput(this.id, '${param}', this.value)" id="input-range-${param}">`,
      '</div>',
      '<div class="col-2">',
      `  <label for="text-${param}" class="form-label"><br></label>`,
      '  <div class="input-group mb-3">',
      `    <input type="text" value="${value}" class="form-control text-center" id="text-${param}" aria-label="${config[0]} (${config[1]})" disabled>`,
      `    <span class="input-group-text">${config[1]}</span>`,
      '  </div>',
      '</div>'
    ].join("\n");
  });

  if (selectedMode === 'NONE') {
    saveButton.disabled = true;
  } else {
    saveButton.disabled = false;
  }
};

pacingModeInput.addEventListener('input', selectPacingMode);
window.addEventListener('load', selectPacingMode);

saveButton.addEventListener('click', async () => {
  params = {};

  const selectedMode = pacingModeInput.value.toUpperCase();
  pacingModesParams[selectedMode].forEach(param => {
    params[param] = document.getElementById(`input-range-${param}`).value;
  });

  if (!currentUser.data.params) {
    currentUser.data.params = {};
  }
  currentUser.data.params[pacingModeInput.value] = params;
  currentUser.update();
});

function customAlert(message, type) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
    `   <div>&#9432; ${message}</div>`,
    `   <button type="button" id="btn-alert-${type}" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`,
    '</div>'
  ].join('');

  alertPlaceholder.append(wrapper);

  setTimeout(() => {
    document.getElementById(`btn-alert-${type}`).click();
  }, 3500);
}

function handleInput(id, param, value) {
  const ranges = paramConfigs[param.toUpperCase()][2];
  console.log(id, param, value);

  // If a second range exists, switch the step size when neccessary
  if (ranges[1]) {
    if ((param === 'vpw' || param === 'apw') && value <= 0.1) {
      console.log("here");
      const self = document.getElementById(id);
      self.step = 0.05;
      self.min = 0.05;
    } else if (ranges[1][0] < value && value < ranges[1][1]) {
      const self = document.getElementById(id);
      self.step = ranges[1][2];
    } else {
      const self = document.getElementById(id);
      self.step = ranges[0][2];
      self.min = ranges[0][0];
    }
  }

  // Set the text field to the current value of the slider
  document.getElementById(`text-${param}`).value = value;
}