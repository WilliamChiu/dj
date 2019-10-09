let fetch = require('isomorphic-unfetch')

//http://m.youtube.com/watch?v=RPfFhfSuUZ4
export default {
  urlToID: url => {
    // https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url
    let regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    } else {
      return null
    }
  },
  idToName: async id => {
    let result = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
    return (await result.json()).title
  }
}