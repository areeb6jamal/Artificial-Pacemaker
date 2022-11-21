const User = require('./models/user.js');
const Connection = require('./connection.js');

const userItem = document.getElementById('itm-user');
const logoutItem = document.getElementById('itm-logout');
const connectButton = document.getElementById('btn-connect');
const alertContainer = document.getElementById('container-alert');

const dsnInput = document.getElementById('input-dsn');
const dsnButton = document.getElementById('btn-dsn');
const pacingModeInput = document.getElementById('select-pacing');
const slidersContainer = document.getElementById('container-sliders');
const saveButton = document.getElementById('btn-save');
const writeButton = document.getElementById('btn-write');

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
  APW: ['Atrial Pulse Width', 'ms', [[0.1, 1.9, 0.1], []], 0.4],
  VPW: ['Ventricular Pulse Width', 'ms', [[0.1, 1.9, 0.1], []], 0.4],
  VS:  ['Ventricular Sensitivity', 'mV', [[0.5, 10, 0.5], []], 2.5],
  VRP: ['Ventricular Refractory Period (VRP)', 'ms', [[150, 500, 10]], 320],
  ARP: ['Atrial Refractory Period (ARP)', 'ms', [[150, 500, 10]], 250],
  HRL: ['Hysteresis Rate Limit', 'ppm', [[30, 175, 5], [50, 90, 1]], 0, true],
  RS:  ['Rate Smoothing', '%', [[3, 24, 3], []], 0, true]
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

const serialConnection = new Connection();
connectButton.addEventListener('click', async () => {
  if (currentUser.data.dsn) {
    if (serialConnection.isConnected) {
      serialConnection.disconnect();
    } else {
      connectButton.disabled = true;
      customAlert('warning', `Connecting device S/N:${currentUser.data.dsn} please wait...`, 2.5);

      if (await serialConnection.connect(currentUser.data.dsn)) {
        serialConnection.serialPort.on('close', serialConnectionClosed);
        setTimeout(() => {
          customAlert('success', `Device S/N:${currentUser.data.dsn} successfully connected!`);
          connectButton.className = 'btn btn-danger';
          connectButton.innerText = 'Disconnect Device';
          connectButton.disabled = false;
          writeButton.disabled = pacingModeInput.value === 'none' ? true : false;
        }, 2.8 * 1000);
      } else {
        setTimeout(() => {
          customAlert('danger', `Unable to connect device S/N:${currentUser.data.dsn}. Check USB cable and serial number!`, 10);
          connectButton.disabled = false;
        }, 2.8 * 1000);
      }
    }
  }
});

const serialConnectionClosed = () => {
  serialConnection.disconnect();
  customAlert('warning', `Device S/N:${currentUser.data.dsn} disconnected`);
  connectButton.className = 'btn btn-success';
  connectButton.innerText = 'Connect Device';
  writeButton.disabled = true;
};

