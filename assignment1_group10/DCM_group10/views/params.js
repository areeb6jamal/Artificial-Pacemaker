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
      `    <button type="button" class="col btn btn-primary" id="btn-read"${serialConnection ? '' : ' disabled'}>Read Parameters from Pacemaker</button>`,
      '  </div>',
      '</div>',
      '<br>',
      '<div class="row align-items-center" id="container-sliders"></div>',
      '<div class="row container text-center">',
      '  <div class="col-md-3">',
      '    <button type="button" class="col btn btn-primary" id="btn-save" disabled>Save on DCM</button>',
      '  </div>',
      '  <div class="col-md-3">',
      '    <button type="button" class="col btn btn-primary" id="btn-write" disabled>Write to Pacemaker</button>',
      '  </div>',
      '  <div class="col-md-3">',
      '    <button type="button" class="col btn btn-danger" id="btn-cancel">CANCEL</button>',
      '  </div>',
      '</div>'
    ].join("\n");

    this.dsnInput = document.getElementById('input-dsn');
    this.dsnButton = document.getElementById('btn-dsn');
    this.pacingModeInput = document.getElementById('select-pacing');
    this.readButton = document.getElementById('btn-read');
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
    const paramU = param.toUpperCase();
    const ranges = paramConfigs[paramU][2];

    // Handle the input depending on the specific parameter
    switch (paramU) {
      case 'LRL':
        this.checkBoundriesLRL(slider, ranges);
        break;
      case 'URL':
        this.checkBoundriesURL(slider);
        break;
    }

    // Set the text field to the current value of the slider
    if (paramU === 'AT') {
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