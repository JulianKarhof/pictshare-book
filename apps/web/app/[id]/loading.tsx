export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full dark:border-t-white animate-spin mb-4" />
      <p className="text-lg text-gray-700 dark:text-gray-300">
        Loading Book...
      </p>
    </div>
  );
}
