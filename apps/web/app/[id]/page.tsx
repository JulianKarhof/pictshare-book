import BookCanvas from "../canvas";
import { use } from "react";

export default function Canvas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <BookCanvas id={id} />;
}
