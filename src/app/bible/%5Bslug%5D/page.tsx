import BibleExplorer from '@/components/bible-explorer/BibleExplorer';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

// SEO Metadata for the specific book
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bookName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    title: `${bookName} | Bible Explorer | DailyMannaAI`,
    description: `Read and study the book of ${bookName} in various translations. AI-powered Bible study, cross-references, and more.`,
    openGraph: {
      title: `${bookName} - DailyMannaAI`,
      description: `Explore the book of ${bookName} at DailyMannaAI.`,
      url: `https://www.dailymannaai.com/bible/${slug}`,
    }
  };
}

export default async function BibleBookPage({ params }: Props) {
  const { slug } = await params;
  
  return (
    <main className="h-screen w-screen overflow-hidden">
      <BibleExplorer initialBookSlug={slug} />
    </main>
  );
}
