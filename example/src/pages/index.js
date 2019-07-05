import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

function IndexPage() {
  const { products } = useStaticQuery(graphql`
    query IndexPage {
      products: allMoltinProduct {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `)

  return products.edges.map(({ node: product }) => (
    <h1 key={product.id}>{product.name}</h1>
  ))
}

export default IndexPage
