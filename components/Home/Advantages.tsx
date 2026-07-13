import "atropos/css";
import Atropos from "atropos/react";

const advantages = [
  ["visualizer-1", "reduces file size of images by 20-90%"],
  ["visualizer-3", "developed by tech giants like Google"],
  ["visualizer-4", "open to use and royalty-free"],
  ["visualizer-6", "already at 70% browser support"],
  ["visualizer-7", "supports transparency to replace PNG"],
  ["visualizer-8", "supports animations to replace GIFs"],
  ["visualizer-9", "embraces HDR and 12-bit color depth"],
  ["visualizer-10", "future-proof VP-10 codec technology"],
  ["visualizer-11", "latest GPUs support hardware decoding"],
  ["visualizer-12", "full of features for smartphones"],
];

export default function Advantages() {
  return (
    <section
      className="container grid relative grid-cols-1 gap-4 p-2 mt-2 mb-12 md:grid-cols-2 lg:grid-cols-3 lg:p-0 xl:grid-cols-4 2xl:grid-cols-5"
      id="avifadvantages"
    >
      {advantages.map((advantage) => (
        <Atropos
          key={advantage[1]}
          activeOffset={20}
          shadowScale={1.01}
          rotateXMax={20}
          scaleClassName="rounded-lg h-full"
          rotateClassName="rounded-lg h-full"
          innerClassName="rounded-lg h-full"
          shadow={false}
          rotateTouch={false}
        >
          <div
            tabIndex={0}
            className="grid overflow-hidden relative z-50 p-4 h-full text-center rounded-lg transition-all duration-200 ease-out transform-gpu hover:scale-105 group bg-bg-600"
            data-atropos-offset="0"
          >
            <div
              className="z-0 mb-4 h-6 bg-center bg-no-repeat bg-contain rounded-lg transition-all duration-500 ease-out origin-center background-no-repeat group-hover:scale-[200]"
              data-atropos-offset="10"
              style={{
                backgroundImage: `url(/assets/${advantage[0]}.svg)`,
              }}
            ></div>
            <div
              className="h-auto leading-snug ease-in md:h-7"
              data-atropos-offset="2"
            >
              <span className="font-bold leading-snug">{advantage[1]}</span>
            </div>
            <div
              className="absolute top-0 right-0 bottom-0 left-0 bg-center bg-cover md:bg-no-repeat"
              style={{
                backgroundImage: `url(/assets/${advantage[0]}.svg)`,
                opacity: "0.025",
                filter: "blur(4px)",
              }}
            ></div>
          </div>
        </Atropos>
      ))}
    </section>
  );
}
