beforeAll(async () => {
  await device.launchApp({
    newInstance: true,
    // New Architecture keeps JS/native loopers busy; disable Detox sync from the start.
    launchArgs: { detoxEnableSynchronization: 0 },
  });
});

afterAll(async () => {
  await device.terminateApp();
});
