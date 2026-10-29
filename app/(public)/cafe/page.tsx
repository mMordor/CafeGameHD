import type { Metadata } from "next";
import CafeExperience from "@/components/cafe/CafeExperience";
import "./cafe.css";

export const metadata: Metadata = {
  title: "منوی کافه | GameZone",
  description: "نوشیدنی‌های سرد، نوشیدنی‌های گرم و غذاها و تنقلات کافه GameZone.",
};

export default function CafePage() {
  return <CafeExperience />;
}
