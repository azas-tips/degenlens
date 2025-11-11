// Loading Skeleton Component
// Displays placeholder UI during data loading

/**
 * Skeleton row for table
 */
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800">
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-20"></div>
      </td>
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-16 ml-auto"></div>
      </td>
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-12 ml-auto"></div>
      </td>
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-16 ml-auto"></div>
      </td>
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-16 ml-auto"></div>
      </td>
      <td className="p-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-10 ml-auto"></div>
      </td>
    </tr>
  );
}

/**
 * Loading skeleton for results table
 * Shows animated placeholder while data is being fetched
 */
export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Analysis Summary Skeleton */}
      <div className="p-3 bg-dark-lighter border border-gray-700 rounded">
        <div className="h-4 bg-gray-700 rounded animate-pulse w-32 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-700 rounded animate-pulse w-full"></div>
          <div className="h-3 bg-gray-700 rounded animate-pulse w-5/6"></div>
          <div className="h-3 bg-gray-700 rounded animate-pulse w-4/6"></div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-400 border-b border-gray-800">
            <tr>
              <th className="text-left p-2">Token</th>
              <th className="text-right p-2">Price</th>
              <th className="text-right p-2">24h %</th>
              <th className="text-right p-2">Volume</th>
              <th className="text-right p-2">Liquidity</th>
              <th className="text-right p-2">Score</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Status text */}
      <div className="text-center text-sm text-gray-500">
        <p>Analyzing token pairs...</p>
      </div>
    </div>
  );
}
