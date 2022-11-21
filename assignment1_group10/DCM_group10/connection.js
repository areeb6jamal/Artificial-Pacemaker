const { SerialPort } = require('serialport');

// Mapping between pacing modes and their hex value
const pacingModeHex = {
  NONE: 0x00, AOO: 0x01, VOO: 0x02, VVI: 0x03
};

// Mapping between fnCodes and their hex value
const fnCodeHex = {
  egram: 0x2F, echo: 0x31, estop: 0x3E, pparams: 0x37
};

class Connection {
  constructor() {
    this.serialPort = null;
    this.dataBuffer = Buffer.alloc(16);
    this.receiveParamsHandler = null;
  }

  async connect(serialNumber) {
    await SerialPort.list().then((ports, err) => {
      if (err) return console.log('PortsList Error: ', err.message);
      console.log('Ports: ', ports);

      // Connect to the device with matching serial number
      ports.forEach(device => {
        if (device.serialNumber === serialNumber && device.manufacturer === 'SEGGER') {
          this.serialPort = new SerialPort({ path: device.path, baudRate: 115200 }, err => {
            if (err) {
              console.log('Connect Error: ', err.message);
              return this.disconnect();
            }
          });
          return;
        }
      });
    });

    if (this.serialPort) {
      console.log('Connect success!');
      console.log(this.serialPort);

      this.serialPort.on('readable', this.readData);
      this.serialPort.on('close', () => this.serialPort = null);

      return true;
    } else {
      console.log('Connect failed!');
      return false;
    }
  }

  disconnect() {
    if (this.serialPort) {
      this.serialPort.close(err => {
        if (err) console.log('Disconnect Error: ', err.message);
        this.serialPort = null;
      });
    }
  }

  readData(readBuffer = this.serialPort.read()) {
    console.log('Read Data: ', readBuffer);

    if (readBuffer[0] !== 0x10) {
      console.log('Read Error: SYNC');
      return false;
    }

    switch(readBuffer[1]) {
      case fnCodeHex.pparams:
        const params = this._readParamsFromBuffer(readBuffer);
        if (params) {
          return this.receiveParamsHandler(null, params);
        } else {
          return false;
        }
        break;

      case fnCodeHex.egram:
        // TODO: process egram data
        break;

      default:
        console.log('Read Error: FnCode not supported!');
        return false;
    }
  }

  _readParamsFromBuffer(readBuffer = Buffer.alloc(16)) {
    let pacingMode;
    switch(readBuffer[2]) {
      case pacingModeHex.AOO:
        pacingMode = 'aoo';
        break;
      case pacingModeHex.VOO:
        pacingMode = 'voo';
        break;
      case pacingModeHex.VVI:
        pacingMode = 'vvi';
        break;
      default:
        console.log('Read Error: Pacing Mode not supported!');
        return false;
    }

    const params = {};
    params[pacingMode] = {};

    params[pacingMode].lrl = readBuffer.readUInt8(3);
    params[pacingMode].url = readBuffer.readUInt8(4);
    params[pacingMode].apa = readBuffer.readUInt8(5)/10;
    params[pacingMode].apw = readBuffer.readUInt8(6)/100;
    params[pacingMode].as = readBuffer.readUInt8(7)/10;
    params[pacingMode].vpa = readBuffer.readUInt8(8)/10;
    params[pacingMode].vpw = readBuffer.readUInt8(9)/100;
    params[pacingMode].vs = readBuffer.readUInt16LE(10)/100;
    params[pacingMode].vrp = readBuffer.readUInt8(12)*10;
    params[pacingMode].arp = readBuffer.readUInt8(13)*10;
    params[pacingMode].hrl = readBuffer.readUInt8(14);
    params[pacingMode].rs = readBuffer.readUInt8(15);

    return params;
  }

  writeData(fnCode, pacingMode = 'NONE', data = {}) {
    if (!this.isConnected) {
      return false;
    }
    if (!Object.hasOwn(fnCodeHex, fnCode)) {
      return false;
    }

    this.dataBuffer = Buffer.alloc(16);
    this.dataBuffer[0] = 0x10; // SYNC
    this.dataBuffer[1] = fnCodeHex[fnCode];

    if (fnCode === 'pparams') {
      //this.dataBuffer[2] = 0x01; // pacingState
      this.dataBuffer[2] = pacingModeHex[pacingMode];
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'lrl') ? data.lrl : 0, 3);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'url') ? data.url : 0, 4);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'apa') ? data.apa*10 : 0, 5);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'apw') ? data.apw*100 : 0, 6);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'as') ? data.as*10 : 0, 7);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'vpa') ? data.vpa*10 : 0, 8);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'vpw') ? data.vpw*100 : 0, 9);
      this.dataBuffer.writeUInt16LE(Object.hasOwn(data, 'vs') ? data.vs*100 : 0, 10);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'vrp') ? data.vrp/10 : 0, 12);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'arp') ? data.arp/10 : 0, 13);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'hrl') ? data.hrl : 0, 14);
      this.dataBuffer.writeUInt8(Object.hasOwn(data, 'rs') ? data.rs : 0, 15);
    }
    //this.dataBuffer[16] = 0x00; // ChkSum

    this.serialPort.write(this.dataBuffer, err => {
      if (err) {
        return console.log('Error: ', err.message);
      } else {
        console.log('Written Buffer: ', this.dataBuffer);
      }
    });
  }

  get isConnected() {
    return this.serialPort ? this.serialPort.isOpen : false;
  }
}

module.exports = Connection;