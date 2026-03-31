import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function GameCardSkeleton() {
  return (
    <Card className="border-gray-700/50 bg-gray-900/60 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-700 opacity-50" />
      <CardHeader className="pb-2 pt-5">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Skeleton className="h-3 w-20 mb-1" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="bg-black/30 rounded-lg p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <div className="grid grid-cols-4 gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-10 mx-auto mb-1" />
                <Skeleton className="h-2 w-6 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
