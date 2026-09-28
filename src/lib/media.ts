import "server-only";
import { prisma } from "@/lib/db";

export async function findMediaUsage(url: string): Promise<string[]> {
  const usages: string[] = [];

  const [
    productCover,
    productGallery,
    projectCover,
    projectGallery,
    blogCover,
  ] = await Promise.all([
    prisma.product.count({ where: { coverImage: url } }),
    prisma.productImage.count({ where: { imageUrl: url } }),
    prisma.project.count({ where: { coverImage: url } }),
    prisma.projectImage.count({ where: { imageUrl: url } }),
    prisma.blogPost.count({ where: { coverImage: url } }),
  ]);

  if (productCover > 0) usages.push(`${productCover} üründe kapak görseli`);
  if (productGallery > 0) usages.push(`${productGallery} ürün galeri görselinde`);
  if (projectCover > 0) usages.push(`${projectCover} projede kapak görseli`);
  if (projectGallery > 0) usages.push(`${projectGallery} proje galeri görselinde`);
  if (blogCover > 0) usages.push(`${blogCover} blog yazısında kapak görseli`);

  return usages;
}

export async function isMediaInUse(url: string): Promise<boolean> {
  const usages = await findMediaUsage(url);
  return usages.length > 0;
}
