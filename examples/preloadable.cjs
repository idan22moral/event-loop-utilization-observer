const { ELUObserver } = require('../');

const observer = new ELUObserver((elu) => console.log(elu));

observer.observe({
    eluThreshold: 0.2,
    sampleIntervalMilliseconds: 20,
});
