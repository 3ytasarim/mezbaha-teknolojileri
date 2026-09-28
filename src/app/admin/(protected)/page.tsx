import { prisma } from "@/lib/db";

async function getCounts() {
  const [products, projects, blogPosts, contactSubmissions, quoteRequests] =
    await Promise.all([
      prisma.product.count(),
      prisma.project.count(),
      prisma.blogPost.count(),
      prisma.contactSubmission.count({ where: { status: "NEW" } }),
      prisma.quoteRequest.count({ where: { status: "NEW" } }),
    ]);

  return { products, projects, blogPosts, contactSubmissions, quoteRequests };
}

export default async function AdminDashboardPage() {
  const counts = await getCounts();

  const cards = [
    { label: "Ürünler", value: counts.products },
    { label: "Projeler", value: counts.projects },
    { label: "Blog Yazıları", value: counts.blogPosts },
    { label: "Yeni İletişim Mesajı", value: counts.contactSubmissions },
    { label: "Yeni Teklif Talebi", value: counts.quoteRequests },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-100">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-neutral-800 bg-neutral-900 p-5"
          >
            <p className="text-sm text-neutral-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-50">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
