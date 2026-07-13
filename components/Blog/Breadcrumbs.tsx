import Link from "@components/Link";
import Head from "next/head";
import { jsonLdScriptProps } from "react-schemaorg";
import { BreadcrumbList } from "schema-dts";
import { useRouter } from "next/router";

export default function Breadcrumbs() {
  const { asPath } = useRouter();
  const url = asPath.split("/");
  const crumb1 = `${process.env.NEXT_PUBLIC_SITE_URL}${url[1]}/`;
  const crumb2 = `${process.env.NEXT_PUBLIC_SITE_URL}${url[1]}#${url[2]}`;
  return (
    <>
      <Head>
        <script
          {...jsonLdScriptProps<BreadcrumbList>({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: url[1],
                item: crumb1,
              },
              url[2] && {
                "@type": "ListItem",
                position: 2,
                name: url[2],
                item: crumb2,
              },
            ],
          })}
        />
        )
      </Head>
      <div>
        <Link href={`/${url[1]}/`} text={`#${url[1]}`} />
        {url[2] && (
          <div className="inline ml-2">
            <Link href={`/${url[1]}/#${url[2]}`} text={`#${url[2]}`} />
          </div>
        )}
      </div>
    </>
  );
}
