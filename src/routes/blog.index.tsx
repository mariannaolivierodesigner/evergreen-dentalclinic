import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Clock } from "lucide-react";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { Tilt } from "@/components/site/motion";
import { Badge } from "@/components/ui/badge";
import { postsQuery } from "@/lib/public-queries";
import { formatDate } from "@/lib/format";
import { postImage } from "@/lib/post-images";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Magazine: consigli di salute orale — Studio Longobardi" },
      {
        name: "description",
        content:
          "Articoli chiari su igiene, prevenzione, ortodonzia e cura dei denti dei bambini, scritti dal team dello Studio Longobardi di Milano.",
      },
      { property: "og:title", content: "Magazine — Studio Longobardi" },
      {
        property: "og:description",
        content: "Consigli pratici di prevenzione e salute orale dal nostro team.",
      },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(postsQuery());
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { data: posts } = useSuspenseQuery(postsQuery());

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Magazine"
        title="Consigli utili, senza allarmismi"
        description="Quello che spieghiamo in poltrona, scritto in modo che resti anche dopo la visita."
        tone="dark"
      />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={(i % 3) * 90} variant="scale">
              <Tilt>
                <Link
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="surface-card group flex h-full flex-col overflow-hidden"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden">
                    <img
                      src={postImage(p.slug, p.category)}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <Badge variant="secondary" className="w-fit rounded-full">
                      {p.category}
                    </Badge>
                    <h2 className="mt-4 text-lg font-semibold">{p.title}</h2>
                    <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                      {p.excerpt}
                    </p>
                    <p className="text-muted-foreground mt-5 flex items-center gap-3 text-xs">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {p.read_minutes} min
                      <span aria-hidden="true">·</span>
                      {p.published_at ? formatDate(p.published_at) : null}
                      <ArrowRight
                        className="text-primary ml-auto h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </p>
                  </div>
                </Link>
              </Tilt>
            </Reveal>
          ))}
        </ul>
      </div>
    </SiteLayout>
  );
}
