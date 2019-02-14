-------------------------------------------------------------------------------

This project is no longer maintained.

-------------------------------------------------------------------------------


_halcyon-cloud-config_
======================

JavaScript generator of _cloud-config_ files, using [Halcyon](https://halcyon.sh/) to deploy Haskell applications.  Intended for use with [DigitalOcean](https://digitalocean.com/).  Supports CentOS 7.0 and Ubuntu 14.04.


Usage
-----

The generated _cloud-config_ file performs a number of actions:

1. Creates a new user account to install and run the application, named `app`.
2. Starts a setup monitor OS service.
3. Installs the OS packages required for Halcyon, including _git_.
4. Uses _git_ to install Halcyon into `/app/halcyon`.
5. Uses Halcyon to install the application into `/app`.
6. Registers the application as an OS service.
7. Starts the application.
8. Stops the setup monitor.

The setup monitor responds to HTTP `GET` requests with a streaming log of the installation process.  By default, the log is available for 1 hour after the installation begins.

A Cabal package description file declaring an executable must be included at the top level of the application source repository.  The name of the executable will be used as the OS service name, and as part of the default command for running the application.


### Example

_halcyon-cloud-config_ is used by [Haskell on DigitalOcean](https://halcyon.sh/deploy/).  Please see the source code of [_halcyon-website_](https://github.com/mietek/halcyon-website/) for a complete usage example.


### Reference

#### `formatDigitalOceanUserData(platform, sourceUrl, opts)`

Returns a _cloud-config_ file as a string, intended to be supplied as the `user_data` parameter to the DigitalOcean [“Create a new droplet”](https://developers.digitalocean.com/v2/#create-a-new-droplet) API endpoint.

| Argument           | Description 
| :----------------- | :----------
| `platform`         | Either `centos` or `ubuntu`.  Required.
| `sourceUrl`        | _git_ URL of the application source repository.  Required.
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

Made by [Miëtek Bak](https://mietek.io/).  Published under the BSD license.  Not affiliated with [DigitalOcean](https://digitalocean.com/).
