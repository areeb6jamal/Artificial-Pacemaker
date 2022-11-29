const ParamsView = require('./views/params.js');
const EgramView = require('./views/egram.js');
const AlertView = require('./views/alert.js');
const User = require('./models/user.js');
const Connection = require('./controllers/connection.js');
const Plotly = require('plotly.js-dist-min');
const { jsPDF } = require('jspdf');

const egramButton = document.getElementById('btn-egram');
const paramsButton = document.getElementById('btn-params');
const newPatientButton = document.getElementById('btn-new-patient');
const aboutButton = document.getElementById('btn-about');
const userItem = document.getElementById('itm-user');
const logoutItem = document.getElementById('itm-logout');
const connectButton = document.getElementById('btn-connect');
const printButton = document.getElementById('btn-print');

// Text to be displayed in the "About" tab of the GUI
const aboutText =
  'Application Model Number: 1.0\n' +
  'Application Software Revision Number: 1.0.0\n' +
  'DCM Serial Number: 001\n' +
  'Institution Name: McMaster University';

// Mapping between pacing modes and their parameters
const pacingModesParams = {
  none: [],
  aoo:  ['lrl', 'url', 'apa', 'apw'],
  voo:  ['lrl', 'url', 'vpa', 'vpw'],
  aai:  ['lrl', 'url', 'apa', 'apw', 'as', 'arp', 'pvarp'],
  vvi:  ['lrl', 'url', 'vpa', 'vpw', 'vs', 'vrp'],
  aoor: ['lrl', 'url', 'msr', 'apa', 'apw', 'at', 'rnt', 'rf', 'ryt'],
  voor: ['lrl', 'url', 'msr', 'vpa', 'vpw', 'at', 'rnt', 'rf', 'ryt'],
  aair: ['lrl', 'url', 'msr', 'apa', 'apw', 'as', 'arp', 'pvarp', 'at', 'rnt', 'rf', 'ryt'],
  vvir: ['lrl', 'url', 'msr', 'vpa', 'vpw', 'vs', 'vrp', 'at', 'rnt', 'rf', 'ryt']
};

// This map sets the name, unit, range, increment and default value for the parameters
// Some parameters have two ranges with different step sizes (see PACEMAKER.pdf)
// mode: [name, unit, [[min, max, increment]], default, switch_on_off]
const paramConfigs = {
  lrl: ['Lower Rate Limit', 'ppm', [[30, 175, 5], [50, 90, 1]], 60],
  url: ['Upper Rate Limit', 'ppm', [[50, 175, 5]], 120],
  msr: ['Maximum Sensor Rate', 'ppm', [[50, 175, 5]], 120],
  apa: ['Atrial Pulse Amplitude', 'V', [[0.1, 5.0, 0.1]], 5, true],
  vpa: ['Ventricular Pulse Amplitude', 'V', [[0.1, 5.0, 0.1]], 5, true],
  apw: ['Atrial Pulse Width', 'ms', [[1, 30, 1]], 1],
  vpw: ['Ventricular Pulse Width', 'ms', [[1, 30, 1]], 1],
  as:  ['Atrial Sensitivity', 'V', [[0, 5, 0.1]], 2.5],
  vs:  ['Ventricular Sensitivity', 'V', [[0, 5, 0.1]], 2.5],
  vrp: ['Ventricular Refractory Period (VRP)', 'ms', [[150, 500, 10]], 320],
  arp: ['Atrial Refractory Period (ARP)', 'ms', [[150, 500, 10]], 250],
  pvarp: ['Post Ventricular Atrial Refractory Period (PVARP)', 'ms', [[150, 500, 10]], 250],
  at:  ['Activity Threshold', 'Thres', [[7, 49, 7]], 28],
  rnt: ['Reaction Time', 'sec', [[10, 50, 10]], 30],
  rf:  ['Response Factor', 'X', [[1, 16, 1]], 8],
  ryt: ['Recovery Time', 'min', [[2, 16, 1]], 5]
};

const paramsView = new ParamsView();
const egramView = new EgramView();
const alertView = new AlertView();
const serialConnection = new Connection();

let currentUser = User.currentUser;
if (!currentUser) {
  currentUser = new User(0, 'User', '', '');
}
userItem.textContent = currentUser.username;
const dsn = currentUser.data.dsn ? currentUser.data.dsn : '';

const aboutButtonClicked = () => window.alert(aboutText);
const logoutClicked = () => {
  currentUser.logout();
  window.location.href = 'index.html';
};

