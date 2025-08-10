import { auth } from "@/lib/auth";
import RecommendationPageView from "@/modules/recommend/ui/views/recommendation-page-view";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function RecommendationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <div>
      <RecommendationPageView />
    </div>
  );
}
