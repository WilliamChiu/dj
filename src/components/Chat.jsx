import React from "react"
import styled from "styled-components"

const StyledInput = styled.input`
  width: 100%;
  padding: 0.3rem;
  box-sizing: border-box;
  border: none;

  &:focus {
    outline: none;
    background-color: #ddd;
  }
`

class Chat extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: ''
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleChange(event) {
    this.setState({value: event.target.value})
  }

  handleSubmit(event) {
    let random = Math.random()
    this.props.socket.send(JSON.stringify({
      intent: "chat added",
      chat: {
        message: this.state.value,
        y: random,
        time: new Date().getTime()
      }
    }))
    this.setState({value: ''})
    this.props.appendToChat({
      message: this.state.value,
      y: random,
      time: new Date().getTime()
    })
    event.preventDefault()
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <StyledInput type="text" value={this.state.value} onChange={this.handleChange} placeholder="Chat"/>
      </form>
    )
  }
}

export default Chat