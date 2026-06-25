import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Agent Profiles',
  description: 'Portable profiles for running AI agents with specific models.',
  appearance: 'dark',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['link', { rel: 'shortcut icon', href: '/favicon.ico' }]
  ],
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      {
        text: 'Specification',
        link: '/specification'
      },
      {
        text: 'agentprofiles/agentprofiles',
        link: 'https://github.com/agentprofiles/agentprofiles'
      }
    ],
    sidebar: [
      {
        text: 'Overview',
        link: '/'
      },
      {
        text: 'Specification',
        link: '/specification'
      }
    ],
    outline: {
      label: 'On this page',
      level: [2, 3]
    },
    footer: {
      message: 'Portable profiles for AI agent harnesses.'
    }
  }
})
