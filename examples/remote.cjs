const { RemoteELUObserver } = require('../');

(async () => {
    const obs = new RemoteELUObserver(
        (elu) => console.log(elu),
        { port: 9229 },
    );

    await obs.initialize();

    process.on('SIGINT', async () => {
        // be sure to disconnect the observer once you're done
        await obs.disconnect();
    });

    await obs.observe({
        eluThreshold: 0.2,
        sampleIntervalMilliseconds: 20,
    });
})();
