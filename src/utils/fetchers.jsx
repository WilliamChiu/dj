import fetch from 'isomorphic-unfetch'
import React from 'react'
import ReactDOM from 'react-dom'
import YouTubePlayer from 'react-player/lib/players/YouTube'
import styled from 'styled-components'

const InvisibleContainer = styled.div`
  width: 0;
  height: 0;
  overflow: hidden;
`

export default {
  urlToName: async url => {
    let result = await fetch(`https://noembed.com/embed?url=${url}`)
    return (await result.json()).title
  },
  playlistToIds: async url => { //https://www.youtube.com/watch?v=IWm03wYBTbM&list=RDIWm03wYBTbM&start_radio=1&t=0
    return new Promise((res, rej) => {
      if (!YouTubePlayer.canPlay(url)) res()
      let invisible = document.createElement("div")
      let returnVideos = videoIds => {
        ReactDOM.unmountComponentAtNode(invisible)
        console.log(videoIds)
        res(videoIds)
      }
      document.body.append(invisible)
      let PlaylistFetcher = class extends React.Component {
        ref = React.createRef()

        onReady = () => {
          let player = this.ref.current.getInternalPlayer()
          returnVideos(player.getPlaylist())
        }

        render() {
          return <InvisibleContainer>
            <YouTubePlayer url={url} ref={this.ref} onReady={this.onReady}/>
          </InvisibleContainer>
        }
      }
      ReactDOM.render(<PlaylistFetcher/>, invisible)
    })
  }
}