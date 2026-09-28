import type { Metadata } from "next";
import Link from "@/components/i18n/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getI18n } from "@/lib/i18n/server";
import { localizePath } from "@/lib/i18n/routes";
import { format } from "@/lib/i18n/dictionaries";
import { rich } from "@/lib/i18n/rich";

import { breadcrumbListJsonLd, jsonLdScriptProps } from "@/lib/seo/json-ld";
import { getPlayableVideos } from "@/lib/legacy-content";
import { VideoEmbed } from "@/components/videos/video-embed";
import { SectionHeading } from "@/components/public/section-heading";

const videos = getPlayableVideos();

export async function generateMetadata(): Promise<Metadata> {
  const { locale, d } = await getI18n();
  return buildMetadata({
    title: d.videos.galleryTitle,
    description: format(d.videos.metaDescription, { n: String(videos.length) }),
    path: "/videolar",
    ogImage: videos[0]?.thumbnail,
    locale,
  });
}

export default async function VideosPage() {
  const { locale, d } = await getI18n();
  const v = d.videos;
  return (
    <main className="mx-auto max-w-(--container) px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <script
        {...jsonLdScriptProps(
          breadcrumbListJsonLd([
            { name: d.common.home, path: localizePath(locale, "/") },
            { name: v.metaTitle, path: localizePath(locale, "/videolar") },
          ])
        )}
      />

      <nav aria-label={d.ui.breadcrumb} className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{d.common.home}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{v.metaTitle}</span>
      </nav>

      <SectionHeading as="h1" className="mt-6" eyebrow={v.eyebrow} title={v.galleryTitle} />
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {rich(v.intro, {
          products: <Link href="/urunler" className="font-semibold text-foreground underline underline-offset-4">{v.productsLink}</Link>,
        })}
      </p>

      <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
        {videos.map((video, index) => (
          <li key={video.id}>
            <VideoEmbed id={video.id} title={video.title} thumbnail={video.thumbnail} watchUrl={video.watchUrl} priority={index < 2} />
            <h2 className="mt-4 font-heading text-lg font-bold tracking-tight text-foreground">{video.title}</h2>
            {video.channel && (
              <p className="mt-1 text-sm text-muted-foreground">
                {v.channel}{" "}
                {video.channelUrl ? (
                  <a href={video.channelUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
                    {video.channel}
                  </a>
                ) : (
                  video.channel
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
