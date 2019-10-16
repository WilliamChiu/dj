import React from "react"
import ReactPlayer from 'react-player'

class YoutubePlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: true,
      vol: .5,
    }

    this.player = React.createRef()

    this.onReady = this.onReady.bind(this);
    this.handleMessage = this.handleMessage.bind(this)
  }

  componentDidMount() {
    console.log(this.props.videoUrl)
    if (!this.props.videoUrl) this.props.handleVideoEnd()
    this.props.socket && this.props.socket.addEventListener('message', this.handleMessage)
  }

  handleMessage(message) {
    console.log(this.player.current)
    let parsed = JSON.parse(message.data)
    let currentTime = this.player.current.getCurrentTime()
    if (parsed.intent === "go back") {
      this.player.current.seekTo(currentTime - 10, true)
    } else if (parsed.intent === "pause or play") {
      if (this.state.playing) {
        this.setState({playing: false})
      } else {
        this.setState({playing: true})
      }
    } else if (parsed.intent === "go forward") {
      this.player.current.seekTo(currentTime + 10, true)
    } else if(parsed.intent == "increase volume") {
      let currentVol = this.state.vol
      if(this.state.vol < .9){
        this.setState({vol: currentVol+.1})
      }
    } else if(parsed.intent == "decrease volume") {
      let currentVol = this.state.vol
      if(this.state.vol > .1){
        this.setState({vol: currentVol-.1})
      }
    }
  }

  onReady(event) {
    console.log(`YouTube Player object for videoUrl: "${this.props.videoUrl}" has been saved to state.`); // eslint-disable-line
    this.setState({
      player: event.target,
      vol: .5,
    });
  }

  render() {
    return (
      <ReactPlayer
        key={this.props.time} //hack
        ref={this.player}
        url={this.props.videoUrl}
        width="640px"
        height="390px"
        controls={true}
        playing={this.state.playing}
        volume={this.state.vol}
        onEnded={this.props.handleVideoEnd}
      />
    );
  }
}

export default YoutubePlayer
