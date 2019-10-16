import React from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import styled, {createGlobalStyle} from 'styled-components'
import Form from './components/Form'
import Chat from './components/Chat'
import Controls from './components/Controls'
import VideoPlayer from './components/VideoPlayer'
import withSocket from './utils/socketSubscriber'

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

class App extends React.Component {
  render() {
    return <DragDropContext onDragEnd={this.props.onDragEnd}>
      {
        this.props.chat.map(chat =>
          <ChatMessage key={chat.time} travelTime={chat.travelTime} y={chat.y}>
            {chat.message}
          </ChatMessage>
        )
      }
      <Global/>
      <Container>
        <div>
          <ActionsContainer>
            <PresenterButton>{this.props.role === "pending" ? "CLIENT" : this.props.role.toUpperCase()}</PresenterButton>
            {
              this.props.role !== "presenter" &&
              this.props.role !== "no presenter" &&
              this.props.messages[0] &&
              <Controls
                goBack={this.props.goBack}
                decrVol={this.props.decrVol}
                pauseOrPlay={this.props.pauseOrPlay}
                incrVol={this.props.incrVol}
                goForward={this.props.goForward}
              />
            }
            {
              this.props.role === "no presenter" && <div><StyledButton onClick={this.props.handlePresent}>Present</StyledButton></div>
            }
          </ActionsContainer>
          {
            this.props.messages.length > 0 && <Droppable droppableId="droppable">
              {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={getListStyle(snapshot.isDraggingOver)}
                  >
                    {this.props.messages.map((message, index) => (
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
            <Form socket={this.props.socket} appendToMessages={this.props.appendToMessages}/>
            <Divider/>
            <Chat socket={this.props.socket} appendToChat={this.props.appendToChat}/>
          </FormsContainer>
        </div>
      {
        this.props.role === "presenter" &&
        this.props.messages[0] &&
        <VideoPlayer
          videoUrl={this.props.messages[0].url}
          time={this.props.messages[0].time}
          handleVideoEnd={this.props.handleVideoEnd}
          socket={this.props.socket}
        />
      }
      </Container>
    </DragDropContext>
  }
}

export default withSocket(App);
