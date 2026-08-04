import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { postQuery } from "@/lib/public-queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Studio Evergreen` },
      {
        name: "description",
        content: "Articolo di prevenzione e salute orale a cura dello Studio Evergreen di Milano.",
      },
      { property: "og:type", content: "article" },
      { property: "og:title", content: "Risorse — Studio Evergreen" },
      {
        property: "og:description",
        content: "Articolo di prevenzione e salute orale del nostro team.",
      },
      { property: "og:url", content: `/blog/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
  }),
  component: PostPage,
  notFoundComponent: () => (
    <SiteLayout>
      <PageHeader title="Articolo non trovato" />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <Button variant="hero" asChild>
          <Link to="/blog">Torna alle risorse</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={post.category}
        title={post.title}
        description={post.published_at ? `Pubblicato il ${formatDate(post.published_at)}` : undefined}
      />
      <article className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-muted-foreground text-lg leading-relaxed">{post.excerpt}</p>
        <div className="mt-8 leading-relaxed whitespace-pre-line">{post.content}</div>
        <div className="border-border mt-12 border-t pt-8">
          <Button variant="hero" asChild>
            <Link to="/prenota">Prenota una visita di controllo</Link>
          </Button>
        </div>
      </article>
    </SiteLayout>
  );
}