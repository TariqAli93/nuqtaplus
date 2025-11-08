import backupController from '../controllers/backupController.js';

/**
 * Backup Routes
 * Handles routing for backup and restore operations
 */
export default async function backupRoutes(fastify) {
  // Create backup
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    handler: backupController.createBackup.bind(backupController),
    schema: {
      description: 'Create system backup',
      tags: ['backup'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                size: { type: 'string' },
                createdAt: { type: 'string' },
                createdBy: { type: 'number' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  });

  // Restore from backup
  fastify.post('/restore', {
    onRequest: [fastify.authenticate],
    handler: backupController.restoreBackup.bind(backupController),
    schema: {
      description: 'Restore system from backup',
      tags: ['backup'],
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                restoredAt: { type: 'string' },
                restoredBy: { type: 'number' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  });

  // List backups
  fastify.get('/list', {
    onRequest: [fastify.authenticate],
    handler: backupController.listBackups.bind(backupController),
    schema: {
      description: 'List available backups',
      tags: ['backup'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  size: { type: 'string' },
                  createdAt: { type: 'string' },
                  createdBy: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  });

  // Download backup
  fastify.get('/download/:filename', {
    onRequest: [fastify.authenticate],
    handler: backupController.downloadBackup.bind(backupController),
    schema: {
      description: 'Download backup file',
      tags: ['backup'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['filename'],
        properties: {
          filename: { type: 'string', minLength: 1 },
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
                filename: { type: 'string' },
                downloadUrl: { type: 'string' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  });

  // Delete backup
  fastify.delete('/:filename', {
    onRequest: [fastify.authenticate],
    handler: backupController.deleteBackup.bind(backupController),
    schema: {
      description: 'Delete backup file',
      tags: ['backup'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['filename'],
        properties: {
          filename: { type: 'string', minLength: 1 },
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
                filename: { type: 'string' },
                deletedAt: { type: 'string' },
                deletedBy: { type: 'number' },
              },
            },
            message: { type: 'string' },
          },
        },
      },
    },
  });
}
