import packageJson from '../package.json' with { type: 'json' }
import wranglerJson from '../wrangler.json' with { type: 'json' }

const { version } = packageJson
const { dev } = wranglerJson

const localhost = {
  "url": `http://localhost:${dev.port}`,
  "description": "localhost"
}

export const API = {
  "openapi": "3.1.0",
  "servers": [localhost],
  "info": {
    "title": "khulnasoft serverless registry",
    "version": version,
    "license": {
      "identifier": "FSL-1.1-MIT",
      "name": "Functional Source License, Version 1.1, MIT Future License",
      "url": "https://fsl.software/FSL-1.1-MIT.template.md"
    },
    "description": "The khulnasoft serverless registry is a npm compatible JavaScript package registry which replicates core features & functionality of registry.npmjs.org while also introducing net-new capabilities."
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "Bearer <token>"
      }
    },
    "schemas": {
      "Error": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string"
          }
        }
      }
    }
  },
  "security": [
    {
      "bearerAuth": []
    }
  ],
  "tags": [
    {
      "name": "Users",
      "description": "User management endpoints"
    },
    {
      "name": "Packages",
      "description": "Package management endpoints"
    }
  ],
  "paths": {
    "/-/ping": {
      "get": {
        "tags": ["Health"],
        "summary": "Health check endpoint",
        "responses": {
          "200": {
            "description": "Service is healthy"
          }
        }
      }
    }
  }
}
