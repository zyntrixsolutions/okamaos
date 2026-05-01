import LessonPage from "@/components/LessonPage";

// Next.js 16: params is a Promise
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LearnSlugPage({ params }: PageProps) {
  const { slug } = await params;
  return <LessonPage slug={slug} />;
}
