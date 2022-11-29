// Mapping between AT values and their names
const activityThresValues = {
  '7': 'V-Low',
  '14': 'Low',
  '21': 'Med-Low',
  '28': 'Med',
  '35': 'Med-High',
  '42': 'High',
  '49': 'V-High'
};

class ParamsView {
  constructor() {
    this.viewContainer = document.getElementById('container-view');
    this.eventListeners = [];
  }

  show(dsn = '', serialConnection = false) {
    document.title = 'Pacemaker DCM · Parameters';

    this.viewContainer.innerHTML = [
      '<h2>Pacemaker Parameters</h2>',
      '<p>Select a pacing mode below to start viewing and configuring the corresponding parameters.</p>',
      '<br>',
      '<div class="col-md-9">',
      '  <div class="input-group mb-3">',
      '    <span class="input-group-text">Device Serial Number</span>',
      '    <input type="text" id="input-dsn" class="form-control" aria-label="Serial Number" disabled>',
      '    <button class="btn btn-secondary" id="btn-dsn" type="button">Edit</button>',
      '  </div>',
      '</div>',
      '<div class="col-md-9">',
      '  <div class="input-group mb-3">',
      '    <div class="form-floating">',
      '      <select class="form-select" id="select-pacing" aria-label="Pacing Mode select">',
      '        <option value="none" selected>Select Pacing Mode</option>',
      '        <option value="aoo">AOO</option>',
      '        <option value="voo">VOO</option>',
      '        <option value="aai">AAI</option>',
      '        <option value="vvi">VVI</option>',
      '        <option value="aoor">AOOR</option>',
      '        <option value="voor">VOOR</option>',
      '        <option value="aair">AAIR</option>',
      '        <option value="vvir">VVIR</option>',
      '      </select>',
      '        <label for="floatingSelect">Pacing Mode</label>',
      '    </div>',
      `    <button type="button" class="col btn btn-outline-primary" id="btn-read"${serialConnection ? '' : ' disabled'}>`,
      '      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-box-arrow-down" viewBox="0 0 16 16">',
      '        <path fill-rule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z" />',
      '        <path fill-rule="evenodd" d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z" />',
      '      </svg>',
      '    Pacemaker Read</button>',
      `    <button type="button" class="col btn btn-outline-primary" id="btn-pace-now"${serialConnection ? '' : ' disabled'}>`,
      '      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-heart-pulse" viewBox="0 0 16 16">',
      '        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053.918 3.995.78 5.323 1.508 7H.43c-2.128-5.697 4.165-8.83 7.394-5.857.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17c3.23-2.974 9.522.159 7.394 5.856h-1.078c.728-1.677.59-3.005.108-3.947C13.486.878 10.4.28 8.717 2.01L8 2.748ZM2.212 10h1.315C4.593 11.183 6.05 12.458 8 13.795c1.949-1.337 3.407-2.612 4.473-3.795h1.315c-1.265 1.566-3.14 3.25-5.788 5-2.648-1.75-4.523-3.434-5.788-5Z" />',
      '        <path d="M10.464 3.314a.5.5 0 0 0-.945.049L7.921 8.956 6.464 5.314a.5.5 0 0 0-.88-.091L3.732 8H.5a.5.5 0 0 0 0 1H4a.5.5 0 0 0 .416-.223l1.473-2.209 1.647 4.118a.5.5 0 0 0 .945-.049l1.598-5.593 1.457 3.642A.5.5 0 0 0 12 9h3.5a.5.5 0 0 0 0-1h-3.162l-1.874-4.686Z" />',
      '      </svg>',
      '    Pace Now</button>',
      '  </div>',
      '</div>',
      '<br>',
      '<div class="row align-items-center" id="container-sliders"></div>',
      '<br>',
      '<div class="row container text-center">',
      '  <div class="col-md-3">',
      '    <button type="button" class="col btn btn-primary" id="btn-save" disabled>',
      '      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">',
      '        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />',
      '        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z" />',
      '      </svg>',
      '    Save on DCM</button>',
      '  </div>',
      '  <div class="col-md-4">',
      `    <button type="button" class="col btn btn-primary" id="btn-write"${serialConnection ? '' : ' disabled'}>`,
      '      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-box-arrow-in-up" viewBox="0 0 16 16">',
      '        <path fill-rule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z" />',
      '        <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z" />',
      '      </svg>',
      '    Pacemaker Write</button>',
      '  </div>',
      '  <div class="col-md-3">',
      '    <button type="button" class="col btn btn-outline-danger" id="btn-cancel">',
      '      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">',
      '        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />',
      '        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />',
      '      </svg>',
      '    Discard Input</button>',
      '  </div>',
      '</div>'
    ].join("\n");

    this.dsnInput = document.getElementById('input-dsn');
    this.dsnButton = document.getElementById('btn-dsn');
    this.pacingModeInput = document.getElementById('select-pacing');
    this.readButton = document.getElementById('btn-read');
    this.paceNowButton = document.getElementById('btn-pace-now');
    this.slidersContainer = document.getElementById('container-sliders');
    this.saveButton = document.getElementById('btn-save');
    this.writeButton = document.getElementById('btn-write');
    this.cancelButton = document.getElementById('btn-cancel');

    this.dsnInput.value = dsn;

    this.eventListeners.forEach(l => {
      document.getElementById(l.id).addEventListener(l.on, l.action);
    });
  }

