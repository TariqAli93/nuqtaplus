import settingsController from '../controllers/settingsController.js';

export default async function settingsRoutes(fastify) {
  // Get all settings with pagination and search
  fastify.get('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Get all settings with pagination',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          search: { type: 'string', description: 'Search in setting keys' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      key: { type: 'string' },
                      value: { type: 'string' },
                      description: { type: 'string' },
                      updatedBy: { type: 'integer' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
                page: { type: 'integer' },
                limit: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.list,
  });

  // Get all settings as key-value object
  fastify.get('/all', {
    schema: {
      tags: ['Settings'],
      summary: 'Get all settings as object',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.getAll,
  });

  // Get setting by key
  fastify.get('/:key', {
    schema: {
      tags: ['Settings'],
      summary: 'Get setting by key',
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'Setting key' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                key: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
                updatedBy: { type: 'integer' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.getByKey,
  });

  // Create new setting
  fastify.post('/', {
    schema: {
      tags: ['Settings'],
      summary: 'Create new setting',
      body: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Unique setting key',
          },
          value: { description: 'Setting value (any type)' },
          description: {
            type: 'string',
            description: 'Setting description',
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                key: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
                updatedBy: { type: 'integer' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.create,
  });

  // Update setting
  fastify.put('/:key', {
    schema: {
      tags: ['Settings'],
      summary: 'Update setting by key',
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'Setting key' },
        },
      },
      body: {
        type: 'object',
        properties: {
          value: { description: 'New setting value (any type)' },
          description: {
            type: 'string',
            description: 'New setting description',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                key: { type: 'string' },
                value: { type: 'string' },
                description: { type: 'string' },
                updatedBy: { type: 'integer' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.update,
  });

  // Delete setting
  fastify.delete('/:key', {
    schema: {
      tags: ['Settings'],
      summary: 'Delete setting by key',
      params: {
        type: 'object',
        required: ['key'],
        properties: {
          key: { type: 'string', description: 'Setting key' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.delete,
  });

  // Bulk update settings
  fastify.put('/bulk', {
    schema: {
      tags: ['Settings'],
      summary: 'Bulk update multiple settings',
      body: {
        type: 'object',
        patternProperties: {
          '.*': { description: 'Setting value for the key' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  key: { type: 'string' },
                  value: { type: 'string' },
                  description: { type: 'string' },
                  updatedBy: { type: 'integer' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.bulkUpdate,
  });

  // Company information endpoints
  fastify.get('/company', {
    schema: {
      tags: ['Settings'],
      summary: 'Get company information',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                city: { type: 'string' },
                area: { type: 'string' },
                street: { type: 'string' },
                phones: {
                  type: 'array',
                  items: { type: 'string' },
                },
                logoUrl: { type: 'string' },
                invoiceType: {
                  type: 'string',
                  enum: ['roll', 'a4'],
                },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.getCompanyInfo,
  });

  fastify.put('/company', {
    schema: {
      tags: ['Settings'],
      summary: 'Update company information',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            description: 'Company name',
          },
          city: {
            type: 'string',
            maxLength: 100,
            description: 'City name',
          },
          area: {
            type: 'string',
            maxLength: 100,
            description: 'Area/District name',
          },
          street: {
            type: 'string',
            maxLength: 200,
            description: 'Street address',
          },
          phones: {
            type: 'array',
            maxItems: 5,
            items: {
              type: 'string',
              maxLength: 20,
            },
            description: 'Phone numbers array',
          },

          logoUrl: {
            type: 'string',
            description: 'Logo file URL',
          },
          invoiceType: {
            type: 'string',
            enum: ['roll', 'a4'],
            description: 'Invoice format type',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'array' },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.saveCompanyInfo,
  });

  // Upload logo
  fastify.post('/logo', {
    schema: {
      tags: ['Settings'],
      summary: 'Upload company logo',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                logoUrl: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.uploadLogo,
  });

  // Validation endpoints
  fastify.post('/validate/phone', {
    schema: {
      tags: ['Settings'],
      summary: 'Validate phone number format',
      body: {
        type: 'object',
        required: ['phone'],
        properties: {
          phone: {
            type: 'string',
            description: 'Phone number to validate',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                isValid: { type: 'boolean' },
                phone: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.validatePhone,
  });

  // Get currency settings
  fastify.get('/currency', {
    schema: {
      tags: ['Settings'],
      summary: 'Get currency settings',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                defaultCurrency: { type: 'string', enum: ['USD', 'IQD'] },
                usdRate: { type: 'number' },
                iqdRate: { type: 'number' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.getCurrencySettings,
  });

  // Save currency settings
  fastify.put('/currency', {
    schema: {
      tags: ['Settings'],
      summary: 'Save currency settings',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['defaultCurrency', 'usdRate', 'iqdRate'],
        properties: {
          defaultCurrency: {
            type: 'string',
            enum: ['USD', 'IQD'],
            description: 'Default currency for the system',
          },
          usdRate: {
            type: 'number',
            minimum: 0,
            description: 'Exchange rate for USD',
          },
          iqdRate: {
            type: 'number',
            minimum: 0,
            description: 'Exchange rate for IQD',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                defaultCurrency: { type: 'string' },
                usdRate: { type: 'number' },
                iqdRate: { type: 'number' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.saveCurrencySettings,
  });

  // DANGER ZONE: System Reset (Admin only)
  fastify.post('/danger/reset', {
    schema: {
      tags: ['Settings'],
      summary: 'Reset entire application (DANGER ZONE - Admin only)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['confirmationToken'],
        properties: {
          confirmationToken: {
            type: 'string',
            enum: ['RESET_CODELIMS_APPLICATION'],
            description: 'Required confirmation token',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                message: { type: 'string' },
                timestamp: { type: 'string' },
              },
            },
          },
        },
      },
    },
    preHandler: [fastify.authenticate],
    handler: settingsController.resetApplication,
  });
}
