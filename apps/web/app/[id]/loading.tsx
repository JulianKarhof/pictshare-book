export default function Loading() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-[#1A1A1A]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-grey-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Loading Canvas...
        </p>
      </div>
      <div className="absolute bottom-4 flex flex-row justify-between items-center bg-gray-800 rounded-md opacity-50">
        <div className="pl-3 flex items-center">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="inline-block bg-gray-600 w-24 h-10 rounded mx-1 animate-pulse"
              />
            ))}
        </div>
        <div>
          <div className="text-white m-5 w-16 h-6 bg-gray-600 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
