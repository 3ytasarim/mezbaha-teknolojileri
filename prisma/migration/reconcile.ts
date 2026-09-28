import type { PrismaClient } from "@prisma/client";

/**
 * Phase 9-11A'da admin UI üzerinden CRUD doğrulaması için oluşturulan iki test kaydının
 * slug'ı, isimden otomatik üretildiği için url-migration-map.md'nin önerdiği kanonik
 * slug ile birebir örtüşmüyordu. Bunlar gerçek admin tarafından girilmiş production
 * içeriği değil, bu oturumun kendi test verisi olduğu için migration'ın kanonik slug'ına
 * yeniden adlandırmak güvenli ve doğru olan seçim — yeni bir duplicate kayıt oluşturmak
 * yerine. İdempotent: zaten doğru slug'daysa hiçbir şey yapmaz.
 */
export async function reconcileKnownTestSlugs(prisma: PrismaClient, dryRun: boolean) {
  const notes: string[] = [];

  const kucukbas = await prisma.productCategory.findFirst({
    where: { slug: "kucukbas-mezbaha-makinalari" },
  });
  if (kucukbas) {
    notes.push(
      `ProductCategory "${kucukbas.slug}" -> "kucukbas" olarak yeniden adlandırılacak (Phase 9-11A test verisi, url-migration-map.md kanonik slug'ıyla hizalanıyor).`
    );
    if (!dryRun) {
      await prisma.productCategory.update({
        where: { id: kucukbas.id },
        data: { slug: "kucukbas" },
      });
    }
  }

  const gobustan = await prisma.project.findFirst({
    where: { slug: "azerbaycan-gobustan-kesimhane" },
  });
  if (gobustan) {
    notes.push(
      `Project "${gobustan.slug}" -> "azerbaycan-gobustan" olarak yeniden adlandırılacak (Phase 9-11A test verisi, ülke-şehir slug şemasıyla hizalanıyor).`
    );
    if (!dryRun) {
      await prisma.project.update({
        where: { id: gobustan.id },
        data: { slug: "azerbaycan-gobustan" },
      });
    }
  }

  return notes;
}
