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
  AOO: ['lrl', 'url', 'apa', 'apw'],
  VOO: ['lrl', 'url', 'vpa', 'vpw'],
  VVI: ['lrl', 'url', 'vpa', 'vpw', 'vs', 'vrp', 'hrl', 'rs']
};

// This map sets the name, unit, range, increment and default value for the parameters
// Some parameters have two ranges with different step sizes (see PACEMAKER.pdf)
// mode: [name, unit, [[min, max, increment]], default, switch_on_off]
const paramConfigs = {
  LRL: ['Lower Rate Limit', 'ppm', [[30, 175, 5], [50, 90, 1]], 60],
  URL: ['Upper Rate Limit', 'ppm', [[50, 175, 5]], 120],
  APA: ['Atrial Pulse Amplitude', 'V', [[0.5, 7.0, 0.5], [0.5, 3.2, 0.1]], 3.5, true],
  VPA: ['Ventricular Pulse Amplitude', 'V', [[0.5, 7.0, 0.5], [0.5, 3.2, 0.1]], 3.5, true],
  APW: ['Atrial Pulse Width', 'ms', [[0.1, 1.9, 0.1], [0.05, 0.1, 0.05]], 0.4],
  VPW: ['Ventricular Pulse Width', 'ms', [[0.1, 1.9, 0.1], [0.05, 0.1, 0.05]], 0.4],
  VS:  ['Ventricular Sensitivity', 'mV', [[0.5, 10, 0.5], [0.25, 1, 0.25]], 2.5],
  VRP: ['Ventricular Refractory Period (VRP)', 'ms', [[150, 500, 10]], 320],
  ARP: ['Atrial Refractory Period (ARP)', 'ms', [[150, 500, 10]], 250],
  HRL: ['Hysteresis Rate Limit', 'ppm', [[30, 175, 5], [50, 90, 1]], 0, true],
  RS:  ['Rate Smoothing', '%', [[0, 25, 3], [20, 26, 5]], 0, true]
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

const selectPacingMode = async () => {
  slidersContainer.innerHTML = '';

  const selectedMode = pacingModeInput.value.toUpperCase();
  pacingModesParams[selectedMode].forEach(param => {
    const config = paramConfigs[param.toUpperCase()];
    const range = config[2][0]; // this is the bigger range
    let value = config[3];  // default value

    if (currentUser.data.params && currentUser.data.params[pacingModeInput.value]) {
      // If a value is already stored, use this instead of the default
      const v = currentUser.data.params[pacingModeInput.value][param];
      if (v !== undefined) {
        value = v;
      }
    }

    let sliderColWidth = 10;
    const disabled = value == 0 ? true : false;

    // Add HTML code for parameter ON/OFF switch to the container
    if (config[4]) {
      sliderColWidth = 9;
      slidersContainer.innerHTML += [
        '<div class="col-1 form-check form-switch">',
        `  <br><input class="form-check-input" type="checkbox" role="switch"`,
        `   oninput="toggleSwitch('${param}')" id="switch-${param}">`,
        `  <label for="switch-${param}" class="form-label" id="label-switch-${param}">${disabled ? 'OFF' : 'ON'}</label>`,
        '</div>', ''
      ].join("\n");
    }

    // Add HTML code for slider and text field to the container
    slidersContainer.innerHTML += [
      `<div class="col-${sliderColWidth}">`,
      `  <label for="input-range-${param}" class="form-label">${config[0]}</label>`,
      `  <input type="range" min="${range[0]}" max="${range[1]}" step="${range[2]}" value="${disabled ? config[3] : value}"`,
      `    class="form-range" oninput="handleInput(this.id, '${param}', this.value)" id="input-range-${param}"${disabled ? ' disabled' : ''}>`,
      '</div>',
      '<div class="col-2">',
      `  <label for="text-${param}" class="form-label"><br></label>`,
      '  <div class="input-group mb-3">',
      `    <input type="text" value="${disabled ? '-' : value}" class="form-control text-center" id="text-${param}" aria-label="${config[0]} (${config[1]})" readonly>`,
      `    <span class="input-group-text">${config[1]}</span>`,
      '  </div>',
      '</div>', ''
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
    const value = document.getElementById(`text-${param}`).value;
    params[param] = value === '-' ? 0 : parseFloat(value);
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

async function handleInput(id, param, value) {
  const ranges = paramConfigs[param.toUpperCase()][2];

  // If a second range exists, switch the step size when neccessary
  if (ranges[1]) {
    const slider = document.getElementById(id);
    if ((param === 'vpw' || param === 'apw' || param == 'vs') && value <= ranges[0][0]) {
      slider.step = ranges[1][2];
      slider.min = ranges[1][2];
    } else if (ranges[1][0] < value && value < ranges[1][1]) {
      slider.step = ranges[1][2];
    } else {
      slider.step = ranges[0][2];
      slider.min = ranges[0][0];
    }
    console.log(slider.min, value, slider.max, slider.step);
  }

  // Set the text field to the current value of the slider
  document.getElementById(`text-${param}`).value = value;
}

async function toggleSwitch(param) {
  const label = document.getElementById(`label-switch-${param}`);
  const slider = document.getElementById(`input-range-${param}`);
  const text = document.getElementById(`text-${param}`);

  if (label.textContent === 'ON') {
    label.textContent = 'OFF';
    slider.disabled = true;
    text.value = '-';
  } else {
    label.textContent = 'ON';
    slider.disabled = false;
    text.value = slider.value;
  }
}