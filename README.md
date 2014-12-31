_halcyon-cloud-config_
======================

JavaScript _cloud-config_ generator for deploying Haskell applications with [Halcyon](https://halcyon.sh/).  Specialised for deploying to [DigitalOcean](https://digitalocean.com/).


Usage
-----

The generated _cloud-config_ file performs a number of actions:

1. Creates an `app` user to install and run the application.
2. Starts a `setup-monitor` OS service.
3. Installs the OS packages required for Halcyon, including _git_.
4. Uses _git_ to install Halcyon into `/app/halcyon`.
5. Uses Halcyon to install the application into `/app`.
6. Registers the application as an OS service.
7. Starts the application.
8. Stops the setup monitor, after a configurable delay.

The setup monitor responds to HTTP `GET` requests made to a configurable port with a streaming log of the installation process.  By default, the setup monitor is stopped 1 hour after the installation begins.

The application service is named after the executable name declared in the application’s Cabal package description.  The default command used to run the application also references the executable name.


### Example

```js
var HalcyonCloudConfig = require('halcyon-cloud-config');

DigitalOcean.createDroplet(
  hostname,
  selectedSize.slug,
  selectedImage.slug,
  selectedRegion.slug,
  selectedKeys.map(function (key) {
      return key.id;
    }),
  HalcyonCloudConfig.formatDigitalOceanUserData(
    selectedImage.distribution.toLowerCase(),
    sourceUrl, {
      envVars:     envVars,
      command:     undefined,
      description: undefined,
      port:        undefined
    }),
  function (droplet, err) {
    if (droplet) {
      console.log('Created droplet:', droplet.id);
    } else {
      console.log('Failed to create droplet:', err);
    }
  }.bind(this),
  token);
```

See [_halcyon-website_](https://github.com/mietek/halcyon-website/) for a complete example.


### Functions

#### `formatDigitalOceanUserData(platform, sourceUrl, opts)`

Returns a _cloud-config_ file, intended to be used as the `user_data` parameter for the DigitalOcean [“Create a new droplet”](https://developers.digitalocean.com/v2/#create-a-new-droplet) API endpoint.  Supports CentOS 7.0 and Ubuntu 14.04.

| Argument           | Description 
| :----------------- | :----------
| `platform`         | Either `centos` or `ubuntu`.  Required.
| `sourceUrl`        | Application source _git_ repository URL.  Required.
| `opts.envVars`     | Environment variables to set both before installing and running the application.
| `opts.command`     | Command to run the application.  Defaults to `/app/bin/${executable}`.
| `opts.description` | Application description.  Defaults to `Haskell on DigitalOcean app`.
| `opts.port`        | Application listening port.  Defaults to `8080`.
| `opts.monitorLife` | Time during which the setup monitor is active, in seconds.  Defaults to `3600`.
| `opts.monitorPort` | Setup monitor listening port.  Defaults to `4040`.


### Installation

```
$ bower install halcyon-cloud-config
```

Scripts using _halcyon-cloud-config_ must be processed with [_webpack_](https://webpack.github.io/) in order to include the required platform-specific configuration files.


About
-----

Made by [Miëtek Bak](https://mietek.io/).  Published under the [MIT X11 license](https://mietek.io/license/).
