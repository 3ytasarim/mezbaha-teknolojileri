import { getLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isPageAvailable } from "@/lib/i18n/config";
import { getPlayableVideos } from "@/lib/legacy-content";
import { VideoEmbed } from "@/components/videos/video-embed";
import { SectionHeading } from "@/components/public/section-heading";
import { ArrowFillButton } from "@/components/ui/arrow-fill-button";

/**
 * Ana sayfa video bölümü: eski sitenin makina montaj videolarından ilk 4'ü (facade: video tıklanana kadar YouTube'dan yüklenmez).
 * "Daha Fazla Video" düğmesi /videolar sayfasına gider; o sayfa menüde yoktur, yalnızca bu düğmeden ulaşılır ve kendi title/description'ıyla
 * sitemap'te yer alır (SEO).
 */
export async function HomeVideos() {
  const locale = await getLocale();
  if (!isPageAvailable(locale, "/videolar")) return null;
  const d = getDictionary(locale).home.videos;
  const videos = getPlayableVideos().slice(0, 4);
  if (videos.length === 0) return null;

  return (
    <section id="videolar" className="border-t border-border bg-background">
      <div className="mx-auto max-w-(--container-wide) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow={d.eyebrow} title={d.title} description={d.description} />
          <ArrowFillButton href="/videolar" tone="navy" size="lg">
            {d.more}
          </ArrowFillButton>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((video) => (
            <li key={video.id}>
              <VideoEmbed id={video.id} title={video.title} thumbnail={video.thumbnail} watchUrl={video.watchUrl} priority={false} />
              <h3 className="mt-4 text-base font-semibold leading-snug text-foreground">{video.title}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
