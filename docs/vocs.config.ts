import { defineConfig } from "vocs";
import { version } from ".././package.json";

export default defineConfig({
  title: "Dacc-js",
  banner: 'Dacc-js is open-source software. Use at your own risk and responsibility. See [Privacy & Terms](/privacy-terms) for details.',
  editLink: {
    pattern: 'https://github.com/thefactlab-org/dacc-js/edit/main/docs/docs/pages/:path',
    text: 'Suggest changes to this page'
  },
  sidebar: {
    "/": [
      {
        text: "Introduction",
        items: [
          { text: 'Getting started', link: "/getting-started" },
          { text: 'Command', link: "/command" },
          { text: 'Examples', link: "/examples" }
        ]
      },
      {
        text: 'Concept',
        items: [
          { text: 'Design concept', link: '/concept/design' },
          { text: 'Solve problem', link: '/concept/solve' },
          { text: 'Mechanical system', link: '/concept/mechanical' },
          { text: 'Technical', link: '/concept/technical' },
        ]
      },
      {
        text: 'Functions',
        items: [
          { text: 'createDaccWallet', link: '/functions/createDaccWallet' },
          { text: 'allowDaccWallet', link: '/functions/allowDaccWallet' },
          { text: 'readDaccWallet', link: '/functions/readDaccWallet' },
          { text: 'Session Dacc wallet', 
            items: [
            { text: 'Create session Time', link: '/functions/session-wallet/create-time-jwt' },
            { text: 'Verify session Time', link: '/functions/session-wallet/verify-time-jwt' },
            ] 
          },
          { text: 'Dacc Transactions', 
            items: [
            { text: 'Send Native', link: '/functions/dacc-transactions/send-native' },
            { text: 'Send Token', link: '/functions/dacc-transactions/send-token' },
            { text: 'Write Contract', link: '/functions/dacc-transactions/write-contract' },
            ] 
          },
          { text: 'Dacc Signatures', 
            items: [
            { text: 'Sign Message', link: '/functions/dacc-signature/sign-message' },
            { text: 'Sign Typed Data', link: '/functions/dacc-signature/sign-typed-data' },
            { text: 'Sign Authorize EIP-7702', link: '/functions/dacc-signature/sign-authorize-eip7702' },
            ] 
          },
        ]
      },
      { text: 'Privacy & Terms', link: '/privacy-terms' },
    ],
  },
  socials: [
    {
      icon: "x",
      link: "https://x.com/thefactlab_org",
    },
    {
      icon: "github",
      link: "https://github.com/thefactlab-org",
    }
  ],
  topNav: [
    { text: "Quick Start", link: "/getting-started#quick-start" },
    { text: "Technical", link: "/concept/technical" },
    { text: "Examples", link: "/examples" },
    {
      text: version,
      items: [
        {
          text: "Changelog",
          link: "https://github.com/thefactlab-org/dacc-js/blob/main/CHANGELOG.md",
        }
      ],
    },
  ],
});
