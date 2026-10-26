"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-xl">If you can see this, the page is rendering correctly.</p>
      <div className="mt-8 p-4 bg-naija-green rounded-lg">
        <p>This box should be green (naija-green color)</p>
      </div>
    </div>
  );
}
