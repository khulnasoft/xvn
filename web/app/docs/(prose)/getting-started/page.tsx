import { renderDoc } from '@/lib/render-doc'

export const metadata = {
  title: 'Getting started — xvn',
  description:
    'Run xvn locally, sign up, and point npm or nrz at your registry.',
}

export default async function GettingStartedPage() {
  return renderDoc('getting-started')
}
