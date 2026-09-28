import { requireAdmin } from "@/lib/auth/guard";
import { SlideForm } from "../slide-form";
import { createSlideAction } from "../actions";

export default async function NewSlidePage() {
  await requireAdmin("EDITOR");

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Yeni Slayt</h1>
      <div className="mt-6">
        <SlideForm action={createSlideAction} />
      </div>
    </div>
  );
}
