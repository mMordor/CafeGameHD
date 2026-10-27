import { Suspense } from "react";
import HomeExperience from "@/components/home/HomeExperience";

export default function HomePage() {
  // useSearchParams (for /?reserve=1) needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <HomeExperience />
    </Suspense>
  );
}
