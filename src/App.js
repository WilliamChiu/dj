import React from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import styled, {createGlobalStyle} from 'styled-components'
import Form from './components/Form'
import Chat from './components/Chat'
import Controls from './components/Controls'
import YoutubePlayer from './components/YoutubePlayer'
import youtubeFetcher from './utils/youtubeFetcher'

const Global = createGlobalStyle`
  html, body, #root {
    height: 100%;
  }
`

const ActionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const FormsContainer = styled.div`
  margin-top: 0.5rem;
`

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

  border-radius: 0.2rem;
`

const ChatMessage = styled.p`
  position: absolute;
  top: ${props => props.y * window.innerHeight}px;
  left: 0;
  animation: slide ${props => props.travelTime}s linear;
  transform: translateX(100vw);
  font-family: "Comic Sans MS", cursive, sans-serif;

  @keyframes slide {
    from {transform: translateX(0vw);}
    to {transform: translateX(100vw);}
  }
`

const PresenterButton = styled.div`
  background-color: #333;
  color: #fff;
  display: inline;
  padding: 0.2rem;
  border-radius: 0.2rem;
`

const Divider = styled.div`
  border-bottom: 1px solid black;
`

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  & > * {
    margin: 1rem;
    min-width: 20rem;
    * {
      font-family: Helvetica Neue,Helvetica,Arial,sans-serif;
      font-weight: 200;
    }
  }
`

let prevPos = null

const getItemStyle = (isDragging, draggableStyle, draggingOver, isDropAnimating) => {
  let isTrashing = !draggingOver && isDropAnimating
  if (isTrashing) {
    return {
      // some basic styles to make the items look a bit nicer
      userSelect: "none",
      marginBottom: "0.5rem",

      // styles we need to apply on draggables
      ...draggableStyle,
      transform: prevPos + " scale(0)",
      textDecoration: "line-through"
    }
  }
  else {
    prevPos = draggableStyle.transform || prevPos
    let textDecoration = !draggingOver && isDragging ? "line-through" : "initial"
    return {
      // some basic styles to make the items look a bit nicer
      userSelect: "none",
      marginBottom: "0.5rem",

      // styles we need to apply on draggables
      ...draggableStyle,
      textDecoration
    }
  }
}

