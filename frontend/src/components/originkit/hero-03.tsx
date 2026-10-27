"use client";
import "./hero-03.css";

import { Section12Hero } from "@/components/originkit/ui/hero-03/section-12-hero";

type Section12Props = {
  onCreate?: () => void;
};

const Section12 = ({ onCreate }: Section12Props) => {
  return <Section12Hero onCreate={onCreate} />;
};

export default Section12;
