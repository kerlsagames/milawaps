"use client";

import Image from "next/image";
import { RulesView } from "@/components/rules-view";

export function YardRulesView() {
  return (
    <div className="grid gap-3 lg:h-full lg:grid-cols-2 lg:items-stretch">
      <div className="flex min-h-0 items-center justify-center overflow-hidden rounded-[28px] border border-black/10 bg-[#d7c49a] shadow-[0_8px_0_rgba(90,60,20,0.12)]">
        <Image
          src="/milawa-yard.jpg"
          alt="Aerial of Milawa Primary School. Gold is F/1, teal is 2/3/4, purple is 5/6."
          width={1888}
          height={2222}
          priority
          className="h-auto max-h-[58vh] w-full object-contain lg:max-h-full"
        />
      </div>
      <RulesView paired />
    </div>
  );
}
