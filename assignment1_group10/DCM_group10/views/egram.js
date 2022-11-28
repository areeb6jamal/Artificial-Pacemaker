class EgramView {
  constructor() {
    this.viewContainer = document.getElementById('container-view');
    this.atrialPlot = document.createElement('div');
    this.ventricalPlot = document.createElement('div');
    this.atrialPlot.style = 'width:100%;height:300px;';
    this.ventricalPlot.style = 'width:100%;height:300px;';
    this.plotPurgeInterval = null;
  }

  show() {
    document.title = 'Pacemaker DCM · Electrocardiogram';
    this.viewContainer.innerHTML = [
      '<h2>Electrocardiogram (ECG)</h2>',
      '<br></br>'
    ].join("\n");

    this.viewContainer.appendChild(this.atrialPlot);
    this.viewContainer.appendChild(this.ventricalPlot);

    Plotly.newPlot(this.atrialPlot, [{
      x: [],
      y: [],
      type: 'line',
      mode: 'lines'
    }], {
      margin: { t: 50 },
      xaxis: { title: 'Time (s)' },
      yaxis: { title: 'Amplitude (V)' },
      title: 'Atrial Signal'
    }, { showSendToCloud: false });

    Plotly.newPlot(this.ventricalPlot, [{
      x: [],
      y: [],
      type: 'line',
      mode: 'lines'
    }], {
      margin: { t: 50 },
      xaxis: { title: 'Time (s)' },
      yaxis: { title: 'Amplitude (V)' },
      title: 'Ventrical Signal'
    }, { showSendToCloud: false });

    this.plotPurgeInterval = setInterval(() => {
      Plotly.update(this.atrialPlot, { x: [[]], y: [[]] }, [0]);
      Plotly.update(this.ventricalPlot, { x: [[]], y: [[]] }, [0]);
    }, 60000);
  }

  hide() {
    this.viewContainer.innerHTML = '';
    clearInterval(this.plotPurgeInterval);
  }
}

module.exports = EgramView;