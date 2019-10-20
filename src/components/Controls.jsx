import React from "react"
import styled from "styled-components"

const ButtonContainer = styled.div`
  display: flex;
`

const StyledButton = styled.button`
  margin: 0 0.1rem;
  display: inline-block;
  border: 1px solid black;
  padding: 0.2rem;
  font-size: 0.6rem;
  background-color: unset;
  flex-grow: 1;

  &:hover, &:focus {
    outline: none;
    background-color: #333;
    color: white;
  }

  &:first-child {
    border-radius: 0.3rem 0 0 0;
  }

  &:last-child {
    border-radius: 0 0.3rem 0 0;
  }
`

const SliderContainer = styled.div`
  border-radius: 0 0 0.3rem 0.3rem;
  height: 0.75rem;
  border: 1px solid black;
  position: relative;
  overflow: hidden;
  margin: 0.1rem;

  &:after {
    font-size: 0.6rem;
    content: 'volume';
    text-align: right;
    color: white;
    width: 100%;
    z-index: -1;
    background: #333;
    right: 0;
    top: 0;
    height: 0.75rem;
    padding: 0 0.2rem;
    display: block;
    position: absolute;
    transform: translateX(${props => `-${100 - props.vol}%`});
  }

  &:after {
    font-size: 0.6rem;
    content: 'volume';
    text-align: right;
    color: white;
    width: 100%;
    z-index: -1;
    background: #333;
    right: 0;
    top: 0;
    height: 0.75rem;
    padding: 0 0.2rem;
    display: block;
    position: absolute;
    transform: translateX(${props => `-${100 - props.vol}%`});
  }

  &:before {
    font-size: 0.6rem;
    content: '${props => `${props.vol}%`}';
    text-align: left;
    color: black;
    width: 100%;
    z-index: -1;
    right: 0;
    top: 0;
    height: 0.75rem;
    padding: 0 0.2rem;
    box-sizing: border-box;
    display: block;
    position: absolute;
    transform: translateX(${props => `${props.vol}%`});
  }
`

const StyledSlider = styled.input`
  -webkit-appearance: none;
  overflow: hidden;
  margin: unset;
  display: block;
  background: unset;

  &:hover, &:focus {
    outline: none;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    height: 0.75rem;
    width: 0.1rem;
    background: none;
    cursor: pointer;
    position: relative;
  }

  &::-moz-range-thumb {
    height: 0.75rem;
    background: none;
    cursor: pointer;
  }
`

const StyleFlex = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
`

class Controls extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      vol: 100
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleMessage = this.handleMessage.bind(this)
  }

  handleChange(event) {
    console.log(event)
    this.setState({vol: event.target.value})
    this.props.setVol(event)
  }

  componentDidMount() {
    this.props.socket && console.log("testsetetes") || this.props.socket.addEventListener('message', this.handleMessage)
  }

  handleMessage(message) {
    console.log(message)
    let parsed = JSON.parse(message.data)
    if (parsed.intent === "set volume") {
      this.setState({vol: parsed.value})
    }     
  }
  render() {
    return (
      <div>
      <StyleFlex>
        <ButtonContainer>
          <StyledButton onClick={this.props.goBack}>-10s</StyledButton>
          <StyledButton onClick={this.props.pauseOrPlay}>play/pause</StyledButton>
          <StyledButton onClick={this.props.goForward}>+10s</StyledButton>
        </ButtonContainer>
        <SliderContainer vol={this.state.vol}>
          <StyledSlider min="0" max="100" value={this.state.vol} type="range" onChange={this.handleChange}/>
        </SliderContainer>
      </StyleFlex>
      </div>
    )
  }
}

export default Controls
