'use strict';

const TuyaBaseDevice = require('../tuyabasedevice');
const CAPABILITIES_SET_DEBOUNCE = 1000;

class TuyaPoolHeatPumpDevice extends TuyaBaseDevice {

  onInit() {
    this.initDevice(this.getData().id);
    this.updateCapabilities(this.get_deviceConfig().status);
    this.registerMultipleCapabilityListener(this.getCapabilities(), async (values, options) => {
      return this._onMultipleCapabilityListener(values, options);
    }, CAPABILITIES_SET_DEBOUNCE);
    this.log(`Tuya PoolHeatPump ${this.getName()} has been initialized`);
  }

  _onMultipleCapabilityListener(valueObj, optsObj) {
    this.log(`pool heat pump capabilities changed by Homey: ${JSON.stringify(valueObj)}`);
    try {
      if (valueObj.poolheatpump_target_temperature != null) {
        this.sendCommand('temp_set', valueObj.poolheatpump_target_temperature);
      }
      if (valueObj.onoff != null) {
        this.sendCommand('switch', valueObj.onoff);
      }
      if (valueObj.poolheatpump_mode != null) {
        this.sendCommand('mode', valueObj.poolheatpump_mode);
      }
    } catch (ex) {
      this.log(ex);
    }
  }

  updateCapabilities(statusArr) {
    this.log(`pool heat pump capabilities received from Tuya: ${JSON.stringify(statusArr)}`);
    statusArr.forEach((status) => {
      switch (status.code) {
        case 'switch':
          this.normalAsync('onoff', status.value);
          break;
        case 'temp_set':
          this.normalAsync('poolheatpump_target_temperature', status.value);
          break;
        case 'temp_current':
          this.normalAsync('measure_temperature', status.value / 10);
          break;
        case 'mode':
          this.normalAsync('poolheatpump_mode', status.value);
          break;
        default:
          this.log(`Unknown pool heat pump capability: ${status.code}`);
          break;
      }
    });
  }

  normalAsync(name, hbValue) {
    this.log(`Set pool heat pump capability ${name} with ${hbValue}`);
    this.setCapabilityValue(name, hbValue)
      .catch((error) => {
        this.error(error);
      });
  }

  sendCommand(code, value) {
    const param = {
      commands: [
        {
          code,
          value,
        },
      ],
    };
    this.homey.app.tuyaOpenApi.sendCommand(this.id, param)
      .catch((error) => {
        this.error('[SET][%s] capabilities Error: %s', this.id, error);
        throw new Error(`Error sending command: ${error}`);
      });
  }
}

module.exports = TuyaPoolHeatPumpDevice;
