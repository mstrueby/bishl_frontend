import { useRouter } from "next/router";

export default function SectionHeader({ sectionData }: {
  sectionData: {
    title: string
    newLink?: string
  }
}) {
  const router = useRouter();

  return (
    <div className="border-b border-gray-200 pb-5 h-16 flex items-center justify-between">
      <h1 className="text-lg font-medium leading-6 text-gray-900">{sectionData.title}</h1>

      {sectionData.newLink && (
        <div className="mt-0 ml-4">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => router.push(sectionData.newLink)}
          >
            Neu
          </button>
        </div>
      )}

    </div>
  );
}