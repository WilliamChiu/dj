import React from "react"
import YouTube from 'react-youtube'

class YoutubePlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      player: null,
    };

    this.onReady = this.onReady.bind(this);
  }

  componentDidMount() {
    console.log(this.props.videoId)
    if (!this.props.videoId) this.props.handleVideoEnd()
    this.props.socket && this.props.socket.addEventListener('message', message => {
      let parsed = JSON.parse(message.data)
      let currentTime = this.state.player.getCurrentTime()
      if (parsed.intent === "go back") {
        this.state.player.seekTo(currentTime - 10, true)
      } else if (parsed.intent === "pause or play") {
        if (this.state.player.getPlayerState() === 1) {
          this.state.player.pauseVideo()
        } else {
          this.state.player.playVideo()
        }
      } else if (parsed.intent === "go forward") {
        this.state.player.seekTo(currentTime + 10, true)
      }
    })
  }

  onReady(event) {
    console.log(`YouTube Player object for videoId: "${this.props.videoId}" has been saved to state.`); // eslint-disable-line
    this.setState({
      player: event.target,
    });
  }

  render() {
    const opts = {
      height: '390',
      width: '640',
      playerVars: { // https://developers.google.com/youtube/player_parameters
        autoplay: 1
      }
    };
 
    return (
      <YouTube
        key={this.props.time} //hack
        videoId={this.props.videoId}
        opts={opts}
        onReady={this.onReady}
        onEnd={this.props.handleVideoEnd}
      />
    );
  }
}

export default YoutubePlayer