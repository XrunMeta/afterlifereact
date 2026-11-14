module.exports = function (v_05a921) {

  v_05a921.cache.invalidate(
    () => `${process.env.NODE_ENV ?? ''}:${process.env.BABEL_ENV ?? ''}`,
  );
  const v_8b4a52 = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';

  const v_a9be84 = v_05a921.caller((v_dbc741) => (v_dbc741 ? v_dbc741.isDev : undefined));
  const v_ab9ff0 = !v_8b4a52 && v_a9be84 === false;
  const v_8ffaf7 = v_8b4a52 ? [] : ["react-native-worklets-core/plugin"];
  if (v_ab9ff0) v_8ffaf7.push(["transform-remove-console", { exclude: ["error"] }]);
  return {
    presets: ["babel-preset-expo"],

    plugins: v_8ffaf7,
  };
};
