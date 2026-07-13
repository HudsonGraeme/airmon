import Link from "@components/Link";

const posts = [
  ["What is an AVIF file?", "what-is-avif"],
  ["What are the benefits of AVIF?", "avif-benefits"],
  ["What is the downside of AVIF?", "avif-downsides"],
  ["What is the goal of AVIF?", "avif-goal"],
  ["Why AVIF?", "why-avif"],
  ["What is AVIF used for?", "avif-use"],
  ["Who created AVIF?", "avif-creator"],
  ["How was AVIF created?", "avif-creation"],
  ["What is the technology stack behind AVIF?", "avif-technologies"],
  ["Is AVIF based on other formats?", "avif-other-formats"],
  ["Is AVIF open source?", "avif-opensource"],
  ["Does AVIF have patents?", "avif-patents"],
  ["What features does AVIF support?", "avif-features"],
  ["Is AVIF a lossless or lossy format?", "avif-loss"],
  ["Is AVIF lossless?", "avif-lossless"],
  ["Is AVIF lossy?", "avif-lossy"],
  ["Does AVIF support transparency?", "avif-transparency"],
  ["Does AVIF support animation?", "avif-animation"],
  ["Does AVIF support SDR?", "avif-sdr"],
  ["Does AVIF support HDR?", "avif-hdr"],
  ["What is the highest megapixel count for AVIF?", "avif-megapixel"],
  ["Does AVIF support Wide Color Gamut?", "avif-wcg"],
  ["What color bit depth does AVIF support?", "avif-bitdepth"],
  ["What color space does AVIF support?", "avif-colorspace"],
  ["What chroma subsampling does AVIF support?", "avif-chromasubsampling"],
  ["Does AVIF support film grain?", "avif-filmgrain"],
  ["Does AVIF support tiling?", "avif-tiling"],
  ["Does AVIF support layers?", "avif-layers"],
  ["How good is AVIF encoding speed?", "avif-encoding"],
  ["How good is AVIF decoding speed?", "avif-decoding"],
  ["Why is AVIF better than other compression codecs?", "avif-better-codec"],
  ["Why is AVIF worse than other codecs?", "avif-worse-codec"],
  ["How do I convert AVIF to JPG?", "avif-to-jpg"],
  ["How do I convert AVIF to PNG?", "avif-to-png"],
];

export default function PostCloud() {
  return (
    <ol className="flex flex-wrap gap-1 text-red-700 text-tiny justify-center mt-8">
      {posts.map((source: any, index: any) => (
        <li key={index} className="py-0 px-1 rounded-md bg-red-1000">
          <Link text={source[0]} href={`/blog/faq/${source[1]}/`} />
        </li>
      ))}
    </ol>
  );
}
