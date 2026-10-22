# **nrz** serverless registry (`xvn`)

> A modern, npm-compatible serverless registry that's fast, secure,
> and ridiculously easy to deploy.

`xvn` is a minimal yet powerful npm-compatible registry that
replicates core npm features while adding cutting-edge capabilities.
Built for the modern web, it runs seamlessly on Cloudflare's global
edge network.

<img src="https://github.com/user-attachments/assets/e76c6f8a-a078-4787-963c-8ec95a879731" alt="xvn api screenshot" />

## 🚀 Quick Start

```bash
nrx -y @nrz/xvn
# XVN Running: http://localhost:1337
```

Common flags:

```bash
xvn --port 4000   # custom ports
xvn --debug       # stream all server logs
xvn --help        # full flag reference
```

## ✨ Why Choose XVN?

- **🔥 Fast**: The speed of setup and startup makes it great for dev/CI
- **🔐 Secure by Default**: Integrity validation and granular access controls
- **🛠 Backwards Compatible**: Drop-in replacement for legacy tools

## 💻 Development Requirements

- [Node.js](https://nodejs.org/en)
- [wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [nrz CLI](https://docs.nrz.khulnasoft.com/cli)
  - Install with `curl -fsSL https://install.nrz.khulnasoft.com | bash`

## 📚 Resources

- **[Configuration Guide](info/CONFIGURATION.md)**
- **[Testing Guide](info/TESTING.md)**
- **[Deployment Guide](info/DEPLOY.md)**
- **[Database Setup](info/DATABASE_SETUP.md)**
- **[Access Control](info/GRANULAR_ACCESS_TOKENS.md)**
- **[Support Guide](info/USER_SUPPORT.md)**
- **[Contributing Guide](info/CONTRIBUTING.md)**
- **[Project Structure](info/PROJECT_STRUCTURE.md)**
- **[Product Roadmap](info/ROADMAP.md)**
- **[Comparisons](info/COMPARISONS.md)**

## 📄 License

XVN is licensed under the **[Functional Source License](https://fsl.software)**
([FSL-1.1-MIT](LICENSE.md)) - free for most use cases, with commercial
restrictions that convert to MIT after two years.
