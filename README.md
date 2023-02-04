# Event Loop Utilization Observer
Get event loop utilization samples from a Node.js process (local or remote).

## Integration
To add the observer to your application, use the `ELUObserver` class.

### Example
```js
const { ELUObserver } = require('event-loop-utilization-observer');

const observer = new ELUObserver((elu) => console.log(elu));

observer.observe({
    eluThreshold: 0.2,
    sampleIntervalMilliseconds: 20,
});
```
You can preload it as a seperate module with the `-r` flag in Node.js.


## Attach to a running Node.js process
Use the `RemoteELUObserver` class to attach the observer to a running Node.js process.  
This observer leverages the *Chrome DevTools Protocol*, and relies on the `console.debug` function for passing data.  
So, if you see ELU logs in your application - take that into account and don't be alarmed.

### Note
This observer depends on *Node.js Inspector*, so it might not be ideal for production.  
If you need this observer in production anyway (for investigative purposes, for instance), you can tell Node.js to enable the inspector by running:
```sh
$ kill -SIGUSR1 <pid>
```
For more information refer to the [Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/).

### Example
```js
const { RemoteELUObserver } = require('event-loop-utilization-observer');

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
```
