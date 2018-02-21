'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.userHooks = exports.schemaOptions = exports.Schema = undefined;

var _authentication = require('@feathersjs/authentication');

var _authentication2 = _interopRequireDefault(_authentication);

var _authenticationLocal = require('@feathersjs/authentication-local');

var _authenticationLocal2 = _interopRequireDefault(_authenticationLocal);

var _feathersHooks = require('@motionbank-js/feathers-hooks');

var _base = require('@motionbank-js/base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const { authenticate } = _authentication2.default.hooks;
const { hashPassword, protect } = _authenticationLocal2.default.hooks;

/**
 * Schema options
 */
const schemaOptions = { idField: 'uuid'

  /**
   * User Schema
   * @type {SchemaObjectInstance<any>}
   */
};const Schema = (0, _base.initSchema)({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true, minLength: 6 },
  location: { type: String },
  organisation: { type: String },
  auth0Id: { type: String, invisible: true }
}, schemaOptions);

/**
 * Add service userHooks
 */
const userHooks = (0, _feathersHooks.hooks)();
userHooks.before = Object.assign(userHooks.before, {
  find: [authenticate('jwt')],
  get: [authenticate('jwt')],
  create: [hashPassword()],
  update: [hashPassword(), authenticate('jwt')],
  patch: [hashPassword(), authenticate('jwt')],
  remove: [authenticate('jwt')]
});
userHooks.after = Object.assign(userHooks.after, {
  all: [
  /**
   * Make sure the password field is never sent to the client
   * Always must be the last hook
   */
  protect('password')]
});

/**
 * Route access matrix by HTTP verb and OAuth grants
 */
schemaOptions.accessMatrix = {
  find: ['retrieve:users'],
  get: ['retrieve:users'],
  create: ['create:users'],
  update: ['update:users'],
  patch: ['update:users'],
  remove: ['remove:users']

  /**
   * Export Users Service configuration
   */
};exports.Schema = Schema;
exports.schemaOptions = schemaOptions;
exports.userHooks = userHooks;