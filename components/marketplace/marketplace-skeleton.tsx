export function MarketplaceSkeleton() {
  return (
    <div className="grid lg:grid-cols-4 gap-8">
      {/* Filters Sidebar Skeleton */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="space-y-6">
            {/* Search skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            
            {/* Location skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            
            {/* Rating skeleton */}
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="lg:col-span-3">
        {/* Results Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>

        {/* Companies Grid Skeleton */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6">
              {/* Company logo */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4"></div>
              
              {/* Company name */}
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              
              {/* Location */}
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              
              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              
              {/* Description */}
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              
              {/* Specialties */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              
              {/* Button */}
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}