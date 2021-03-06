import path from 'path'
import favicon from 'serve-favicon'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'

import feathers from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import express from '@feathersjs/express'

import merge from 'merge-deep'

import hooks, { logger } from './hooks'
import services from './services'
import sockets from './sockets'
import persistence from './persistence'

import { createService, Util } from './base'

/** Debug logging when not in production **/
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug'
}

// TODO: this file needs to shrink!

function factory (options = {}, buildVars) {
  /**
   * Configuration (see config/default.json)
   */
  const app = express(feathers())
  app.configure(configuration())
  options = merge({
    systemResources: [],
    serviceResources: [],
    middleware: {
      preAuth: options.middleware ? Object.assign({}, options.middleware.preAuth) : undefined,
      postAuth: options.middleware ? Object.assign({}, options.middleware.postAuth) : undefined,
      postResource: options.middleware ? Object.assign({}, options.middleware.postResource) : undefined
    },
    buildVars: merge(buildVars, options.buildVars),
    logger
  }, options)
  options.basePath = options.basePath && options.basePath[0] === path.sep
    ? path.resolve(options.basePath) : path.join(__dirname, '..', '..')
  app.set('appconf', options)
  const serviceOptions = app.get('services')
  /**
   * Basics
   */
  app.use(cors())
  app.use(helmet())
  app.use(compress())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(favicon(path.join(app.get('public'), 'favicon.ico')))
  app.use('/', express.static(app.get('public')))
  /**
   * Transport Providers
   */
  app.configure(express.rest())
  app.configure(sockets.provider.primus)
  /**
   * Pre auth middleware
   */
  if (options.middleware && options.middleware.preAuth) {
    app.configure(options.middleware.preAuth)
  }
  /**
   * Authentication
   * TODO: needs a whole lotta fixin'
   */
  app.configure(services.Authentication())
  /**
   * ACL (Access Control List)
   * with backends:
   *
   * - memoryBackend
   * - redisBackend
   * - mongoBackend
   */
  const ACLBackend = services.ACL.memoryBackend
  app.set('acl', new services.ACL(new ACLBackend(), buildVars))
  // app.configure(app.get('acl').middleware)
  /**
   * Post auth middleware
   */
  if (options.middleware && options.middleware.postAuth) {
    app.configure(options.middleware.postAuth)
  }
  /**
   * GET Request proxy
   */
  app.configure(services.Proxy())
  /**
   * System Resources
   * used for basic API services
   */
  for (let [name, value] of Object.entries(options.systemResources)) {
    const
      { Schema, schemaOptions, resourceHooks } = value,
      persist = Util.parseConfig(persistence, serviceOptions.system.persistence)
    persist.options.logger = logger
    app.configure(createService({
      logger: logger,
      paginate: app.get('paginate'),
      name,
      Schema,
      schemaOptions,
      hooks: merge(hooks.resource, resourceHooks)
    }, persist))
  }
  /**
   * Resources
   */
  for (let [name, value] of Object.entries(options.serviceResources)) {
    const
      { Schema, schemaOptions, resourceHooks } = value,
      persist = Util.parseConfig(persistence, serviceOptions.resources.persistence)
    persist.options.logger = logger
    app.configure(createService({
      logger: logger,
      paginate: app.get('paginate'),
      name,
      Schema,
      schemaOptions,
      hooks: merge(hooks.resource, resourceHooks),
      idField: schemaOptions.idField
    }, persist))
  }
  /**
   * Post resource middleware
   */
  if (options.middleware && options.middleware.postResource) {
    app.configure(options.middleware.postResource)
  }
  /**
   * Event Channels
   */
  app.configure(sockets.channels)
  /**
   * Error handlers
   */
  app.use(express.notFound())
  app.use(express.errorHandler({ logger: options.logger || logger }))
  /**
   * App Hooks
   */
  app.hooks(hooks.app)
  return app
}

export default {
  /**
   * Core API Factory function
   */
  factory
}

export {
  /**
   * API parts
   */
  hooks,
  services,
  sockets,
  persistence,
  logger
}
