import { getDefaultConfig } from "expo/metro-config";
import { withNativeWind } from "nativewind/metro";

const config = getDefaultConfig(new URL('.', import.meta.url).pathname);

export default withNativeWind(config, { input: "./global.css" });
