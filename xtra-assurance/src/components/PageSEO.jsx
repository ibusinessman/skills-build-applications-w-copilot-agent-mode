import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://xtra-asirans.ht';

export default function PageSEO({ title, description, path = '/', structuredData }) {
  const fullTitle = title
    ? `${title} | Xtra Assurance`
    : 'Xtra Assurance | Asirans Mototaxi #1 Ayiti';

  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
