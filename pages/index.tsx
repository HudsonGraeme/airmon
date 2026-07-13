//React
import { ChangeEvent, useEffect, useState } from "react";
import { InferGetStaticPropsType, NextPage } from "next";

// Contentlayers
import { allTutorials } from "contentlayer/generated";

//Converter
import Conversion from "@components/Home/Conversion";
import DownloadButton from "@components/Home/DownloadButton";
import Dropzone from "@components/Home/Dropzone";
import SettingsBox, { Settings } from "@components/Home/SettingsBox";
import Converter from "@utils/converter";
import { uniqueId } from "@utils/utils";

//Page Layout & Blog
import Layout from "@components/Layout";
import Tooltip from "@components/Home/Tooltip";
import Advantages from "@components/Home/Advantages";
import Post from "@components/Blog/Post";
import Ad from "@components/Blog/Ad";
import ImageComparison from "@components/Home/ImageComparison";
import PostCloud from "@components/Blog/PostCloud";

interface FileWithId {
  file: File;
  id: number;
}

const getPosts = () => {
  const parsePosts = (serialisedDoc: any) => {
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
    tutorials: allTutorials.map((doc) => parsePosts(doc)),
  };
};

export const getStaticProps = async () => {
  const posts = getPosts();
  const tutorials = posts.tutorials;
  const defaultFilteredPost = [...tutorials];

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
      tutorials,
      defaultFilteredPost,
      listSubCategories,
      listCategories,
      listSupport,
    },
  };
};
type PostsPageProps = InferGetStaticPropsType<typeof getStaticProps>;
const Index: NextPage<PostsPageProps> = ({
  tutorials,
  listSupport,
  listSubCategories,
}) => {
  const [filteredPost, setFilteredPost] = useState([]);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [selectedCategoryPill, setSelectedCategoryPill] = useState("");

  const [converter, setConverter] = useState<Converter>();
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [convertedFiles, setConvertedFiles] = useState<File[]>([]);
  const [settingsBoxOpen, setSettingsBoxOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    effort: 25,
    quality: 75,
    useYuv444: false,
    keepTransparency: true,
    autoDownload: false,
  });

  useEffect(() => setConverter(new Converter()), []);

  function onSettingsUpdate(settings: Settings) {
    setSettings(settings);
  }

  async function onFilesSelected(selectedFiles: File[]) {
    setFiles([
      ...files,
      ...selectedFiles.map((file) => ({ file, id: uniqueId() })),
    ]);
    setSettingsBoxOpen(false);
  }

  function onConversionFinished(file: File) {
    convertedFiles.push(file);
    setConvertedFiles([...convertedFiles]);
  }

  const handleSelectedPill = (category: string) => {
    if (category === selectedCategoryPill) {
      setSelectedCategoryPill("");
      setFilteredPost([]);
      return;
    }

    setSelectedCategoryPill(category);
    const filteredPosts = tutorials.filter((post) => {
      return post.subcategory === category || post.support === category;
    });

    setFilteredPost(filteredPosts as any);
  };

  const handleFilterByKeyword = (event: ChangeEvent<HTMLInputElement>) => {
    const keyword = event.target.value;
    const filtered = tutorials.filter((post) =>
      post.keyword?.toLowerCase().includes(keyword.toLowerCase())
    );
    setFilterKeyword(keyword);
    setFilteredPost(filtered as any);
  };

  const meta = {
    title: "AVIF Converter - unlimited free conversions",
    description:
      "Fastest converter online. Supports bulk. Privacy protected. Convert all image types to AVIF for free.🚀 Compress your images now!⏱",
    url: "",
    datePublished: "2020-09-01",
  };

  return (
    <Layout meta={meta}>
      <section className="container mt-6 lg:mt-12 text-center">
        <h1>Convert images to AVIF for free, fast.</h1>
        <div className="justify-center mb-4 lg:mb-6 md:flex">
          <h2 className="my-0 text-base font-normal">
            No data is sent. The magic happens in your browser.
          </h2>
          <Tooltip text="How?">
            Rav1e, Rust, and WASM convert your images locally.
          </Tooltip>
        </div>

        <div
          data-transition-style="bouncingIn"
          className={
            "w-[720px] relative mx-auto flex flex-col items-center justify-center max-w-full rounded-xl p-0 md:p-4 bg-white bg-opacity-5" +
            (settingsBoxOpen ? " open" : "")
          }
        >
          <Dropzone onDrop={onFilesSelected} />

          <button
            aria-label="Conversion settings"
            className={`absolute top-4 right-4 z-50 block w-5 h-5 p-5 cursor-pointer transition-all transform ease-cog duration-300 bg-no-repeat bg-center invisible md:visible ${
              settingsBoxOpen ? " rotate-180" : "rotate-0"
            }`}
            style={{
              backgroundImage: `url(/assets/settings.svg)`,
              backgroundSize: 24,
              filter: `${
                settingsBoxOpen
                  ? "invert(15%) sepia(52%) saturate(6095%) hue-rotate(348deg) brightness(87%) contrast(88%)"
                  : "none"
              }`,
            }}
            onClick={() => setSettingsBoxOpen(!settingsBoxOpen)}
          ></button>
          <div
            className={
              "absolute top-0 left-full ml-4 w-24 h-auto p-3 bg-bg-400 rounded-md ease-out transform transition-all duration-500 origin-left" +
              (settingsBoxOpen
                ? " opacity-100 translate-x-0 scale-100"
                : " opacity-0 -translate-x-12 scale-0 ")
            }
          >
            <SettingsBox
              open={settingsBoxOpen}
              onSettingsUpdate={onSettingsUpdate}
            />
          </div>

          {converter &&
            files.map(({ file, id }) => (
              <Conversion
                onFinished={onConversionFinished}
                settings={settings}
                file={file}
                converter={converter}
                key={id}
              />
            ))}
          <DownloadButton files={convertedFiles} />
        </div>
      </section>
      <section className="hidden overflow-hidden px-3 mt-12 mb-4 max-w-screen-lg md:block">
        <div
          className="absolute inset-0 mx-auto w-3/5 rounded-full ease-in-out -z-10 bg-gradient blur-[100px]"
          data-transition-style="glow"
        />
      </section>
      <Advantages />
      <ImageComparison />
      <aside className="mx-auto max-w-screen-md">
        <Ad />
      </aside>
      <div className="container mt-12 text-center">
        <div className="mx-auto text-base font-normal max-w-[768px]">
          <h3>How to use AVIF</h3>
          Support is constantly rising across software and hardware. Thanks to
          being royalty-free, companies can include the format without having to
          deal with patents. Get started on all different types of browsers,
          operating systems, and software.
          <input
            type="text"
            placeholder="🔎︎ Search all posts"
            className="block relative py-3 px-3 pr-10 my-4 w-full text-white rounded-md border-2 outline-none focus:border-pink-700 bg-bg-400 border-bg-500"
            onChange={handleFilterByKeyword}
          />
          {[listSubCategories, listSupport].map((type: any, key: any) => (
            <div className="flex flex-wrap gap-2 mb-2" key={key}>
              {type.map((category: any) => (
                <button
                  key={category}
                  onClick={() => handleSelectedPill(category)}
                  className={`px-2 py-0 rounded-sm font-normal ${
                    selectedCategoryPill === category
                      ? "bg-red-1000 border-transparent text-pink-700 hover:bg-indigo-700"
                      : "bg-bg-500 text-gray-300"
                  }`}
                >
                  {selectedCategoryPill === category && <span>✓</span>}
                  {category == "full" ||
                  category == "partial" ||
                  category == "no"
                    ? category + " support"
                    : category}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 mt-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filterKeyword.length > 0 || filteredPost.length ? (
            <>
              {filteredPost.map((post: any) => (
                <Post
                  key={post.keyword}
                  description={post.description}
                  support={post.support}
                  category={post.category}
                  subcategory={post.subcategory}
                  keyword={post.keyword}
                  url={post.url}
                />
              ))}
            </>
          ) : (
            <>
              {tutorials.map((post: any) => (
                <Post
                  key={post.keyword}
                  description={post.description}
                  support={post.support}
                  category={post.category}
                  subcategory={post.subcategory}
                  keyword={post.keyword}
                  url={post.url}
                />
              ))}
            </>
          )}
        </div>
      </div>
      <aside className="px-2 mx-auto max-w-screen-md">
        <Ad />
      </aside>
      <div className="container px-2 mt-12 max-w-screen-md text-left md:text-center">
        In the last ten years,{" "}
        <b>
          the size of an average web page has increased from 500 kb to 2000 kb
        </b>
        . Images always take up half the amount. A new image format is needed to
        stop the increasing size of images on the web. JPEG has been the most
        popular image format for years due to its high compatibility.
        <br /> <b>AVIF is the modern solution</b>. It was developed by the
        Alliance for Open Media, a collaboration of Google, Apple, Mozilla,
        Intel and other tech giants. AVIF is a codec for highly compressed
        images of acceptable quality and is constantly improving.{" "}
        <b>
          AVIF offers a significant reduction in file size compared to the
          current JPEG or WebP codecs
        </b>
        .<br /> You can reduce file sizes by 20-90%, even for images with
        transparency and animated frames. Currently supported by Chrome, Opera
        and Firefox, you can expect it to get more support soon.
        <br /> AVIF is being
        <b> developed by the most influential technology companies</b>. Netflix
        has already considered AVIF superior to JPEG and even newer WebP image
        formats in terms of image quality to compressed file size ratio. AV1 has
        been developed by industry leaders and technological innovators from all
        reputable companies. They licensed their codec patents royalty-free to
        create an ecosystem that would last. <br />{" "}
        <b>There is no other codec that seems as promising as AVIF</b>. With its
        widespread support, current feature rate, royalty-free usage and highest
        compression rate achieved, we are only a few steps away from creating a
        truly modern web. avif.io helps to strengthen the support of AVIF by
        providing information, news, resources and an AVIF converter to convert
        PNG to AVIF, JPG to AVIF and more image formats.
        <br />
        Enjoy the free AVIF converter online, convert your images to AVIF today
        and enjoy the amazing compression it provides.
      </div>
      <PostCloud />
    </Layout>
  );
};

export default Index;
