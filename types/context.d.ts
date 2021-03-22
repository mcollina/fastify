import { ContextConfigDefault } from './utils'

/**
 * Route context object. Properties defined here will be available in the route's handler
 */
export interface FastifyContext<ContextConfig = ContextConfigDefault> {
  config: ContextConfig
}
