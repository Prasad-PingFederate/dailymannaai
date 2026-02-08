// src/app/bible-explorer/page.tsx
import BibleExplorer from '@/components/bible-explorer/BibleExplorer';

export default function BibleExplorerPage() {
    return (
        <main className="min-h-screen bg-slate-100 py-12 px-4 flex justify-center">
            <div className="w-full max-w-4xl h-[80vh]">
                <BibleExplorer />
            </div>
        </main>
    );
}
