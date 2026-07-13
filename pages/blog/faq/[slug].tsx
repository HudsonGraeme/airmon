import Blog from "@components/Blog";
import { allFAQs, FAQs } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import MDXComponents from "@components/MDXComponents";
import Head from "next/head";
import { jsonLdScriptProps } from "react-schemaorg";
import { FAQPage } from "schema-dts";
import Ad from "@components/Blog/Ad";
import Link from "@components/Link";

export async function getStaticPaths() {
  return {
    paths: allFAQs.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: any }) {
  const post = allFAQs.find((post) => post.slug === params.slug);
  return { props: { post } };
}

const PostLayout = ({ post }: { post: FAQs; headings: any }) => {
  const MDXContent = useMDXComponent(post.body.code);
  return (
    <>
      <Blog meta={post}>
        <Head>
          <script
            {...jsonLdScriptProps<FAQPage>({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: {
                "@type": "Question",
                name: post.title,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: post.answer,
                  url: process.env.NEXT_PUBLIC_SITE_URL + post.url,
                },
              },
            })}
          />
        </Head>
        <MDXContent components={MDXComponents} />
        <aside>
          <Ad />
        </aside>
        <aside className="container mt-8 max-w-3xl">
          <nav
            aria-label="chapters"
            className="p-4 my-4 rounded-lg md:py-2 bg-bg-400"
          >
            <h4 className="mb-2 bold">More questions about AVIF</h4>
            <ol className="list-none">
              {contentTable.map((entry, i) => (
                <li
                  className="py-0 list-item"
                  style={{ counterIncrement: "step-counter" }}
                  key={entry[0] + i}
                >
                  <Link
                    text={entry[0]}
                    className="text-red-700 no-underline md:text-base text-tiny"
                    href={`/blog/faq/${entry[1]}/`}
                  />
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <aside>
          <Ad />
        </aside>
      </Blog>
    </>
  );
};

const contentTable = [
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

export default PostLayout;
