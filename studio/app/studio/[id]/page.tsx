import StudioClient from "@/components/studio/StudioClient";

// Next.js 16: params is a Promise
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudioPage({ params }: PageProps) {
  const { id } = await params;
  return <StudioClient projectId={id} />;
}
