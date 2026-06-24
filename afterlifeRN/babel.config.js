module.exports = function (v_05a921) {

  v_05a921.cache.invalidate(
    () => `${process.env.NODE_ENV ?? ''}:${process.env.BABEL_ENV ?? ''}`,
  );
  const v_8b4a52 = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
  return {
    presets: ["babel-preset-expo"],

    plugins: v_8b4a52 ? [] : ["react-native-worklets-core/plugin"],
  };
};
