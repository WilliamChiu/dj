let fetch = require('isomorphic-unfetch')

export default {
  urlToName: async url => {
    let result = await fetch(`https://noembed.com/embed?url=${url}`)
    return (await result.json()).title
  }
}