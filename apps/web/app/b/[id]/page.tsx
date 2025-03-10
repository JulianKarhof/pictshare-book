import BookCanvas from "@web/components/canvas";
import { use } from "react";

export default function Canvas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <BookCanvas canvasId={id} />;
}
