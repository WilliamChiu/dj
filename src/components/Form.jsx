import React from "react"
import styled from "styled-components"
import fetchers from "../utils/fetchers"

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

class Form extends React.Component {
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

  async handleSubmit(event) {
    event.preventDefault()
    let playlistResults = await fetchers.playlistToIds(this.state.value)
    if (playlistResults) {
      playlistResults.map(id => "https://www.youtube.com/watch?v=" + id).forEach(url => {
        this.props.socket.send(JSON.stringify({
          intent: "message added",
          message: url
        }))
        this.props.appendToMessages(url)
      })
      this.setState({value: ''})
    }
    else {
      this.props.socket.send(JSON.stringify({
        intent: "message added",
        message: this.state.value
      }))
      this.props.appendToMessages(this.state.value)
      this.setState({value: ''})
    }
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <StyledInput type="text" value={this.state.value} onChange={this.handleChange} placeholder="Media URLs here"/>
      </form>
    )
  }
}

export default Form
