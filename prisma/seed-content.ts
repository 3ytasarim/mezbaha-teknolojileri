import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Bu script yalnızca docs/current-site-inventory.md içinde DOĞRULANMIŞ gerçek
// içerikleri Neon'a yazar. Hiçbir istatistik, sertifika, kapasite rakamı ya da
// açıklama uydurulmamıştır — kaynak URL'ler ve envanter bölümleri kod içinde
// yorum olarak belirtilmiştir. Idempotenttir: slug/key bazlı upsert kullanır,
// tekrar çalıştırıldığında yinelenen kayıt oluşturmaz.

async function main() {
  console.log("Doğrulanmış test içeriği içe aktarılıyor (kaynak: docs/current-site-inventory.md)...");

  // Kaynak: current-site-inventory.md §2 — /tr/buyukbas-mezbaha-makinalari/
  const category = await prisma.productCategory.upsert({
    where: { slug: "buyukbas" },
    create: { slug: "buyukbas", image: "/images/categories/buyukbas-mezbaha-makinalari.png", sortOrder: 0, active: true },
    update: {},
  });

  await prisma.productCategoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "tr" } },
    create: {
      categoryId: category.id,
      locale: "tr",
      name: "Büyükbaş Mezbaha Makinaları",
      shortDescription:
        "Kesim hücreleri, karkas taşıma ve deri yüzme hatlarından oluşan büyükbaş üretim hattı ekipmanları.",
      seoTitle: "Büyükbaş Mezbaha Makinaları",
      seoDescription:
        "Kesim hücreleri, karkas taşıma ve deri yüzme hatlarından oluşan büyükbaş üretim hattı ekipmanları.",
    },
    update: {},
  });
  console.log(`✓ ProductCategory: ${category.slug}`);

  // Kaynak: current-site-inventory.md §3 "Deri yüzme" — /tr/hidrolik-deri-yuzme-makinasi/
  const product1 = await prisma.product.upsert({
    where: { slug: "hidrolik-deri-yuzme-makinasi" },
    create: {
      slug: "hidrolik-deri-yuzme-makinasi",
      categoryId: category.id,
      coverImage: "/images/products/hidrolik-deri-yuzme-makinasi.png",
      status: "PUBLISHED",
      active: true,
      featured: true,
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product1.id, locale: "tr" } },
    create: {
      productId: product1.id,
      locale: "tr",
      name: "Hidrolik Deri Yüzme Makinası",
      shortDescription:
        "Çift yönlü işlem ve bağımsız platform kontrolüne sahip paslanmaz çelik deri yüzme makinası.",
      seoTitle: "Hidrolik Deri Yüzme Makinası",
      seoDescription:
        "Çift yönlü işlem ve bağımsız platform kontrolüne sahip paslanmaz çelik deri yüzme makinası.",
    },
    update: {},
  });
  console.log(`✓ Product: ${product1.slug}`);

  // Kaynak: current-site-inventory.md §3 "Testereler" — /tr/karkas-bolme-testeresi/
  const product2 = await prisma.product.upsert({
    where: { slug: "karkas-bolme-testeresi" },
    create: {
      slug: "karkas-bolme-testeresi",
      categoryId: category.id,
      coverImage: "/images/products/karkas-bolme-testeresi.png",
      status: "PUBLISHED",
      active: true,
      featured: true,
      sortOrder: 1,
    },
    update: {},
  });
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product2.id, locale: "tr" } },
    create: {
      productId: product2.id,
      locale: "tr",
      name: "Karkas Bölme Testeresi",
      shortDescription: "Slim Line karkas bölme testeresi ile hızlı ve hijyenik karkas ayırma.",
      seoTitle: "Karkas Bölme Testeresi (Slim Line)",
      seoDescription: "Slim Line karkas bölme testeresi ile hızlı ve hijyenik karkas ayırma.",
    },
    update: {},
  });
  console.log(`✓ Product: ${product2.slug}`);

  // Kaynak: current-site-inventory.md §3 "Kesim hücreleri" — /tr/dairesel-kesim-hucresi/
  const product3 = await prisma.product.upsert({
    where: { slug: "dairesel-kesim-hucresi" },
    create: {
      slug: "dairesel-kesim-hucresi",
      categoryId: category.id,
      coverImage: "/images/products/dairesel-kesim-hucresi.png",
      status: "PUBLISHED",
      active: true,
      featured: false,
      sortOrder: 2,
    },
    update: {},
  });
  await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: product3.id, locale: "tr" } },
    create: {
      productId: product3.id,
      locale: "tr",
      name: "Dairesel Kesim Hücresi",
      shortDescription: "Büyükbaş kesim işlemi için dönel platformlu dairesel kesim hücresi.",
      seoTitle: "Dairesel Kesim Hücresi",
      seoDescription: "Büyükbaş kesim işlemi için dönel platformlu dairesel kesim hücresi.",
    },
    update: {},
  });
  console.log(`✓ Product: ${product3.slug}`);

  // Kaynak: current-site-inventory.md §4-B — /tr/projeler/ sayfasındaki C-50 kapasite paketi
  const capacitySolution = await prisma.project.upsert({
    where: { slug: "c-50" },
    create: {
      slug: "c-50",
      type: "CAPACITY_SOLUTION",
      country: "Türkiye",
      capacity: "50 büyükbaş + 100 koyun",
      area: "~350 m²",
      status: "PUBLISHED",
      publishedAt: new Date(),
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: capacitySolution.id, locale: "tr" } },
    create: {
      projectId: capacitySolution.id,
      locale: "tr",
      name: "C-50",
      shortDescription: "Kompakt ölçekli kesimhane tesisi.",
      seoTitle: "C-50 Kapasite Paketi",
      seoDescription: "50 büyükbaş + 100 koyun kapasiteli ~350 m² kompakt kesimhane tesisi.",
    },
    update: {},
  });
  console.log(`✓ Project (capacity solution): ${capacitySolution.slug}`);

  // Kaynak: current-site-inventory.md §4-A — ana sayfa uluslararası referans kartları (Fas / Kenitra)
  const referenceProject = await prisma.project.upsert({
    where: { slug: "fas-kenitra" },
    create: {
      slug: "fas-kenitra",
      type: "REFERENCE",
      country: "Fas",
      city: "Kenitra",
      capacity: "500 büyükbaş, 3.000 koyun",
      status: "PUBLISHED",
      publishedAt: new Date(),
      featured: true,
      sortOrder: 0,
    },
    update: {},
  });
  await prisma.projectTranslation.upsert({
    where: { projectId_locale: { projectId: referenceProject.id, locale: "tr" } },
    create: {
      projectId: referenceProject.id,
      locale: "tr",
      name: "Fas / Kenitra — Modern Kesimhane",
      shortDescription: "500 büyükbaş ve 3.000 koyun kapasiteli modern kesimhane projesi.",
      seoTitle: "Fas Kenitra Modern Kesimhane Projesi",
      seoDescription: "500 büyükbaş ve 3.000 koyun kapasiteli modern kesimhane projesi.",
    },
    update: {},
  });
  console.log(`✓ Project (reference): ${referenceProject.slug}`);

  // Kaynak: current-site-inventory.md §5 — blog yazılarının tamamında görünen breadcrumb "Blog - Mezbaha Sistemleri"
  const blogCategory = await prisma.blogCategory.upsert({
    where: { slug: "mezbaha-sistemleri" },
    create: { slug: "mezbaha-sistemleri" },
    update: {},
  });
  await prisma.blogCategoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: blogCategory.id, locale: "tr" } },
    create: { categoryId: blogCategory.id, locale: "tr", name: "Mezbaha Sistemleri" },
    update: {},
  });
  console.log(`✓ BlogCategory: ${blogCategory.slug}`);

  // Kaynak: current-site-inventory.md §5 — gerçek başlık, sitede tam makale metni ayrıca doğrulanmadığı
  // için `content` alanı boş bırakıldı (uydurulmadı).
  const post1 = await prisma.blogPost.upsert({
    where: { slug: "rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir" },
    create: {
      slug: "rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir",
      categoryId: blogCategory.id,
      authorType: "company",
      authorName: "Mezbaha Teknolojileri",
      status: "PUBLISHED",
      publishedAt: new Date(),
      featured: true,
    },
    update: {},
  });
  await prisma.blogPostTranslation.upsert({
    where: { blogPostId_locale: { blogPostId: post1.id, locale: "tr" } },
    create: {
      blogPostId: post1.id,
      locale: "tr",
      title: "Raylı Taşıma Sistemleri (İkizray) Nedir ve Neden Kullanılır?",
      excerpt:
        "Karkas taşıma hatlarında ikizray sistemlerinin işleyişi ve mezbaha verimliliğine katkısı.",
      seoTitle: "Raylı Taşıma Sistemleri (İkizray) Nedir ve Neden Kullanılır?",
      seoDescription:
        "Karkas taşıma hatlarında ikizray sistemlerinin işleyişi ve mezbaha verimliliğine katkısı.",
    },
    update: {},
  });
  console.log(`✓ BlogPost: ${post1.slug}`);

  const post2 = await prisma.blogPost.upsert({
    where: { slug: "mezbaha-hijyeni-nasil-saglanir" },
    create: {
      slug: "mezbaha-hijyeni-nasil-saglanir",
      categoryId: blogCategory.id,
      authorType: "company",
      authorName: "Mezbaha Teknolojileri",
      status: "PUBLISHED",
      publishedAt: new Date(),
      featured: true,
    },
    update: {},
  });
  await prisma.blogPostTranslation.upsert({
    where: { blogPostId_locale: { blogPostId: post2.id, locale: "tr" } },
    create: {
      blogPostId: post2.id,
      locale: "tr",
      title: "Mezbaha Hijyeni Nasıl Sağlanır?",
      excerpt: "Kesim hatlarında hijyen standartlarını korumak için uygulanan yöntemler.",
      seoTitle: "Mezbaha Hijyeni Nasıl Sağlanır?",
      seoDescription: "Kesim hatlarında hijyen standartlarını korumak için uygulanan yöntemler.",
    },
    update: {},
  });
  console.log(`✓ BlogPost: ${post2.slug}`);

  // Kaynak: docs/url-migration-map.md — bu test veri setine karşılık gelen gerçek eski URL'ler.
  const redirects: { sourcePath: string; destinationPath: string }[] = [
    { sourcePath: "/tr/buyukbas-mezbaha-makinalari", destinationPath: "/urunler/buyukbas" },
    { sourcePath: "/tr/hidrolik-deri-yuzme-makinasi", destinationPath: "/urun/hidrolik-deri-yuzme-makinasi" },
    { sourcePath: "/tr/karkas-bolme-testeresi", destinationPath: "/urun/karkas-bolme-testeresi" },
    { sourcePath: "/tr/dairesel-kesim-hucresi", destinationPath: "/urun/dairesel-kesim-hucresi" },
  ];

  for (const redirect of redirects) {
    await prisma.redirect.upsert({
      where: { sourcePath: redirect.sourcePath },
      create: { ...redirect, statusCode: 301, active: true },
      update: {},
    });
  }
  console.log(`✓ Redirect: ${redirects.length} kayıt (url-migration-map.md test alt kümesi)`);

  console.log("Tamamlandı.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
