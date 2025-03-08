import { SERVER_ID } from "@api/config";
import env from "@api/env";
import { log } from "@api/logger";
import { type RedisClientType } from "redis";
import type { WebSocketEvent } from "./ws.schema";

export interface WebSocketEventServerId {
  serverId: string;
  event: WebSocketEvent;
}

export class WebSocketSyncService {
  private _publisher: RedisClientType;
  private _subscriber: RedisClientType;
  private _distributors: Map<
    string,
    Map<string, (message: WebSocketEvent) => void>
  > = new Map();

  public constructor(publisher: RedisClientType, subscriber: RedisClientType) {
    this._publisher = publisher;
    this._subscriber = subscriber;

    Promise.all([this._publisher.connect(), this._subscriber.connect()])
      .then(() => {
        log.info(`Connected to Redis at ${env.REDIS_URL}`);
      })
      .catch((err) => {
        log.error("Error connecting to Redis:", err);
      });
  }

  public subscribe(
    channel: string,
    subscriberId: string,
    send: (message: WebSocketEvent) => void,
  ): void {
    if (!this._distributors.has(channel)) {
      this._distributors.set(channel, new Map());

      this._subscriber.subscribe(channel, (message) => {
        const parsedMessage = JSON.parse(message) as WebSocketEventServerId;
        if (parsedMessage.serverId === SERVER_ID) return;

        try {
          this._distributors.get(channel)?.forEach((distributor) => {
            distributor(parsedMessage.event);
          });
        } catch (err) {
          log.error("Error processing Redis message:", err);
        }
      });

      log.info(`Subscribed to channel ${channel}`);
    }

    this._distributors.get(channel)?.set(subscriberId, send);
  }

  public unsubscribe(channel: string, subscriberId: string): void {
    const distributorChannel = this._distributors.get(channel);
    if (distributorChannel) {
      distributorChannel.delete(subscriberId);
      if (distributorChannel.size === 0) {
        this._distributors.delete(channel);
        this._subscriber.unsubscribe(channel);

        log.info(`Unsubscribed from channel ${channel}`);
      }
    }
  }

  public async publish(
    channel: string,
    message: WebSocketEvent,
  ): Promise<void> {
    try {
      await this._publisher.publish(
        channel,
        JSON.stringify({ serverId: SERVER_ID, event: message }),
      );
    } catch (err) {
      log.error("Error publishing message to Redis:", err);
    }
  }

  public async destroy(): Promise<void> {
    this._distributors.clear();
    await this._publisher.disconnect();
    await this._subscriber.disconnect();
  }
}
