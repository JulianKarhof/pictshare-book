import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { type RedisClientType } from "redis";
import { ConnectionStatus, WebSocketEventType } from "./ws.schema";
import {
  type WebSocketEventServerId,
  WebSocketSyncService,
} from "./ws.service";

mock.module("@api/config", () => ({
  PORT: 4000,
  SERVER_ID: "current-server",
  SHORT_SERVER_ID: "current-server",
}));

const createMockRedisClient = () => ({
  connect: mock(() => Promise.resolve()),
  disconnect: mock(() => Promise.resolve()),
  subscribe: mock((_channel: string, callback: (message: string) => void) => {
    subscribeCallback = callback;
  }),
  unsubscribe: mock(() => {}),
  publish: mock((_channel: string, _message: string) => Promise.resolve()),
});

let subscribeCallback: ((message: string) => void) | null = null;

const testMessage: WebSocketEventServerId = {
  serverId: "different-server",
  event: {
    type: WebSocketEventType.CONNECTION,
    payload: {
      status: ConnectionStatus.CONNECTED,
      message: "Connected",
    },
    timestamp: Date.now(),
  },
};
const testChannel = "test-channel";
const testSubscriber = "test-subscriber";

describe("WebSocketService", () => {
  let wsService: WebSocketSyncService;
  let mockPublisher: RedisClientType;
  let mockSubscriber: RedisClientType;

  beforeEach(() => {
    mockPublisher = createMockRedisClient() as unknown as RedisClientType;
    mockSubscriber = createMockRedisClient() as unknown as RedisClientType;
    wsService = new WebSocketSyncService(mockPublisher, mockSubscriber);
  });

  afterEach(async () => {
    await wsService.destroy();
  });

  test("should connect to Redis on initialization", () => {
    expect(mockPublisher.connect).toHaveBeenCalled();
    expect(mockSubscriber.connect).toHaveBeenCalled();
  });

  test("should subscribe to channel and handle messages", () => {
    const mockSend = mock((_message: unknown) => {});

    wsService.subscribe(testChannel, testSubscriber, mockSend);

    expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
      testChannel,
      expect.any(Function),
    );

    subscribeCallback?.(JSON.stringify(testMessage));

    expect(mockSubscriber.subscribe).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(testMessage.event);
  });

  test("should unsubscribe from channel", () => {
    const mockSend = mock((_message: unknown) => {});

    wsService.subscribe(testChannel, testSubscriber, mockSend);
    wsService.unsubscribe(testChannel, testSubscriber);

    expect(mockSubscriber.unsubscribe).toHaveBeenCalledWith(testChannel);

    wsService.publish(testChannel, testMessage.event);
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("should publish messages to channel", async () => {
    await wsService.publish(testChannel, testMessage.event);

    const expectedMessage: WebSocketEventServerId = {
      serverId: "current-server",
      event: testMessage.event,
    };

    expect(mockPublisher.publish).toHaveBeenCalledWith(
      testChannel,
      JSON.stringify(expectedMessage),
    );
  });

  test("should handle multiple subscribers for same channel", () => {
    const subscriber1 = "subscriber1";
    const subscriber2 = "subscriber2";
    const mockSend1 = mock((_message: unknown) => {});
    const mockSend2 = mock((_message: unknown) => {});

    wsService.subscribe(testChannel, subscriber1, mockSend1);
    wsService.subscribe(testChannel, subscriber2, mockSend2);

    subscribeCallback?.(JSON.stringify(testMessage));

    expect(mockSubscriber.subscribe).toHaveBeenCalledTimes(1);
    expect(mockSend1).toHaveBeenCalledWith(testMessage.event);
    expect(mockSend2).toHaveBeenCalledWith(testMessage.event);
  });

  test("should handle unsubscribe without affecting other subscribers", () => {
    const subscriber1 = "subscriber1";
    const subscriber2 = "subscriber2";
    const mockSend1 = mock((_message: unknown) => {});
    const mockSend2 = mock((_message: unknown) => {});

    wsService.subscribe(testChannel, subscriber1, mockSend1);
    wsService.subscribe(testChannel, subscriber2, mockSend2);
    wsService.unsubscribe(testChannel, subscriber1);

    subscribeCallback?.(JSON.stringify(testMessage));

    expect(mockSubscriber.unsubscribe).not.toHaveBeenCalled();
    expect(mockSend1).not.toHaveBeenCalled();
    expect(mockSend2).toHaveBeenCalledWith(testMessage.event);
  });

  test("should handle Redis publish errors", async () => {
    const mockErrorPublisher = {
      ...mockPublisher,
      publish: mock(() => Promise.reject(new Error("Publish error"))),
    };

    const errorWsService = new WebSocketSyncService(
      mockErrorPublisher as unknown as RedisClientType,
      mockSubscriber,
    );

    await errorWsService.publish("test-channel", testMessage.event);
    expect(true).toBe(true);
  });
});
