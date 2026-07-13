import { useState } from "react";
import { InferGetStaticPropsType, NextPage } from "next";
import Post from "@components/Blog/Post";
import Layout from "@components/Layout";
import Ad from "@components/Blog/Ad";

import {
  allArticles,
  allComparisons,
  allTutorials,
  AllTypes,
} from "contentlayer/generated";
import PostCloud from "@components/Blog/PostCloud";

const meta = {
  blog: {
    title: "AVIF Blog",
    description: "Get a support overview, find tutorials or ask a question",
    url: "blog/",
    datePublished: "2020-09-01",
  },
};

const getPosts = () => {
  const parsePosts = (serialisedDoc: any | AllTypes) => {
    const { _id, body, ...data } = serialisedDoc;
    return {
      url: data.url ? data.url : "",
      support: data.support ? data.support : "",
      subcategory: data.subcategory ? data.subcategory : "",
      category: data.category ? data.category : "",
      keyword: data.keyword ? data.keyword : "",
      title: data.title ? data.title : "",
      description: data.description ? data.description : "",
    };
  };

  return {
    articles: allArticles.map((doc) => parsePosts(doc)),
    comparisons: allComparisons.map((doc) => parsePosts(doc)),
    tutorials: allTutorials.map((doc) => parsePosts(doc)),
  };
};

export const getStaticProps = async () => {
  const posts = getPosts();

  const articles = posts.articles;
  const comparisons = posts.comparisons;
  const tutorials = posts.tutorials;

  const defaultFilteredPost = [...articles, ...comparisons, ...tutorials];

  const listSubCategories = [
    ...new Set(defaultFilteredPost.map((post) => post.subcategory)),
  ].filter(Boolean);
  const listCategories = [
    ...new Set(defaultFilteredPost.map((post) => post.category)),
  ].filter(Boolean);
  const listSupport = [
    ...new Set(defaultFilteredPost.map((post) => post.support)),
  ].filter(Boolean);

  return {
    props: {
      articles,
      comparisons,
      tutorials,
      defaultFilteredPost,
      listSubCategories,
      listCategories,
      listSupport,
    },
  };
};

type PostsPageProps = InferGetStaticPropsType<typeof getStaticProps>;
const BlogAvif: NextPage<PostsPageProps> = ({
  articles,
  comparisons,
  tutorials,
  defaultFilteredPost,
  listSubCategories,
  listCategories,
  listSupport,
}) => {
  getPosts();
  const [filteredPost, setFilteredPost] = useState([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedCategoryPill, setSelectedCategoryPill] = useState("");

  const handleSelectedPill = (category: string) => {
    if (category === selectedCategoryPill) {
      setSelectedCategoryPill("");
      setFilteredPost([]);
      return;
    }

    setSelectedCategoryPill(category);
    const filteredPosts = defaultFilteredPost.filter((post) => {
      return (
        post.category === category ||
        post.subcategory === category ||
        post.support === category
      );
    });

    setFilteredPost(filteredPosts as any);
  };

  const handleFilterByKeyword = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const keyword = event.target.value;
    const filtered = defaultFilteredPost.filter((post) =>
      post.title.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilterKeyword(keyword);
    setFilteredPost(filtered as any);
  };

  const postTypes = [
    ["Articles", articles],
    ["Comparisons", comparisons],
    ["Tutorials", tutorials],
  ];

  const filterTypes = [listCategories, listSubCategories, listSupport];

  return (
    <Layout meta={meta.blog}>
      <main className="p-2 md:p-4 archive blog">
        <div className="mt-12 text-center">
          <h1>{meta.blog.title}</h1>
          <h2 className="mb-8 text-base">{meta.blog.description}</h2>
        </div>
        <div className="container px-2">
          <input
            type="text"
            placeholder="🔎︎ Search all posts"
            className="block relative py-3 px-3 pr-10 mt-1 mb-3 w-full text-white rounded-md border-2 outline-none focus:border-pink-700 bg-bg-400 border-bg-500"
            onChange={handleFilterByKeyword}
          />
          {filterTypes.map((type: any, key: any) => (
            <div className="mb-2" key={key}>
              {type.map((category: any) => (
                <button
                  key={category}
                  onClick={() => handleSelectedPill(category)}
                  className={`inline-flex items-center px-2 py-0 mt-2 mr-2 py-0.5 rounded-sm font-normal cursor-pointer ${
                    selectedCategoryPill === category
                      ? "bg-red-1000 border-transparent text-pink-700 hover:bg-indigo-700"
                      : "bg-bg-500 text-gray-300"
                  }`}
                >
                  {selectedCategoryPill === category && (
                    <span className="mr-1">✓</span>
                  )}
                  {category == "full" ||
                  category == "partial" ||
                  category == "no"
                    ? category + " support"
                    : category}
                </button>
              ))}
            </div>
          ))}
          {filterKeyword.length > 0 || filteredPost.length ? (
            <div className="grid grid-cols-1 gap-2 mt-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {filteredPost.map((post: any) => (
                <Post
                  key={post.keyword}
                  title={post.title}
                  description={post.description}
                  support={post.support}
                  category={post.category}
                  subcategory={post.subcategory}
                  keyword={post.keyword}
                  url={post.url}
                />
              ))}
            </div>
          ) : (
            <>
              {postTypes.map((post: any, key: any) => (
                <section key={key}>
                  <h3
                    className="mt-8 mb-3 text-xl font-bold capitalize"
                    id={post[0].toLowerCase()}
                  >
                    {post[0]}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 mt-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {post[1].map((post: any) => (
                      <Post
                        key={post.keyword}
                        title={post.title}
                        description={post.description}
                        support={post.support}
                        category={post.category}
                        subcategory={post.subcategory}
                        keyword={post.keyword}
                        url={post.url}
                      />
                    ))}
                  </div>
                  <aside className="px-2 mx-auto max-w-screen-md">
                    <Ad />
                  </aside>
                </section>
              ))}
            </>
          )}
          <PostCloud />
        </div>
      </main>
    </Layout>
  );
};

export default BlogAvif;
