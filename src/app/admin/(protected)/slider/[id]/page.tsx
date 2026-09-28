import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { SlideForm } from "../slide-form";
import { updateSlideAction } from "../actions";

export default async function EditSlidePage({ params }: PageProps<"/admin/slider/[id]">) {
  await requireAdmin("EDITOR");
  const { id } = await params;

  const slide = await prisma.heroSlide.findUnique({ where: { id } });
  if (!slide) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Slayt Düzenle — {slide.title}</h1>
      <div className="mt-6">
        <SlideForm
          action={updateSlideAction.bind(null, id)}
          initialValues={{
            title: slide.title,
            subtitle: slide.subtitle ?? "",
            buttonText: slide.buttonText,
            buttonLink: slide.buttonLink,
            image: slide.image,
            imageAlt: slide.imageAlt ?? "",
            fit: slide.fit === "contain" ? "contain" : "cover",
            active: slide.active,
          }}
        />
      </div>
    </div>
  );
}
