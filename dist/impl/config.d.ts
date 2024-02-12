import { Configuration } from '@/impl/types';
declare function getDefaultConfiguration(): Configuration;
declare function setConfiguration(config: Configuration): void;
declare function getConfiguration(): {
    mode: "strict" | "loose";
    ingres: {
        simple: {
            idKey: string;
            metadataKey: string;
            dataKey: string;
        };
    };
};
export { getConfiguration, setConfiguration, getDefaultConfiguration };
