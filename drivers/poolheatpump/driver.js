'use strict';

const TuyaBaseDriver = require('../tuyabasedriver');

class TuyaPoolHeatPumpDriver extends TuyaBaseDriver {

  onInit() {
    this.homey.flow.getActionCard('set_poolheatpump_mode')
      .registerRunListener(async (args, state) => {
        const device = this.getDevice({ id: args.device.id });
        if (!device) return false;

        await device.setCapabilityValue('poolheatpump_mode', args.mode);
        device.sendCommand('mode', args.mode);
        return true;
      });
    this.homey.flow.getActionCard('set_poolheatpump_target_temperature')
      .registerRunListener(async (args, state) => {
        const device = this.getDevice({ id: args.device.id });
        if (!device) return false;

        // Prevent fractional values
        if (!Number.isInteger(args.target_temperature)) {
          throw new Error('Please enter a whole number for the target temperature.');
        }

        await device.setCapabilityValue('poolheatpump_target_temperature', args.target_temperature);
        device.sendCommand('temp_set', args.target_temperature);
      });
    this.log('Tuya pool heat pump driver has been initialized');
  }

  async onPairListDevices() {
    let devices = [];
    if (!this.homey.app.isConnected()) {
      throw new Error('Please configure the app first.');
    } else {
      let poolHeatPump = this.get_devices_by_type('poolheatpump');
      for (let tuyaDevice of Object.values(poolHeatPump)) {
        let capabilities = ['onoff', 'poolheatpump_mode', 'poolheatpump_target_temperature', 'measure_temperature',
        ];

        devices.push({
          data: {
            id: tuyaDevice.id,
          },
          capabilities: capabilities,
          name: tuyaDevice.name,
        });
      }
    }
    return devices.sort(TuyaBaseDriver._compareHomeyDevice);
  }

}

module.exports = TuyaPoolHeatPumpDriver;
