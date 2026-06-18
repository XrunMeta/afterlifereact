module.exports = function (api) {

  api.cache.invalidate(
    () => `${process.env.NODE_ENV ?? ''}:${process.env.BABEL_ENV ?? ''}`,
  );
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
  return {
    presets: ["babel-preset-expo"],

    plugins: isTest ? [] : ["react-native-worklets-core/plugin"],
  };
};
