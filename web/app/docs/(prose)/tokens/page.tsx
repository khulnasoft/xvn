import { renderDoc } from '@/lib/render-doc'

export const metadata = {
  title: 'Tokens & scopes — xvn',
  description:
    'API keys, granular permissions, and common access personas for xvn.',
}

export default async function TokensPage() {
  return renderDoc('tokens')
}
