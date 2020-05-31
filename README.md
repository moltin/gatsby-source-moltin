<img src="https://www.elasticpath.com/themes/custom/bootstrap_sass/logo.svg" alt="" width="400" />

# Elastic Path Commerce Cloud gatsby-source-moltin

[![Stable Branch](https://img.shields.io/badge/stable%20branch-master-blue.svg)](https://github.com/moltin/gatsby-demo-store)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/moltin/gatsby-source-moltin/issues)
[![follow on Twitter](https://img.shields.io/twitter/follow/elasticpath?style=social&logo=twitter)](https://twitter.com/intent/follow?screen_name=elasticpath)

🚀 Gatsby source plugin for building [Elastic Path Commerce Cloud](https://www.elasticpath.com) powered eCommerce websites.

## Install

```sh
yarn add @moltin/gatsby-source-moltin
```

## How to use

```js
// In your gatsby-config.js
plugins: [
  {
    resolve: `@moltin/gatsby-source-moltin`,
    options: {
      client_id: '...'
    },
  },
],
```

## How to query

```graphql
{
  allMoltinProduct {
    edges {
      node {
        id
        name
        description
        slug
        sku
        categories {
          id
          name
        }
      }
    }
  }
}
```

## Terms And Conditions

- Any changes to this project must be reviewed and approved by the repository owner. For more information about contributing, see the [Contribution Guide](https://github.com/moltin/gatsby-demo-store/blob/master/.github/CONTRIBUTING.md).
- For more information about the license, see [MIT License](https://github.com/moltin/gatsby-source-moltin/blob/master/LICENSE).
