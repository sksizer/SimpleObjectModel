import { Configuration } from '@/impl/types';

const defaultConfiguration: Configuration = {
  mode: 'loose',
  ingres: {
    simple: {
      idKey: '_k',
      metadataKey: '_metadata',
      dataKey: 'data',
    },
  },
};

function getDefaultConfiguration(): Configuration {
  return { ...defaultConfiguration };
}

let configuration: Configuration = getDefaultConfiguration();
function setConfiguration(config: Configuration) {
  configuration = config;
}
function getConfiguration() {
  return { ...configuration };
}

export { getConfiguration, setConfiguration, getDefaultConfiguration };
