import { renderDoc } from '@/lib/render-doc'

export const metadata = {
  title: 'Configuration — xvn',
  description:
    'Configure xvn for local development, deployment, and package-manager integration.',
}

export default async function ConfigurationPage() {
  return renderDoc('configuration')
}