let egramRunning = false;
let startTime = 0;
const paramsButtonClicked = () => {
  if (egramRunning) {
    egramRunning = false;
    egramView.hide();
    paramsView.show(dsn, serialConnection.isConnected);
    serialConnection.writeData('estop');
  }
};

const egramButtonClicked = () => {
  if (!egramRunning) {
    egramRunning = true;
    paramsView.hide();
    egramView.show();
    serialConnection.writeData('egram');
    startTime = Date.now();
  }
};

const egramHandler = (egramData) => {
  const plotSeconds = (Date.now() - startTime) / 1000;
  const timeData = Array.from({length: 9}, (_, i) => i*0.002 + plotSeconds);

  Plotly.extendTraces(egramView.atrialPlot, { x: [timeData], y: [egramData.atrial] }, [0]);
  Plotly.extendTraces(egramView.ventricalPlot, { x: [timeData], y: [egramData.ventrical] }, [0]);

  if (plotSeconds > 5) {
    Plotly.relayout(egramView.atrialPlot, { xaxis: { title: 'Time (s)', range: [plotSeconds-5, plotSeconds] }});
    Plotly.relayout(egramView.ventricalPlot, { xaxis: { title: 'Time (s)', range: [plotSeconds-5, plotSeconds] }});
  }
};
serialConnection.receiveEgramHandler = egramHandler;

const newPatientButtonClicked = () => {
  currentUser.logout();
  window.location.href = 'index.html#register';
};

const connectButtonClicked = async () => {
  if (currentUser.data.dsn) {
    if (serialConnection.isConnected) {
      serialConnection.disconnect();
    } else {
      connectButton.disabled = true;
      alertView.showAlert('warning', `Connecting device S/N:${currentUser.data.dsn} please wait...`, 2.5);

      const connectResult = await serialConnection.connect(currentUser.data.dsn);
      if (connectResult === Connection.SUCCESS) {
        serialConnection.serialPort.on('close', serialConnectionClosed);

        setTimeout(() => {
          alertView.showAlert('success', `Device S/N:${currentUser.data.dsn} successfully connected!`);
          connectButton.className = 'btn btn-danger';
          connectButton.innerHTML = connectButton.innerHTML.replace('Connect', 'Disconnect');
          connectButton.disabled = false;
          paramsView.readButton.disabled = false;
          paramsView.paceNowButton.disabled = false;
          paramsView.writeButton.disabled = paramsView.pacingModeInput.value === 'none' ? true : false;
          if (egramRunning) {
            serialConnection.writeData('egram');
            startTime = Date.now();
          }
        }, 2.8 * 1000);
      } else if (connectResult === Connection.SERIAL_NUM_MISMATCH) {
        setTimeout(() => {
          alertView.showAlert('danger', `USB device not matching S/N:${currentUser.data.dsn}. Connect other device!`, 10);
          connectButton.disabled = false;
        }, 2.8 * 1000);
      } else {
        setTimeout(() => {
          alertView.showAlert('danger', `Unable to connect device S/N:${currentUser.data.dsn}. Check USB connection!`, 10);
          connectButton.disabled = false;
        }, 2.8 * 1000);
      }
    }
  }
};

const serialConnectionClosed = () => {
  serialConnection.disconnect();
  alertView.showAlert('warning', `Device S/N:${currentUser.data.dsn} disconnected`);
  connectButton.className = 'btn btn-outline-success';
  connectButton.innerHTML = connectButton.innerHTML.replace('Disconnect', 'Connect');
  paramsView.readButton.disabled = true;
  paramsView.paceNowButton.disabled = true;
  paramsView.writeButton.disabled = true;
};

const printButtonClicked = () => {
  if (egramRunning) {
    window.print();
    return;
  }

  const doc = new jsPDF();
  const fileName = 'brady-parameters-report.pdf';
  const infoText = aboutText + '\nDate: ' + new Date(Date.now()).toLocaleString();

  doc.text('Pacemaker DCM - Bradycardia Parameters Report', 10, 20);
  doc.text(infoText, 10, 40);
  doc.text(`Pacing Mode: ${paramsView.pacingModeInput.value.toUpperCase()}`, 10, 80);

  let offset = 85;
  const selectedMode = paramsView.pacingModeInput.value;
  pacingModesParams[selectedMode].forEach(param => {
    const paramConfig = paramConfigs[param];
    let value = document.getElementById(`text-${param}`).value;
    if (value === '-') value = 'OFF';

    doc.text(`${paramConfig[0]}:`, 10, offset += 7);
    doc.text(`${param === 'pvarp' ? '\t\t\t' : ''} ${value} ${paramConfig[1]}`, 102, offset);
  });

  doc.save(fileName);
  window.alert('Report was saved to:\n' + fileName);
};

