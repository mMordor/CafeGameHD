import { Suspense } from "react";
import HomeExperience from "@/components/home/HomeExperience";
import Loading from "./loading";

export default function HomePage() {
  // useSearchParams (for /?reserve=1) needs a Suspense boundary.
  return (
    <Suspense fallback={<Loading />}>
      <HomeExperience />
    </Suspense>
  );
}