const getListStyle = isDraggingOver => ({
  background: isDraggingOver ? "#ddd" : "white",
  margin: '1rem 0',
  padding: '1rem'
});

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      messages: [],
      chat: [],
      role: "pending"
    }
    this.makeSocket = this.makeSocket.bind(this)
    this.appendToMessages = this.appendToMessages.bind(this)
    this.appendToChat = this.appendToChat.bind(this)
    this.handleVideoEnd = this.handleVideoEnd.bind(this)
    this.handlePresent = this.handlePresent.bind(this)
    this.onDragEnd = this.onDragEnd.bind(this)
    this.goBack = this.goBack.bind(this)
    this.pauseOrPlay = this.pauseOrPlay.bind(this)
    this.goForward = this.goForward.bind(this)
  }

  async componentDidMount() {
    console.log("Mounting...")
    this.makeSocket()
    
    window.addEventListener('beforeunload', () =>{    
      if (this.state.role === "presenter") this.state.socket.send(JSON.stringify({
        intent: "presenter leaving"
      }))
    })

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === 'visible') {
        console.log("Checking socket health...")
        if (this.state.socket.readyState !== WebSocket.OPEN && this.state.socket.readyState !== WebSocket.CONNECTING) {
          console.log("Remounting, websocket was ", this.state.socket.readyState)
          this.state.socket.close()
          this.makeSocket()
        }
      }
    })
  }

  makeSocket() {
    let socket = new WebSocket("wss://connect.websocket.in/spec?room_id=queue-" + (window.location.pathname.slice(1) || 1))
    socket.addEventListener('message', message => {
      let parsed = JSON.parse(message.data)
      if (parsed.intent === "look for presenter"
        && this.state.role === "presenter") {
        socket.send(JSON.stringify({
          intent: "presenter exists",
          messages: this.state.messages,
        }))
      }
      else if (parsed.intent === "look for presenter"
        && this.state.role === "no presenter") {
        socket.send(JSON.stringify({
          intent: "no presenter",
          messages: this.state.messages,
        }))
      }
      else if (parsed.intent === "presenter exists") {
        this.setState({
          messages: parsed.messages,
          role: "client"
        })
      }
      else if (parsed.intent === "no presenter") {
        this.setState({
          messages: parsed.messages,
          role: "no presenter"
        })
      }
      else if (parsed.intent === "presenter leaving") {
        this.setState({
          role: "no presenter"
        })
      }
      else if (parsed.intent === "messages changed") {
        this.setState({
          messages: parsed.messages
        })
      }
      else if (parsed.intent === "message added") {
        this.appendToMessages(parsed.message)
      }
      else if (parsed.intent === "chat added") {
        this.appendToChat(parsed.chat)
      }
    })
    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({intent: "look for presenter"}))
      this.setState({
        socket
      })
    })
    setTimeout(() => {
      if (this.state.role === "pending") {
        socket.send(JSON.stringify({
          intent: "presenter exists",
          messages: this.state.messages,
        }))
        this.setState({ role: "presenter" })
      }
    }, 3000)
    return socket
  }

  componentWillUnmount() {
    this.state.socket.close()
  }

  async appendToMessages(message) {
    let id = youtubeFetcher.urlToID(message)
    let name = await youtubeFetcher.idToName(id)
    let time = new Date().getTime() // play the same video twice in a row
    if (id && name) this.setState(state => {
      return {
        messages: state.messages.concat([{id, name, time}])
      }
    })
  }

  async appendToChat(chat) {
    chat.travelTime = 10 * Math.random() + 10
    this.setState(state => {
      return {
        chat: state.chat.concat([chat])
      }
    }, () => {
      setTimeout(() => {
        this.setState(state => {
          let newChat = state.chat.filter(c => c.time !== chat.time)
          return {
            chat: newChat
          }
        })
      }, chat.travelTime * 1000 * 1.5) // Grace
    })
  }

  handleVideoEnd() {
    this.setState(state => {
      return {
        messages: state.messages.slice(1)
      }
    }, () => {
      this.state.socket.send(JSON.stringify({
        intent: "messages changed",
        messages: this.state.messages
      }))
    })
  }

  handlePresent() {
    this.state.socket.send(JSON.stringify({
      intent: "presenter exists",
      messages: this.state.messages
    }))
    this.setState({
      role: "presenter"
    })
  }

  goBack(e) {
    if (e.detail) e.currentTarget.blur()
    this.state.socket.send(JSON.stringify({
      intent: "go back"
    }))
  }

  pauseOrPlay(e) {
    if (e.detail) e.currentTarget.blur()
    this.state.socket.send(JSON.stringify({
      intent: "pause or play"
    }))
  }

  goForward(e) {
    if (e.detail) e.currentTarget.blur()
    this.state.socket.send(JSON.stringify({
      intent: "go forward"
    }))
  }

  onDragEnd(result) {
    // dropped outside the list
    let messages
    if (!result.destination) {
      messages = Array.from(this.state.messages)
      messages.splice(result.source.index, 1)
    }
    else messages = reorder(
      this.state.messages,
      result.source.index,
      result.destination.index
    );

    this.state.socket.send(JSON.stringify({
      intent: "messages changed",
      messages
    }))

    this.setState({
      messages
    });
  }

  render() {
    return <DragDropContext onDragEnd={this.onDragEnd}>
      {
        this.state.chat.map(chat =>
          <ChatMessage key={chat.time} travelTime={chat.travelTime} y={chat.y}>
            {chat.message}
          </ChatMessage>
        )
      }
      <Global/>
      <Container>
        <div>
          <ActionsContainer>
            <PresenterButton>{this.state.role === "pending" ? "CLIENT" : this.state.role.toUpperCase()}</PresenterButton>
            {
              this.state.role !== "presenter" &&
              this.state.role !== "no presenter" &&
              this.state.messages[0] &&
              <Controls
                goBack={this.goBack}
                pauseOrPlay={this.pauseOrPlay}
                goForward={this.goForward}
              />
            }
            {
              this.state.role === "no presenter" && <div><StyledButton onClick={this.handlePresent}>Present</StyledButton></div>
            }
          </ActionsContainer>
          {
            this.state.messages.length > 0 && <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                  >
                    {this.state.messages.map((message, index) => (
                      <Draggable key={message.time} draggableId={message.time} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={getItemStyle(
                              snapshot.isDragging,
                              provided.draggableProps.style,
                              snapshot.draggingOver,
                              snapshot.isDropAnimating
                            )}
                          >
                            {message.name}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
            </Droppable>
          }
          <FormsContainer>
            <Form socket={this.state.socket} appendToMessages={this.appendToMessages}/>
            <Divider/>
            <Chat socket={this.state.socket} appendToChat={this.appendToChat}/>
          </FormsContainer>
        </div>
      {
        this.state.role === "presenter" &&
        this.state.messages[0] &&
        <YoutubePlayer
          videoId={this.state.messages[0].id}
          time={this.state.messages[0].time}
          handleVideoEnd={this.handleVideoEnd}
          socket={this.state.socket}
        />
      }
      </Container>
    </DragDropContext>
  }
}

export default App;
