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

class Controls extends React.Component {
  render() {
    return (
      <div>
        <StyledButton onClick={this.props.goBack}>-10</StyledButton>
        <StyledButton onClick={this.props.pauseOrPlay}>play/pause</StyledButton>
        <StyledButton onClick={this.props.goForward}>+10</StyledButton>
      </div>
    )
  }
}

export default Controls