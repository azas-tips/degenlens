// Loading Skeleton Component
// Displays placeholder UI during data loading

/**
 * Loading skeleton for TOP PICK card
 * Shows animated placeholder while analysis is being performed
 */
export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP PICK Card Skeleton */}
      <div className="relative cyber-card p-8 bg-gradient-to-br from-primary/20 via-cyber-card to-neon-purple/10 border-2 border-primary/50 rounded-2xl shadow-neon-purple scanline">
        <div className="absolute top-4 right-4">
          <div className="h-4 bg-gradient-to-r from-neon-green/30 to-neon-green/60 rounded animate-pulse w-20 shadow-neon-green"></div>
        </div>

        {/* Symbol & Moonshot Potential */}
        <div className="mb-6">
          <div className="h-10 bg-gradient-to-r from-purple-500/30 to-purple-500/60 rounded-lg animate-pulse w-40 mb-3 shadow-neon-purple"></div>
          <div className="h-8 bg-gradient-to-r from-neon-cyan/30 to-neon-cyan/60 rounded-lg animate-pulse w-32 shadow-neon-cyan"></div>
        </div>

        {/* Momentum Phase */}
        <div className="mb-6">
          <div className="h-10 bg-gradient-to-r from-neon-green/30 to-profit/60 rounded-full animate-pulse w-36 shadow-neon-green"></div>
        </div>

        {/* Reason */}
        <div className="mb-6 p-5 bg-cyber-darker/80 border border-purple-500/30 rounded-xl backdrop-blur-sm">
          <div className="space-y-3">
            <div className="h-3 bg-gradient-to-r from-gray-600/50 to-purple-500/30 rounded animate-pulse w-full"></div>
            <div className="h-3 bg-gradient-to-r from-gray-600/50 to-purple-500/30 rounded animate-pulse w-5/6"></div>
            <div className="h-3 bg-gradient-to-r from-gray-600/50 to-purple-500/30 rounded animate-pulse w-4/6"></div>
          </div>
        </div>

        {/* Catalyst & Momentum Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-cyber-darker/50 border border-purple-500/20 rounded-lg">
            <div className="h-3 bg-gradient-to-r from-neon-cyan/40 to-neon-cyan/60 rounded animate-pulse w-20 mb-3 shadow-neon-cyan"></div>
            <div className="h-4 bg-gradient-to-r from-gray-600/50 to-purple-500/30 rounded animate-pulse w-28"></div>
          </div>
          <div className="p-4 bg-cyber-darker/50 border border-purple-500/20 rounded-lg">
            <div className="h-3 bg-gradient-to-r from-neon-cyan/40 to-neon-cyan/60 rounded animate-pulse w-20 mb-3 shadow-neon-cyan"></div>
            <div className="h-6 bg-gradient-to-r from-neon-green/40 to-neon-green/60 rounded animate-pulse w-16 shadow-neon-green"></div>
          </div>
        </div>

        {/* Contract Address */}
        <div className="p-5 bg-cyber-darker/80 rounded-xl border-2 border-neon-cyan/30 shadow-neon-cyan">
          <div className="h-3 bg-gradient-to-r from-neon-cyan/40 to-neon-cyan/60 rounded animate-pulse w-28 mb-3 shadow-neon-cyan"></div>
          <div className="flex items-center gap-3">
            <div className="h-8 bg-gradient-to-r from-gray-600/50 to-purple-500/30 rounded animate-pulse flex-1"></div>
            <div className="h-10 bg-gradient-to-r from-neon-cyan/30 to-neon-blue/40 rounded-lg animate-pulse w-24 shadow-neon-cyan"></div>
          </div>
        </div>
      </div>

      {/* Status text */}
      <div className="text-center text-sm font-mono">
        <div className="mb-6 flex items-center justify-center">
          <div className="relative w-20 h-20">
            {/* Rotating rings */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-neon-purple animate-spin"></div>
            <div
              className="absolute inset-2 rounded-full border-2 border-transparent border-b-neon-cyan animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>
            <div
              className="absolute inset-4 rounded-full border-2 border-transparent border-l-neon-pink animate-spin"
              style={{ animationDuration: '2s' }}
            ></div>
            {/* Center pulse */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-neon-purple animate-glow-pulse"></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-neon-purple animate-glow-pulse"></div>
          <p className="text-neon-cyan font-bold">Analyzing token pairs...</p>
        </div>
        <p className="text-xs text-gray-500">Finding the best opportunity</p>
      </div>
    </div>
  );
}