const dsnButtonClicked = () => {
  if (paramsView.dsnInput.disabled) {
    paramsView.dsnInput.disabled = false;
    paramsView.dsnButton.innerText = 'Save';
  } else {
    currentUser.data.dsn = paramsView.dsnInput.value;
    currentUser.update();
    paramsView.dsnInput.disabled = true;
    paramsView.dsnButton.innerText = 'Edit';
  }
};

const selectPacingMode = async (_event, presetParams = null) => {
  if (presetParams) {
    paramsView.pacingModeInput.value = Object.keys(presetParams)[0];
  } else {
    presetParams = currentUser.data.params;
  }

  paramsView.slidersContainer.innerHTML = '';
  const selectedMode = paramsView.pacingModeInput.value;

  pacingModesParams[selectedMode].forEach(param => {
    const config = paramConfigs[param];
    let value = config[3]; // default value

    if (presetParams && presetParams[selectedMode]) {
      // If a value is already stored in database or received from pacemaker, use it instead of the default
      const v = presetParams[selectedMode][param];
      if (v !== undefined) {
        value = v;
      }
    }

    // Creates a slider with a text field for the paramter
    paramsView.createParameterInput(param, config, value);
  });

  if (selectedMode === 'none') {
    paramsView.saveButton.disabled = true;
    paramsView.writeButton.disabled = true;
  } else {
    paramsView.saveButton.disabled = false;
    paramsView.writeButton.disabled = serialConnection.isConnected ? false : true;
  }
};

const readButtonClicked = () => serialConnection.writeData('echo');

const paceNowButtonClicked = () => {
  const paceNowParams = {
    lrl: 65,
    url: 65,
    vpa: 5,
    vpw: 1,
    vs: 0.1,
    vrp: 320
  };

  serialConnection.writeData('pparams', 'vvi', paceNowParams);
};

const saveButtonClicked = async () => {
  const params = getParamsFromInput();

  if (!currentUser.data.params) {
    currentUser.data.params = {};
  }
  currentUser.data.params[paramsView.pacingModeInput.value] = params;
  currentUser.update();
};

const writeButtonClicked = async () => {
  const params = getParamsFromInput();
  const selectedMode = paramsView.pacingModeInput.value;
  serialConnection.writeData('pparams', selectedMode, params);
};

const cancelButtonClicked = () => {
  paramsView.pacingModeInput.value = 'none';
  selectPacingMode();
};


// Register event listeners/handler
connectButton.addEventListener('click', connectButtonClicked);
printButton.addEventListener('click', printButtonClicked);
aboutButton.addEventListener('click', aboutButtonClicked);
logoutItem.addEventListener('click', logoutClicked);
paramsButton.addEventListener('click', paramsButtonClicked);
egramButton.addEventListener('click', egramButtonClicked);
newPatientButton.addEventListener('click', newPatientButtonClicked);

paramsView.eventListeners.push({ id: 'btn-dsn', on: 'click', action: dsnButtonClicked });
paramsView.eventListeners.push({ id: 'select-pacing', on: 'input', action: selectPacingMode });
paramsView.eventListeners.push({ id: 'btn-read', on: 'click', action: readButtonClicked });
paramsView.eventListeners.push({ id: 'btn-pace-now', on: 'click', action: paceNowButtonClicked });
paramsView.eventListeners.push({ id: 'btn-save', on: 'click', action: saveButtonClicked });
paramsView.eventListeners.push({ id: 'btn-write', on: 'click', action: writeButtonClicked });
paramsView.eventListeners.push({ id: 'btn-cancel', on: 'click', action: cancelButtonClicked });
serialConnection.receiveParamsHandler = selectPacingMode;


// Default view after login is parameters view
paramsView.show(dsn);


// Utility Functions

function getParamsFromInput() {
  const params = {};

  const selectedMode = paramsView.pacingModeInput.value;
  pacingModesParams[selectedMode].forEach(param => {
    if (param === 'at') {
      params[param] = parseInt(document.getElementById(`input-range-${param}`).value);
    } else {
      const value = document.getElementById(`text-${param}`).value;
      params[param] = value === '-' ? 0 : parseFloat(value);
    }
  });

  return params;
}