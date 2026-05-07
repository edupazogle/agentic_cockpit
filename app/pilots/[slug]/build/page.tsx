import { redirect } from 'next/navigation'

interface BuildPageProps {
  params: Promise<{ slug: string }>
}

export default async function BuildPage({ params }: BuildPageProps) {
  const { slug } = await params
  redirect(`/pilots/${slug}/build/i`)
}
