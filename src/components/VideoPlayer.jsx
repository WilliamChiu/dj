import React from "react"
import ReactPlayer from 'react-player'
import styled from 'styled-components'

const Container = styled.div`
  position: relative;
  ${props => props.table && `
    &:after {
      content: ' ';
      left: calc(50% - 50px);
      top: calc(50% - 50px);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background-color: white;
      position: absolute;
      ${props.playing ?
        `animation: 1s scale_up forwards;`:
        `animation: 1s scale_down forwards;`
      }
    }

    @keyframes scale_up {
      0% {
        transform: scale(0);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes scale_down {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(0);
      }
    }
  `
  }
`

const Record = styled.div`
  ${props => props.table && `
      overflow: hidden;
      ${props.playing ?
      `animation:1s round_border forwards, 8s spin linear infinite;`:
      `animation:2s spin_to_stop forwards;`
      }
      transition: border-radius 0.3s;
      position: relative;

      @keyframes round_border {
        100% {
          border-radius: 50%;
        }
      }

      @keyframes spin {
        100% {
          transform:rotate(360deg);
        }
      }

      @keyframes spin_to_stop {
        0% {
          transform: rotate(${props => props.angle || 0}deg);
          border-radius: 50%;
        }
        50% {
          transform:rotate(360deg);
          border-radius: 50%;
        }
        100% {
          transform:rotate(360deg);
          border-radius: 0%;
        }
      }
  `
  }
`

const Stylus = styled.div`
  height: 300px;
  width: 5px;
  background-color: #333;
  top: 20px;
  right: -40px;
  position: absolute;
  transform-origin: top right;
  ${props => props.playing ?
  `transform: rotate(20deg);`:
  `transform: rotate(0deg);`
  }
  transition: transform 0.3s;

  &::before {
    content: ' ';
    width: 40px;
    height: 40px;
    position: absolute;
    top: -20px;
    right: -17.5px;
    border-radius: 50%;
    background-color: #888;
  }

  &::after {
    content: ' ';
    width: 15px;
    height: 40px;
    position: absolute;
    bottom: 0px;
    right: -5px;
    background-color: #888;
  }
`

// https://stackoverflow.com/questions/47888943/transition-back-from-keyframe-mid-animation
function getRotationDegrees (element) {
    // get the computed style object for the element
    const style = window.getComputedStyle (element);
     
    // this string will be in the form 'matrix(a, b, c, d, tx, ty)'
    let transformString = style["-webkit-transform"]
                       || style["-moz-transform"]
                       || style["transform"];
                       
    if (!transformString || transformString === "none")
        return 0;
        
    // Remove matrix notation
    transformString = transformString
      .substr (0, transformString.length - 2)
        .substr (7);
    
    // Split and parse to floats
    const parts = transformString
      .split (",")
        .map (num => parseFloat (num));
        
    // Destructure in a and b
    let [a, b] = parts;
    
    // Doing atan2 on (b, a) will give you the angle in radians
    // Convert it to degrees and normalize it from (-180...180) to (0...360)
    const degrees = ((180 * Math.atan2 (b, a) / Math.PI) + 360) % 360;
    
    return degrees;
}

class YoutubePlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: true,
      angle: 0
    }

    this.player = React.createRef()
    this.record = React.createRef()

    this.onReady = this.onReady.bind(this);
    this.handleMessage = this.handleMessage.bind(this)
    this.onPause = this.onPause.bind(this)
    this.onPlay = this.onPlay.bind(this)
  }

  componentDidMount() {
    console.log(this.props.videoUrl)
    if (!this.props.videoUrl) this.props.handleVideoEnd()
    this.props.socket && this.props.socket.addEventListener('message', this.handleMessage)
  }

  handleMessage(message) {
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
    }
  }

  onReady(event) {
    this.setState({
      player: event.target,
    });
  }

  onPause() {
    this.setState({
      playing: false,
      angle: getRotationDegrees(this.record.current)
    })
  }

  onPlay() {
    this.setState({
      playing: true
    })
  }

  render() {
    return (
      <Container
        table={this.props.table}
        playing={this.state.playing}
      >
        <Record
          playing={this.state.playing}
          ref={this.record}
          angle={this.state.angle}
          table={this.props.table}
        >
          <ReactPlayer
            key={this.props.time} //hack
            ref={this.player}
            url={this.props.videoUrl}
            width={this.props.table ? "400px" : "600px"}
            height="400px"
            controls={true}
            playing={this.state.playing}
            onEnded={this.props.handleVideoEnd}
            onPause={this.onPause}
            onPlay={this.onPlay}
          />
        </Record>
        {this.props.table && <Stylus playing={this.state.playing}/>}
      </Container>
    );
  }
}

export default YoutubePlayer