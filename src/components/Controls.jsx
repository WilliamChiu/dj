import React from "react"
import styled from "styled-components"

const StyledButton = styled.button`
  margin: 0 0.1rem;
  display: inline-block;
  border: 1px solid black;
  padding: 0.2rem;
  font-size: 0.6rem;
  background-color: unset;

  &:hover, &:focus {
    outline: none;
    background-color: #333;
    color: white;
  }

  &:first-child {
    border-radius: 0.2rem 0 0 0.2rem;
  }

  &:last-child {
    border-radius: 0 0.2rem 0.2rem 0;
  }
`
const StyledSlider = styled.input`
`

const StyleFlex = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
}
`

class Controls extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      vol: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
  }

  handleChange(event) {
    this.setState({vol: event.target.value})
    this.props.setVol(event)
  }

  componentDidMount() {
    this.props.socket && this.props.socket.addEventListener('message', this.handleMessage)
  }

  handleMessage(message) {
    let parsed = JSON.parse(message.data)
    if (parsed.intent === "set volume") {
      this.setState({vol: parsed.value})
    }     
  }
  render() {
    return (
      <div>
      <StyleFlex>
        <div>
          <StyledButton onClick={this.props.goBack}>-10s</StyledButton>
          <StyledButton onClick={this.props.pauseOrPlay}>play/pause</StyledButton>
          <StyledButton onClick={this.props.goForward}>+10s</StyledButton>
        </div>
        <StyledSlider min="1" max="100" value={this.state.vol} type="range" onChange={this.handleChange}/>
      </StyleFlex>
      </div>
    )
  }
}

export default Controls
