const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

const exclusionPatterns = [
  /node_modules\/react-native\/ReactAndroid\/.*/,
  /node_modules\/react-native\/ReactCommon\/.*/,
  /node_modules\/react-native\/sdks\/.*/,
  /node_modules\/@expo\/cli\/node_modules\/@expo\/prebuild-config\/.*/,
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/\.git\/.*/,
];

config.resolver.blockList = new RegExp(
  exclusionPatterns.map((r) => r.source).join("|")
);

module.exports = config;
