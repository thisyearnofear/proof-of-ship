/**
 * Service Manager
 * Centralized service management and access
 */

import { realCircleService } from "./RealCircleService";
import { realGitHubService } from "./RealGitHubService";
import { realLiFiService } from "./RealLiFiService";
import { apiConfigs, validateApiService } from "../config/environment";

class ServiceManager {
  constructor() {
    this.services = new Map();
    this.initializeServices();
  }

  initializeServices() {
    // Register all services
    this.services.set("circle", realCircleService);
    this.services.set("github", realGitHubService);
    this.services.set("lifi", realLiFiService);
  }

  /**
   * Get a service instance
   */
  getService(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service;
  }

  /**
   * Check if a service is available and configured
   */
  isServiceAvailable(name) {
    try {
      const service = this.getService(name);
      return service.isConfigured();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all available services
   */
  getAvailableServices() {
    const available = [];
    for (const [name] of this.services) {
      if (this.isServiceAvailable(name)) {
        available.push(name);
      }
    }
    return available;
  }

  /**
   * Get service status for all services
   */
  getServiceStatus() {
    const status = {};
    for (const [name] of this.services) {
      status[name] = {
        available: this.isServiceAvailable(name),
        configured: validateApiService(name),
      };
    }
    return status;
  }

  /**
   * Execute operation with service fallback
   */
  async withFallback(primaryService, fallbackService, operation) {
    try {
      const service = this.getService(primaryService);
      if (service.isConfigured()) {
        return await operation(service);
      }
    } catch (error) {
      console.warn(`Primary service ${primaryService} failed:`, error.message);
    }

    // Try fallback service
    if (fallbackService) {
      try {
        const fallback = this.getService(fallbackService);
        if (fallback.isConfigured()) {
          return await operation(fallback);
        }
      } catch (error) {
        console.warn(
          `Fallback service ${fallbackService} failed:`,
          error.message
        );
      }
    }

    throw new Error(`No available service for operation`);
  }

  /**
   * Get Circle service
   */
  getCircleService() {
    return this.getService("circle");
  }

  /**
   * Get GitHub service
   */
  getGitHubService() {
    return this.getService("github");
  }

  /**
   * Get LiFi service
   */
  getLiFiService() {
    return this.getService("lifi");
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const results = {};

    for (const [name, service] of this.services) {
      try {
        results[name] = {
          configured: validateApiService(name),
          available: service.isConfigured(),
          status: "healthy",
        };

        // Try to ping service if it has a ping method
        if (typeof service.ping === "function") {
          await service.ping();
          results[name].ping = "success";
        }
      } catch (error) {
        results[name] = {
          configured: false,
          available: false,
          status: "error",
          error: error.message,
        };
      }
    }

    return results;
  }
}

// Export singleton instance
export const serviceManager = new ServiceManager();
export default serviceManager;
