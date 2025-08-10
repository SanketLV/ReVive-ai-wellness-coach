import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderIcon, RefreshCwIcon, SparklesIcon } from "lucide-react";
import React from "react";
import RecommendationCard from "./recommendation-card";
import { RecommendationResult } from "@/types";

interface Props {
  hasSearched: boolean;
  isLoading: boolean;
  recommendations: any[];
  searchRecommendations: () => void;
  handleSaveRecommendation: (recommendation: RecommendationResult) => void;
  handleTryRecommendation: (recommendation: RecommendationResult) => void;
  seedSampleData: () => void;
}

const RecommendationResultComp = ({
  hasSearched,
  isLoading,
  recommendations,
  searchRecommendations,
  handleSaveRecommendation,
  handleTryRecommendation,
  seedSampleData,
}: Props) => {
  return (
    <>
      {hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {isLoading
                ? "Searching..."
                : `Recommendations (${recommendations.length})`}
            </h2>
            {recommendations.length > 0 && (
              <Button
                variant="outline"
                onClick={searchRecommendations}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendation) => (
                <RecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  onSave={handleSaveRecommendation}
                  onTry={handleTryRecommendation}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Recommendations Found</CardTitle>
                <CardDescription>
                  Try adjusting your filters or seed some sample data to get
                  started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Here are some tips to get better recommendations:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Remove some filters to broaden your search</li>
                    <li>Try different meal types or workout styles</li>
                    <li>Adjust your time availability</li>
                    <li>Experiment with different difficulty levels</li>
                  </ul>
                  <Button onClick={seedSampleData} disabled={isLoading}>
                    {isLoading ? (
                      <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="mr-2 h-4 w-4" />
                    )}
                    Seed Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </>
  );
};

export default RecommendationResultComp;
