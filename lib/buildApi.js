'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = buildApi;

var _request = require('./request');

var _request2 = _interopRequireDefault(_request);

var _selectors = require('./selectors');

var _applyUrlWithPlaceholders = require('./applyUrlWithPlaceholders');

var _applyUrlWithPlaceholders2 = _interopRequireDefault(_applyUrlWithPlaceholders);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray2(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }return arr2;
  } else {
    return Array.from(arr);
  }
}

var pendingPromises = {};

var defaultConfigure = function defaultConfigure(options) {
  return options;
};
var defaultAfterResolve = function defaultAfterResolve(result) {
  return Promise.resolve(result);
};
var defaultAfterReject = function defaultAfterReject(result) {
  return Promise.reject(result);
};
var defaultBeforeRequest = function defaultBeforeRequest() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return args;
};

function buildApi(endpoints) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var baseUrl = config.baseUrl,
      _config$configureOpti = config.configureOptions,
      configureOptions = _config$configureOpti === undefined ? defaultConfigure : _config$configureOpti,
      _config$configureHead = config.configureHeaders,
      configureHeaders = _config$configureHead === undefined ? defaultConfigure : _config$configureHead,
      _config$afterResolve = config.afterResolve,
      afterResolve = _config$afterResolve === undefined ? defaultAfterResolve : _config$afterResolve,
      _config$afterReject = config.afterReject,
      afterReject = _config$afterReject === undefined ? defaultAfterReject : _config$afterReject,
      _config$beforeRequest = config.beforeRequest,
      beforeRequest = _config$beforeRequest === undefined ? defaultBeforeRequest : _config$beforeRequest;


  return Object.keys(endpoints).reduce(function (acc, key) {
    var _endpoints$key = endpoints[key],
        path = _endpoints$key.path,
        required = _endpoints$key.required,
        normalizeArguments = _endpoints$key.method;


    var requiredPlaceholders = required || [];
    var placeholderRegexp = /:([^\/$]+)/g;
    var match = void 0;

    while (match = placeholderRegexp.exec(path)) {
      requiredPlaceholders.push(match[1]);
    }

    acc[key] = function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var normalizedArguments = normalizeArguments.apply(undefined, args);

      var placeholders = normalizedArguments.placeholders || {};
      var options = normalizedArguments.options || {};

      var augmentedOptions = _extends({}, options, {
        headers: configureHeaders(_extends({
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json'
        }, options.headers))
      });

      var missingPlaceholders = requiredPlaceholders.filter(function (key) {
        return !placeholders.hasOwnProperty(key) || placeholders[key] == null;
      });

      if (missingPlaceholders.length > 0) {
        var message = 'The "' + key + '" API call cannot be performed. The following params were not specified: ' + missingPlaceholders.join(', ');
        console.error(message);
        var neverendingPromise = new Promise(function () {
          return 1;
        });
        neverendingPromise.noop = true;

        return neverendingPromise;
      }

      var promiseId = JSON.stringify([key, args]);

      if (pendingPromises[promiseId]) {
        return pendingPromises[promiseId];
      }

      var req = _request2.default.apply(undefined, _toConsumableArray2(beforeRequest(baseUrl, (0, _applyUrlWithPlaceholders2.default)(path, placeholders, noEncode), configureOptions(augmentedOptions))));

      var promise = req.then(afterResolve).then(function (result) {
        delete pendingPromises[promiseId];
        return result;
      }).catch(function (error) {
        delete pendingPromises[promiseId];
        return Promise.reject(error);
      }).catch(afterReject);

      promise.actionName = key;
      promise.params = args;
      pendingPromises[promiseId] = promise;

      return promise;
    };

    acc[key].actionName = key;

    return acc;
  }, {});
};