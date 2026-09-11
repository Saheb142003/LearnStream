import React from "react";
import { Helmet } from "react-helmet-async";

export default function SEO({
  title,
  description,
  url,
  image,
  videoData,
  quizQuestions,
  type = "website",
  breadcrumbs = [],
}) {
  const defaultTitle = "LearnStream - Master New Skills with Online Video Courses";
  const defaultDesc =
    "Turn any YouTube video or playlist into an interactive learning experience with AI-powered summaries, smart transcripts, note cards, and practice quizzes.";
  const siteUrl = "https://learnstream.netlify.app";
  const ogImage = image || `${siteUrl}/assets/LS_icon.png`;
  const canonicalUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullTitle = title ? `${title} | LearnStream` : defaultTitle;
  const finalDesc = description || defaultDesc;

  // 1. WebSite & SearchAction Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LearnStream",
    url: siteUrl,
    description: defaultDesc,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/feed?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // 2. WebApplication Schema
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "LearnStream",
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    description: defaultDesc,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "Md Sahebuddin Ansari",
      url: "https://github.com/Saheb142003",
    },
  };

  // 3. VideoObject / Course Schema (when video data is supplied)
  let videoSchema = null;
  if (videoData && videoData.videoId) {
    videoSchema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: title || videoData.title || defaultTitle,
      description: finalDesc,
      thumbnailUrl: [
        image || `https://img.youtube.com/vi/${videoData.videoId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${videoData.videoId}/hqdefault.jpg`,
      ],
      uploadDate: videoData.uploadDate || new Date().toISOString(),
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoData.videoId}`,
      publisher: {
        "@type": "Organization",
        name: "LearnStream",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/assets/LS_icon.png`,
        },
      },
    };
  }

  // 4. FAQPage Schema for Quiz Questions
  let faqSchema = null;
  if (quizQuestions && quizQuestions.length > 0) {
    const mainEntities = quizQuestions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          Array.isArray(q.options) && q.options[q.correctAnswer]
            ? q.options[q.correctAnswer]
            : "Detailed answer and explanation available in LearnStream interactive quiz.",
      },
    }));
    faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: mainEntities,
    };
  }

  // 5. BreadcrumbList Schema
  let breadcrumbSchema = null;
  if (breadcrumbs && breadcrumbs.length > 0) {
    breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${siteUrl}${item.path}`,
      })),
    };
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={finalDesc} />
      <meta
        name="keywords"
        content="education, online courses, youtube learning, ai quiz generator, video transcripts, video summaries, programming tutorials, learnstream, study with ai"
      />
      <meta name="author" content="Md Sahebuddin Ansari" />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="LearnStream" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="LearnStream - Educational Learning Platform" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@saheb142003" />
      <meta name="twitter:creator" content="@saheb142003" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="LearnStream Preview" />

      {/* Structured Data JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
      {videoSchema && (
        <script type="application/ld+json">{JSON.stringify(videoSchema)}</script>
      )}
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Helmet>
  );
}