const selectPacingMode = async () => {
  slidersContainer.innerHTML = '';
  const selectedMode = pacingModeInput.value.toUpperCase();

  pacingModesParams[selectedMode].forEach(param => {
    const config = paramConfigs[param.toUpperCase()];
    let value = config[3]; // default value

    if (currentUser.data.params && currentUser.data.params[pacingModeInput.value]) {
      // If a value is already stored in database, use it instead of the default
      const v = currentUser.data.params[pacingModeInput.value][param];
      if (v !== undefined) {
        value = v;
      }
    }

    // Creates a slider with a text field for the paramter
    createParameterInput(param, config, value);
  });

  if (selectedMode === 'NONE') {
    saveButton.disabled = true;
    writeButton.disabled = true;
  } else {
    saveButton.disabled = false;
    writeButton.disabled = serialConnection.isConnected ? false : true;
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

writeButton.addEventListener('click', async () => {
  console.log('writeButton clicked...');
  params = {};

  const selectedMode = pacingModeInput.value.toUpperCase();
  pacingModesParams[selectedMode].forEach(param => {
    const value = document.getElementById(`text-${param}`).value;
    params[param] = value === '-' ? 0 : parseFloat(value);
  });

  serialConnection.writeData('pparams', selectedMode, params);
});

function createParameterInput(param, config, value) {
  const range = config[2][0]; // range the input must cover
  const disabled = value == 0 ? true : false;

  // Create HTML element for slider and add label with switch (if required)
  const slider = document.createElement('div');
  slidersContainer.appendChild(slider);
  slider.className = 'col-md-9';

  if (config[4]) {
    // Add ON/OFF switch for the parameter
    slider.innerHTML = [
      `<label for="input-range-${param}" class="form-label"><div class="d-flex my-switch">`,
      `  <div class="form-text">${config[0]}</div>`,
      '  <div class="form-check form-switch form-check-inline">',
      `    <input class="form-check-input form-check-inline" type="checkbox" role="switch"`,
      `     oninput="toggleSwitch('${param}')" id="switch-${param}"${disabled ? '' : ' checked'}>`,
      '  </div>',
      `  <div class="form-text" id="label-switch-${param}">${disabled ? 'OFF' : 'ON'}</div>`,
      '</div></label>', ''
    ].join("\n");
  } else {
    slider.innerHTML = `<label for="input-range-${param}" class="form-label">${config[0]}</label>`;
  }

  // Add HTML code for the actual slider to the element
  slider.innerHTML += [
    `<input type="range" min="${range[0]}" max="${range[1]}" step="${range[2]}" value="${disabled ? config[3] : value}"`,
    ` class="form-range" oninput="handleInput(this, '${param}')" id="input-range-${param}"${disabled ? ' disabled' : ''}>`, ''
  ].join("\n");

  // Create HTML element for slider's text field and add it to the container
  const sliderText = document.createElement('div');
  slidersContainer.appendChild(sliderText);
  sliderText.className = 'col-md-3';

  sliderText.innerHTML = [
    `<label for="text-${param}" class="form-label"><br></label>`,
    '<div class="input-group mb-3">',
    `  <input type="text" value="${disabled ? '-' : value}" class="form-control text-center" id="text-${param}" aria-label="${config[0]} (${config[1]})" readonly>`,
    `  <span class="input-group-text">${config[1]}</span>`,
    '</div>', ''
  ].join("\n");
}

function customAlert(type, message, timeout = 5) {
  alertContainer.innerHTML = [
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
    `   <div>&#9432; ${message}</div>`,
    `   <button type="button" id="btn-alert" class="btn-close" data-bs-dismiss="alert" onclick="addAlertPlaceholder()"></button>`,
    '</div>'
  ].join('');

  setTimeout(() => {
    const btn = document.getElementById('btn-alert');
    if (btn) btn.click();
  }, timeout * 1000);
}

function addAlertPlaceholder() {
  alertContainer.innerHTML = '<div class="alert hide" role="alert"><div><br></div></div>';
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

function handleInput(slider, param) {
  const ranges = paramConfigs[param.toUpperCase()][2];

  // Handle the input depending on the specific parameter (i.e. switch the step size)
  switch (param.toUpperCase()) {
    case 'LRL':
      checkBoundriesLRL(slider, ranges);
      break;
    case 'URL':
      checkBoundriesURL(slider);
      break;
    case 'VPW': case 'APW':
      switchStepSizePulseWidth(slider);
      break;
    case 'VS':
      switchStepSizePulseSensitivity(slider);
      break;
    case 'RS':
      switchStepSizeRateSmoothing(slider);
      break;
    default:
      if (ranges[1]) {
        // APA, VPA, HRL
        switchStepSize(slider, ranges);
      }
  }

  // Set the text field to the current value of the slider
  document.getElementById(`text-${param}`).value = slider.value;
}

function checkBoundriesLRL(lrlSlider, ranges) {
  const urlSlider = document.getElementById('input-range-url');

  if (parseInt(lrlSlider.value) > parseInt(urlSlider.value)) {
    lrlSlider.value = urlSlider.value;
  } else {
    switchStepSize(lrlSlider, ranges);
  }
}

function checkBoundriesURL(urlSlider) {
  const lrlSlider = document.getElementById('input-range-lrl');

  if (parseInt(urlSlider.value) < parseInt(lrlSlider.value)) {
    urlSlider.value = lrlSlider.value;
  }
}

function switchStepSize(slider, ranges) {
  if (ranges[1][0] < slider.value && slider.value < ranges[1][1]) {
    slider.step = ranges[1][2];
  } else {
    slider.step = ranges[0][2];
  }
}

function switchStepSizePulseWidth(slider) {
  if (slider.value == 0.1) {
    slider.step = 0.05;
    slider.min = 0.05;
  } else if (slider.value == 0.15) {
    slider.step = 0.1;
    slider.min = 0.1;
    slider.value += 0.05;
  }
}

function switchStepSizePulseSensitivity(slider) {
  if (slider.value == 1) {
    slider.step = 0.25;
    slider.min = 0.25;
  } else if (slider.value == 1.25) {
    slider.step = 0.5;
    slider.min = 0.5;
    slider.value += 0.25;
  }
}

function switchStepSizeRateSmoothing(slider) {
  if (slider.value == 21) {
    slider.step = 5;
    slider.min = 5;
    slider.max = 25;
  } else if (slider.value == 20) {
    slider.step = 3;
    slider.min = 3;
    slider.max = 24;
    slider.value += 1;
  }
}