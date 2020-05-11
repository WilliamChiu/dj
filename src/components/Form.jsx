import React from "react"
import styled from "styled-components"
import fetchers from "../utils/fetchers"
import Autosuggest from "react-autosuggest"

const FormContainer = styled.div`
  & .react-autosuggest__container {
    display: block;
    position: relative;
  }

  & .react-autosuggest__suggestions-container {
    position: absolute;
    width: 100%;
    z-index: 1;

    & ul {
      list-style-type: none;
      margin: unset;
      padding: unset;
      border-radius: 0.2rem;
      background-color: #333;
    }
  }
`

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

const StyledSuggestion = styled.div`
  color: white;
  font-size: 11px;
  padding: 0.4rem;
  margin: 0.2rem 0;
  color: ${props => props.isHighlighted ? "#fff" : "#aaa"};
  position: relative;

  &:after {
    content: '${props => props.children.substring(0, props.query.length)}';
    position: absolute;
    display: block;
    color: #fff;
    top: 0;
    left: 0;
    height: 100%;
    box-sizing: border-box;
    padding: 0.4rem;
  }
`

let getSuggestionValue = suggestion => suggestion

let renderSuggestion = (suggestion, { query, isHighlighted }) => <StyledSuggestion query={query} isHighlighted={isHighlighted}>{suggestion}</StyledSuggestion>

class Form extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      value: '',
      suggestions: {},
      suggestionKeys: []
    }
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.getSuggestions = this.getSuggestions.bind(this)
    this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this)
    this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this)
  }

  handleChange(event, { newValue, method }) {
    if (method === "type") {
      this.setState({
        value: newValue,
      })
    }
    else {
      this.setState({
        value: newValue,
        autocomplete: this.state.suggestions[newValue]
      })
    }
  }

  getSuggestions(value) {
    let autocomplete, autocompleteKeys = null
    return value.length < 2 ? {} : 
      this.props.autocomplete.search(value)
  }

  onSuggestionsFetchRequested({value}){
    let suggestions = this.getSuggestions(value)
    let suggestionKeys = Object.keys(suggestions)
    this.setState({
      suggestions,
      suggestionKeys
    });
  };

  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: {},
      suggestionKeys: []
    });
  };

  async handleSubmit(event) {
    event.preventDefault()
    if (this.state.autocomplete) {
      this.props.socket.send(JSON.stringify({
        intent: "message added",
        message: this.state.autocomplete
      }))
      this.props.appendToMessages(this.state.autocomplete)
      this.setState({
        value: '',
        autocomplete: null
      })
      return
    }
    if (fetchers.isYoutubePlaylist(this.state.value)) {
      let playlistResults = await fetchers.playlistToIds(this.state.value)
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
      <FormContainer value={this.state.value} autocompleteKeys={this.state.autocompleteKeys}>
        <form onSubmit={this.handleSubmit}>
          <Autosuggest
            suggestions={this.state.suggestionKeys}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={getSuggestionValue}
            renderSuggestion={renderSuggestion}
            inputProps={{
              placeholder: "Media",
              type: "text",
              value: this.state.value,
              onChange: this.handleChange
            }}
            renderInputComponent={props => <StyledInput {...props}/>}
          />
        </form>
      </FormContainer>
    )
  }
}

export default Form
