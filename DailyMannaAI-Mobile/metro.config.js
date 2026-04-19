import { getDefaultConfig } from "expo/metro-config";
import { withNativeWind } from "nativewind/metro";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = getDefaultConfig(__dirname);

export default withNativeWind(config, { input: "./global.css" });
