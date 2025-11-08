import * as configModel from '@models/configuration.model';
import { Configuration } from '@models/configuration.model';
import { CustomError } from '@utils/errorHandler';
import { logService } from './log.service';
import { logger } from '@config/logger';

// Defining a class to handle configuration logic and caching
class ConfigurationService {
  // Private property for in-memory cache of configurations
  private cache: Map<string, string> = new Map();

  constructor() {
    // Initializing configuration loading upon service creation
    this.loadConfigurationsToCache();
  }

  /**
   * Loading all configurations from the database into the in-memory cache.
   */
  async loadConfigurationsToCache(): Promise<void> {
    try {
      // Fetching all configurations from the database
      const configurations = await configModel.findAllConfigurations();
      // Clearing the existing cache
      this.cache.clear();
      // Populating the cache map
      configurations.forEach((config) => {
        this.cache.set(config.key, config.value);
      });
      // Logging successful cache load
      logger.info('Application configurations loaded into cache.');
    } catch (error) {
      // Logging error if configurations fail to load
      logger.error('Failed to load configurations into cache:', error);
    }
  }

  /**
   * Retrieving all configuration settings from the database.
   * @returns A promise resolving to an array of all configurations.
   */
  async getAllConfigurations(): Promise<Configuration[]> {
    // Delegating to the model to fetch all configurations
    return configModel.findAllConfigurations();
  }

  /**
   * Retrieving a configuration value by key from the cache or database.
   * @param key The unique key of the configuration.
   * @returns The configuration value string, or undefined if not found.
   */
  getByKey(key: string): string | undefined {
    // Returning the value from the cache
    return this.cache.get(key);
  }

  /**
   * Updating the value of an existing configuration setting.
   * @param key The key of the configuration to update.
   * @param value The new value.
   * @param updaterId The ID of the user performing the update (for logging).
   * @returns A promise resolving to the updated configuration object.
   */
  async updateConfiguration(
    key: string,
    value: string,
    updaterId: string
  ): Promise<Configuration> {
    // Finding the existing configuration details
    const existingConfig = await configModel.findConfigurationByKey(key);

    // Checking if the configuration exists
    if (!existingConfig) {
      // Throwing an error if the configuration key is not found
      throw new CustomError(`Configuration key '${key}' not found.`, 404);
    }
    
    // Checking if the configuration is editable by admin
    if (!existingConfig.isEditableByAdmin) {
      // Throwing an error if the configuration is system-locked
      throw new CustomError(`Configuration key '${key}' is not editable.`, 403);
    }

    // Calling the model to execute the update
    const updatedConfig = await configModel.updateConfigurationValue(key, value);

    // Checking if the update was successful
    if (!updatedConfig) {
       // Should not happen if previous checks pass, but handles race conditions
      throw new CustomError(`Failed to update configuration key '${key}'.`, 500);
    }

    // Updating the in-memory cache
    this.cache.set(updatedConfig.key, updatedConfig.value);

    // Logging the configuration update action
    await logService.logAction('CONFIG_UPDATED', updaterId, 'Configuration', updatedConfig.id, {
      key: updatedConfig.key,
      oldValue: existingConfig.value,
      newValue: updatedConfig.value,
    });

    // Returning the updated configuration object
    return updatedConfig;
  }
}

// Exporting an instance of the ConfigurationService
export const configurationService = new ConfigurationService();