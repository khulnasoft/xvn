import { renderDoc } from '@/lib/render-doc'

export const metadata = {
  title: 'Deployment — xvn',
  description:
    'Deploy the xvn registry worker to Cloudflare using the xvn deploy command.',
}

export default async function DeployPage() {
  return renderDoc('deploy')
}
