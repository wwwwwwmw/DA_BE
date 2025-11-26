/**
 * Dependency Injection Container
 * Manages application dependencies and their lifecycles
 */
class DIContainer {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  // Register a service
  register(name, factory, options = {}) {
    this.services.set(name, {
      factory,
      singleton: options.singleton || false
    });
  }

  // Register a singleton service
  registerSingleton(name, factory) {
    this.register(name, factory, { singleton: true });
  }

  // Resolve a service
  resolve(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' is not registered`);
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory(this));
      }
      return this.singletons.get(name);
    }

    return service.factory(this);
  }

  // Check if service is registered
  has(name) {
    return this.services.has(name);
  }

  // Clear all services (for testing)
  clear() {
    this.services.clear();
    this.singletons.clear();
  }
}

module.exports = DIContainer;