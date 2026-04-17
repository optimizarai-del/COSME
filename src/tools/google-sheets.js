/**
 * Google Sheets Integration Tools
 * Phase 2: Google Sheets create_spreadsheet, append_rows, read_range
 */

import { google } from 'googleapis';

export class GoogleSheetsTools {
  constructor(credentials) {
    this.credentials = credentials;
    this.auth = null;
  }

  async _getAuth() {
    if (this.auth) {
      return this.auth;
    }

    const { client_id, client_secret, redirect_uris } = this.credentials.installed || this.credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    if (this.credentials.access_token) {
      oAuth2Client.setCredentials({
        access_token: this.credentials.access_token,
        refresh_token: this.credentials.refresh_token
      });
    }

    this.auth = oAuth2Client;
    return this.auth;
  }

  async _refreshToken() {
    if (!this.auth) {
      await this._getAuth();
    }

    try {
      const { credentials } = await this.auth.refreshAccessToken();
      this.auth.setCredentials(credentials);

      if (this.credentials.onTokenRefresh) {
        await this.credentials.onTokenRefresh(credentials);
      }

      return credentials;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  getCreateSpreadsheetTool() {
    return {
      name: 'create_spreadsheet',
      description: 'Create a new Google Spreadsheet',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the new spreadsheet'
          },
          sheets: {
            type: 'array',
            description: 'Array of sheet names to create',
            items: { type: 'string' }
          }
        },
        required: ['title']
      },
      execute: async (params) => {
        try {
          const auth = await this._getAuth();
          const sheets = google.sheets({ version: 'v4', auth });

          const resource = {
            properties: {
              title: params.title
            }
          };

          if (params.sheets && params.sheets.length > 0) {
            resource.sheets = params.sheets.map(title => ({
              properties: { title }
            }));
          }

          const response = await sheets.spreadsheets.create({
            resource,
            fields: 'spreadsheetId,spreadsheetUrl,sheets'
          });

          return {
            spreadsheetId: response.data.spreadsheetId,
            spreadsheetUrl: response.data.spreadsheetUrl,
            sheets: response.data.sheets?.map(s => s.properties.title) || []
          };
        } catch (error) {
          if (error.code === 401) {
            await this._refreshToken();
            return this.getCreateSpreadsheetTool().execute(params);
          }
          throw error;
        }
      }
    };
  }

  getAppendRowsTool() {
    return {
      name: 'append_rows',
      description: 'Append rows to a Google Spreadsheet',
      schema: {
        type: 'object',
        properties: {
          spreadsheetId: {
            type: 'string',
            description: 'ID of the spreadsheet'
          },
          range: {
            type: 'string',
            description: 'Sheet name and range (e.g., "Sheet1!A1")'
          },
          values: {
            type: 'array',
            description: 'Array of rows to append',
            items: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        required: ['spreadsheetId', 'range', 'values']
      },
      execute: async (params) => {
        try {
          const auth = await this._getAuth();
          const sheets = google.sheets({ version: 'v4', auth });

          const response = await sheets.spreadsheets.values.append({
            spreadsheetId: params.spreadsheetId,
            range: params.range,
            valueInputOption: 'USER_ENTERED',
            resource: {
              values: params.values
            }
          });

          return {
            updatedRange: response.data.updates.updatedRange,
            updatedRows: response.data.updates.updatedRows,
            updatedColumns: response.data.updates.updatedColumns,
            updatedCells: response.data.updates.updatedCells
          };
        } catch (error) {
          if (error.code === 401) {
            await this._refreshToken();
            return this.getAppendRowsTool().execute(params);
          }
          throw error;
        }
      }
    };
  }

  getReadRangeTool() {
    return {
      name: 'read_range',
      description: 'Read a range of cells from a Google Spreadsheet',
      schema: {
        type: 'object',
        properties: {
          spreadsheetId: {
            type: 'string',
            description: 'ID of the spreadsheet'
          },
          range: {
            type: 'string',
            description: 'Sheet name and range (e.g., "Sheet1!A1:B10")'
          }
        },
        required: ['spreadsheetId', 'range']
      },
      execute: async (params) => {
        try {
          const auth = await this._getAuth();
          const sheets = google.sheets({ version: 'v4', auth });

          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: params.spreadsheetId,
            range: params.range
          });

          return {
            range: response.data.range,
            majorDimension: response.data.majorDimension,
            values: response.data.values || []
          };
        } catch (error) {
          if (error.code === 401) {
            await this._refreshToken();
            return this.getReadRangeTool().execute(params);
          }
          throw error;
        }
      }
    };
  }

  getAllTools() {
    return [
      this.getCreateSpreadsheetTool(),
      this.getAppendRowsTool(),
      this.getReadRangeTool()
    ];
  }
}
