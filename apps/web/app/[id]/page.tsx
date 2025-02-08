import BookCanvas from "@web/app/canvas";
import { use } from "react";

export default function Canvas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <BookCanvas canvasId={id} />;
}
