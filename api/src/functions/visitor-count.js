const { createHash } = require('node:crypto');
const { app } = require('@azure/functions');
const { TableClient } = require('@azure/data-tables');

const partitionKey = 'site';
const counterRowKey = 'total';
const tableName = process.env.VISITOR_TABLE_NAME || 'VisitorCounters';
let tableClient;
let tableReady;

function getTableClient() {
  if (!tableClient) {
    const connectionString = process.env.VISITOR_STORAGE_CONNECTION_STRING;
    if (!connectionString) throw new Error('VISITOR_STORAGE_CONNECTION_STRING is not configured');
    tableClient = TableClient.fromConnectionString(connectionString, tableName);
  }
  return tableClient;
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = getTableClient().createTable().catch((error) => {
      if (error.statusCode !== 409) throw error;
    });
  }
  await tableReady;
}

function isNotFound(error) {
  return error.statusCode === 404 || error.code === 'ResourceNotFound';
}

function isConflict(error) {
  return error.statusCode === 409 || error.statusCode === 412;
}

async function getCount(client) {
  try {
    const counter = await client.getEntity(partitionKey, counterRowKey);
    return Number(counter.count) || 0;
  } catch (error) {
    if (isNotFound(error)) return 0;
    throw error;
  }
}

async function registerVisitor(visitorId) {
  await ensureTable();
  const client = getTableClient();
  const visitorRowKey = createHash('sha256').update(visitorId).digest('hex');

  try {
    await client.getEntity(partitionKey, visitorRowKey);
    return getCount(client);
  } catch (error) {
    if (!isNotFound(error)) throw error;
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      let counter;
      try {
        counter = await client.getEntity(partitionKey, counterRowKey);
      } catch (error) {
        if (!isNotFound(error)) throw error;
      }

      const nextCount = (Number(counter?.count) || 0) + 1;
      const visitor = {
        partitionKey,
        rowKey: visitorRowKey,
        createdAt: new Date().toISOString()
      };

      if (counter) {
        await client.submitTransaction([
          ['create', visitor],
          ['update', { ...counter, count: nextCount }, 'Replace', { etag: counter.etag }]
        ]);
      } else {
        await client.submitTransaction([
          ['create', visitor],
          ['create', { partitionKey, rowKey: counterRowKey, count: nextCount }]
        ]);
      }

      return nextCount;
    } catch (error) {
      if (!isConflict(error)) throw error;
      try {
        await client.getEntity(partitionKey, visitorRowKey);
        return getCount(client);
      } catch (visitorError) {
        if (!isNotFound(visitorError)) throw visitorError;
      }
    }
  }

  throw new Error('Visitor counter update could not be completed');
}

app.http('visitor-count', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'visitor-count',
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';
      if (!/^[a-zA-Z0-9_-]{16,100}$/.test(visitorId)) {
        return { status: 400, jsonBody: { error: 'Invalid visitor identifier' } };
      }

      const count = await registerVisitor(visitorId);
      return {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
        jsonBody: { count }
      };
    } catch (error) {
      context.error('Visitor counter failed', error);
      return { status: 500, jsonBody: { error: 'Counter unavailable' } };
    }
  }
});

module.exports = { registerVisitor };
