beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    delete: true,
  });
});

beforeEach(async () => {
  await device.reloadReactNative();
});
