# gatsby-source-moltin

🚀 Gatsby source plugin for building [Moltin](https://moltin.com) powered eCommerce websites.

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
