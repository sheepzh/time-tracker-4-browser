['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT', 'SIGUSR1', 'SIGUSR2'].forEach((sig) => {
  process.on(sig, () => {
    console.error(`!!! Received signal: ${sig} at ${new Date().toISOString()}`);
    console.trace();
  });
});
