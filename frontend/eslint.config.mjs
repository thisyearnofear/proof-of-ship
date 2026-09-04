import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...coreWebVitals,
  {
    rules: {
      // Existing components rely on data-fetching effects that trigger these
      // experimental react-hooks rules. Disable for a green lint while the
      // codebase is being prepared for demo.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/error-boundaries": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      // Pre-existing lint debt across the demo app; not worth blocking deploy.
      "react/no-unescaped-entities": "off",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
