import { getHeadings } from "@utils/mdx";
import { getPost } from "@utils/allPosts";
import Blog from "@components/Blog";
import ContentTable from "@components/Blog/ContentTable";
import { allComparisons, Comparisons } from "contentlayer/generated";
import { useMDXComponent } from "next-contentlayer/hooks";
import MDXComponents from "@components/MDXComponents";

export async function getStaticPaths() {
  return {
    paths: allComparisons.map((p) => ({ params: { slug: p.slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: any }) {
  const relatedPosts = allComparisons.map((item: any) => ({
    url: item.url,
    keyword: item.keyword,
    description: item.description,
    support: item.support ? item.support : "",
  }));
  const post = allComparisons.find((post) => post.slug === params.slug);
  const headings = await getHeadings(post!.body.raw);
  return { props: { post, headings, relatedPosts } };
}

const PostLayout = ({
  post,
  headings,
  relatedPosts,
}: {
  post: Comparisons;
  headings: any;
  relatedPosts: any;
}) => {
  const MDXContent = useMDXComponent(post.body.code);
  return (
    <>
      <Blog meta={post} posts={relatedPosts}>
        <ContentTable contentTable={headings} />
        <MDXContent components={MDXComponents} />
      </Blog>
    </>
  );
};

export default PostLayout;
