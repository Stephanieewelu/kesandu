module.exports = function (api) {
  const presets = [
    api.env('web') ? '@babel/preset-env' : 'babel-preset-expo'
  ];
  return {
    presets,
    plugins: [

    ]
  };
};
