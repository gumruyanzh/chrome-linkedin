// Comprehensive Connection Management Tests
import {
  addConnection,
  getConnections,
  updateConnectionStatus,
  getConnectionById,
  deleteConnection,
  getConnectionsByStatus,
  CONNECTION_STATUS
} from '../utils/connection-management.js';

describe('Connection Management Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
  });

  describe('CONNECTION_STATUS', () => {
    test('should have all required status types', () => {
      expect(CONNECTION_STATUS.PENDING).toBeDefined();
      expect(CONNECTION_STATUS.ACCEPTED).toBeDefined();
      expect(CONNECTION_STATUS.DECLINED).toBeDefined();
      expect(CONNECTION_STATUS.WITHDRAWN).toBeDefined();
    });

    test('should have unique status values', () => {
      const values = Object.values(CONNECTION_STATUS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('addConnection', () => {
    test('should add new connection with required fields', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      const connectionData = {
        profileId: '123',
        name: 'John Doe',
        title: 'Software Engineer',
        company: 'Acme Inc',
        profileUrl: 'https://linkedin.com/in/johndoe'
      };

      const result = await addConnection(connectionData);

      expect(chrome.storage.local.set).toHaveBeenCalled();
      expect(result.id).toBeDefined();
      expect(result.status).toBe(CONNECTION_STATUS.PENDING);
      expect(result.createdAt).toBeDefined();
    });

    test('should prevent duplicate connections', async () => {
      const existingConnections = [
        { profileId: '123', name: 'John Doe', status: CONNECTION_STATUS.PENDING }
      ];
      chrome.storage.local.get.mockResolvedValue({
        connection_database: existingConnections
      });

      const connectionData = {
        profileId: '123',
        name: 'John Doe'
      };

      await expect(addConnection(connectionData)).rejects.toThrow();
    });

    test('should store message with connection', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      const connectionData = {
        profileId: '456',
        name: 'Jane Smith',
        message: 'Hello Jane, I would like to connect!'
      };

      await addConnection(connectionData);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].message).toBe(connectionData.message);
    });

    test('should track campaign if provided', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      const connectionData = {
        profileId: '789',
        name: 'Bob Wilson',
        campaignId: 'campaign123'
      };

      await addConnection(connectionData);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].campaignId).toBe('campaign123');
    });
  });

  describe('getConnections', () => {
    test('should return all connections', async () => {
      const connections = [
        { id: '1', name: 'John Doe', status: CONNECTION_STATUS.PENDING },
        { id: '2', name: 'Jane Smith', status: CONNECTION_STATUS.ACCEPTED }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const result = await getConnections();

      expect(result.length).toBe(2);
    });

    test('should return empty array when no connections', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await getConnections();

      expect(result).toEqual([]);
    });

    test('should filter by options', async () => {
      const connections = [
        { id: '1', name: 'John', status: CONNECTION_STATUS.PENDING, createdAt: Date.now() },
        { id: '2', name: 'Jane', status: CONNECTION_STATUS.ACCEPTED, createdAt: Date.now() - 86400000 }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const result = await getConnections({ status: CONNECTION_STATUS.PENDING });

      expect(result.length).toBe(1);
      expect(result[0].name).toBe('John');
    });

    test('should support pagination', async () => {
      const connections = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        name: `User ${i}`,
        status: CONNECTION_STATUS.PENDING
      }));
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const result = await getConnections({ limit: 10, offset: 0 });

      expect(result.length).toBe(10);
    });
  });

  describe('updateConnectionStatus', () => {
    test('should update connection status', async () => {
      const connections = [
        { id: 'conn1', name: 'John Doe', status: CONNECTION_STATUS.PENDING }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });
      chrome.storage.local.set.mockResolvedValue();

      await updateConnectionStatus('conn1', CONNECTION_STATUS.ACCEPTED);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].status).toBe(CONNECTION_STATUS.ACCEPTED);
    });

    test('should add status history', async () => {
      const connections = [
        { id: 'conn1', name: 'John Doe', status: CONNECTION_STATUS.PENDING }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });
      chrome.storage.local.set.mockResolvedValue();

      await updateConnectionStatus('conn1', CONNECTION_STATUS.ACCEPTED);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].statusHistory).toBeDefined();
    });

    test('should update updatedAt timestamp', async () => {
      const connections = [
        { id: 'conn1', name: 'John Doe', status: CONNECTION_STATUS.PENDING, createdAt: Date.now() - 10000 }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });
      chrome.storage.local.set.mockResolvedValue();

      await updateConnectionStatus('conn1', CONNECTION_STATUS.ACCEPTED);

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].updatedAt).toBeDefined();
    });

    test('should throw error for non-existent connection', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });

      await expect(updateConnectionStatus('nonexistent', CONNECTION_STATUS.ACCEPTED))
        .rejects.toThrow();
    });
  });

  describe('getConnectionById', () => {
    test('should return connection by ID', async () => {
      const connections = [
        { id: 'conn1', name: 'John Doe' },
        { id: 'conn2', name: 'Jane Smith' }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const result = await getConnectionById('conn2');

      expect(result.name).toBe('Jane Smith');
    });

    test('should return null for non-existent ID', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });

      const result = await getConnectionById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteConnection', () => {
    test('should delete connection by ID', async () => {
      const connections = [
        { id: 'conn1', name: 'John Doe' },
        { id: 'conn2', name: 'Jane Smith' }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });
      chrome.storage.local.set.mockResolvedValue();

      await deleteConnection('conn1');

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database.length).toBe(1);
      expect(savedData.connection_database[0].id).toBe('conn2');
    });

    test('should handle deleting non-existent connection', async () => {
      const connections = [{ id: 'conn1', name: 'John Doe' }];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });
      chrome.storage.local.set.mockResolvedValue();

      // Should not throw
      await deleteConnection('nonexistent');

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database.length).toBe(1);
    });
  });

  describe('getConnectionsByStatus', () => {
    test('should filter connections by status', async () => {
      const connections = [
        { id: '1', name: 'John', status: CONNECTION_STATUS.PENDING },
        { id: '2', name: 'Jane', status: CONNECTION_STATUS.ACCEPTED },
        { id: '3', name: 'Bob', status: CONNECTION_STATUS.PENDING }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const pending = await getConnectionsByStatus(CONNECTION_STATUS.PENDING);

      expect(pending.length).toBe(2);
    });

    test('should return empty array for status with no connections', async () => {
      const connections = [
        { id: '1', name: 'John', status: CONNECTION_STATUS.PENDING }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const declined = await getConnectionsByStatus(CONNECTION_STATUS.DECLINED);

      expect(declined).toEqual([]);
    });
  });

  describe('Connection Metadata', () => {
    test('should store connection source', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      await addConnection({
        profileId: '123',
        name: 'John Doe',
        source: 'search_results'
      });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].source).toBe('search_results');
    });

    test('should store connection tags', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      await addConnection({
        profileId: '123',
        name: 'John Doe',
        tags: ['recruiter', 'tech']
      });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].tags).toEqual(['recruiter', 'tech']);
    });

    test('should calculate relationship score', async () => {
      chrome.storage.local.get.mockResolvedValue({ connection_database: [] });
      chrome.storage.local.set.mockResolvedValue();

      await addConnection({
        profileId: '123',
        name: 'John Doe',
        mutualConnections: 10,
        sharedCompanies: 2
      });

      const savedData = chrome.storage.local.set.mock.calls[0][0];
      expect(savedData.connection_database[0].relationshipScore).toBeDefined();
    });
  });

  describe('Connection Statistics', () => {
    test('should calculate connection rate', async () => {
      const connections = [
        { status: CONNECTION_STATUS.PENDING },
        { status: CONNECTION_STATUS.ACCEPTED },
        { status: CONNECTION_STATUS.ACCEPTED },
        { status: CONNECTION_STATUS.DECLINED }
      ];
      chrome.storage.local.get.mockResolvedValue({ connection_database: connections });

      const stats = await getConnections({ includeStats: true });

      // Stats should include acceptance rate
      expect(stats.stats).toBeDefined();
      expect(stats.stats.acceptanceRate).toBeDefined();
    });
  });
});
