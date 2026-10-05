"use client";

import Image from "next/image";

export function MapView() {
  return (
    <div className="flex min-h-0 items-center justify-center">
      <div className="w-full overflow-hidden rounded-[28px] border border-black/10 bg-[#d7c49a] shadow-[0_16px_40px_rgba(90,60,20,0.18)]">
        <Image
          src="/milawa-yard.jpg"
          alt="Aerial of Milawa Primary School. Gold is F/1, teal is 2/3/4, purple is 5/6."
          width={1888}
          height={2222}
          priority
          className="mx-auto h-auto max-h-[calc(100dvh-7.5rem)] w-full object-contain"
        />
      </div>
    </div>
  );
}
