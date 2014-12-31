'use strict';

var rawFile = {
  'centos': {
    appService:          require('./scripts/raw-file!./scripts/centos/app.service'),
    setupPartSh:         require('./scripts/raw-file!./scripts/centos/setup.part.sh'),
    setupPartYml:        require('./scripts/raw-file!./scripts/centos/setup.part.yml'),
    setupMonitorSocket:  require('./scripts/raw-file!./scripts/centos/setup-monitor.socket'),
    setupMonitorService: require('./scripts/raw-file!./scripts/centos/setup-monitor@.service')
  },
  'ubuntu': {
    appConf:             require('./scripts/raw-file!./scripts/ubuntu/app.conf'),
    setupPartSh:         require('./scripts/raw-file!./scripts/ubuntu/setup.part.sh'),
    setupPartYml:        require('./scripts/raw-file!./scripts/ubuntu/setup.part.yml'),
    setupMonitorConf:    require('./scripts/raw-file!./scripts/ubuntu/setup-monitor.conf')
  },
  setupMonitorSh:      require('./scripts/raw-file!./scripts/setup-monitor.sh'),
  setupSh:             require('./scripts/raw-file!./scripts/setup.sh'),
  setupYml:            require('./scripts/raw-file!./scripts/setup.yml')
};


function replace(source, key, value) {
  return source.split(key || '').join(value || '');
}


function format(source, map) {
  return Object.keys(map || {}).reduce(function (result, key) {
      return replace(result, '{{' + key + '}}', map[key] || '');
    }, source);
}


function indent(spaces, source) {
  var str = new Array(spaces + 1).join(' ');
  return source.split('\n')
    .map(function (line) {
      return str + line;
    })
    .join('\n');
}


var formatFile = {
  'centos': {
    appEnvVars: function (envVars) {
      return Object.keys(envVars || {}).map(function (key) {
          return 'Environment="' + key + '=' + (envVars[key] || '') + '"';
        });
    },
    setupPartSh: function (opts) {
      return format(rawFile['centos'].setupPartSh, {
          setupMonitorLife:     opts.monitorLife
        });
    },
    setupPartYml: function (opts) {
      return format(rawFile['centos'].setupPartYml, {
          appService:           indent(6, format(rawFile['centos'].appService, {
              appDescription:       opts.description,
              appPort:              opts.port,
              appEnvVars:           formatFile['centos'].appEnvVars(opts.envVars)
            })),
          setupMonitorSocket:   indent(6, format(rawFile['centos'].setupMonitorSocket, {
              setupMonitorPort:     opts.monitorPort
            })),
          setupMonitorService:  indent(6, rawFile['centos'].setupMonitorService)
        });
    }
  },
  'ubuntu': {
    appEnvVars: function (envVars) {
      return Object.keys(envVars || {}).map(function (key) {
          return 'env ' + key + '="' + (envVars[key] || '') + '"';
        });
    },
    setupPartSh: function (opts) {
      return format(rawFile['ubuntu'].setupPartSh, {
          setupMonitorLife:     opts.monitorLife
        });
    },
    setupPartYml: function (opts) {
      return format(rawFile['ubuntu'].setupPartYml, {
          appConf:              indent(6, format(rawFile['ubuntu'].appConf, {
              appDescription:       opts.description,
              appPort:              opts.port,
              appEnvVars:           formatFile['ubuntu'].appEnvVars(opts.envVars)
            })),
          setupMonitorConf:     indent(6, format(rawFile['ubuntu'].setupMonitorConf, {
              setupMonitorPort:     opts.monitorPort
            }))
        });
    }
  },
  setupEnvVars: function (envVars) {
    return Object.keys(envVars || {}).map(function (key) {
        return 'export ' + key + '=\'' + (envVars[key] || '') + '\'';
      });
  },
  setupSh: function (platform, sourceUrl, opts) {
    return format(rawFile.setupSh, {
        setupEnvVars:   formatFile.setupEnvVars(opts.envVars),
        setupPartSh:    formatFile[platform].setupPartSh(opts),
        appSourceUrl:   sourceUrl,
        appCommand:     opts.command,
        appPort:        opts.port
      });
  },
  setupYml: function (platform, sourceUrl, opts) {
    return format(rawFile.setupYml, {
        setupMonitorSh: indent(6, rawFile.setupMonitorSh),
        setupPartYml:   formatFile[platform].setupPartYml(opts),
        setupSh:        indent(6, formatFile.setupSh(platform, sourceUrl, opts))
      });
  }
};


module.exports = {
  formatDigitalOceanUserData: function (platform, sourceUrl, opts) {
    if (!platform) {
      throw new Error('Missing platform');
    }
    if (platform !== 'centos' && platform !== 'ubuntu') {
      throw new Error('Unexpected platform: ' + platform);
    }
    if (!sourceUrl || !sourceUrl.length) {
      throw new Error('Missing source URL');
    }
    opts = opts || {};
    return formatFile.setupYml(platform, sourceUrl, {
      envVars:     opts.envVars,
      command:     opts.command,
      description: opts.description || 'Haskell on DigitalOcean app',
      port:        opts.port        || 8080,
      monitorLife: opts.monitorLife || 3600,
      monitorPort: opts.monitorPort || 4040
    });
  }
};
