// import type { Metadata } from "next";
// import CafeNav from "@/components/cafe/CafeNav";
// import CafeSection from "@/components/cafe/CafeSection";
// import { MENU } from "@/lib/menu";
// import "./cafe.css";

// export const metadata: Metadata = {
//   title: "منوی کافه | GameZone",
//   description: "نوشیدنی‌های سرد، نوشیدنی‌های گرم و غذاها و تنقلات کافه GameZone.",
// };

// export default function CafePage() {
//   return (
//     <div className="cf-page">
//       <h1 className="sr-only">منوی کافه</h1>
//       <CafeNav categories={MENU.map(({ id, navLabel }) => ({ id, navLabel }))} />
//       {MENU.map((category, i) => (
//         <CafeSection key={category.id} category={category} index={i} />
//       ))}
//     </div>
//   );
// }

import Hero from "@/components/cafe/Hero";
import MenuSection from "@/components/cafe/MenuSection";
import { menuCategories } from "@/lib/menu";

export default function HomePage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden">
      <Hero />
      {menuCategories.map((category, index) => (
        <MenuSection
          key={category.id}
          category={category}
          index={index}
        />
      ))}
    </main>
  );
}