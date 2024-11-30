module.exports = {
  testRunner: 'jest',
  runnerConfig: 'jest.e2e.config.js',
  specs: 'tests/e2e',
  behavior: {
    init: {
      exposeGlobals: false
    }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'platforms/ios/build/Debug-iphonesimulator/YourAppName.app'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'platforms/android/app/build/outputs/apk/debug/app-debug.apk'
    }
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14'
      }
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30'
      }
    }
  }
};
