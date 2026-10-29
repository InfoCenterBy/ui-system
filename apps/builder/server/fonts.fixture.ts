// Trimmed real shape of a Google css2 answer: subset comment, then the face
export const GOOGLE_SAMPLE = `/* cyrillic-ext */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v20/ext.woff2) format('woff2');
  unicode-range: U+0460-052F, U+1C80-1C8A;
}
/* cyrillic */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v20/cyr.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin */
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/inter/v20/lat.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131;
}
`

// The public list starts with a line that stops it being read as a script
export const METADATA_SAMPLE =
	")]}'\n" +
	JSON.stringify({
		familyMetadataList: [
			{
				family: 'Roboto',
				category: 'Sans Serif',
				fonts: { '400': {}, '700i': {} },
			},
			{ family: 'Mint', category: 'Serif', fonts: { '400': {} } },
			{
				family: 'Intel One',
				category: 'Sans Serif',
				fonts: { '400': {} },
			},
			{
				family: 'Inter',
				category: 'Sans Serif',
				fonts: { '400': {}, '100': {} },
			},
		],
	})
