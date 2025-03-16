import { ImageReturnSchema } from "@api/routes/image/image.schema";
import { WebSocketEventType } from "@api/routes/ws/ws.schema";
import { client } from "@web/lib/client";
import { StageService } from "@web/services/stage.service";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type AssetListener = (
  assets: Map<string, typeof ImageReturnSchema.static>,
) => void;

export class AssetManager {
  private static _instance: AssetManager;
  private _assets: Map<string, typeof ImageReturnSchema.static> = new Map();
  private _listeners: Set<AssetListener> = new Set();

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager._instance) {
      AssetManager._instance = new AssetManager();
    }
    return AssetManager._instance;
  }

  public getAsset(id: string): typeof ImageReturnSchema.static | undefined {
    return this._assets.get(id);
  }

  public getAssetList(): Array<typeof ImageReturnSchema.static> {
    return Array.from(this._assets.values());
  }

  public addAssets(assets: Map<string, typeof ImageReturnSchema.static>): void {
    assets.forEach((value, key) => {
      this._assets.set(key, value);
    });

    this._notifyListeners();
  }

  public resetAssets(): void {
    this._assets.clear();
    this._notifyListeners();
  }

  public subscribe(listener: AssetListener): () => void {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  private _notifyListeners(): void {
    this._listeners.forEach((listener) => {
      listener(this._assets);
    });
  }
}

export function useAssetManager() {
  const [assets, setAssets] = useState<Array<typeof ImageReturnSchema.static>>(
    [],
  );

  useEffect(() => {
    setAssets(AssetManager.getInstance().getAssetList());

    StageService.getInstance().subscribe(
      WebSocketEventType.IMAGE_CREATE,
      (event) => {
        AssetManager.getInstance().addAssets(
          new Map(event.payload.images.map((image) => [image.id, image])),
        );
        setAssets(AssetManager.getInstance().getAssetList());
      },
    );

    const unsubscribe = AssetManager.getInstance().subscribe((assetMap) => {
      setAssets(Array.from(assetMap.values()));
    });

    return unsubscribe;
  }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    try {
      const data = await StageService.getInstance().sendImageCreate(files);

      AssetManager.getInstance().addAssets(
        new Map(data.map((item) => [item.id, item])),
      );

      return data;
    } catch (error) {
      toast.error("Failed to upload files");
      throw error;
    }
  }, []);

  const fetchImages = useCallback(async (projectId: string) => {
    AssetManager.getInstance().resetAssets();

    const { data, error } = await client
      .projects({ id: projectId })
      .images.get();

    if (error) {
      switch (error.status) {
        case 422:
          throw error.value;
        default:
          throw error.value;
      }
    }

    const imageMap = new Map(data.map((item) => [item.id, item]));
    AssetManager.getInstance().addAssets(imageMap);

    return data;
  }, []);

  return {
    assets,
    uploadFiles,
    fetchImages,
  };
}
