import FileUploader from "@/components/FileUploader";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-xl p-8">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Resource Upload (small & large files)
        </h1>
        <FileUploader />
      </div>
    </main>
  );
}
