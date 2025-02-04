"use client";
import Pixi from "../canvas/pixiApp";
import { use } from "react";

export default function Canvas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <Pixi id={id} />;
}