  hide() {
    this.viewContainer.innerHTML = '';
  }

  createParameterInput(param, config, value) {
    const range = config[2][0]; // range the input must cover
    const disabled = value == 0 ? true : false;

    // Create HTML element for slider and add label with switch (if required)
    const slider = document.createElement('div');
    this.slidersContainer.appendChild(slider);
    slider.className = 'col-md-9';

    if (config[4]) {
      // Add ON/OFF switch for the parameter
      slider.innerHTML = [
        `<label for="input-range-${param}" class="form-label"><div class="d-flex my-switch">`,
        `  <div class="form-text">${config[0]}</div>`,
        '  <div class="form-check form-switch form-check-inline">',
        `    <input class="form-check-input form-check-inline" type="checkbox" role="switch"`,
        `      id="switch-${param}"${disabled ? '' : ' checked'}>`,
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
      ` class="form-range" id="input-range-${param}"${disabled ? ' disabled' : ''}>`, ''
    ].join("\n");

    // Create HTML element for slider's text field and add it to the container
    const sliderText = document.createElement('div');
    this.slidersContainer.appendChild(sliderText);
    sliderText.className = 'col-md-3';

    if (param === 'at') {
      value = activityThresValues[value];
    }
    sliderText.innerHTML = [
      `<label for="text-${param}" class="form-label"><br></label>`,
      '<div class="input-group mb-3">',
      `  <input type="text" value="${disabled ? '-' : value}" class="form-control text-center" id="text-${param}" aria-label="${config[0]} (${config[1]})" readonly>`,
      `  <span class="input-group-text">${config[1]}</span>`,
      '</div>', ''
    ].join("\n");

    document.getElementById(`input-range-${param}`).addEventListener('input', e => this.handleInput(e.target, param));
    if (config[4]) document.getElementById(`switch-${param}`).addEventListener('input', () => this.toggleSwitch(param));
  }

  async toggleSwitch(param) {
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

  handleInput(slider, param) {
    const ranges = paramConfigs[param][2];

    // Handle the input depending on the specific parameter
    switch (param) {
      case 'lrl':
        this.checkBoundriesLRL(slider, ranges);
        break;
      case 'url':
        this.checkBoundriesURL(slider);
        break;
    }

    // Set the text field to the current value of the slider
    if (param === 'at') {
      document.getElementById(`text-${param}`).value = activityThresValues[slider.value];
    } else {
      document.getElementById(`text-${param}`).value = slider.value;
    }
  }

  checkBoundriesLRL(lrlSlider, ranges) {
    const urlSlider = document.getElementById('input-range-url');

    if (parseInt(lrlSlider.value) > parseInt(urlSlider.value)) {
      lrlSlider.value = urlSlider.value;
    } else {
      this.switchStepSize(lrlSlider, ranges);
    }
  }

  checkBoundriesURL(urlSlider) {
    const lrlSlider = document.getElementById('input-range-lrl');

    if (parseInt(urlSlider.value) < parseInt(lrlSlider.value)) {
      urlSlider.value = lrlSlider.value;
    }
  }

  switchStepSize(slider, ranges) {
    if (ranges[1][0] < slider.value && slider.value < ranges[1][1]) {
      slider.step = ranges[1][2];
    } else {
      slider.step = ranges[0][2];
    }
  }
}

module.exports = ParamsView;